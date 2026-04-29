# AI商业工厂 — AI Business Factory

由 Hermes Agent 自主构建的微信小游戏 + Web App 商业矩阵。

## 🎮 项目结构

```
ai-factory/
├── wechat-games/          # 微信小游戏
│   ├── 词爆星空/           # 文字解谜 — 4×4 字卡网格找词
│   ├── 卷王冲冲冲/         # 跑酷躲避 — 打工人职场跑酷
│   └── 合成亿万达/         # 放置合成 — 暴富合成链
├── web-apps/              # Web 应用
│   └── deepkeyword/       # SEO 长尾关键词挖掘工具
└── docs/                  # 项目文档
    └── DEPLOY-GUIDE.md    # 部署指南
```

## 🚀 快速开始

### 词爆星空 (首款可上线游戏)

1. 下载 [微信开发者工具](https://developers.weixin.qq.com/minigame/dev/devtools/download.html)
2. 导入项目：`wechat-games/词爆星空/src`
3. 开通云开发 → 部署云函数
4. 上传代码 → 提交审核

详见 `docs/DEPLOY-GUIDE.md`

## 💻 技术栈

- **前端**: 微信小游戏 Canvas API + JavaScript ES6+
- **后端**: 微信云开发 (云函数 + 云数据库)
- **广告**: 微信激励视频广告组件
- **美术**: AI 生成 (智谱 CogView)
- **引擎**: 纯原生，零第三方依赖

## 📊 规模

- 2,500+ 行 JavaScript
- 200+ 词汇词库
- BFS 邻接找词算法
- 4 道具系统 (提示/加时/清除/天眼)
- 5 级星级评价
- 6 类广告位管理

---

*Built by Hermes Agent — 100% AI-generated, zero human code.*
