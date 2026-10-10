import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classifyVoteRecord, filterVoteRecords, formatVoteDate, groupVoteRecords, officialVoteUrl, summarizeProceduralVote } from "../vote-records.mjs";

const house = {
  chamber: "house", date: "2025-01-14T14:28:00-05:00",
  sourceUrl: "https://api.congress.gov/v3/house-vote/119/1/10",
  question: "On Motion to Suspend the Rules and Pass", result: "Passed", vote: "Yea"
};
const senate = {
  chamber: "senate", date: "2025-02-04", sourceUrl: "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00001.xml",
  question: "Cloture", result: "Agreed to", vote: "Nay"
};

test("House records link to the public House Clerk roll-call page", () => {
  assert.equal(officialVoteUrl(house), "https://clerk.house.gov/Votes/202510");
});
test("Senate records retain their official Senate.gov XML source", () => {
  assert.equal(officialVoteUrl(senate), senate.sourceUrl);
});
test("unsupported or malformed source URLs do not become public links", () => {
  assert.equal(officialVoteUrl({ ...house, sourceUrl: "https://example.com/vote/10" }), null);
  assert.equal(officialVoteUrl({ ...house, sourceUrl: "not a url" }), null);
});
test("search and recorded-vote filtering work together, newest records first", () => {
  const votes = [house, senate, { ...house, date: "2025-02-01", vote: "Nay", question: "Final passage" }];
  const filtered = filterVoteRecords(votes, { query: "pass", choice: "Nay" });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].question, "Final passage");
  assert.equal(filterVoteRecords(votes, { query: "cloture" })[0], senate);
});
test("dates are formatted and invalid dates are handled", () => {
  assert.equal(formatVoteDate("2025-01-14T23:00:00Z"), "Jan 14, 2025");
  assert.equal(formatVoteDate("invalid"), "Date unavailable");
});
test("index requests a versioned evidence script to avoid stale cached renderers", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /evidence\.js\?v=[^"]+/);
  const evidence = readFileSync(new URL("../evidence.js", import.meta.url), "utf8");
  assert.match(evidence, /vote-records\.mjs\?v=plain-language-votes-1/);
});

test("classifies clear procedural actions separately from votes on legislative text", () => {
  assert.equal(classifyVoteRecord({ question: "On the Cloture Motion" }), "procedural");
  assert.equal(classifyVoteRecord({ question: "On Motion to Proceed to H.R. 100" }), "procedural");
  assert.equal(classifyVoteRecord({ question: "On Passage of the Bill" }), "legislation");
  assert.equal(classifyVoteRecord({ question: "On agreeing to the amendment" }), "legislation");
  assert.equal(classifyVoteRecord({ question: "On Motion to Suspend the Rules and Pass" }), "legislation");
  assert.equal(classifyVoteRecord({ question: "On the Question" }), "unclassified");
});
test("explicit reviewed category takes precedence and groups records separately", () => {
  const records = [
    { ...house, date: "2025-01-14", category: "procedural" },
    { ...senate, date: "2025-02-04", category: "legislation" },
    { ...house, date: "2025-03-01", question: "On the Question" }
  ];
  const groups = groupVoteRecords(records);
  assert.deepEqual(groups.map(group => group.id), ["procedural", "legislation", "unclassified"]);
  assert.equal(groups[0].records[0].date, "2025-01-14");
});
test("vote cards require reviewed purpose and effect and disclose missing context", () => {
  const source = readFileSync(new URL("../evidence.js", import.meta.url), "utf8");
  assert.match(source, /vote\.contextReviewed === true && vote\.purpose && vote\.effect/);
  assert.match(source, /We have not yet checked what this vote would do/);
  assert.match(source, /groupVoteRecords\(visible\)/);
});

test("Senate procedural summaries explain cloture and motion to proceed without treating them as law passage", () => {
  const cloture = summarizeProceduralVote({ chamber: "senate", question: "On Cloture on the Motion to Proceed H.R. 9340" });
  assert.match(cloture.purpose, /bring the named measure up/);
  assert.match(cloture.effect, /does not itself bring the bill up or pass it/);
  assert.equal(cloture.sourceUrl, "https://www.senate.gov/about/research-tools/glossary.htm");
  const proceed = summarizeProceduralVote({ chamber: "senate", question: "On the Motion to Proceed S.J.Res. 197" });
  assert.match(proceed.effect, /does not pass the measure/);
  assert.equal(summarizeProceduralVote({ chamber: "senate", question: "On Passage of the Bill S. 4668" }), null);
});

test("vote results use collapsed group summaries and compact, expandable records", () => {
  const source = readFileSync(new URL("../evidence.js", import.meta.url), "utf8");
  assert.match(source, /<details class="vote-group"><summary>/);
  assert.match(source, /<details class="vote-record"><summary>/);
  assert.match(source, /vote-row-question/);
  assert.match(source, /vote-row-choice/);
});

test("vote groups use plain language and a readable layout", () => {
  const votes = readFileSync(new URL("../vote-records.mjs", import.meta.url), "utf8");
  const evidence = readFileSync(new URL("../evidence.js", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  assert.match(votes, /How lawmakers handle a bill/);
  assert.match(votes, /Votes on a bill or amendment/);
  assert.match(votes, /We need more information/);
  assert.match(evidence, /Search a bill, date, or result/);
  assert.match(styles, /font-size:16px/);
  assert.match(styles, /min-height:48px/);
});

test("plain-language vote categories are present", () => { const source = readFileSync(new URL("../evidence.js", import.meta.url), "utf8"); assert.match(source, /A vote about how Congress works/); assert.match(source, /Voted yes/); });

test("vote filter options use everyday words", () => { const source = readFileSync(new URL("../evidence.js", import.meta.url), "utf8"); assert.match(source, /Yea: "Voted yes"/); assert.match(source, /Nay: "Voted no"/); assert.match(source, /Not Voting.*Did not vote/); });

test("vote explanations and instructions remain readable", () => { const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8"); assert.match(styles, /source-note\{font-size:16px/); assert.match(styles, /vote-detail p,.vote-detail li,.vote-detail a\{font-size:16px/); });
