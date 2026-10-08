# Daily evidence import

The scheduled importer refreshes `data/imported-evidence-2026.json`, a research-only inbox. It does not write to `data/candidate-evidence-2026.json`, which remains the reviewed source of truth rendered by the site.

## Sources and matching

- House roll-call records come from the official Congress.gov API and are joined to configured members by Bioguide ID.
- Senate roll-call records come from the official Senate XML feeds and are joined by the configured member surname and state.
- Candidate position sources are explicitly listed in `data/import-targets.json`. The importer stores page title, description, canonical URL, and a content hash; it does not copy entire pages or turn language into claims.
- Initial targets cover Jon Ossoff, Mike Collins, and Brian Jack. Add a candidate only after confirming the identity and the first-party source URL. Add more official congressional IDs to capture more voting records.

The source feeds provide recorded votes, not the meaning or impact of legislation. Every imported vote and position source is marked for human review. A reviewer must check candidate identity, office, context, exact wording, and citations before authoring a claim in the public evidence file. Missing rows do not mean a candidate took no position or cast no vote.

## GitHub setup

1. Request a Congress.gov API key from <https://api.congress.gov/sign-up/>.
2. Add it as the repository Actions secret `CONGRESS_API_KEY`.
3. The workflow runs daily at 13:00 UTC and can also be started from the Actions tab.
4. When imports change, the workflow opens or updates `automated/daily-evidence-import` as a pull request. Review and merge that PR manually.

The API key is read from the Actions secret, is never written into files, and is removed from request URLs before errors are logged.

## Local run

```sh
CONGRESS_API_KEY=your-key npm run import:evidence
npm test
npm run validate:evidence
```
