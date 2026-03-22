const form = document.querySelector("#generator-form");
const resultsContainer = document.querySelector("#results");
const resultSummary = document.querySelector("#result-summary");
const statusMessage = document.querySelector("#status-message");
const historyList = document.querySelector("#history-list");
const favoriteList = document.querySelector("#favorite-list");
const lengthModeSelect = document.querySelector("#length-mode-select");
const broadLengthField = document.querySelector("#broad-length-field");
const exactLengthField = document.querySelector("#exact-length-field");

const STORAGE_KEYS = {
  history: "ai-nickname-history",
  favorites: "ai-nickname-favorites",
};

const labelMap = {
  usage: {
    nickname: "网名 / 昵称",
    gameId: "游戏 ID",
    social: "社媒账号名",
    character: "角色名",
  },
  style: {
    cute: "可爱",
    cool: "高冷",
    mystery: "神秘",
    art: "文艺",
    funny: "搞笑",
    chuuni: "中二",
  },
  language: {
    zh: "中文",
    en: "英文",
    mix: "混合",
  },
  lengthMode: {
    broad: "宽泛模式",
    exact: "精确模式",
  },
  length: {
    short: "短",
    medium: "中",
    long: "长",
  },
};

let currentResults = [];
let currentOptions = null;
let historyItems = loadStoredItems(STORAGE_KEYS.history);
let favoriteItems = loadStoredItems(STORAGE_KEYS.favorites);

