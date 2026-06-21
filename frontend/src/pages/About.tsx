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
 * About - 关于 Latestname · 此刻之名
 */
import { usePrefs } from '../App'
import { D, setLang } from '../i18n-shim'

export default function About() {
  const { lang } = usePrefs()
  setLang(lang)

  return (
    <div className="container fade-in" style={{ maxWidth: '720px', padding: '3rem 1rem' }}>
      <div className="label">{D('About', 'About')}</div>
      <h2 className="title-cn" style={{ marginTop: '0.5rem', marginBottom: '0.6rem' }}>
        {D('关 于 此 刻 之 名', 'About Latestname')}
      </h2>
      <p className="subtitle" style={{ marginBottom: '2.5rem', opacity: 0.7 }}>
        {D('一个为什么要存在的小工具', 'A small tool, and why it exists')}
      </p>

      {/* === 为什么做这个 === */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="label" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
          ✦ {D('为什么做这个', 'Why this exists')}
        </h3>
        <p className="body-text" style={{ lineHeight: 2, marginBottom: '1rem' }}>
          2025 年我开始用现成的占卜 app。紫黑渐变、3D 塔罗牌翻转、AI 语音合成——做得很漂亮。
          但我用的次数越来越少。因为每次看完那些「吉凶参半，宜谨慎抉择」的句子，我合上手机，心里什么都没多。
        </p>
        <p className="body-text" style={{ lineHeight: 2, marginBottom: '1rem' }}>
          后来我开始写自己的版本。一开始是为了搞清楚几件事：
        </p>
        <ul style={{ lineHeight: 2, marginBottom: '1rem', paddingLeft: '1.5rem' }}>
          <li>六爻到底是怎么排出来的？老说"动爻生变"，但动爻是按什么规则被标记的？</li>
          <li>塔罗抽牌的"随机"是什么分布？是真随机还是伪随机？同一个种子能复现吗？</li>
          <li>AI 解读一段卦象时，它到底在"算"什么，还是只是把字典里的几个词拼起来？</li>
        </ul>
        <p className="body-text" style={{ lineHeight: 2 }}>
          写完之后发现自己确实搞清楚了上面三个问题——算法是确定的，种子是可复现的，AI 那一层是可选的。
          后来把它发布出来。如果你也对"它到底在算什么"这件事好奇，可以自己看代码：
          <a href="https://github.com/linmy666/latestname" target="_blank" rel="noopener noreferrer" className="text-gold" style={{ marginLeft: '0.3em' }}>GitHub</a>。
        </p>
      </div>

      {/* === 卦象是什么 === */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="label" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
          ✦ {D('卦象是结构，不是答案', 'A hexagram is a structure, not an answer')}
        </h3>
        <p className="body-text" style={{ lineHeight: 2, marginBottom: '1rem' }}>
          你摇出的六个爻组成的卦象，是一个数学对象。64 种可能，每一种都有 2000 多年前写下的卦辞、彖辞、象辞。
          但那些是参考，不是答案。怎么读这张图，是你的事。
        </p>
        <p className="body-text" style={{ lineHeight: 2, marginBottom: '1rem' }}>
          比如「地天泰」卦象是上坤下干。坤是地、阴；干是天、阳。阴上阳下——在物理上这叫"阳气上升、阴气下降"，
          天地不交。但从另一个角度看，地在上表示"承载"，天在下表示"谦下"——
          君子"以天地之气相交"为吉利，所以是"小往大来，吉亨"。
        </p>
        <p className="body-text" style={{ lineHeight: 2, marginBottom: '1rem' }}>
          同一种卦象，在不同的提问者、不同的时间、不同的心境下，可能指向完全不同的解读方向。
          卦辞给你一个起点，但不是终点。
        </p>
        <p className="body-text" style={{ lineHeight: 2 }}>
          这也是我为什么没把这个 app 做成"一键得到答案"的形态。
          你点完之后看到的是"卦象 + 卦辞 + 你自己写的问题"。中间留出空间，让你自己想。
        </p>
      </div>

      {/* === 为什么是 AI 解读层 === */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="label" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
          ✦ {D('为什么 AI 解读是可选层', 'Why AI interpretation is optional')}
        </h3>
        <p className="body-text" style={{ lineHeight: 2, marginBottom: '1rem' }}>
          排盘本身不需要 AI。三枚铜钱、六个爻、64 种可能——这是 3000 年前就定义好的数学问题，
          我用 Python 实现了一遍。确定性，可复现，不依赖任何语言模型。
        </p>
        <p className="body-text" style={{ lineHeight: 2, marginBottom: '1rem' }}>
          但"把卦辞翻译成现代人能读的话"这件事，AI 确实比我写得好。
          所以我把这两层分开——你可以在「设置」里接入任何 OpenAI 兼容的 API（GPT-4、Claude、本地 ollama 都可以），
          让 AI 用你的卦象 + 卦辞 + 你的问题作为上下文，生成解读。
        </p>
        <p className="body-text" style={{ lineHeight: 2 }}>
          不配置也没关系。确定性分析本身（卦象结构、动爻生克、五行分布、五维评分）已经是一份完整的报告。
          AI 那一层是"锦上添花"，不是"必须"。
        </p>
      </div>

      {/* === 为什么东西方放一起 === */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="label" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
          ✦ {D('为什么把易经和塔罗放在一起', 'Why I Ching and Tarot together')}
        </h3>
        <p className="body-text" style={{ lineHeight: 2, marginBottom: '1rem' }}>
          一个体系说的话，可能是巧合。两个独立体系对同一个问题同时给出相似方向的解读，
          这种巧合出现的概率就低很多了。
        </p>
        <p className="body-text" style={{ lineHeight: 2, marginBottom: '1rem' }}>
          易经是 3000 年前的阴阳五行模型，塔罗是 1909 年韦特-史密斯（Rider-Waite-Smith）定型的 78 张象征符号。
          两个系统的底层逻辑完全不同——一个是二元加变化的数学结构，一个是图像 + 直觉的对应关系。
          但当它们指向同一个方向时，那个"方向"本身比单一系统更值得认真对待。
        </p>
        <p className="body-text" style={{ lineHeight: 2 }}>
          我把这种两个系统同时指向同一主题的情况叫做「共振」。在结果页你也可以看到——
          如果你的卦象说的是"宜守"，塔罗也翻出防守型的牌，我们会在解读里标注出来。
        </p>
      </div>

      {/* === 限额说明 === */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="label" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
          ✦ {D('为什么有每日限额', 'Why daily quotas')}
        </h3>
        <p className="body-text" style={{ lineHeight: 2, marginBottom: '1rem' }}>
          起卦本身不花钱——这是数学计算，跑在云端函数上。
          但 AI 深度解读背后是大模型（GPT / Claude / GLM 等），按 token 计费——一次完整解读可能花掉几毛钱到几块钱。
        </p>
        <p className="body-text" style={{ lineHeight: 2, marginBottom: '1rem' }}>
          如果免费无限用，单个用户一天可以轻松消耗几百元的 API 费；一旦被人滥用，整个项目会爆。
          所以我设了一个基础限额让项目能持续运行，同时也让深度用户能根据自己的需求获取更多额度。
        </p>
        <p className="body-text" style={{ lineHeight: 2 }}>
          三种配额分别是：<strong>卦名测算</strong>（16 卦格人格识别，一次性测试，多次复测不必重复花钱）、
          <strong>卦象测算</strong>（每次起卦）、<strong>深度解读</strong>（AI 自然语言解读）。
        </p>
      </div>

      {/* === 资料来源 === */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="label" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
          ✦ {D('资料来源', 'Sources')}
        </h3>
        <p className="body-text" style={{ fontSize: '0.9rem', lineHeight: 1.9, marginBottom: '0.8rem' }}>
          《周易》原文（卦辞、彖传、象传、爻辞、十翼）为
          <span className="text-gold"> 公有领域先秦两汉典籍</span>，
          来自 <a href="https://zh.wikisource.org/wiki/周易" target="_blank" rel="noopener noreferrer" className="text-gold" style={{ margin: '0 0.3em' }}>维基文库</a>。
        </p>
        <p className="body-text" style={{ fontSize: '0.9rem', lineHeight: 1.9, marginBottom: '0.8rem' }}>
          塔罗牌采用韦特-史密斯体系（Rider-Waite-Smith, 1909），所有现代白话解读均由本项目自写。
        </p>
        <p className="body-text" style={{ fontSize: '0.9rem', lineHeight: 1.9, marginBottom: '0.8rem' }}>
          城市经纬度数据来自
          <a href="https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov" target="_blank" rel="noopener noreferrer" className="text-gold" style={{ margin: '0 0.3em' }}>xiangyuecn/AreaCity-JsSpider-StatsGov</a>（MIT License），
          原始数据来源于国家地名信息库（民政部 2025-12-31）、高德地图、腾讯地图。
        </p>
        <p className="body-text" style={{ fontSize: '0.9rem', lineHeight: 1.9 }}>
          真太阳时校正基于 Spencer (1971) 简化版均时差公式 + 经度偏移（每度 4 分钟）。
        </p>
      </div>

      {/* === 开源协议 === */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="label" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
          ✦ {D('开源协议', 'License')}
        </h3>
        <p className="body-text" style={{ fontSize: '0.9rem', lineHeight: 1.9, marginBottom: '0.8rem' }}>
          本项目使用 <strong>AGPL-3.0</strong> 协议发布。
          这意味着：
        </p>
        <ul style={{ fontSize: '0.9rem', lineHeight: 1.9, paddingLeft: '1.5rem', marginBottom: '0.8rem' }}>
          <li>你可以自由使用、修改、阅读源码</li>
          <li>如果你部署了自己的服务（含内网），也必须开源你的修改</li>
          <li>商业使用前请阅读
            <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer" className="text-gold" style={{ margin: '0 0.3em' }}>完整协议文本</a>
            了解合规要求
          </li>
        </ul>
        <p className="body-text" style={{ fontSize: '0.9rem', lineHeight: 1.9 }}>
          之所以用 AGPL 而不是 MIT：是因为排盘算法是核心价值，我不想它被原样克隆然后商业售卖。
          但同时我把它免费开放，让真正感兴趣的人可以学习、改进、二次发布。
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.8 }}>
        代码 · 数据 · 算法 · 都在 GitHub。<br/>
        <a href="https://github.com/linmy666/latestname" target="_blank" rel="noopener noreferrer" className="text-gold">github.com/linmy666/latestname</a>
        <br/>
        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
          {D(
            'EN: Latestname is an open-source divination platform that combines I Ching and Tarot. Casting is deterministic math, not mysticism. AI interpretation is optional. Code: AGPL-3.0.',
            ''
          )}
        </span>
      </div>
    </div>
  )
}
// _LN_WM: 4c3a8f2e7b1d9065a2c8e4f1b7d3096e8a5c2f4d (linmy666/latestname AGPL-3.0)
