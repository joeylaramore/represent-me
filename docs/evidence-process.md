# Candidate evidence research and publication process

## Scope and source of truth
- The **reported** candidate roster is `data/ballot-2026.json`. Confirm each race/candidate against Georgia Secretary of State and county election records before publishing claims. It is not an official personal ballot.
- The **published evidence** source of truth is `data/candidate-evidence-2026.json`; it is versioned, reviewed in pull requests, and served read-only. Do not create a parallel database or save voter choices.
- Never infer candidate positions from party, sponsorship, or a vote. Never treat lack of records as opposition.

## Repeatable workflow (per candidate)
1. **Verify identity and office** against authoritative election records; note election, district, and candidate's exact name. Stop if identity/office is uncertain.
2. **Find official voting records**: Congress.gov, House Clerk, U.S. Senate roll calls, or Georgia General Assembly roll calls as applicable. Capture chamber, bill, roll-call ID, vote, vote date, bill version, and the official permanent URL in source metadata/notes. Do not describe a bill's impact solely from its title.
3. **Find stated positions**: candidate campaign website, archived official platform, first-person interviews, speeches, or written questionnaires. Capture the original wording and publication date. Do not convert a statement into a stronger claim.
4. **Corroborate** material contextual assertions with a second *independent* reputable source when available (e.g., AP, local public-interest reporting, official fiscal analysis). Two outlets repeating one press release are not independent evidence. A government roll call alone can establish how someone voted; corroboration is for interpretation/context.
5. **Write a neutral, short summary**, tag claim type and topic, include the date and source titles/publishers/HTTPS URLs. Record uncertainty or changes in position as separate dated entries. Never rank candidates or editorialize.
6. **Run** `npm test` and `npm run validate:evidence`. Have a reviewer open every citation, verify claim-to-source fit and candidate identity, and approve the PR. Merge only reviewed, supported claims.
7. **Refresh** from the daily research inbox in `data/imported-evidence-2026.json` and when candidates publish new statements, legislative votes are recorded, or official candidate lists change. Re-review stale and disputed claims; update dates rather than silently replacing historical positions. The daily job does not publish claims: review source changes and draft any public claim separately.

## Minimal JSON example (illustrative only; do NOT publish fictional claims)
```json
{"office":"OFFICE FROM ROSTER","name":"EXACT CANDIDATE NAME","claims":[{"type":"recorded-vote","topic":"Education","date":"2026-01-01","summary":"Factual description of a specific recorded vote, without assigning motives.","sources":[{"publisher":"Official legislative body","title":"Roll call 123","url":"https://example.gov/roll-call/123"}]}]}
```

## Publication gates
- Claims lacking a date, topic, source, or neutral summary must not render.
- Prefer two independent sources; if only one is available, label the limitation in UI.
- Official vote records are mandatory for a claim described as a recorded vote.
- Editorial review is mandatory; scheduled automation checks completeness and staleness, **not** unsupervised publication of political assertions.
- Never collect or persist voters' candidate selections or intended votes.