function loadStoredItems(key) {
  const rawValue = localStorage.getItem(key);

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveStoredItems(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getLengthLabel(options) {
  if (options.lengthMode === "exact") {
    return `${options.exactLength} 字`;
  }

  return labelMap.length[options.length];
}

function syncLengthFields() {
  const isExactMode = lengthModeSelect.value === "exact";
  broadLengthField.classList.toggle("is-hidden", isExactMode);
  exactLengthField.classList.toggle("is-hidden", !isExactMode);
}

function buildMetaText(item) {
  return `${item.style} · ${item.language} · ${item.usage}`;
}

function createSavedItem(item, options) {
  return {
    id: `${item.name}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: item.name,
    style: item.style || labelMap.style[options.style],
    usage: item.usage || labelMap.usage[options.usage],
    language: labelMap.language[options.language],
    description: item.description || "",
    createdAt: new Date().toLocaleString("zh-CN"),
  };
}

function isFavorite(name) {
  return favoriteItems.some((item) => item.name === name);
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-error", isError);
}

function renderSavedList(container, items, type) {
  if (items.length === 0) {
    const emptyText = type === "history" ? "还没有生成历史。" : "还没有收藏昵称。";

    container.innerHTML = `
      <article class="list-card empty-card">
        <p class="title">${escapeHtml(emptyText)}</p>
        <p class="meta">生成后的内容会自动保存在这里。</p>
      </article>
    `;
    return;
  }

  const clearButton =
    type === "history"
      ? `<button type="button" class="mini-button" data-action="clear-history">清空历史</button>`
      : `<button type="button" class="mini-button" data-action="clear-favorites">清空收藏</button>`;

  container.innerHTML = `
    <div class="list-toolbar">${clearButton}</div>
    ${items
      .map(
        (item) => `
          <article class="list-card">
            <p class="title">${escapeHtml(item.name)}</p>
            <p class="meta">${escapeHtml(buildMetaText(item))}</p>
            ${item.description ? `<p class="meta">${escapeHtml(item.description)}</p>` : ""}
            <p class="meta">保存时间：${escapeHtml(item.createdAt)}</p>
            <div class="list-actions">
              <button type="button" class="mini-button" data-action="copy-saved" data-name="${escapeHtml(item.name)}">复制</button>
              ${
                type === "favorites"
                  ? `<button type="button" class="mini-button" data-action="remove-favorite" data-id="${escapeHtml(item.id)}">取消收藏</button>`
                  : `<button type="button" class="mini-button" data-action="remove-history" data-id="${escapeHtml(item.id)}">删除</button>`
              }
            </div>
          </article>
        `
      )
      .join("")}
  `;
}

function renderResults(items, options) {
  currentResults = items;
  currentOptions = options;

  if (items.length === 0) {
    resultsContainer.innerHTML = "";
    resultSummary.textContent = "暂无结果，请重新选择条件后再试。";
    return;
  }

  resultSummary.textContent = `已生成 ${items.length} 个昵称，当前组合：${labelMap.usage[options.usage]} · ${labelMap.style[options.style]} · ${labelMap.language[options.language]} · ${labelMap.lengthMode[options.lengthMode]} · ${getLengthLabel(options)}${options.special ? " · 特殊符号" : ""}`;

  resultsContainer.innerHTML = items
    .map(
      (item, index) => `
        <article class="name-card">
          <div>
            <p class="name-text">${escapeHtml(item.name)}</p>
            <div class="tag-row">
              <span class="tag">${escapeHtml(item.style || labelMap.style[options.style])}</span>
              <span class="tag">${escapeHtml(labelMap.language[options.language])}</span>
              <span class="tag">${escapeHtml(item.usage || labelMap.usage[options.usage])}</span>
              <span class="tag">${escapeHtml(getLengthLabel(options))}</span>
            </div>
            ${item.description ? `<p class="card-description">${escapeHtml(item.description)}</p>` : ""}
          </div>
          <div class="card-actions">
            <button type="button" class="ghost-button" data-action="copy-result" data-name="${escapeHtml(item.name)}">复制</button>
            <button type="button" class="ghost-button" data-action="toggle-favorite" data-index="${index}">
              ${isFavorite(item.name) ? "已收藏" : "收藏"}
            </button>
          </div>
        </article>
      `
    )
    .join("");
}

function getFormOptions() {
  const formData = new FormData(form);

  return {
    usage: formData.get("usage"),
    style: formData.get("style"),
    language: formData.get("language"),
    count: Number(formData.get("count")),
    lengthMode: formData.get("lengthMode"),
    length: formData.get("length"),
    exactLength: Number(formData.get("exactLength")),
    special: formData.get("special") === "on",
  };
}

function buildFallbackResults(options) {
  const names = window.generateNames(options);
  return names.map((name) => ({
    name,
    style: labelMap.style[options.style],
    usage: labelMap.usage[options.usage],
    description: "当前使用本地模拟生成结果。",
  }));
}

async function requestGeneratedNames(options) {
  let response;

  try {
    response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });
  } catch (error) {
    throw new Error("无法连接本地后端，请先运行 npm start；当前已切换为本地模拟生成。", {
      cause: error,
    });
  }

  let result;

  try {
    result = await response.json();
  } catch (error) {
    throw new Error("后端返回的不是有效 JSON，请检查服务是否正常启动。", {
      cause: error,
    });
  }

  if (!response.ok || !result.success) {
    throw new Error(result.error || "生成失败，请稍后重试");
  }

  if (!Array.isArray(result.data) || result.data.length === 0) {
    throw new Error("AI 返回结果为空");
  }

  return result.data;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    setStatus(`已复制：${text}`);
  } catch (error) {
    setStatus("复制失败，请手动复制。", true);
  }
}

function addHistory(items, options) {
  const nextItems = items.map((item) => createSavedItem(item, options)).reverse();
  historyItems = [...nextItems, ...historyItems].slice(0, 20);
  saveStoredItems(STORAGE_KEYS.history, historyItems);
  renderSavedList(historyList, historyItems, "history");
}

function toggleFavorite(item, options) {
  const existingItem = favoriteItems.find((favorite) => favorite.name === item.name);

  if (existingItem) {
    favoriteItems = favoriteItems.filter((favorite) => favorite.name !== item.name);
    setStatus(`已取消收藏：${item.name}`);
  } else {
    favoriteItems = [createSavedItem(item, options), ...favoriteItems].slice(0, 30);
    setStatus(`已收藏：${item.name}`);
  }

  saveStoredItems(STORAGE_KEYS.favorites, favoriteItems);
  renderSavedList(favoriteList, favoriteItems, "favorites");

  if (currentResults.length > 0 && currentOptions) {
    renderResults(currentResults, currentOptions);
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const options = getFormOptions();
  resultSummary.textContent = "正在生成昵称，请稍候...";
  resultsContainer.innerHTML = "";
  setStatus("正在请求 AI 生成结果...");

  try {
    const items = await requestGeneratedNames(options);
    renderResults(items, options);
    addHistory(items, options);
    setStatus("生成完成。", false);
  } catch (error) {
    const fallbackItems = buildFallbackResults(options);
    renderResults(fallbackItems, options);
    addHistory(fallbackItems, options);
    setStatus(error.message || "网络失败，已切换为本地模拟生成。", true);
  }
}

async function handleResultsClick(event) {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  if (button.dataset.action === "copy-result") {
    await copyText(button.dataset.name);
    return;
  }

  if (button.dataset.action === "toggle-favorite") {
    const index = Number(button.dataset.index);
    const item = currentResults[index];

    if (item && currentOptions) {
      toggleFavorite(item, currentOptions);
    }
  }
}

async function handleHistoryClick(event) {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  if (button.dataset.action === "copy-saved") {
    await copyText(button.dataset.name);
    return;
  }

  if (button.dataset.action === "remove-history") {
    historyItems = historyItems.filter((item) => item.id !== button.dataset.id);
    saveStoredItems(STORAGE_KEYS.history, historyItems);
    renderSavedList(historyList, historyItems, "history");
    setStatus("已删除一条历史记录。");
    return;
  }

  if (button.dataset.action === "clear-history") {
    historyItems = [];
    saveStoredItems(STORAGE_KEYS.history, historyItems);
    renderSavedList(historyList, historyItems, "history");
    setStatus("历史记录已清空。");
  }
}

async function handleFavoriteClick(event) {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  if (button.dataset.action === "copy-saved") {
    await copyText(button.dataset.name);
    return;
  }

  if (button.dataset.action === "remove-favorite") {
    favoriteItems = favoriteItems.filter((item) => item.id !== button.dataset.id);
    saveStoredItems(STORAGE_KEYS.favorites, favoriteItems);
    renderSavedList(favoriteList, favoriteItems, "favorites");

    if (currentResults.length > 0 && currentOptions) {
      renderResults(currentResults, currentOptions);
    }

    setStatus("已取消收藏。");
    return;
  }

  if (button.dataset.action === "clear-favorites") {
    favoriteItems = [];
    saveStoredItems(STORAGE_KEYS.favorites, favoriteItems);
    renderSavedList(favoriteList, favoriteItems, "favorites");

    if (currentResults.length > 0 && currentOptions) {
      renderResults(currentResults, currentOptions);
    }

    setStatus("收藏区已清空。");
  }
}

renderSavedList(historyList, historyItems, "history");
renderSavedList(favoriteList, favoriteItems, "favorites");
syncLengthFields();
lengthModeSelect.addEventListener("change", syncLengthFields);
form.addEventListener("submit", handleSubmit);
resultsContainer.addEventListener("click", handleResultsClick);
historyList.addEventListener("click", handleHistoryClick);
favoriteList.addEventListener("click", handleFavoriteClick);
setStatus("如果看到连接错误，请先运行 npm start；断开时会自动切换到本地模拟生成。");
