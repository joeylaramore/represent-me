import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classifyVoteRecord, filterVoteRecords, formatVoteDate, groupVoteRecords, officialVoteUrl } from "../vote-records.mjs";

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
  assert.match(source, /Plain-language purpose and effect have not been reviewed/);
  assert.match(source, /groupVoteRecords\(visible\)/);
});
