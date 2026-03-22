const stylePools = {
  cute: {
    zh: {
      prefix: ["软糖", "奶霜", "小莓", "桃桃", "糯米", "云朵"],
      core: ["团子", "星星", "汽水", "猫爪", "布丁", "果冻"],
    },
    en: {
      prefix: ["Mochi", "Berry", "Honey", "Bunny", "Peach", "Mimi"],
      core: ["Pop", "Puff", "Boo", "Candy", "Mallow", "Daisy"],
    },
  },
  cool: {
    zh: {
      prefix: ["寒", "夜", "零", "冷", "霜", "寂"],
      core: ["川", "烬", "雾", "刃", "曜", "影"],
    },
    en: {
      prefix: ["Cold", "Void", "Ash", "Night", "Frost", "Zero"],
      core: ["Rune", "Blade", "Mist", "Vex", "Shade", "Core"],
    },
  },
  mystery: {
    zh: {
      prefix: ["雾隐", "月蚀", "深渊", "幽夜", "暗潮", "秘境"],
      core: ["旅人", "星谣", "低语", "幻影", "观测者", "咏者"],
    },
    en: {
      prefix: ["Lunar", "Myst", "Noir", "Abyss", "Veil", "Phantom"],
      core: ["Whisper", "Walker", "Echo", "Oracle", "Trace", "Dream"],
    },
  },
  art: {
    zh: {
      prefix: ["迟暮", "青空", "晚风", "长街", "半夏", "白昼"],
      core: ["来信", "诗集", "光年", "手札", "落笔", "序章"],
    },
    en: {
      prefix: ["Blue", "Paper", "Silent", "Autumn", "Poem", "River"],
      core: ["Sonnet", "Letter", "Canvas", "Bloom", "Verse", "Note"],
    },
  },
  funny: {
    zh: {
      prefix: ["土豆", "咸鱼", "熬夜", "吨吨", "迷路", "打工"],
      core: ["会飞", "冠军", "选手", "队长", "本尊", "侠"],
    },
    en: {
      prefix: ["Oops", "Snack", "Potato", "Lazy", "Dizzy", "Noodle"],
      core: ["Cat", "Ninja", "Hero", "Boss", "Wizard", "Duck"],
    },
  },
  chuuni: {
    zh: {
      prefix: ["漆黑", "终焉", "虚空", "审判", "赤炎", "禁忌"],
      core: ["炎凰", "圣痕", "王座", "魔眼", "龙魂", "裁决者"],
    },
    en: {
      prefix: ["Dark", "Abyss", "Crimson", "Chaos", "Night", "Reaper"],
      core: ["Flame", "Crown", "Dragon", "Soul", "Blade", "X"],
    },
  },
};

const usageSuffixMap = {
  nickname: ["", "", "呀", "酱"],
  gameId: ["", "", "Pro", "X"],
  social: ["", "", "_daily", "_log"],
  character: ["", "", "大人", "使者"],
};

const symbols = ["_", "-", "·", ".", "Xx", "77"];
const broadLengthMap = {
  zh: {
    short: 2,
    medium: 4,
    long: 6,
  },
  en: {
    short: 6,
    medium: 10,
    long: 14,
  },
  mix: {
    short: 6,
    medium: 10,
    long: 16,
  },
};

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function addSpecialSymbol(name) {
  const symbol = pickRandom(symbols);
  const position = Math.random() > 0.5 ? "middle" : "end";

  if (position === "middle" && name.length > 1) {
    const middleIndex = Math.floor(name.length / 2);
    return `${name.slice(0, middleIndex)}${symbol}${name.slice(middleIndex)}`;
  }

  return `${name}${symbol}`;
}

function createZhName(style, usage) {
  const pool = stylePools[style].zh;
  return `${pickRandom(pool.prefix)}${pickRandom(pool.core)}${pickRandom(usageSuffixMap[usage])}`;
}

function createEnName(style, usage) {
  const pool = stylePools[style].en;
  return `${pickRandom(pool.prefix)}${pickRandom(pool.core)}${pickRandom(usageSuffixMap[usage])}`;
}

function createMixName(style, usage) {
  const zhName = createZhName(style, usage);
  const enName = createEnName(style, usage);
  return Math.random() > 0.5 ? `${zhName}${pickRandom(["", "_", "-"])}${enName}` : `${enName}${pickRandom(["", "_", "-"])}${zhName}`;
}

function trimName(name, targetLength) {
  if (name.length <= targetLength) {
    return name;
  }

  return name.slice(0, targetLength);
}

function getTargetLength(options) {
  if (options.lengthMode === "exact") {
    return Number(options.exactLength);
  }

  return broadLengthMap[options.language][options.length];
}

function buildNameByLength(style, usage, language, options) {
  const targetLength = getTargetLength(options);
  let name = "";

  while (name.length < targetLength) {
    if (language === "zh") {
      name += createZhName(style, usage);
    } else if (language === "en") {
      name += createEnName(style, usage);
    } else {
      name += createMixName(style, usage);
    }
  }

  return trimName(name, targetLength);
}

function generateNames(options) {
  const { usage, style, language, count, special } = options;
  const results = [];
  const usedNames = new Set();

  while (results.length < count) {
    let name = buildNameByLength(style, usage, language, options);

    if (special) {
      name = addSpecialSymbol(name);
    }

    if (!usedNames.has(name)) {
      usedNames.add(name);
      results.push(name);
    }
  }

  return results;
}

window.generateNames = generateNames;
