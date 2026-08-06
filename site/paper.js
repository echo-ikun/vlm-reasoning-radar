const $ = (selector) => document.querySelector(selector);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function pill(text, tone = "neutral") {
  return el("span", `readout-pill ${tone}`, text);
}

function section(title, eyebrow) {
  const block = el("section", "readout-section");
  const header = el("div", "readout-section-heading");
  if (eyebrow) header.append(el("p", "eyebrow", eyebrow));
  header.append(el("h2", "", title));
  block.append(header);
  return block;
}

function bullets(items, className = "readout-list") {
  const list = el("ul", className);
  items.forEach((item) => list.append(el("li", "", item)));
  return list;
}

function factCard(label, value) {
  const card = el("article", "fact-card");
  card.append(el("span", "fact-label", label), el("p", "", value));
  return card;
}

function scoreRow(label, value) {
  const row = el("div", "judgment-score");
  const head = el("div", "judgment-score-head");
  head.append(el("span", "", label), el("b", "", `${Number(value).toFixed(1)} / 5`));
  const track = el("div", "score-track");
  const fill = el("span", "score-fill");
  fill.style.width = `${Number(value) * 20}%`;
  track.append(fill);
  row.append(head, track);
  return row;
}

function externalLink(label, href, className = "source-button") {
  const link = el("a", className, label);
  link.href = href;
  link.target = "_blank";
  link.rel = "noreferrer";
  return link;
}

function renderHero(paper, analysis) {
  const hero = el("section", "readout-hero");
  const meta = el("div", "readout-meta");
  meta.append(
    pill("FULL-PAPER CHECKED", "green"),
    pill(analysis.paper_version),
    pill(`Reviewed ${analysis.reviewed_on}`)
  );
  const title = el("h1", "readout-title", paper.title);
  const authors = el("p", "readout-authors", paper.authors.join(", "));
  const decision = el("div", "readout-decision");
  decision.append(
    el("span", "fact-tag", "INFERENCE"),
    el("p", "decision-one-liner", analysis.decision.one_liner),
    el("p", "decision-bottom", analysis.decision.bottom_line)
  );
  const actions = el("div", "readout-actions");
  actions.append(
    externalLink("Open paper ↗", analysis.assets.paper, "primary-button"),
    externalLink("PDF ↗", analysis.assets.pdf, "secondary-button")
  );
  if (analysis.assets.code_url) actions.append(externalLink("Claimed code ↗", analysis.assets.code_url, "secondary-button"));
  hero.append(meta, title, authors, decision, actions);
  return hero;
}

function renderNarrative(analysis) {
  const block = section("从论文叙事中拆出真实增量", "DE-NARRATED CONTRIBUTION");
  const grid = el("div", "narrative-grid");
  const surface = el("article", "narrative-card surface");
  surface.append(el("span", "narrative-label", "作者表层叙事"), el("p", "", analysis.decision.surface_claim));
  const actual = el("article", "narrative-card actual");
  actual.append(el("span", "narrative-label", "我们认为真正做了什么"), el("p", "", analysis.decision.de_narrated));
  grid.append(surface, actual);
  const why = el("div", "why-panel");
  why.append(el("span", "fact-tag", "INFERENCE"), el("h3", "", "为什么对我们有用"), el("p", "", analysis.decision.why_it_matters));
  block.append(grid, why);
  return block;
}

