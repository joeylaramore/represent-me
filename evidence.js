// Official vote rows are shown as recorded, without inferring motive or an overall position.
import { filterVoteRecords, groupVoteRecords, classifyVoteRecord, summarizeProceduralVote, officialVoteUrl, formatVoteDate } from "./vote-records.mjs?v=vote-groups-1";

(async () => {
  const root = document.getElementById("preliminary-ballot");
  if (!root) return;
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  let claims = [];
  try {
    const response = await fetch("data/candidate-evidence-2026.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Candidate claims unavailable");
    const json = await response.json();
    claims = Array.isArray(json.candidates) ? json.candidates : [];
  } catch { claims = []; }

  let votesPromise;
  const loadVotes = () => votesPromise ||= fetch("data/imported-evidence-2026.json", { cache: "no-store" })
    .then(response => { if (!response.ok) throw new Error("Vote records unavailable"); return response.json(); })
    .then(json => Array.isArray(json.votes) ? json.votes : []);

  function renderClaims(candidate) {
    const items = Array.isArray(candidate?.claims) ? candidate.claims : [];
    const rendered = items.map(claim => {
      const sources = Array.isArray(claim.sources) ? claim.sources.filter(source => source && /^https:\/\//.test(source.url) && source.publisher && source.title) : [];
      if (!sources.length || !claim.summary || !claim.type || !claim.topic || !claim.date) return "";
      const preview = claim.summary.length > 180 ? claim.summary.slice(0, 177).trimEnd() + "…" : claim.summary;
      const links = sources.map(source => '<li><a href="' + escapeHtml(source.url) + '" target="_blank" rel="noopener noreferrer">Read ' + escapeHtml(source.publisher) + " source text: " + escapeHtml(source.title) + ' ↗</a></li>').join("");
      const corroboration = sources.length < 2 ? "<small>One source available; independent corroboration pending.</small>" : "";
      return '<details class="evidence-claim"><summary><span class="evidence-meta">' + escapeHtml(claim.topic) + " · " + escapeHtml(claim.date) + " · " + escapeHtml(claim.type) + '</span><span class="evidence-preview">' + escapeHtml(preview) + '</span><span class="evidence-expand-hint">Expand for context &amp; citations</span></summary><div class="evidence-detail"><p class="evidence-summary">' + escapeHtml(claim.summary) + '</p>' + corroboration + '<details class="evidence-sources"><summary>Sources and cross-checks (' + sources.length + ')</summary><ul>' + links + "</ul></details></div></details>";
    }).join("");
    return rendered ? '<div class="evidence-claim-list">' + rendered + '</div>' : '<p class="evidence-empty">No sourced candidate claims published yet. This does not mean the candidate has no positions or record.</p>';
  }
  function renderVoteCard(vote) {
    const sourceUrl = officialVoteUrl(vote);
    const linkLabel = vote.chamber === "house" ? "House Clerk roll-call record" : "Senate.gov roll-call record (XML)";
    const link = sourceUrl ? '<a href="' + escapeHtml(sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + linkLabel + " ↗</a>" : "";
    const category = classifyVoteRecord(vote);
    const categoryLabel = category === "procedural" ? "Procedural action" : category === "legislation" ? "Bill or amendment vote" : "Action type not classified";
    const hasReviewedContext = vote.contextReviewed === true && vote.purpose && vote.effect;
    const proceduralGuide = !hasReviewedContext ? summarizeProceduralVote(vote) : null;
    const contextSources = hasReviewedContext && Array.isArray(vote.contextSources)
      ? '<ul class="vote-context-sources">' + vote.contextSources.filter(source => source && source.title && /^https:\/\//.test(source.url)).map(source => '<li><a href="' + escapeHtml(source.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(source.title) + ' ↗</a></li>').join("") + "</ul>"
      : "";
    const reviewedContext = hasReviewedContext
      ? '<div class="vote-explanation"><p><strong>What it was for:</strong> ' + escapeHtml(vote.purpose) + '</p><p><strong>What it would do:</strong> ' + escapeHtml(vote.effect) + '</p>' + contextSources + '</div>'
      : "";
    const proceduralContext = proceduralGuide
      ? '<div class="vote-explanation"><p><strong>What it was for:</strong> ' + escapeHtml(proceduralGuide.purpose) + '</p><p><strong>What it would do:</strong> ' + escapeHtml(proceduralGuide.effect) + '</p><p class="vote-source-note">General Senate procedure, not a summary of the underlying bill. <a href="' + escapeHtml(proceduralGuide.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(proceduralGuide.sourceTitle) + ' ↗</a></p></div>'
      : "";
    const context = reviewedContext || proceduralContext || '<p class="vote-context-pending">Plain-language purpose and effect have not been reviewed for this roll call. The official question and linked measure are provided so you can check the source.</p>';
    return '<article class="vote-record"><p class="vote-meta">' + escapeHtml(categoryLabel) + " · " + escapeHtml(formatVoteDate(vote.date)) + " · " + escapeHtml(vote.memberOffice || vote.chamber) + '</p><h6>' + escapeHtml(vote.question || "Roll-call vote") + '</h6>' + context + '<p class="vote-outcome"><strong>Recorded vote:</strong> ' + escapeHtml(vote.vote || "Not reported") + ' <span>· Question result: ' + escapeHtml(vote.result || "Not reported") + "</span></p>" + (vote.billUrl && /^https:\/\/www\.congress\.gov\//.test(vote.billUrl) ? '<p><a href="' + escapeHtml(vote.billUrl) + '" target="_blank" rel="noopener noreferrer">Related measure on Congress.gov ↗</a></p>' : "") + link + "</article>";
  }

  async function openVotePanel(details, candidateName) {
    if (details.dataset.loaded) return;
    const output = details.querySelector(".vote-results");
    const status = details.querySelector(".vote-status");
    const summary = details.querySelector("summary");
    status.textContent = "Loading official roll-call records…";
    try {
      const allVotes = await loadVotes();
      const records = allVotes.filter(vote => vote.candidate === candidateName);
      summary.textContent = "Official voting record (" + records.length + ")";
      details.dataset.loaded = "true";
      const search = details.querySelector(".vote-search");
      const choice = details.querySelector(".vote-choice");
      const allOption = document.createElement("option");
      allOption.value = "all";
      allOption.textContent = "All votes";
      choice.replaceChildren(allOption);
      [...new Set(records.map(vote => vote.vote).filter(Boolean))].sort((a, b) => a.localeCompare(b)).forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        choice.appendChild(option);
      });
      const more = details.querySelector(".vote-more");
      let visibleLimit = 20;
      const update = () => {
        const filtered = filterVoteRecords(records, { query: search.value, choice: choice.value });
        const visible = filtered.slice(0, visibleLimit);
        const groups = groupVoteRecords(visible);
        output.innerHTML = groups.map(group => '<section class="vote-group" aria-labelledby="vote-group-' + group.id + '"><h5 id="vote-group-' + group.id + '">' + group.title + ' <span>(' + group.records.length + ')</span></h5><p>' + group.description + '</p>' + group.records.map(renderVoteCard).join("") + '</section>').join("") || '<p class="evidence-empty">No roll-call records match these filters.</p>';
        status.textContent = "Showing " + visible.length + " of " + filtered.length + " matching records" + (records.length !== filtered.length ? " (" + records.length + " total)." : ".");
        more.hidden = visible.length >= filtered.length;
      };
      search.addEventListener("input", () => { visibleLimit = 20; update(); });
      choice.addEventListener("change", () => { visibleLimit = 20; update(); });
      more.addEventListener("click", () => { visibleLimit += 20; update(); });
      more.hidden = records.length <= 20;
      update();
    } catch {
      status.textContent = "Official roll-call records could not be loaded. Please try again later.";
      details.dataset.loaded = "";
    }
  }

  function enhance() {
    root.querySelectorAll(".ballot-row").forEach(row => {
      if (row.querySelector(".candidate-evidence")) return;
      const office = row.querySelector("h4")?.textContent || "";
      const names = [...row.querySelectorAll(".ballot-option:not(.ballot-undecided) strong")].map(node => node.textContent);
      const panel = document.createElement("details");
      panel.className = "candidate-evidence";
      const title = document.createElement("summary");
      title.textContent = "Candidate research — summaries, votes & sources";
      panel.appendChild(title);
      const content = document.createElement("div");
      content.className = "evidence-candidates";
      for (const name of names) {
        const item = document.createElement("section");
        item.className = "evidence-candidate";
        const heading = document.createElement("h5");
        heading.textContent = name;
        item.appendChild(heading);
        const records = document.createElement("details");
        records.className = "official-votes";
        records.addEventListener("toggle", () => { if (records.open) openVotePanel(records, name); });
        const recordsTitle = document.createElement("summary");
        recordsTitle.textContent = "Official voting record — open to load";
        records.appendChild(recordsTitle);
        const controls = document.createElement("div");
        controls.className = "vote-controls";
        const searchLabel = document.createElement("label");
        searchLabel.textContent = "Search votes";
        const search = document.createElement("input");
        search.type = "search";
        search.className = "vote-search";
        search.placeholder = "Question, date, or result";
        searchLabel.appendChild(search);
        const choiceLabel = document.createElement("label");
        choiceLabel.textContent = "Filter by recorded vote";
        const choice = document.createElement("select");
        choice.className = "vote-choice";
        const all = document.createElement("option");
        all.value = "all";
        all.textContent = "All votes";
        choice.appendChild(all);
        choiceLabel.appendChild(choice);
        controls.append(searchLabel, choiceLabel);
        records.appendChild(controls);
        const status = document.createElement("p");
        status.className = "vote-status";
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        records.appendChild(status);
        const output = document.createElement("div");
        output.className = "vote-results";
        records.appendChild(output);
        const more = document.createElement("button");
        more.type = "button";
        more.className = "outline vote-more";
        more.textContent = "Show next 20";
        more.hidden = true;
        records.appendChild(more);
        item.appendChild(records);
        const evidence = claims.find(candidate => candidate.office === office && candidate.name === name);
        const claimsHeading = document.createElement("h6");
        claimsHeading.className = "candidate-claims-heading";
        claimsHeading.textContent = "Sourced statements and actions";
        item.appendChild(claimsHeading);
        const claimBody = document.createElement("div");
        claimBody.innerHTML = renderClaims(evidence);
        item.appendChild(claimBody);
        content.appendChild(item);
      }
      const note = document.createElement("p");
      note.className = "evidence-disclaimer";
      note.textContent = "Roll calls are shown as recorded; procedural motions and amendments do not necessarily represent a vote on an entire bill. These records do not establish motive, an overall policy position, or effectiveness. Candidate statements are attributed and cross-checked where sources are available. This site does not endorse candidates. Missing evidence is not a negative assessment; roster and coverage remain preliminary.";
      content.appendChild(note);
      panel.appendChild(content);
      row.appendChild(panel);
    });
  }

  new MutationObserver(() => {
    if (root.querySelector(".ballot-row:not(:has(.candidate-evidence))")) enhance();
  }).observe(root, { childList: true, subtree: true });
  enhance();
})();
