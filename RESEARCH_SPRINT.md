# Research Sprint Runbook

Research Sprint 由人工点选或每周触发；一次最多深读两篇，绝不作为每日 Scout 的前置条件。

1. 从 `Deep-read Candidate` 或用户指定论文中选主论文。
2. 临时 PDF 仅放在 `tmp/pdfs/`；阅读正文、关键表、附录，并在结束时删除全部临时文件。
3. 实际访问作者声称公开的代码、数据、模型和 benchmark；不可访问就明确记录。
4. 写入符合 `schemas/analysis.schema.json` 的 `data/analyses/<paper-id>.json`。
5. 输出必须区分 FACT、INFERENCE、IDEA，并还原输入输出、数据/算力、真实变量、对照公平性、可复用最小实验与风险。
6. 通过 `validate_radar.py`、`validate_analyses.py`、`build_site.py` 后再提交 `Research sprint YYYY-MM-DD`。