function renderFingerprint(analysis) {
  const block = section("实验指纹", "MODELS · DATA · INPUTS · COMPUTE");
  const fp = analysis.task_fingerprint;
  const cards = el("div", "fact-grid");
  cards.append(
    factCard("具体问题", fp.problem_type),
    factCard("研究阶段", fp.stage),
    factCard("输入", fp.inputs.join("；")),
    factCard("输出", fp.outputs.join("；")),
    factCard("模型", analysis.models.map((model) => `${model.name} (${model.size})`).join("；")),
    factCard("训练数据", analysis.data_ledger.training_data),
    factCard("生成预算", analysis.compute_ledger.generation_budget),
    factCard("硬件与成本", `${analysis.compute_ledger.hardware} ${analysis.compute_ledger.reported_cost}`)
  );
  block.append(cards);

  const modelGrid = el("div", "model-grid");
  analysis.models.forEach((model) => {
    const card = el("article", "model-card");
    card.append(el("h3", "", model.name), pill(model.size, "blue"), el("p", "model-role", model.role), el("p", "", model.notes));
    modelGrid.append(card);
  });
  block.append(modelGrid);
  return block;
}

function renderMethod(analysis) {
  const block = section("方法拆解", "WHAT ACTUALLY CHANGED");
  const layout = el("div", "method-layout");
  const pipeline = el("ol", "pipeline-list");
  analysis.method_decomposition.pipeline.forEach((step) => pipeline.append(el("li", "", step)));
  const delta = el("aside", "true-delta");
  delta.append(el("span", "fact-tag", "INFERENCE"), el("h3", "", "真正的 delta"), el("p", "", analysis.method_decomposition.true_delta));
  layout.append(pipeline, delta);
  const compare = el("div", "compare-grid");
  const prior = el("article", "compare-card");
  prior.append(el("h3", "", "已有组件 / 前置思想"), bullets(analysis.method_decomposition.borrowed_or_prior));
  const costs = el("article", "compare-card warning");
  costs.append(el("h3", "", "容易被包装隐藏的成本"), bullets(analysis.method_decomposition.hidden_costs));
  compare.append(prior, costs);
  block.append(layout, compare);
  return block;
}

function renderBenchmarks(analysis) {
  const block = section("Benchmark 到底测了什么", "EVALUATION AUDIT");
  const wrap = el("div", "table-wrap");
  const table = el("table", "benchmark-table");
  const head = el("thead");
  const headRow = el("tr");
  ["Benchmark", "考察能力 / 规模", "主要结果", "我们的判断"].forEach((name) => headRow.append(el("th", "", name)));
  head.append(headRow);
  const body = el("tbody");
  analysis.benchmark_audit.forEach((bench) => {
    const row = el("tr");
    const name = el("td", "benchmark-name");
    name.append(el("strong", "", bench.name), el("span", "", bench.metric));
    const capability = el("td");
    capability.append(el("p", "", bench.capability), el("small", "", bench.sample_size));
    row.append(name, capability, el("td", "", bench.main_result), el("td", "benchmark-read", bench.our_read));
    body.append(row);
  });
  table.append(head, body);
  wrap.append(table);
  block.append(wrap);
  return block;
}

function renderAudit(analysis) {
  const block = section("我们发现的证据与风险", "FACTS FIRST");
  const code = el("div", `asset-status ${analysis.assets.code_verified ? "verified" : "unavailable"}`);
  code.append(
    pill(analysis.assets.code_verified ? "CODE VERIFIED" : "CODE UNAVAILABLE", analysis.assets.code_verified ? "green" : "red"),
    el("p", "", analysis.assets.code_status)
  );
  block.append(code);
  const flags = el("div", "audit-grid");
  analysis.audit_flags.forEach((flag) => {
    const card = el("article", `audit-card severity-${flag.severity}`);
    const top = el("div", "audit-top");
    top.append(pill(flag.kind, flag.kind === "FACT" ? "blue" : "violet"), pill(flag.severity.toUpperCase(), flag.severity === "high" ? "red" : "neutral"));
    card.append(top, el("h3", "", flag.claim), el("p", "audit-support", flag.support), el("p", "audit-interpretation", flag.interpretation));
    flags.append(card);
  });
  block.append(flags);
  return block;
}

