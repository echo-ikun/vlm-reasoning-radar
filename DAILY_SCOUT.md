# Daily Scout Runbook

每日 Scout 的目标是让研究信号稳定落库，而不是每天强行完成一篇论文精读。

## 产出契约

- 检索最近 3 天的新提交或重要修订，覆盖三个 campaign，且最多 20% 为 peripheral radar。
- 先按 arXiv ID、DOI、规范化标题与第一作者去重，并排除已在 `data/papers.jsonl` 中的记录。
- 最多收录 3 篇 `Deep-read Candidate`、5 篇 Watchlist；没有高质量论文时可以只写空日报。
- 摘要级结论一律标记 `abstract-only`，不得写成作者结论已被验证。
- 每篇只回答四件事：具体问题、去掉包装后的真实变量、值得深读的理由、当前证据缺口。
- 写入 `data/papers.jsonl` 与 `digests/YYYY-MM-DD.md`；日报使用“今日研究判断 / Deep-read Candidates / Watchlist / 排除统计 / 下一步”五段结构。

## 禁止事项

- 不下载 PDF，不读全文，不写 `data/analyses/`，不更新 Zotero。
- 不用低相关论文填配额；不因摘要分高而替作者背书。
- 不提交密钥、环境变量、个人论文文件夹或任何 `tmp/` 内容。

## 收尾

依次运行：

```bash
python3 scripts/validate_radar.py
python3 scripts/validate_analyses.py
python3 scripts/build_site.py
git diff --check
```

只有本轮产生的论文记录、日报或站点派生文件有变更时，提交 `Radar scout YYYY-MM-DD` 并推送 `main`。若检索、校验或推送失败，保留干净工作树并在结果中说明失败步骤与修复建议。
