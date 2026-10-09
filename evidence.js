// Official vote rows are shown as recorded, without inferring motive or an overall position.
import { filterVoteRecords, officialVoteUrl, formatVoteDate } from "./vote-records.mjs";

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
      const links = sources.map(source => '<li><a href="' + escapeHtml(source.url) + '" target="_blank" rel="noopener noreferrer">Read ' + escapeHtml(source.publisher) + " source text: " + escapeHtml(source.title) + ' ↗</a></li>').join("");
      return '<article class="evidence-claim"><p class="evidence-meta">' + escapeHtml(claim.topic) + " · " + escapeHtml(claim.type) + " · " + escapeHtml(claim.date) + '</p><p class="evidence-summary">' + escapeHtml(claim.summary) + '</p><details><summary>Read actual source text (' + sources.length + ')</summary><ul>' + links + "</ul></details>" + (sources.length < 2 ? "<small>One source available; independent corroboration pending.</small>" : "") + "</article>";
    }).join("");
    return rendered || '<p class="evidence-empty">No sourced candidate claims published yet. This does not mean the candidate has no positions or record.</p>';
  }

  function renderVoteCard(vote) {
    const sourceUrl = officialVoteUrl(vote);
    const linkLabel = vote.chamber === "house" ? "House Clerk roll-call record" : "Senate.gov roll-call record (XML)";
    const link = sourceUrl ? '<a href="' + escapeHtml(sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + linkLabel + " ↗</a>" : "";
    return '<article class="vote-record"><p class="vote-meta">' + escapeHtml(formatVoteDate(vote.date)) + " · " + escapeHtml(vote.memberOffice || vote.chamber) + '</p><h6>' + escapeHtml(vote.question || "Roll-call vote") + '</h6><p class="vote-outcome"><strong>Recorded vote:</strong> ' + escapeHtml(vote.vote || "Not reported") + ' <span>· Question result: ' + escapeHtml(vote.result || "Not reported") + "</span></p>" + (vote.billUrl && /^https:\/\/www\.congress\.gov\//.test(vote.billUrl) ? '<p><a href="' + escapeHtml(vote.billUrl) + '" target="_blank" rel="noopener noreferrer">Related bill on Congress.gov ↗</a></p>' : "") + link + "</article>";
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
      const more = details.querySelector(".vote-more");
      let visibleLimit = 20;
      const update = () => {
        const filtered = filterVoteRecords(records, { query: search.value, choice: choice.value });
        const visible = filtered.slice(0, visibleLimit);
        output.innerHTML = visible.map(renderVoteCard).join("") || '<p class="evidence-empty">No roll-call records match these filters.</p>';
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
      title.textContent = "Votes & positions — read the source text";
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
        choice.innerHTML = '<option value="all">All votes</option><option>Yea</option><option>Nay</option><option>Present</option><option>Not Voting</option>';
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
