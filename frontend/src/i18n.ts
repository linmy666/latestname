/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Latestname — 此刻之名                                      ║
 * ║  东西方占卜融合平台 (易经 × 塔罗 × 卦格人格)                   ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Copyright © 2026 Lin Ruihan (linmy666)                      ║
 * ║  SPDX-License-Identifier: AGPL-3.0-or-later                  ║
 * ║  https://github.com/linmy666/latestname                      ║
 * ║                                                              ║
 * ║  Free software under AGPL-3.0. See LICENSE for details.      ║
 * ╚══════════════════════════════════════════════════════════════╝
 * Authorship: Lin Ruihan | GitHub: linmy666 | Project: Latestname
 */

/**
 * Latestname — 全量 i18n 字典 v2
 *
 * 涵盖：
 * - 所有页面 UI 文字（Home / Divine / Settings / History / About / Login / Admin）
 * - 所有组件（PersonalityCard/Selector/Quiz/FollowupPanel/FortuneChart/TarotCard/ShareCard）
 * - 业务术语兜底（卦象/塔罗/运势标签）
 *
 * 业务内容（卦辞、塔罗含义、AI 解读）的英文版从后端 JSON 读取，
 * 此处只提供 UI 框架 + 业务术语兜底翻译。
 */

export type Lang = 'zh' | 'en'

// ============================================================
// 业务术语兜底（卦象/塔罗/运势）
// 后端返回 name_en 时优先用后端；缺失时回退到此表
// ============================================================
export const FALLBACK_GLOSSARY = {
  zh: {
    // 卦象运势
    fortunes: {
      '大吉': '大吉', '吉': '吉', '中吉': '中吉', '中': '中',
      '小凶': '小凶', '凶': '凶', '大凶': '大凶',
    } as Record<string, string>,
    // 通用动作
    actions: {
      cast: '起卦', flip: '翻牌', draw: '抽牌', select: '选择',
      save: '保存', share: '分享', retry: '重试', next: '下一步',
      prev: '上一步', confirm: '确认', cancel: '取消', close: '关闭',
    },
    // 错误提示
    errors: {
      network: '网络异常，请稍后重试',
      auth: '请先登录',
      quota: '今日次数已用完',
      server: '服务器内部错误',
    },
  },
  en: {
    fortunes: {
      '大吉': 'Auspicious', '吉': 'Favorable', '中吉': 'Mostly Favorable', '中': 'Neutral',
      '小凶': 'Slightly Unfavorable', '凶': 'Unfavorable', '大凶': 'Inauspicious',
    } as Record<string, string>,
    actions: {
      cast: 'Cast', flip: 'Flip', draw: 'Draw', select: 'Select',
      save: 'Save', share: 'Share', retry: 'Retry', next: 'Next',
      prev: 'Back', confirm: 'Confirm', cancel: 'Cancel', close: 'Close',
    },
    errors: {
      network: 'Network error. Please try again.',
      auth: 'Please log in first.',
      quota: 'Daily quota exhausted.',
      server: 'Internal server error.',
    },
  },
}

