# VLM Reasoning Radar

这是一个面向会议冲刺的研究情报底座。它不是“收集尽可能多的论文”，而是持续回答三个问题：

1. 最近出现了哪些与我们相关的新进展？
2. 哪些矛盾、空白或失败模式可能形成研究机会？
3. 哪些机会能在当前时间、算力和数据条件下完成？

## 当前范围

主研究树位于 [`research-tree.yaml`](research-tree.yaml)。第一阶段并行观察三个候选战役：

- `multimodal-reasoning-post-training`
- `video-streaming-reasoning`
- `agentic-visual-reasoning`

主分类按“研究问题”组织；模态、训练阶段、方法和证据状态作为标签，避免同一篇论文在目录中重复出现。

## 工作流

```text
发现候选论文
  -> DOI / arXiv ID / 标题去重
  -> 摘要初筛与 campaign 归类
  -> 研究机会评分
  -> Deep-read Candidate / Watchlist / Rejected
  -> 主候选进入全文 Research Readout
  -> 生成每日日报
  -> 每周更新 Opportunity Map
```

自动流程不永久保存 PDF、不写 Zotero；校验通过后提交雷达数据与站点，由 GitHub Pages 和 Daily Radar Issue 发布。

## Website

公开研究雷达部署在 GitHub Pages：

- Site: <https://echo-ikun.github.io/vlm-reasoning-radar/>
- RSS: <https://echo-ikun.github.io/vlm-reasoning-radar/feed.xml>

网站由 `site/` 中的零依赖静态前端构成，`scripts/build_site.py` 会从 `data/papers.jsonl` 和 `digests/` 生成网站数据与 RSS。推送到 `main` 后，GitHub Actions 自动重新发布。

## 目录

| 路径 | 用途 |
|---|---|
| `research-tree.yaml` | 稳定的 VLM Reasoning 主树 |
| `campaigns/` | 可切换的研究战役配置 |
| `config/` | 数据源、评分和运行规则 |
| `schemas/paper.schema.json` | 单篇论文的摘要级结构化字段定义 |
| `schemas/analysis.schema.json` | 全文深读与研究判断字段定义 |
| `scripts/validate_radar.py` | 零依赖 JSONL/schema 校验器 |
| `scripts/build_site.py` | 生成网站数据、日报副本和 RSS |
| `data/papers.jsonl` | 已收录论文数据库，每行一个 JSON 对象 |
| `data/analyses/` | 全文 Research Readout |
| `REVIEW_PROFILE.md` | 个人阅读习惯与研究判断标准 |
| `digests/` | 每日雷达报告 |
| `opportunity-map.md` | 每周维护的研究机会地图 |
| `RUNBOOK.md` | 自动任务的执行和质量规范 |
| `site/` | GitHub Pages 静态前端 |


## 人工反馈

日报中可以使用以下反馈词校准系统：

- `重点跟踪`：提高该主题、作者、benchmark 和引用邻域的权重。
- `不相关`：加入负面样本，但不自动扩大排除规则。
- `深读`：读取正文、关键实验表、附录与官方资产，按 `REVIEW_PROFILE.md` 生成站内 Research Readout。
- `可做`：进入 Opportunity Map，要求补齐最小实验和风险。
- `拥挤`：保留趋势跟踪，但降低立项优先级。
