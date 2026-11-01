// Official vote rows are shown as recorded, without inferring motive or an overall position.
import { filterVoteRecords, groupVoteRecords, classifyVoteRecord, summarizeProceduralVote, officialVoteUrl, formatVoteDate } from "./vote-records.mjs?v=plain-language-votes-1";

(async () => {
  const root = document.getElementById("preliminary-ballot");
  const representativeRoot = document.getElementById("representative-list");
  if (!root && !representativeRoot) return;
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  let claims = [];
  try {
    const response = await fetch("data/candidate-evidence-2026.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Candidate claims unavailable");
    const json = await response.json();
    claims = Array.isArray(json.candidates) ? json.candidates : [];
  } catch { claims = []; }

  let importedEvidencePromise;
  const loadImportedEvidence = () => importedEvidencePromise ||= fetch("data/imported-evidence-2026.json", { cache: "no-store" })
    .then(response => { if (!response.ok) throw new Error("Imported evidence unavailable"); return response.json(); });
  const loadVotes = () => loadImportedEvidence().then(json => Array.isArray(json.votes) ? json.votes : []);
  const loadNewsLeads = () => loadImportedEvidence().then(json => Array.isArray(json.newsLeads) ? json.newsLeads : []);
  const loadPositionSources = () => loadImportedEvidence().then(json => Array.isArray(json.positionSources) ? json.positionSources : []);

  function renderClaims(candidate, limit = Infinity) {
    const items = Array.isArray(candidate?.claims) ? candidate.claims : [];
    const renderClaim = claim => {
      const sources = Array.isArray(claim.sources) ? claim.sources.filter(source => source && /^https:\/\//.test(source.url) && source.publisher && source.title) : [];
      if (!sources.length || !claim.summary || !claim.type || !claim.topic || !claim.date) return "";
      const preview = claim.summary.length > 180 ? claim.summary.slice(0, 177).trimEnd() + "…" : claim.summary;
      const links = sources.map(source => '<li><a href="' + escapeHtml(source.url) + '" target="_blank" rel="noopener noreferrer">Read ' + escapeHtml(source.publisher) + " source text: " + escapeHtml(source.title) + ' ↗</a></li>').join("");
      const corroboration = sources.length < 2 ? "<small>One source available; independent corroboration pending.</small>" : "";
      return '<details class="evidence-claim"><summary><span class="evidence-meta">' + escapeHtml(claim.topic) + " · " + escapeHtml(claim.date) + " · " + escapeHtml(claim.type) + '</span><span class="evidence-preview">' + escapeHtml(preview) + '</span><span class="evidence-expand-hint">Open explanation and sources</span></summary><div class="evidence-detail"><p class="evidence-summary">' + escapeHtml(claim.summary) + '</p>' + corroboration + '<details class="evidence-sources"><summary>Sources and cross-checks (' + sources.length + ')</summary><ul>' + links + "</ul></details></div></details>";
    };
    const visible = items.slice(0, limit).map(renderClaim).join("");
    const remaining = items.slice(limit);
    const more = remaining.length ? '<details class="more-evidence-claims"><summary>Show ' + remaining.length + ' more reviewed summaries</summary><div class="evidence-claim-list">' + remaining.map(renderClaim).join("") + '</div></details>' : "";
    return visible ? '<div class="evidence-claim-list">' + visible + '</div>' + more : '<p class="evidence-empty">No cross-checked public statement summaries are published yet. Missing coverage is not a negative finding.</p>';
  }

  function renderVoteCard(vote) {
    const sourceUrl = officialVoteUrl(vote);
    const linkLabel = vote.chamber === "house" ? "House Clerk roll-call record" : "Senate.gov roll-call record (XML)";
    const link = sourceUrl ? '<a href="' + escapeHtml(sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + linkLabel + " ↗</a>" : "";
    const category = classifyVoteRecord(vote);
    const categoryLabel = category === "procedural" ? "A vote about how Congress works" : category === "legislation" ? "A vote on bill text" : "We need more information";
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
    const context = reviewedContext || proceduralContext || '<p class="vote-context-pending">We have not yet checked what this vote would do. Read the official question and source before drawing a conclusion.</p>';
    const question = escapeHtml(vote.question || "Roll-call vote");
    const date = escapeHtml(formatVoteDate(vote.date));
    const recordedVote = escapeHtml(vote.vote || "Not reported");
    const shortVote = escapeHtml(({ Yea: "Voted yes", Nay: "Voted no", Aye: "Voted yes", No: "Voted no", "Not Voting": "Did not vote" })[vote.vote] || vote.vote || "Not reported");
    const result = escapeHtml(vote.result || "Not reported");
    return '<details class="vote-record"><summary><span class="vote-row-meta">' + date + ' · ' + escapeHtml(vote.memberOffice || vote.chamber) + '</span><span class="vote-row-question">' + question + '</span><span class="vote-row-choice">' + shortVote + '</span></summary><div class="vote-detail"><p class="vote-meta">' + escapeHtml(categoryLabel) + ' · ' + date + ' · ' + escapeHtml(vote.memberOffice || vote.chamber) + '</p><h6>' + question + '</h6>' + context + '<p class="vote-outcome"><strong>Recorded vote:</strong> ' + recordedVote + ' <span>· Question result: ' + result + '</span></p>' + (vote.billUrl && /^https:\/\/www\.congress\.gov\//.test(vote.billUrl) ? '<p><a href="' + escapeHtml(vote.billUrl) + '" target="_blank" rel="noopener noreferrer">Related measure on Congress.gov ↗</a></p>' : "") + link + '</div></details>';
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
      summary.textContent = "Recorded votes (" + records.length + ")";
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
        option.textContent = ({ Yea: "Voted yes", Nay: "Voted no", Aye: "Voted yes", No: "Voted no", "Not Voting": "Did not vote" })[value] || value;
        choice.appendChild(option);
      });
      const more = details.querySelector(".vote-more");
      let visibleLimit = 20;
      if (!records.length) {
        output.innerHTML = '<p class="evidence-empty">No official vote records are available for this candidate in the current import. That does not mean they have never voted or taken a position.</p>';
        status.textContent = "No vote records are available in this data set yet.";
        details.dataset.loaded = "true";
        return;
      }
      const update = () => {
        const filtered = filterVoteRecords(records, { query: search.value, choice: choice.value });
        const visible = filtered.slice(0, visibleLimit);
        const groups = groupVoteRecords(visible);
        output.innerHTML = groups.map(group => '<details class="vote-group"><summary><span>' + group.title + '</span><span class="vote-group-count">' + group.records.length + ' shown</span></summary><div class="vote-group-body"><p>' + group.description + '</p>' + group.records.map(renderVoteCard).join("") + '</div></details>').join("") || '<p class="evidence-empty">No roll-call records match these filters.</p>';
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


  function makeVotePanel(candidateName) {
    const records = document.createElement("details"); records.className = "official-votes";
    records.addEventListener("toggle", () => { if (records.open) openVotePanel(records, candidateName); });
    const title = document.createElement("summary"); title.textContent = "Recorded votes — tap to open"; records.appendChild(title);
    const controls = document.createElement("div"); controls.className = "vote-controls";
    const searchLabel = document.createElement("label"); searchLabel.textContent = "Search votes";
    const search = document.createElement("input"); search.type = "search"; search.className = "vote-search"; search.placeholder = "Search a bill, date, or result"; searchLabel.appendChild(search);
    const choiceLabel = document.createElement("label"); choiceLabel.textContent = "Filter by the candidate’s vote";
    const choice = document.createElement("select"); choice.className = "vote-choice";
    const all = document.createElement("option"); all.value = "all"; all.textContent = "All votes"; choice.appendChild(all); choiceLabel.appendChild(choice);
    controls.append(searchLabel, choiceLabel); records.appendChild(controls);
    const status = document.createElement("p"); status.className = "vote-status"; status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite"); records.appendChild(status);
    const output = document.createElement("div"); output.className = "vote-results"; records.appendChild(output);
    const more = document.createElement("button"); more.type = "button"; more.className = "outline vote-more"; more.textContent = "Show next 20"; more.hidden = true; records.appendChild(more);
    return records;
  }

  const candidateDialog = document.createElement("dialog");
  candidateDialog.className = "candidate-info-dialog";
  candidateDialog.innerHTML = '<form method="dialog"><button class="close" aria-label="Close candidate information">×</button><p class="eyebrow">Positions and public record</p><h2 class="candidate-info-title"></h2><div class="candidate-info-body"></div></form>';
  document.body.appendChild(candidateDialog);
  const candidateDialogTitle = candidateDialog.querySelector(".candidate-info-title");
  const candidateDialogBody = candidateDialog.querySelector(".candidate-info-body");

  function makeNewsLeadsPanel(candidateName) {
    const panel = document.createElement("details"); panel.className = "candidate-news-leads";
    const title = document.createElement("summary"); title.textContent = "News coverage and position leads"; panel.appendChild(title);
    const note = document.createElement("p"); note.className = "source-note"; note.textContent = "Reports can help locate a candidate's stated views. These are research leads, not reviewed position summaries; open the article and check its context."; panel.appendChild(note);
    const status = document.createElement("p"); status.className = "vote-status"; status.setAttribute("role", "status"); panel.appendChild(status);
    const output = document.createElement("div"); output.className = "candidate-news-lead-list"; panel.appendChild(output);
    panel.addEventListener("toggle", async () => {
      if (!panel.open || panel.dataset.loaded) return;
      status.textContent = "Loading coverage leads…";
      try {
        const all = await loadNewsLeads();
        const rows = all.filter(lead => lead.candidate === candidateName && lead.status === "news-report-needs-human-review").sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
        output.innerHTML = rows.length ? rows.slice(0, 12).map(lead => {
          const url = /^https:\/\//.test(lead.url || "") ? lead.url : "";
          if (!url || !lead.title || !lead.publisher) return "";
          return '<article class="candidate-news-lead"><p><strong>' + escapeHtml(lead.publisher) + '</strong>' + (lead.date ? ' · ' + escapeHtml(lead.date) : '') + '</p><a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(lead.title) + ' ↗</a></article>';
        }).join("") : '<p class="evidence-empty">No coverage leads from the configured reputable news sources are in the import inbox. Missing coverage is not evidence that the candidate has no position.</p>';
        status.textContent = rows.length ? "Showing " + Math.min(rows.length, 12) + " coverage leads. Review the article before treating it as a candidate position." : "";
        panel.dataset.loaded = "true";
      } catch { status.textContent = "News coverage leads could not be loaded. Please try again later."; }
    });
    return panel;
  }

  function makePositionSourcesPanel(candidateName) {
    const panel = document.createElement("details"); panel.className = "candidate-position-sources";
    const title = document.createElement("summary"); title.textContent = "Candidate and campaign source pages"; panel.appendChild(title);
    const note = document.createElement("p"); note.className = "source-note"; note.textContent = "These are first-party source snapshots. The linked pages can contain the candidate's own stated positions; the snapshot is not itself a reviewed summary."; panel.appendChild(note);
    const status = document.createElement("p"); status.className = "vote-status"; status.setAttribute("role", "status"); panel.appendChild(status);
    const output = document.createElement("div"); output.className = "candidate-position-source-list"; panel.appendChild(output);
    panel.addEventListener("toggle", async () => {
      if (!panel.open || panel.dataset.loaded) return;
      status.textContent = "Loading candidate source pages…";
      try {
        const all = await loadPositionSources();
        const rows = all.filter(item => item.candidate === candidateName).sort((a, b) => String(b.changedAt || "").localeCompare(String(a.changedAt || "")));
        output.innerHTML = rows.length ? rows.map(item => {
          const url = /^https:\/\//.test(item.url || "") ? item.url : "";
          if (!url || !item.title) return "";
          return '<article class="candidate-news-lead"><p><strong>' + escapeHtml(new URL(url).hostname.replace(/^www\./, "")) + '</strong>' + (item.changedAt ? ' · checked ' + escapeHtml(String(item.changedAt).slice(0, 10)) : '') + '</p><a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(item.title) + ' ↗</a>' + (item.description ? '<p>' + escapeHtml(item.description) + '</p>' : '') + '</article>';
        }).join("") : '<p class="evidence-empty">No first-party candidate source page is in the current import.</p>';
        status.textContent = rows.length ? rows.length + " first-party source snapshot(s). Review the page before treating it as a position." : "";
        panel.dataset.loaded = "true";
      } catch { status.textContent = "Candidate source snapshots could not be loaded. Please try again later."; }
    });
    return panel;
  }

  function openCandidateInfo(button) {
    const name = button.dataset.candidate || "Candidate";
    const row = button.closest(".ballot-row");
    const office = row?.querySelector("h4")?.textContent || "This race";
    const evidence = claims.find(candidate => candidate.name === name);
    candidateDialogTitle.textContent = name;
    candidateDialogBody.replaceChildren();
    const officeText = document.createElement("p"); officeText.className = "candidate-info-office"; officeText.textContent = office; candidateDialogBody.appendChild(officeText);
    const statusLine = document.createElement("p"); statusLine.className = "candidate-info-incumbency";
    statusLine.textContent = button.dataset.incumbent === "true" ? "Incumbent in this race" : (button.dataset.incumbentName ? "Challenger; not the current officeholder" : "Not incumbent; this is an open seat");
    candidateDialogBody.appendChild(statusLine);
    if (button.dataset.incumbencySource) {
      const statusSource = document.createElement("a"); statusSource.className = "candidate-info-status-source";
      statusSource.href = button.dataset.incumbencySource; statusSource.target = "_blank"; statusSource.rel = "noopener noreferrer";
      statusSource.textContent = "Source for incumbent status ↗"; candidateDialogBody.appendChild(statusSource);
    }
    const positionHeading = document.createElement("h3"); positionHeading.className = "candidate-info-section-title"; positionHeading.textContent = "Published, reviewed positions and statements"; candidateDialogBody.appendChild(positionHeading);
    const summary = document.createElement("div"); summary.className = "candidate-info-summary";
    summary.innerHTML = evidence?.claims?.length ? renderClaims(evidence) : '<p class="evidence-empty">No reviewed position summary is published yet. Check the source pages or news leads below; missing information is not a negative finding.</p>';
    candidateDialogBody.appendChild(summary);
    candidateDialogBody.appendChild(makePositionSourcesPanel(name));
    candidateDialogBody.appendChild(makeNewsLeadsPanel(name));
    const votes = makeVotePanel(name); const votesHeading = document.createElement("details"); votesHeading.className = "candidate-info-votes";
    votesHeading.addEventListener("toggle", () => { if (votesHeading.open) votes.open = true; });
    const votesSummary = document.createElement("summary"); votesSummary.textContent = "Official voting history"; votesHeading.append(votesSummary, votes); candidateDialogBody.appendChild(votesHeading);
    const source = row?.querySelector(".ballot-row-actions a");
    if (source) { const link = document.createElement("a"); link.className = "candidate-info-source"; link.href = source.href; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Check race source ↗"; candidateDialogBody.appendChild(link); }
    candidateDialog.showModal();
  }

  function bindCandidateInfoButtons() {
    root.querySelectorAll(".candidate-info").forEach(button => {
      if (button.dataset.bound) return;
      button.dataset.bound = "true";
      button.addEventListener("click", () => openCandidateInfo(button));
    });
  }

  function renderRepresentativeProfiles() {
    if (!representativeRoot || representativeRoot.dataset.ready === "true") return;
    let selectedState = "";
    try { selectedState = localStorage.getItem("represent-me-location-state-v3") || ""; } catch {}
    if (selectedState !== "GA") {
      representativeRoot.replaceChildren();
      const message = document.createElement("p");
      message.textContent = selectedState ? "Federal research is currently available for Georgia only. State and local research is coming soon." : "Choose your state first to load representatives.";
      representativeRoot.appendChild(message);
      return;
    }
    const profiles = [
      { name: "Jon Ossoff", office: "U.S. Senator for Georgia", url: "https://www.ossoff.senate.gov/", birthDate: "1987-02-16", summary: "He publicly supported a $35 monthly cap for covered Medicare insulin, investigated housing investors, and examined Georgia foster-care safety. The sources document those actions, not whether they solved the broader problems." },
      { name: "Raphael Warnock", office: "U.S. Senator for Georgia", url: "https://www.warnock.senate.gov/", birthDate: "1969-07-23" },
      { name: "Brian Jack", office: "U.S. Representative · Georgia District 3", url: "https://jack.house.gov/", birthDate: "1988-02-17" }
    ];
    representativeRoot.replaceChildren();
    for (const profile of profiles) {
      const evidence = claims.find(item => item.name === profile.name);
      const card = document.createElement("article"); card.className = "representative-card";
      const office = document.createElement("p"); office.className = "representative-office"; office.textContent = profile.office;
      const name = document.createElement("h3"); name.textContent = profile.name;
      const incumbentTag = document.createElement("span"); incumbentTag.className = "candidate-incumbency representative-incumbency"; incumbentTag.textContent = "Incumbent";
      if (profile.birthDate) {
        const age = document.createElement("p"); age.className = "representative-age";
        const birth = new Date(profile.birthDate + "T00:00:00"); const today = new Date();
        let years = today.getFullYear() - birth.getFullYear();
        if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) years--;
        age.textContent = "Age " + years;
        card.appendChild(age);
      }
      const intro = document.createElement("p"); intro.className = "representative-summary";
      intro.textContent = profile.summary || "A checked summary is not ready yet. We are still reviewing sources; missing information does not mean there is no record.";
      const link = document.createElement("a"); link.className = "representative-official-link"; link.href = profile.url; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Official profile ↗";
      const more = document.createElement("details"); more.className = "representative-details";
      const summary = document.createElement("summary"); summary.textContent = "See votes and sources"; more.appendChild(summary);
      more.appendChild(makeVotePanel(profile.name));
      const claimsDetails = document.createElement("details"); claimsDetails.className = "representative-claims";
      const claimsSummary = document.createElement("summary"); claimsSummary.textContent = evidence?.claims?.length ? "Statements and sources" : "Source summary not ready yet";
      claimsDetails.appendChild(claimsSummary);
      const content = document.createElement("div"); content.innerHTML = evidence?.claims?.length ? renderClaims(evidence, 2) : renderClaims(null);
      claimsDetails.appendChild(content); more.appendChild(claimsDetails);
      card.append(office, name, incumbentTag, intro, link, more); representativeRoot.appendChild(card);
    }
    representativeRoot.dataset.ready = "true";
  }

  function enhance() {
    root.querySelectorAll(".ballot-row").forEach(row => {
      if (row.querySelector(".candidate-evidence")) return;
      const office = row.querySelector("h4")?.textContent || "";
      const names = [...row.querySelectorAll(".ballot-option:not(.ballot-undecided) strong")].map(node => node.textContent);
      const panel = document.createElement("details");
      panel.className = "candidate-evidence";
      const title = document.createElement("summary");
      title.textContent = "Candidate details, votes & sources";
      panel.appendChild(title);
      const content = document.createElement("div");
      content.className = "evidence-candidates";
      for (const name of names) {
        const item = document.createElement("section");
        item.className = "evidence-candidate";
        const heading = document.createElement("h5");
        heading.textContent = name;
        item.appendChild(heading);
        item.appendChild(makeVotePanel(name));
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
    bindCandidateInfoButtons();
  }

  renderRepresentativeProfiles();
  window.addEventListener("represent-me-location-ready", renderRepresentativeProfiles);
  window.addEventListener("location-cleared", () => { representativeRoot.dataset.ready = ""; renderRepresentativeProfiles(); });

  new MutationObserver(() => {
    if (root.querySelector(".ballot-row:not(:has(.candidate-evidence))")) enhance();
  }).observe(root, { childList: true, subtree: true });
  enhance();
})();
