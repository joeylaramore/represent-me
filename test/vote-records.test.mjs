import test from "node:test";
import assert from "node:assert/strict";
import { filterVoteRecords, formatVoteDate, officialVoteUrl } from "../vote-records.mjs";

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
  assert.equal(filterVoteRecords(votes, { query: "senate" })[0], senate);
});
test("dates are formatted and invalid dates are handled", () => {
  assert.equal(formatVoteDate("2025-01-14T23:00:00Z"), "Jan 14, 2025");
  assert.equal(formatVoteDate("invalid"), "Date unavailable");
});
