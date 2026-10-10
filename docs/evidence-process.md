# Candidate evidence research and source-checking process

Use this checklist for every public claim. Keep the claim, the sources, and what each source proves together in the pull request that proposes the claim.

## Before researching

- The reported roster is `data/ballot-2026.json`. Confirm the candidate's exact name, race, and district with Georgia Secretary of State or county election records. These are reported contests, not a certified personal ballot.
- Published candidate evidence belongs in `data/candidate-evidence-2026.json`. It is reviewed in pull requests and served read-only. Do not create a parallel database or save voter choices.
- Do not infer a position from party, endorsements, sponsorship, or a vote. No record is not evidence of opposition.

## Check one claim at a time

1. **Write the smallest factual claim.** Split sentences that make multiple claims. Include who, what, and when. Mark whether it is a candidate statement, a recorded vote, or background about a bill or policy.
2. **Find the best original source.** For votes, use Congress.gov, the House Clerk, U.S. Senate roll calls, or Georgia General Assembly records. Save the chamber, roll-call ID, date, question, member's recorded vote, measure/version, and permanent official URL. For a candidate's position, use the candidate's own published statement, campaign site, questionnaire, or a dated interview. Do not treat a headline or bill title as proof of the bill's effect.
3. **Check important context independently.** Find a second reliable source that did its own reporting or analysis, such as a nonpartisan legislative analysis, fiscal note, court record, or reputable local/national reporting. Confirm it is independent; two sites repeating the same press release count as one source. An official roll call is enough to confirm how a member voted, but it does not prove motive, policy impact, or a candidate's overall position.
4. **Compare the sources.** Confirm they refer to the same person, event, date, and version. Record what each source supports and what it cannot establish. Note any disagreement, missing information, corrections, or uncertainty. Never resolve a conflict by guessing.
5. **Write a neutral summary that matches the evidence.** Keep the date and scope. Attribute opinions to the speaker. For bills, explain separately what the vote did procedurally and what the underlying measure would do, using the relevant text and analysis. Do not claim that a procedural vote passed a bill.
6. **Attach the check record to the PR.** For each claim, include:
   - Proposed wording and claim type.
   - Original-source title, publisher, date, URL, and the exact detail it supports.
   - Independent-check title, publisher, date, URL, and the detail it confirms or disputes; explain when no independent source is available.
   - Any limits, conflicting evidence, or wording changes made after checking.
7. **Have a second person verify it.** The reviewer opens every link, checks that the source loads and matches the cited fact, confirms identity/date/version, and decides whether the summary overstates the evidence. A checked box is not enough: record the reviewer and any correction in the PR discussion.

## Decision

- **Pass:** The original evidence directly supports the wording, the independent check supports important context when available, and there is no unresolved contradiction. Merge only after review.
- **Narrow or label:** A single source establishes a limited fact, but context is incomplete. State the limitation clearly in the record and UI.
- **Hold:** The source is missing, inaccessible, unrelated, contradicted, or does not support the wording. Do not publish the claim until resolved.
- Official primary records alone may verify that a specific vote occurred. Claims about the measure's effect, intent, or broader significance need separate evidence.
- If a source changes or disappears, re-check it and update the dated record; do not silently replace historical claims.
- The daily importer may find new records and source changes. It does not verify interpretations or publish candidate claims automatically.

## Before merging

Run `npm test`, `npm run validate:evidence`, and `npm run validate:imports`. Confirm every public claim has a date, topic, neutral wording, and working source link. Do not merge unsupported or unresolved claims.

## Minimal JSON example

Illustrative only; do not publish fictional claims.

```json
{"office":"OFFICE FROM ROSTER","name":"EXACT CANDIDATE NAME","claims":[{"type":"recorded-vote","topic":"Education","date":"2026-01-01","summary":"Factual description of a specific recorded vote, without assigning motives.","sources":[{"publisher":"Official legislative body","title":"Roll call 123","url":"https://example.gov/roll-call/123"}]}]}
```

Never collect or persist voters' candidate selections or intended votes.
