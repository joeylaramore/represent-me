export function officialVoteUrl(vote) {
  if (vote.chamber === "house") {
    let source;
    try { source = new URL(vote.sourceUrl); } catch { return null; }
    if (source.hostname !== "api.congress.gov") return null;
    const parts = source.pathname.split("/");
    if (parts.length !== 6 || parts[2] !== "house-vote" || !/^[0-9]+$/.test(parts[5])) return null;
    const year = new Date(vote.date).getUTCFullYear();
    return year && Number.isFinite(year) ? `https://clerk.house.gov/Votes/${year}${Number(parts[5])}` : null;
  }
  if (vote.chamber === "senate") {
    try {
      const source = new URL(vote.sourceUrl);
      return source.protocol === "https:" && source.hostname === "www.senate.gov" ? source.href : null;
    } catch { return null; }
  }
  return null;
}

export function classifyVoteRecord(vote) {
  const declared = String(vote.category || "").toLocaleLowerCase();
  if (declared === "procedural" || declared === "legislation") return declared;
  const question = String(vote.question || "").toLocaleLowerCase().replace(/\s+/g, " ").trim();
  if (/\b(on passage|final passage|pass the bill|passage of|motion to suspend.*\b(pass|agree)\b|on the amendment|on agreeing to (the )?(amendment|bill|resolution)|on adoption of (the )?(amendment|bill|resolution))\b/.test(question)) return "legislation";
  if (/\b(cloture|motion to proceed|motion to table|motion to lay on the table|motion to recommit|motion to adjourn|previous question|motion to reconsider)\b/.test(question)) return "procedural";
  return "unclassified";
}

export function summarizeProceduralVote(vote) {
  if (vote.chamber !== "senate" || classifyVoteRecord(vote) !== "procedural") return null;
  const question = String(vote.question || "").toLocaleLowerCase();
  if (/cloture/.test(question)) {
    const onProceed = /motion to proceed/.test(question);
    return {
      purpose: onProceed
        ? "Whether to limit debate on the motion to bring the named measure up for Senate consideration."
        : "Whether to limit debate on the pending Senate matter named in the roll-call question.",
      effect: onProceed
        ? "If agreed to, cloture limits further debate on the motion to proceed so the Senate can move to the next step. It does not itself bring the bill up or pass it."
        : "If agreed to, cloture limits further debate on the pending matter so the Senate can move toward a vote. It does not itself pass a bill or confirm a nominee.",
      sourceTitle: "U.S. Senate glossary: cloture and motion to proceed",
      sourceUrl: "https://www.senate.gov/about/research-tools/glossary.htm"
    };
  }
  if (/motion to proceed/.test(question)) return {
    purpose: "Whether the Senate should bring the named measure up for floor consideration.",
    effect: "If agreed to, the Senate can begin considering the measure, including debate and votes. This procedural vote does not pass the measure.",
    sourceTitle: "U.S. Senate glossary: motion to proceed",
    sourceUrl: "https://www.senate.gov/about/research-tools/glossary.htm"
  };
  return null;
}

export function groupVoteRecords(votes) {
  const groups = [
    { id: "procedural", title: "How lawmakers handle a bill", description: "These votes decide how a bill moves through Congress. They do not pass the bill itself.", records: [] },
    { id: "legislation", title: "Votes on a bill or amendment", description: "These votes can change a bill or pass it. A vote on an amendment is not the same as passing the whole bill.", records: [] },
    { id: "unclassified", title: "We need more information", description: "The official record does not explain what this vote was for. We will not guess.", records: [] }
  ];
  for (const vote of sortVoteRecords(votes)) groups.find(group => group.id === classifyVoteRecord(vote)).records.push(vote);
  return groups.filter(group => group.records.length);
}

export function sortVoteRecords(votes) {
  return [...votes].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export function filterVoteRecords(votes, { query = "", choice = "all" } = {}) {
  const needle = query.trim().toLocaleLowerCase();
  return sortVoteRecords(votes).filter(vote => {
    const choiceMatches = choice === "all" || vote.vote?.toLocaleLowerCase() === choice.toLocaleLowerCase();
    const text = [vote.date, vote.question, vote.result, vote.vote, vote.memberOffice].join(" ").toLocaleLowerCase();
    return choiceMatches && (!needle || text.includes(needle));
  });
}

export function formatVoteDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Date unavailable" : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}
