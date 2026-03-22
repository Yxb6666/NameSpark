require("dotenv").config();

const path = require("path");
const express = require("express");
const OpenAI = require("openai");

const app = express();
const port = process.env.PORT || 3000;
const publicDir = __dirname;

const client = new OpenAI({
  apiKey: process.env.ZAI_API_KEY,
  baseURL: "https://open.bigmodel.cn/api/paas/v4/",
});

const usageMap = {
  nickname: "网名 / 昵称",
  gameId: "游戏 ID",
  social: "社媒账号名",
  character: "角色名",
};

const styleMap = {
  cute: "可爱",
  cool: "高冷",
  mystery: "神秘",
  art: "文艺",
  funny: "搞笑",
  chuuni: "中二",
};

const languageMap = {
  zh: "中文",
  en: "英文",
  mix: "混合",
};

const broadLengthMap = {
  short: "短",
  medium: "中",
  long: "长",
};

const lengthModeMap = {
  broad: "宽泛模式",
  exact: "精确模式",
};

const countOptions = [1, 5, 10];
const exactLengthOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

app.use(express.json());
app.use("/src", express.static(path.join(publicDir, "src")));
app.use(express.static(publicDir));

function createPrompt({ usage, style, language, count, lengthMode, length, exactLength, special }) {
  const usageLabel = usageMap[usage] || usage;
  const styleLabel = styleMap[style] || style;
  const languageLabel = languageMap[language] || language;
  const modeLabel = lengthModeMap[lengthMode] || "宽泛模式";
  const lengthLabel =
    lengthMode === "exact" ? `精确 ${exactLength} 个字符` : `${broadLengthMap[length] || "中"}`;
  const symbolLabel = special ? "启用特殊符号风格" : "不使用特殊符号";

  return `
你是一个专业的昵称生成助手。

请根据以下条件生成 ${count} 个昵称候选：
- 用途：${usageLabel}
- 风格：${styleLabel}
- 语言：${languageLabel}
- 字数模式：${modeLabel}
- 字数要求：${lengthLabel}
- 特殊符号：${symbolLabel}

要求：
1. 结果必须适合指定用途和风格。
2. 如果语言是中文，就优先输出自然的中文昵称。
3. 如果语言是英文，就优先输出自然的英文昵称。
4. 如果语言是混合，就输出中英混合风格昵称。
5. 如果启用了特殊符号，可以适度加入下划线、点号、短横线等，但不要太乱。
6. 不要生成重复名字。
7. 如果是精确模式，请尽量严格控制在指定字符数附近。
8. 返回严格 JSON，不要使用 Markdown，不要添加解释。

请返回如下格式：
{
  "data": [
    {
      "name": "昵称",
      "style": "${styleLabel}",
      "usage": "${usageLabel}",
      "description": "一句简短说明"
    }
  ]
}
`;
}

function extractJson(text) {
  const trimmed = String(text || "").trim();

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("模型没有返回有效 JSON");
    }

    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

function normalizeResults(parsed, fallbackStyle, fallbackUsage) {
  if (!parsed || !Array.isArray(parsed.data)) {
    return [];
  }

  return parsed.data
    .map((item) => ({
      name: typeof item.name === "string" ? item.name.trim() : "",
      style: typeof item.style === "string" && item.style.trim() ? item.style.trim() : fallbackStyle,
      usage: typeof item.usage === "string" && item.usage.trim() ? item.usage.trim() : fallbackUsage,
      description:
        typeof item.description === "string" && item.description.trim()
          ? item.description.trim()
          : "",
    }))
    .filter((item) => item.name);
}

app.post("/api/generate", async (req, res) => {
  const { usage, style, language, count, lengthMode, length, exactLength, special } = req.body || {};

  if (!process.env.ZAI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "服务器未配置 ZAI_API_KEY",
    });
  }

  const isBroadModeValid = lengthMode === "broad" && broadLengthMap[length];
  const isExactModeValid = lengthMode === "exact" && exactLengthOptions.includes(Number(exactLength));

  if (
    !usageMap[usage] ||
    !styleMap[style] ||
    !languageMap[language] ||
    !countOptions.includes(count) ||
    !lengthModeMap[lengthMode] ||
    (!isBroadModeValid && !isExactModeValid)
  ) {
    return res.status(400).json({
      success: false,
      error: "请求参数不合法",
    });
  }

  try {
    const response = await client.chat.completions.create({
      model: "glm-5",
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content: "你是一个只返回 JSON 的昵称生成助手。",
        },
        {
          role: "user",
          content: createPrompt({ usage, style, language, count, lengthMode, length, exactLength, special }),
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content || "";

    if (!content) {
      return res.status(502).json({
        success: false,
        error: "AI 没有返回内容",
      });
    }

    const parsed = extractJson(content);
    const results = normalizeResults(parsed, styleMap[style], usageMap[usage]);

    if (results.length === 0) {
      return res.status(502).json({
        success: false,
        error: "AI 返回结果为空",
      });
    }

    return res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    const message =
      error && typeof error.message === "string"
        ? error.message
        : "生成失败，请稍后重试";

    return res.status(500).json({
      success: false,
      error: message,
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
