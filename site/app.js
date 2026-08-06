const state = { papers: [], campaign: "all", verdict: "all", query: "" };

const $ = (selector) => document.querySelector(selector);
const campaignLabel = (id) => ({
  "agentic-visual-reasoning": "Agentic Visual",
  "multimodal-reasoning-post-training": "Post-training",
  "video-streaming-reasoning": "Video / Streaming",
}[id] || id);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderMetrics(data) {
  $("#paper-count").textContent = data.paper_count;
  $("#deep-read-count").textContent = data.deep_read_count || 0;
  $("#campaign-count").textContent = data.campaigns.length;
  const timestamp = new Date(data.generated_at);
  $("#last-updated").textContent = `Updated ${timestamp.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
}

function renderSignals(digest) {
  $("#digest-date").textContent = digest.date || "No digest";
  $("#signal-lead").textContent = digest.bullets[0]?.replace(/^一句话趋势：/, "") || "等待第一份研究日报。";
  $("#digest-link").href = digest.github_url || "#signals";
  const list = $("#signal-list");
  list.replaceChildren();
  (digest.signals.length ? digest.signals : digest.bullets.slice(1, 4)).forEach((signal, index) => {
    const item = element("div", "signal-item");
    item.append(element("b", "", String(index + 1).padStart(2, "0")), element("span", "", signal));
    list.append(item);
  });
}

function renderCampaigns(campaigns) {
  const container = $("#campaign-filters");
  container.replaceChildren();
  ["all", ...campaigns].forEach((campaign) => {
    const button = element("button", `campaign-filter${campaign === state.campaign ? " active" : ""}`, campaign === "all" ? "All campaigns" : campaignLabel(campaign));
    button.type = "button";
    button.dataset.campaign = campaign;
    button.addEventListener("click", () => {
      state.campaign = campaign;
      renderCampaigns(campaigns);
      renderPapers();
    });
    container.append(button);
  });
}

function paperCard(paper) {
  const card = element("article", "paper-card");
  const analysis = paper.analysis;
  const top = element("div", "paper-card-top");
  const verdictText = analysis
    ? "research readout"
    : (paper.verdict === "must-read" ? "deep-read candidate" : paper.verdict.replace("-", " "));
  const verdict = element("span", `verdict ${paper.verdict}`, verdictText);
  const score = analysis
    ? element("span", "readout-badge", "FULL READOUT")
    : element("span", "score", Number(paper.scores.total).toFixed(3));
  top.append(verdict, score);

  const heading = element("h3");
  const link = element("a", "", paper.title);
  link.href = analysis ? `./paper.html?id=${encodeURIComponent(paper.id)}` : (paper.urls?.paper || "#");
  if (!analysis) {
    link.target = "_blank";
    link.rel = "noreferrer";
  }
  heading.append(link);

  const authorText = paper.authors.length > 4 ? `${paper.authors.slice(0, 4).join(", ")} +${paper.authors.length - 4}` : paper.authors.join(", ");
  const authors = element("p", "authors", authorText);
  const problem = element("p", `paper-problem${analysis ? " de-narrated" : ""}`, analysis?.decision?.de_narrated || paper.summary?.problem || paper.summary?.method || "Summary pending.");
  if (analysis) {
    const why = element("p", "paper-why", analysis.decision.why_it_matters);
    card.append(top, heading, authors, problem, why);
  } else {
    card.append(top, heading, authors, problem);
  }
  const footer = element("div", "paper-footer");
  const chips = element("div", "chips");
  [campaignLabel(paper.campaigns?.[0]), paper.primary_branch].filter(Boolean).forEach((label) => chips.append(element("span", "chip", label)));
  const evidence = element("span", "evidence", analysis?.evidence_level || paper.evidence_level || "unverified");
  footer.append(chips, evidence);
  card.append(footer);
  if (analysis) {
    const actions = element("div", "card-actions");
    const readout = element("a", "readout-link", "Open research readout →");
    readout.href = `./paper.html?id=${encodeURIComponent(paper.id)}`;
    const source = element("a", "source-link", "arXiv ↗");
    source.href = paper.urls?.paper || "#";
    source.target = "_blank";
    source.rel = "noreferrer";
    actions.append(readout, source);
    card.append(actions);
  }
  return card;
}

function filteredPapers() {
  const query = state.query.trim().toLocaleLowerCase();
  return state.papers.filter((paper) => {
    if (state.campaign !== "all" && !paper.campaigns.includes(state.campaign)) return false;
    if (state.verdict !== "all" && paper.verdict !== state.verdict) return false;
    if (!query) return true;
    const haystack = [paper.title, ...paper.authors, paper.primary_branch, paper.summary?.problem, paper.summary?.method].filter(Boolean).join(" ").toLocaleLowerCase();
    return haystack.includes(query);
  });
}

function renderPapers() {
  const papers = filteredPapers();
  const grid = $("#paper-grid");
  grid.replaceChildren(...papers.map(paperCard));
  $("#result-count").textContent = `${papers.length} paper${papers.length === 1 ? "" : "s"}`;
  $("#empty-state").hidden = papers.length > 0;
}

async function init() {
  try {
    const response = await fetch("./data/papers.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.papers = data.papers;
    renderMetrics(data);
    renderSignals(data.latest_digest);
    renderCampaigns(data.campaigns);
    renderPapers();
  } catch (error) {
    $("#signal-lead").textContent = "Research data could not be loaded.";
    $("#paper-grid").replaceChildren(element("div", "empty-state", `Load error: ${error.message}`));
  }
}

$("#search-input").addEventListener("input", (event) => { state.query = event.target.value; renderPapers(); });
$("#verdict-filter").addEventListener("change", (event) => { state.verdict = event.target.value; renderPapers(); });
init();
