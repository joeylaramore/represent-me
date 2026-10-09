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
