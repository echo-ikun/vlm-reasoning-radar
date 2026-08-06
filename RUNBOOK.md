# Radar Runbook

## 每日任务

1. 读取 `research-tree.yaml`、`config/*.yaml` 和 `campaigns/*.yaml`。
2. 读取最近的 `data/papers.jsonl` 与 `digests/`，避免重复报告。
3. 按 `lookback_days` 检索新提交和重要修订；先分别执行每个 campaign 的 `positive_queries` 并取并集，通用 `vision language` 宽查询最多占候选预算的 20%。优先使用论文、官方会议页面和官方代码仓库。
4. 先按 arXiv ID、DOI 去重，再使用规范化标题和第一作者做模糊去重。
5. 为候选论文选择唯一 `primary_branch`，跨维度属性只写入 tags。
6. 按 `config/radar.yaml` 评分，生成 Deep-read Candidate、Watchlist 和排除统计。摘要级高分表示“值得全文核验”，不表示已经认可论文结论。
7. 从 Deep-read Candidate 中选择最多 1 篇主论文；严格遵循 `REVIEW_PROFILE.md`，读取全文、关键实验表、附录，并检查作者声称公开的代码、数据和模型是否真实可访问。按需读取最多 2 篇最近邻工作做方法溯源。
8. 临时 PDF 只允许写入 `tmp/pdfs/`，完成分析后删除，不进入论文文件夹或 Git。将深读结果写入 `data/analyses/<paper-id>.json`，并符合 `schemas/analysis.schema.json`。
9. 将新记录追加到 `data/papers.jsonl`，将日报写入 `digests/YYYY-MM-DD.md`。日报必须区分摘要候选与 Full-paper Research Readout，并将 FACT、INFERENCE、IDEA 分开。
10. 运行 `python3 scripts/validate_radar.py` 和 `python3 scripts/validate_analyses.py`；校验失败时修复本轮数据，不得留下损坏记录。
11. 不永久下载 PDF、不写 Zotero。日报与数据校验通过后，运行 `python3 scripts/build_site.py`，仅提交本轮产生的雷达数据、深读、日报和站点派生文件；有变更时提交到当前 `main` 分支并推送到 `origin`。GitHub Pages 与 Daily Radar Issue 由 Actions 自动发布。

## 摘要规范

每篇 Full-paper Research Readout 必须回答：

- 论文真正解决了什么问题？
- 方法相对最接近工作的关键差异是什么？
- 主要结果是否控制了模型规模、额外数据、推理预算和 benchmark 设置？
- 证据来自摘要、全文、代码还是复现？
- 它暴露了什么研究空白、矛盾或可验证失败模式？
- 使用了哪些模型、数据、样本规模、输入输出和生成/训练预算？
- 去掉作者命名后，真正新增的是算法、数据管线、prompt、额外计算还是控制实验？
- 声称公开的代码、数据、模型与 benchmark 是否实际可用？
- 哪些组件来自已有工作，哪些只是新组合？
- 更偏算法探索、工程、数据还是评测？我们能提炼什么最小可行 idea？

不得把摘要中的自我宣传直接改写成事实。仅检查摘要时，`evidence_level` 必须是 `abstract-only`，且只能作为 Deep-read Candidate 或 Watchlist。深读输出必须把论文事实、我们的推断和待验证 idea 明确分开。

## 每周任务

- 汇总各 campaign 的论文密度、代码可用率、重复问题和竞争强度。
- 只将至少由两篇独立工作支持，或能通过低成本实验验证的问题写入 Opportunity Map。
- 明确区分“趋势”“研究空白”“可做项目”。
- 给出 campaign 权重调整建议，但不自动改变主方向。

## 失败处理

- 某一数据源不可用时继续使用其他来源，并在日报记录缺口。
- 无高质量新论文时可以生成空日报，不用低相关论文填满配额。
- 无法核实论文、代码或 venue 时标记 `unverified`，不要猜测。
