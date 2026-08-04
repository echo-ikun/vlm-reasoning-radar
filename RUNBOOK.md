# Radar Runbook

## 每日任务

1. 读取 `research-tree.yaml`、`config/*.yaml` 和 `campaigns/*.yaml`。
2. 读取最近的 `data/papers.jsonl` 与 `digests/`，避免重复报告。
3. 按 `lookback_days` 检索新提交和重要修订；先分别执行每个 campaign 的 `positive_queries` 并取并集，通用 `vision language` 宽查询最多占候选预算的 20%。优先使用论文、官方会议页面和官方代码仓库。
4. 先按 arXiv ID、DOI 去重，再使用规范化标题和第一作者做模糊去重。
5. 为候选论文选择唯一 `primary_branch`，跨维度属性只写入 tags。
6. 按 `config/radar.yaml` 评分，生成 Must Read、Watchlist 和排除统计。
7. 将新记录追加到 `data/papers.jsonl`，将日报写入 `digests/YYYY-MM-DD.md`。
8. 运行 `python3 scripts/validate_radar.py`；校验失败时修复本轮数据，不得留下损坏的 JSONL。
9. 不自动下载 PDF、不写 Zotero、不提交 Git、不向外部平台发布，除非配置和用户授权发生变化。

## 摘要规范

每篇 Must Read 必须回答：

- 论文真正解决了什么问题？
- 方法相对最接近工作的关键差异是什么？
- 主要结果是否控制了模型规模、额外数据、推理预算和 benchmark 设置？
- 证据来自摘要、全文、代码还是复现？
- 它暴露了什么研究空白、矛盾或可验证失败模式？

不得把摘要中的自我宣传直接改写成事实。仅检查摘要时，`evidence_level` 必须是 `abstract-only`。

## 每周任务

- 汇总各 campaign 的论文密度、代码可用率、重复问题和竞争强度。
- 只将至少由两篇独立工作支持，或能通过低成本实验验证的问题写入 Opportunity Map。
- 明确区分“趋势”“研究空白”“可做项目”。
- 给出 campaign 权重调整建议，但不自动改变主方向。

## 失败处理

- 某一数据源不可用时继续使用其他来源，并在日报记录缺口。
- 无高质量新论文时可以生成空日报，不用低相关论文填满配额。
- 无法核实论文、代码或 venue 时标记 `unverified`，不要猜测。
