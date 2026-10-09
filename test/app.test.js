const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const html=fs.readFileSync('index.html','utf8');
test('target election and jurisdiction are labeled',()=>{assert.match(html,/November 3, 2026/);assert.match(html,/Coweta County/)})
test('candidate names are not fabricated',()=>assert.doesNotMatch(html,/Candidate [A-Z][a-z]+ [A-Z][a-z]+/))
test('verification and official sources are visible',()=>{assert.match(html,/awaiting verification/i);assert.match(html,/Georgia Secretary of State/)})
test('questionnaire persists locally',()=>assert.match(fs.readFileSync('app.js','utf8'),/localStorage/))

test('questionnaire entry copy matches six current-issue questions',()=>assert.match(html,/Take the 6-question questionnaire/))

test('published image includes the evidence module dependency',()=>{assert.match(fs.readFileSync('Dockerfile','utf8'),/evidence\\.js vote-records\\.mjs/);assert.match(html,/type="module" src="evidence\\.js\\?v=/)});
test('compare page explains the path to candidate vote records',()=>{assert.match(html,/expand <strong>Votes &amp; positions<\\/strong>/);assert.match(html,/Official voting record/)});
test('every static in-page link has a matching target',()=>{for(const [,target] of html.matchAll(/href="#([^"]+)"/g)){assert.ok(new RegExp('id=["\\']'+target.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'["\\']').test(html),'Missing in-page target: #'+target)}});
