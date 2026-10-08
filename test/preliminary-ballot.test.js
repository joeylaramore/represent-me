const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const ballot=JSON.parse(fs.readFileSync('data/ballot-2026.json','utf8'));
test('preliminary ballot is never presented as a certified personal ballot',()=>{assert.equal(ballot.status,'preliminary-not-personalized');for(const c of ballot.contests){assert.equal(c.personalBallotConfirmed,false);assert.equal(c.verification,'reported-roster')}});
test('every candidate race links to a source',()=>{for(const c of ballot.contests){assert.ok(ballot.sources[c.source]?.url.startsWith('https://'));assert.ok(c.candidates.length>0);for(const candidate of c.candidates)assert.ok(candidate.name&&candidate.party)}});
test('Docker image includes data and ballot renderer',()=>{const docker=fs.readFileSync('Dockerfile','utf8');assert.match(docker,/ballot\.js/);assert.match(docker,/COPY data\//)});