function renderLineage(analysis) {
  const block = section("这篇工作从哪里来", "METHOD LINEAGE");
  const intro = el("p", "section-intro", "这里不把引用列表当作溯源。只保留真正解释方法来源、问题来源或相邻控制变量的工作。");
  const timeline = el("div", "lineage-list");
  analysis.lineage.forEach((item) => {
    const card = el("article", "lineage-card");
    const title = externalLink(item.title, item.url, "lineage-title");
    card.append(pill(item.confidence.toUpperCase()), title, el("p", "lineage-relation", item.relationship), el("p", "", item.our_read));
    timeline.append(card);
  });
  block.append(intro, timeline);
  return block;
}

function renderJudgment(analysis) {
  const block = section("像审稿人，也像准备自己做的人", "OUR JUDGMENT");
  const layout = el("div", "judgment-layout");
  const scores = el("div", "judgment-scores");
  scores.append(
    el("h3", "", analysis.judgment.work_type),
    scoreRow("算法探索", analysis.judgment.algorithmic),
    scoreRow("工程工作", analysis.judgment.engineering),
    scoreRow("评测价值", analysis.judgment.evaluation)
  );
  const notes = el("div", "judgment-notes");
  const solid = el("article", "judgment-note solid");
  solid.append(el("span", "fact-tag", "SOLID"), el("p", "", analysis.judgment.solid));
  const oversold = el("article", "judgment-note oversold");
  oversold.append(el("span", "fact-tag", "OVERSOLD"), el("p", "", analysis.judgment.oversold));
  notes.append(solid, oversold);
  layout.append(scores, notes);
  block.append(layout, el("h3", "subheading", "结论可能失效的地方"), bullets(analysis.judgment.failure_modes));
  return block;
}

function renderIdeas(analysis) {
  const block = section("哪些东西可以被我们拿走", "IDEA CANDIDATES");
  const grid = el("div", "idea-grid");
  analysis.reuse_ideas.forEach((idea, index) => {
    const card = el("article", "idea-card");
    const head = el("div", "idea-head");
    head.append(el("span", "idea-number", String(index + 1).padStart(2, "0")), pill("IDEA", "violet"));
    card.append(
      head,
      el("h3", "", idea.title),
      el("p", "idea-insight", idea.insight),
      el("h4", "", "如何缝合"),
      el("p", "", idea.adaptation),
      el("h4", "", "最小实验"),
      el("p", "", idea.minimal_experiment),
      el("h4", "", "价值 / 风险"),
      el("p", "", `${idea.expected_value} 风险：${idea.risk}`)
    );
    const venues = el("div", "idea-venues");
    idea.venue_fit.forEach((venue) => venues.append(pill(venue, "blue")));
    card.append(venues);
    grid.append(card);
  });
  block.append(grid);
  const next = el("div", "next-action");
  next.append(el("span", "fact-tag", "NEXT ACTION"), el("p", "", analysis.next_action));
  block.append(next);
  return block;
}

async function init() {
  const main = $("#readout-main");
  try {
    const id = new URLSearchParams(window.location.search).get("id");
    const response = await fetch("./data/papers.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const paper = data.papers.find((item) => item.id === id);
    if (!paper) throw new Error("Paper not found");
    if (!paper.analysis) throw new Error("This paper has not received a full-paper readout yet");
    const analysis = paper.analysis;
    document.title = `${paper.title} · Research Readout`;
    $("#arxiv-nav").href = analysis.assets.paper;
    main.replaceChildren(
      renderHero(paper, analysis),
      renderNarrative(analysis),
      renderFingerprint(analysis),
      renderMethod(analysis),
      renderBenchmarks(analysis),
      renderAudit(analysis),
      renderLineage(analysis),
      renderJudgment(analysis),
      renderIdeas(analysis)
    );
  } catch (error) {
    const empty = el("div", "readout-error");
    empty.append(el("h1", "", "Research readout unavailable"), el("p", "", error.message));
    const back = el("a", "primary-button", "Back to radar");
    back.href = "./";
    empty.append(back);
    main.replaceChildren(empty);
  }
}

init();
