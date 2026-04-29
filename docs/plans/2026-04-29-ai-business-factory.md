# AI商业工厂 主执行计划

> **给 Hermes**: 使用 subagent-driven-development skill 分任务执行。每个任务分配给对应角色的子代理。

**目标**: 由 AI 全栈执行，30 天内同时上线微信小游戏矩阵 + SEO 工具 Web App，首月净利 ¥942+。

**架构**: 多智能体协作 — 7 个角色 Skill 分工，监督者+决策者双层管控。Claude Code 处理所有技术代码。

**技术栈**: 
- 微信小游戏: Canvas API + JS ES6 + 微信云开发 + 微信广告SDK
- Web App: Next.js 14 + TypeScript + Tailwind + Supabase + Paddle + Vercel
- AI 生成: DeepSeek（策划/代码）、智谱CogView（美术）、Suno/Udio（音效）

---

## 项目结构

```
/root/ai-factory/
├── wechat-games/
│   ├── 词爆星空/        # 文字解谜: 成语+热词+谐音梗
│   ├── 卷王冲冲冲/      # 跑酷躲避: 打工人主题
│   └── 合成亿万达/      # 放置合成: 金钱主题
├── web-apps/
│   └── seo-tool/        # SEO关键词挖掘+AI扩写工具
└── docs/
    ├── plans/           # 执行计划
    ├── gdd/             # 游戏设计文档
    ├── decisions/       # 决策记录
    └── reviews/         # 审查报告
```

---

## 阶段一: 基础建设 (D1-D3, 并行)

### 任务 1-A: 生成 3 份游戏设计文档 ← AI-1
**目标**: 词爆星空、卷王冲冲冲、合成亿万达的完整GDD
**产出**: 3 份 markdown GDD 文档（按 ai-game-designer Skill 的8章结构）
**执行者**: `delegate_task(goal="生成词爆星空GDD", context="...")` 并行 x3
**质量门禁**: 监督者审查 → 每条规则可独立验证

### 任务 1-B: 生成美术提示词清单 ← AI-3
**目标**: 词爆星空全套50条AI生成提示词
**产出**: `prompts/词爆星空/` 下50个 .txt 文件
**执行者**: `delegate_task(goal="生成词爆星空美术提示词", context="...")`
**质量门禁**: 每个提示词独立可执行、包含负面提示词

### 任务 1-C: 搭建游戏代码框架 ← AI-2 (Claude Code)
**目标**: 3 款游戏的基础 game.js + project.config.json + game.json
**产出**: 可导入微信开发者工具的基础项目
**执行者**: `claude --acp --stdio` 子代理
**质量门禁**: 代码可在无AppID情况下通过语法检查

### 任务 1-D: Web App 初始化 ← AI-5
**目标**: Next.js项目 + Supabase数据库 + Paddle支付骨架
**产出**: 可部署到Vercel的空框架（路由+认证+支付集成占位）
**执行者**: `delegate_task`

---

## 阶段二: 资产生产 (D3-D5)

### 任务 2-A: 词爆星空核心玩法代码 ← AI-2
### 任务 2-B: 卷王冲冲冲核心玩法代码 ← AI-2
### 任务 2-C: 合成亿万达核心玩法代码 ← AI-2
### 任务 2-D: 美术资产批量生成 ← AI-3（需用户执行智谱CogView）
### 任务 2-E: 音效资产搜集+生成 ← AI-4

---

## 阶段三: 集成交付 (D5-D7)

### 任务 3-A: 微信云开发环境配置 ← AI-2
**前置**: 用户提供 AppID
### 任务 3-B: 广告SDK接入 ← AI-2
### 任务 3-C: 词爆星空提审准备 ← 架构师
### 任务 3-D: Web App 功能开发 ← AI-5

---

## 阶段四: 上线运营 (D7-D30)

### 任务 4-A: 词爆星空提交审核
### 任务 4-B: 卷王冲冲冲提交审核
### 任务 4-C: 合成亿万达提交审核
### 任务 4-D: Web App 部署到Vercel
### 任务 4-E: Product Hunt + Reddit 内容分发 ← AI-5

---

## 风险监控 (持续)

| 检查点 | 时机 | 动作 |
|--------|------|------|
| GDD审查 | 每个GDD完成后 | 监督者审查 |
| 代码审查 | 每款游戏完成后 | 监督者审查 + 决策者评估 |
| 审核状态 | 提交后每24h | 决策者监控驳回 |
| DAU | D21 | G4触发检查 |
| 收入 | D30 | 首月总结 |

---

## 角色 Skill 加载指南

在飞书群聊中，Hermes 应按需加载以下 Skill：

| 群聊 | 角色 | 加载命令 |
|------|------|---------|
| 小游戏策划 | AI-1 | `skill_view(name='ai-game-designer')` |
| 小游戏开发 | AI-2 | `skill_view(name='ai-game-developer')` |
| 小游戏美术 | AI-3 | `skill_view(name='ai-game-artist')` |
| 小游戏音效 | AI-4 | `skill_view(name='ai-sound-designer')` |
| Web App开发 | AI-5 | `skill_view(name='ai-web-developer')` |
| 监督层 | 监督者 | `skill_view(name='ai-business-supervisor')` |
| 决策层 | 决策者 | `skill_view(name='ai-business-decision-maker')` |

---

## 用户需要提供的

1. **微信小游戏 AppID** — 用于任务 3-A、3-B、3-C
2. **微信广告单元ID** (adUnitId) — 上线前提供
3. **微信支付商户号** — 上线前提供（仅内购需要）
4. **智谱CogView API Key** — 用于美术资产批量生成（或用户自行执行提示词）

---

> **下一步**: 立即执行阶段一，3份GDD并行生成。