// ============================================================
// 主字典
// ============================================================
export const i18n = {
  zh: {
    // 通用
    common: {
      loading: '加载中…',
      empty: '暂无数据',
      copied: '已复制',
      learnMore: '了解更多',
      readMore: '阅读更多',
      collapse: '收起',
      expand: '展开',
      today: '今日',
      yesterday: '昨日',
      tomorrow: '明日',
      or: '或',
      and: '和',
      yes: '是',
      no: '否',
      on: '开启',
      off: '关闭',
      unknown: '未知',
    },

    // 导航
    nav: {
      home: '首页', divine: '叩玄', archive: '卜辞',
      settings: '设置', about: '关于', login: '登录', logout: '退出',
      admin: '管理', back: '返回',
    },

    // 顶部栏
    topbar: {
      switchToEn: 'EN',
      switchToZh: '中',
      switchToDark: '夜间', switchToLight: '日间',
      viewDesktop: '电脑版', viewMobile: '手机版',
      menu: '菜单',
    },

    // ===== Home 页 =====
    home: {
      title: 'Latestname',
      subtitle: '此刻之名',
      tagline: '16 种底色 × 64 卦 × 78 塔罗牌，\n每一次起卦，都为你的此刻取一个名字。',
      enter: '开始测卦格',
      enterSub: '28 题测卦格 · 3 分钟',
      skipQuiz: '跳过测卦格，直接起卦',
      dailyTitle: '今日之卦',
      dailySub: (date: string) => `${date} · 所有人今天都会遇到这一卦`,
      dailyAskBtn: '我来问我的卦',
      dailyYi: '宜', dailyJi: '忌',
      howtoTitle: '如 何 玩',
      steps: [
        { num: '01', icon: '◎', title: '测定卦格', desc: '28 道题，3 分钟。像 MBTI 一样测出你的先天卦格——16 种底色之名。' },
        { num: '02', icon: '❀', title: '问一件事', desc: '带着你的卦格，心中默念当下最困惑的事。事业、感情、决策皆可。' },
        { num: '03', icon: '◐', title: '抛铜钱 · 抽塔罗', desc: '六次金钱卦 + 西方塔罗三牌。东西方体系同时给出答案。' },
        { num: '04', icon: '◇', title: '三方共振解读', desc: '卦格 × 卦象 × 塔罗，三重维度交叉验证，指向同一个方向。' },
        { num: '05', icon: '✦', title: '获得此刻之名', desc: '基于你的卦格和当下卦象，生成一个名字。' },
      ],
      scenesTitle: '快 捷 场 景',
      scenes: [
        { icon: '💼', cn: '跳槽决策', q: '我该跳槽吗' },
        { icon: '📖', cn: '考试运势', q: '这次考试能通过吗' },
        { icon: '♥', cn: '感情走向', q: '我们还能复合吗' },
        { icon: '❓', cn: '投资时机', q: '现在该加仓吗' },
        { icon: '⚖', cn: '两难抉择', q: '我该怎么选择' },
        { icon: '✈', cn: '出行吉凶', q: '最近适合出行吗' },
      ],
      features: [
        { en: 'Now-Name', cn: '此刻之名', desc: '每次起卦根据提问时间生成不同解读。' },
        { en: 'East × West', cn: '东西方共振', desc: '同一个问题，同时起卦和抽牌。卦象与塔罗指向同一个方向——跨体系的背书。' },
        { en: 'No Magic', cn: '确定性算法', desc: '排盘靠数学，不靠玄学。同一人同一刻同一问题，结果可复现。AI 只做解读。' },
      ],
      // closingTitle + closingBody 已删除 — 之前是诗化收尾文案（卦是天地的语言...这不是 bug 这是 feature）
    },

    // ===== Divine 页（叩玄 / 占卜） =====
    divine: {
      questionLabel: '问 事',
      questionPh: '写下您要问的事...（如：我应该接受这份新工作吗？）',
      questionHelp: '问得越具体，解读越准确。',
      cast: '叩 玄 · CAST',
      castBtn: '起 卦',
      recast: '再 叩 一 卦',
      casting: '卜 筮 中…',
      breathing: '调 息',
      breathingHint: '深呼吸三次，让心沉静',
      skipBreath: '跳过',
      combined: 'COMBINED',
      iching: 'I CHING',
      tarot: 'TAROT',
      resultTitle: '卜 辞',
      ichingTitle: '易 经 · I CHING',
      tarotTitle: '塔 罗 · TAROT',
      relationsTitle: '卦 变 · HEXAGRAM RELATIONS',
      resonanceTitle: '共 振 · RESONANCE',
      fortuneTitle: '运 势 · FORTUNE',
      interpretTitle: '深 度 解 读 · AI Interpretation',
      startInterpret: '✦ 启 动 深 度 解 读',
      interpreting: 'AI 正在解读…',
      interpretRetry: '重 试',
      shareCard: '生成分享图',
      downloadCard: '下载到本地',
      errorDivine: '占卜请求失败，请稍后重试',
      errorInterpret: '解读请求失败',
      // 运势 5 维
      fortuneDims: {
        career: '事业', relationship: '感情', finance: '财运',
        health: '健康', timing: '时机',
      },
      // 塔罗位置
      tarotPositions: ['过去', '现在', '未来'],
      // 卦变关系
      hexRel: { primary: '本卦', changed: '变卦', mutual: '互卦', nuclear: '错卦' },
    },

    // ===== Settings 页 =====
    settings: {
      title: '设 置',
      desc: '配置 LLM Endpoint 以启用 AI 深度解读。支持任何 OpenAI 兼容接口。',
      presetsTitle: '快 捷 预 设',
      baseUrl: 'API Endpoint · base_url',
      apiKey: 'API Key',
      model: '模型 · Model',
      save: '保 存 · SAVE',
      saving: '保存中…',
      test: '测试连接 · TEST',
      testing: '测试中…',
      saved: '✦ 配置已保存',
      saveFail: '保存失败',
      privacyTitle: '隐 私 说 明',
      privacyBody: '所有配置仅保存在你的浏览器本地，不会上传到我们的服务器。',
      appearance: '外 观 · Appearance',
      theme: '主题',
      dark: '暗色',
      light: '亮色',
      animations: '动画效果',
      animOn: '开启',
      animOff: '关闭',
      language: '语言 · Language',
      viewMode: '视图模式',
      viewAuto: '自动',
      viewDesktop: '电脑版',
      viewMobile: '手机版',
      version: '版本',
    },

    // ===== History 页（卜辞） =====
    history: {
      title: '卜 辞',
      empty: '还没有卜辞记录。\n先去「叩玄」起一卦吧。',
      emptyAction: '去叩玄',
      dateLabel: '起卦时间',
      hexLabel: '卦象',
      questionLabel: '所问之事',
      view: '查看',
      delete: '删除',
      confirmDelete: '确定删除这条卜辞？',
      filterAll: '全部',
      filterToday: '今日',
      filterWeek: '本周',
      filterMonth: '本月',
      count: (n: number) => `共 ${n} 条记录`,
    },

    // ===== About 页 =====
    about: {
      title: '关 于',
      intro: 'Latestname · 此刻之名 —— 一个将易经与塔罗融合的开源占卜平台。',
      story: '你有一个身份证上的名字，那是父母翻字典取的。但你此刻的样子，叫什么？我们相信：此刻的你，比昨天的你更真实。卦象每天都不一样，你的名字也应该跟着变。',
      principles: '核心原则',
      principlesList: [
        { title: '确定性', body: '排盘靠数学，不靠玄学。同一人同一刻同一问题，结果可复现。' },
        { title: '东西方共振', body: '易经 + 塔罗同时指向同一主题，才给出跨体系的背书。' },
        { title: 'AI 只做解读', body: '核心排盘由算法保证，AI 仅负责自然语言解读层。' },
        { title: '开源', body: '代码与数据全部开源，可独立部署、可审计、可定制。' },
      ],
      credits: '致谢',
      creditsBody: '本项目参考了 XIAOEEN/lifeline-k- 的设计思路，并结合最新的 LLM 解读能力。所有卦象与塔罗数据均来自公有领域文献。',
      version: '版本号',
      contact: '联系我们',
      license: 'MIT 协议',
      githubLink: 'GitHub 仓库',
    },

    // ===== Login 页 =====
    login: {
      title: '登 录',
      subtitle: '登录后可跨设备同步卜辞',
      emailLabel: '邮箱',
      emailPh: 'your@email.com',
      passwordLabel: '密码',
      passwordPh: '至少 8 位',
      loginBtn: '登 录',
      registerBtn: '注 册',
      forgotPwd: '忘记密码？',
      noAccount: '还没有账号？',
      hasAccount: '已有账号？',
      or: '或使用',
      google: 'Google 登录',
      github: 'GitHub 登录',
      guest: '以访客身份继续',
      emailInvalid: '请输入有效的邮箱',
      pwdTooShort: '密码至少 8 位',
      loginFail: '登录失败，请检查邮箱和密码',
      registerSuccess: '注册成功，请登录',
    },

    // ===== Personality 卦格 =====
    personality: {
      quizTitle: '卦 格 测 试',
      quizSub: '28 道题，3 分钟，测出你的先天卦格',
      quizProgress: (cur: number, total: number) => `${cur} / ${total}`,
      quizIntro: '本测试将帮助你识别自己的「底色之名」。请根据直觉作答，没有对错。',
      quizStart: '开始测试',
      quizPrev: '上一题',
      quizNext: '下一题',
      quizSubmit: '查看结果',
      resultTitle: '你 的 卦 格',
      resultSub: '这是你的先天底色',
      retest: '重新测试',
      backHome: '回到首页',
      shareCard: '分享我的卦格',
      // 4 个维度名
      dims: {
        yin_yang: '阴阳',
        rigidity_flexibility: '刚柔',
        ascending_descending: '升降',
        inner_outer: '内外',
      },
      // 心理/事业/成长 板块
      psychology: '内 在 本 色',
      career: '事 业 天 赋',
      growth: '成 长 之 路',
      affinity: '亲 和 卦',
      rarity: '稀有度',
      tipsTitle: '行 卦 之 约',
      // 5 大解读面板
      panels: [
        '内 在 本 色', '事 业 天 赋', '人 际 关 系',
        '情 感 模 式', '生 命 节 律',
      ],
    },

    // ===== Footer =====
    footer: {
      brand: 'Latestname · 此刻之名',
      tagline: '易经 × 塔罗 · 确定性算法 · AI 解读',
      privacy: '隐私', terms: '条款', about: '关于',
      github: 'GitHub', feedback: '反馈',
    },
  },

  // ============================================================
  // ENGLISH VERSION
  // ============================================================
  en: {
    common: {
      loading: 'Loading…',
      empty: 'No data',
      copied: 'Copied',
      learnMore: 'Learn more',
      readMore: 'Read more',
      collapse: 'Collapse',
      expand: 'Expand',
      today: 'Today',
      yesterday: 'Yesterday',
      tomorrow: 'Tomorrow',
      or: 'or',
      and: 'and',
      yes: 'Yes',
      no: 'No',
      on: 'On',
      off: 'Off',
      unknown: 'Unknown',
    },

    nav: {
      home: 'Home', divine: 'Divine', archive: 'Archive',
      settings: 'Settings', about: 'About', login: 'Log in', logout: 'Log out',
      admin: 'Admin', back: 'Back',
    },

    topbar: {
      switchToEn: 'EN',
      switchToZh: '中',
      switchToDark: 'Dark', switchToLight: 'Light',
      viewDesktop: 'Desktop', viewMobile: 'Mobile',
      menu: 'Menu',
    },

    home: {
      title: 'Latestname',
      subtitle: 'A Name for Your Now',
      tagline: '16 patterns × 64 hexagrams × 78 tarot cards.\nEach cast gives your now a name.',
      enter: 'Start the Quiz',
      enterSub: '28 questions · 3 minutes',
      skipQuiz: 'Skip quiz, cast directly',
      dailyTitle: 'Hexagram of Today',
      dailySub: (date: string) => `${date} · Everyone meets this hexagram today`,
      dailyAskBtn: 'Ask my own',
      dailyYi: 'Do', dailyJi: 'Avoid',
      howtoTitle: 'H O W   T O   P L A Y',
      steps: [
        { num: '01', icon: '◎', title: 'Discover Your Archetype', desc: '28 questions, 3 minutes. Like MBTI — find your innate archetype across 16 names.' },
        { num: '02', icon: '❀', title: 'Ask One Question', desc: 'Bring your archetype into focus. Hold the question that troubles you most: career, love, decisions.' },
        { num: '03', icon: '◐', title: 'Cast Coins · Draw Tarot', desc: 'Six coin tosses for I Ching + three tarot cards. East and West answer at once.' },
        { num: '04', icon: '◇', title: 'Triangulated Reading', desc: 'Archetype × Hexagram × Tarot. Three dimensions cross-check, pointing the same way.' },
        { num: '05', icon: '✦', title: 'Receive Your Now-Name', desc: 'The cosmos uses your archetype and the hexagram of this moment to name your present.' },
      ],
      scenesTitle: 'Q U I C K   S C E N E S',
      scenes: [
        { icon: '💼', cn: 'Job Decision', q: 'Should I switch jobs?' },
        { icon: '📖', cn: 'Exam Luck', q: 'Will I pass this exam?' },
        { icon: '♥', cn: 'Love Path', q: 'Can we get back together?' },
        { icon: '❓', cn: 'Investment Timing', q: 'Is now the time to buy?' },
        { icon: '⚖', cn: 'Tough Choice', q: 'How should I choose?' },
        { icon: '✈', cn: 'Travel Fortune', q: 'Is it wise to travel now?' },
      ],
      features: [
        { en: 'Now-Name', cn: 'A Name for the Moment', desc: 'Each reading adapts to when you ask — same question today and next month gives different interpretations.' },
        { en: 'East × West', cn: 'East-West Resonance', desc: 'Ask once, cast coins AND draw cards. When I Ching and Tarot point the same way, you have cross-system backing.' },
        { en: 'No Magic', cn: 'Deterministic Algorithm', desc: 'The casting is math, not mysticism. Same person, same moment, same question — same result. AI only narrates.' },
      ],
      // closingTitle + closingBody 已删除 — 之前是诗化收尾文案
    },

    divine: {
      questionLabel: 'Your Question',
      questionPh: 'Write what you want to ask... (e.g. Should I take this new job?)',
      questionHelp: 'The more specific, the sharper the reading.',
      cast: 'C A S T',
      castBtn: 'Cast',
      recast: 'Cast Again',
      casting: 'Casting…',
      breathing: 'Breathe',
      breathingHint: 'Three deep breaths. Settle the mind.',
      skipBreath: 'Skip',
      combined: 'COMBINED',
      iching: 'I CHING',
      tarot: 'TAROT',
      resultTitle: 'Reading',
      ichingTitle: 'I CHING',
      tarotTitle: 'TAROT',
      relationsTitle: 'Hexagram Relations',
      resonanceTitle: 'Resonance',
      fortuneTitle: 'Fortune',
      interpretTitle: 'AI Interpretation',
      startInterpret: '✦ G E N E R A T E   R E A D I N G',
      interpreting: 'AI is reading…',
      interpretRetry: 'Retry',
      shareCard: 'Generate share image',
      downloadCard: 'Download',
      errorDivine: 'Divination failed. Please try again.',
      errorInterpret: 'Interpretation failed.',
      fortuneDims: {
        career: 'Career', relationship: 'Relationship', finance: 'Finance',
        health: 'Health', timing: 'Timing',
      },
      tarotPositions: ['Past', 'Present', 'Future'],
      hexRel: { primary: 'Primary', changed: 'Changed', mutual: 'Mutual', nuclear: 'Nuclear' },
    },

    settings: {
      title: 'Settings',
      desc: 'Configure your LLM Endpoint to enable AI interpretation. Any OpenAI-compatible API works.',
      presetsTitle: 'Quick Presets',
      baseUrl: 'API Endpoint · base_url',
      apiKey: 'API Key',
      model: 'Model',
      save: 'SAVE',
      saving: 'Saving…',
      test: 'Test Connection',
      testing: 'Testing…',
      saved: '✦ Configuration saved',
      saveFail: 'Save failed',
      privacyTitle: 'Privacy',
      privacyBody: 'All settings are stored locally in your browser. We never upload anything to our server.',
      appearance: 'Appearance',
      theme: 'Theme',
      dark: 'Dark',
      light: 'Light',
      animations: 'Animations',
      animOn: 'On',
      animOff: 'Off',
      language: 'Language',
      viewMode: 'View mode',
      viewAuto: 'Auto',
      viewDesktop: 'Desktop',
      viewMobile: 'Mobile',
      version: 'Version',
    },

    history: {
      title: 'Archive',
      empty: 'No readings yet.\nHead over to "Divine" to cast your first.',
      emptyAction: 'Go to Divine',
      dateLabel: 'Cast at',
      hexLabel: 'Hexagram',
      questionLabel: 'Question',
      view: 'View',
      delete: 'Delete',
      confirmDelete: 'Delete this reading?',
      filterAll: 'All',
      filterToday: 'Today',
      filterWeek: 'This week',
      filterMonth: 'This month',
      count: (n: number) => `${n} records`,
    },

    about: {
      title: 'About',
      intro: 'Latestname — an open-source divination platform fusing I Ching and Tarot.',
      story: 'You have a name on your ID — chosen from a dictionary by your parents. But what is the name of who you are right now? We believe who you are today is more real than who you were yesterday. Hexagrams change every day, and so should your name.',
      principles: 'Core Principles',
      principlesList: [
        { title: 'Deterministic', body: 'Casting is math, not mysticism. Same person, same moment, same question — same result.' },
        { title: 'East-West Resonance', body: 'I Ching + Tarot pointing the same way provides cross-system validation.' },
        { title: 'AI Narrates Only', body: 'Core casting is algorithmic; AI only handles natural-language interpretation.' },
        { title: 'Open Source', body: 'Code and data are fully open. Deploy it yourself, audit it, customize it.' },
      ],
      credits: 'Credits',
      creditsBody: 'This project draws inspiration from XIAOEEN/lifeline-k- and combines modern LLM interpretation. All hexagram and tarot data are drawn from public-domain literature.',
      version: 'Version',
      contact: 'Contact',
      license: 'MIT License',
      githubLink: 'GitHub Repo',
    },

    login: {
      title: 'Log In',
      subtitle: 'Sign in to sync your readings across devices',
      emailLabel: 'Email',
      emailPh: 'your@email.com',
      passwordLabel: 'Password',
      passwordPh: 'At least 8 characters',
      loginBtn: 'Log In',
      registerBtn: 'Sign Up',
      forgotPwd: 'Forgot password?',
      noAccount: 'No account?',
      hasAccount: 'Have an account?',
      or: 'Or use',
      google: 'Continue with Google',
      github: 'Continue with GitHub',
      guest: 'Continue as guest',
      emailInvalid: 'Please enter a valid email',
      pwdTooShort: 'Password must be at least 8 characters',
      loginFail: 'Login failed. Check your email and password.',
      registerSuccess: 'Sign-up succeeded. Please log in.',
    },

    personality: {
      quizTitle: 'Archetype Quiz',
      quizSub: '28 questions · 3 minutes · Find your innate archetype',
      quizProgress: (cur: number, total: number) => `${cur} / ${total}`,
      quizIntro: 'This quiz identifies your innate "ground-color name". Answer by gut feeling — there are no right or wrong answers.',
      quizStart: 'Start quiz',
      quizPrev: 'Previous',
      quizNext: 'Next',
      quizSubmit: 'See result',
      resultTitle: 'Your Archetype',
      resultSub: 'This is your innate ground-color',
      retest: 'Retake quiz',
      backHome: 'Back to home',
      shareCard: 'Share my archetype',
      dims: {
        yin_yang: 'Yin-Yang',
        rigidity_flexibility: 'Rigid-Flexible',
        ascending_descending: 'Ascend-Descend',
        inner_outer: 'Inner-Outer',
      },
      psychology: 'Inner Nature',
      career: 'Career Talent',
      growth: 'Growth Path',
      affinity: 'Affinity Hexagrams',
      rarity: 'Rarity',
      tipsTitle: 'Pact with the Hexagram',
      panels: [
        'Inner Nature', 'Career Talent', 'Relationships',
        'Emotional Pattern', 'Life Rhythm',
      ],
    },

    footer: {
      brand: 'Latestname · A Name for Your Now',
      tagline: 'I Ching × Tarot · Deterministic · AI Narrated',
      privacy: 'Privacy', terms: 'Terms', about: 'About',
      github: 'GitHub', feedback: 'Feedback',
    },
  },
} as const

// ============================================================
// 工具函数：业务术语回退翻译
// ============================================================
export function translateFortune(zh: string, lang: Lang): string {
  return FALLBACK_GLOSSARY[lang].fortunes[zh] || zh
}

export function translateAction(key: keyof typeof FALLBACK_GLOSSARY.zh.actions, lang: Lang): string {
  return FALLBACK_GLOSSARY[lang].actions[key]
}

export function translateError(key: keyof typeof FALLBACK_GLOSSARY.zh.errors, lang: Lang): string {
  return FALLBACK_GLOSSARY[lang].errors[key]
}