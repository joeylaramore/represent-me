# Represent Me — product specification

## Mission

Represent Me is a politically neutral, evidence-based government accountability platform. It helps citizens understand who represents them, what they believe, what officials claim to believe, what they have done, whether public actions are consistent with stated principles, where authority comes from, and where public money goes. It is not a political-news aggregator, partisan voting guide, endorsement engine, or automatic ranking system.

## First release

The first release targets the November 3, 2026 Georgia general election and begins with Coweta County. Initial configured districts are Georgia, Coweta County, U.S. Congressional District 3, Georgia Senate District 6, Georgia House District 70, County Commission District 2, and School Board District 2. These are configuration defaults and must not be presented as a substitute for verifying a user’s actual ballot.

Election data must come from the Georgia Secretary of State, My Voter Page, Coweta County Elections, official candidate filings, and official sample ballots. The product must never fabricate candidate names, party affiliations, measures, or contested races. Every record is labeled verified, preliminary, awaiting verification, or uncertain/disputed as appropriate.

## Experience

Within ten seconds, users should see the election date, countdown, districts, number of contests, candidates, measures, and a preparation checklist. Within one minute, they should be able to compare candidates by name, party, office, incumbent/challenger status, experience, stated positions, documented actions, financial disclosures, and sources. Deep dives may include voting records, promises, party-platform consistency, fiscal responsibility, constitutional questions, authority, public statements versus actions, conflicts, effectiveness, spending, and debt.

Candidate comparisons must use identical evidence categories and show missing or uncertain evidence. A party-hidden mode may reveal affiliations afterward. The system must not endorse, rank, or generate an overall candidate score.

## My Beliefs

The questionnaire separates desired outcomes from the government’s proper role, federal versus state authority, preferred mechanisms, issue importance, and acceptable tradeoffs. It covers taxation, debt, spending, poverty, healthcare, education, constitutional rights, religious liberty, law enforcement, immigration, foreign policy, and executive power. Users may skip, revise, and mark deal-breakers. Religious belief data is sensitive: disclosure is optional, collection is minimized, and stored responses are protected.

## Evidence and accountability

The Practice What You Preach feature separates public profession, advocated policy, documented personal conduct, and actions taken under government authority. It must not speculate about private faith, judge religious identity, infer that missing charity data means no donations, or assign moral verdicts. Apparent inconsistencies and documented explanations are presented with competing evidence and the same standards for every party.

The accountability model traces citizen → election → official → legislation or appointment → agency → government action → consequence. It addresses separation of powers, federalism, rights, authorization, executive orders, delegated and emergency authority, oversight, taxation, spending, borrowing, and legislative transparency. Possible constitutional concerns must be distinguished from court-established violations.

## Architecture and deployment

The application is isolated from the existing Should I Blanket application. Prefer maintainable Docker Compose, server-rendered or lightweight responsive pages where appropriate, PostgreSQL when relational persistence is necessary, a clear source/evidence ingestion model, automated tests, CI/CD, environment-specific configuration, structured logs, and health checks. Avoid unnecessary infrastructure. Do not modify the existing application or Nginx without checking for conflicts, expose secrets, or assume SSH access.

Core entities include elections, jurisdictions, districts, offices, candidates, officials, appointments, actions, voting records, statements, promises, evidence sources, claims and verification status, user values and priorities, comparisons, and personal notes. Track source URLs, retrieval dates, verification dates, and evidence confidence/status.

## Quality and definition of done

Tests cover election accuracy, contest relationships, district matching, source attribution, missing or contradictory evidence, questionnaire persistence, accessibility, mobile behavior, security, and deployment health. Passing tests do not prove election facts are accurate.

The first milestone is complete when the app runs locally, displays sourced November 3 contests, clearly labels verification status, supports candidate comparisons and the initial questionnaire, passes automated tests, is available at `representme.jlaramore.com`, and leaves existing applications operational.
