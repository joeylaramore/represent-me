const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const html=fs.readFileSync('index.html','utf8');
test('target election and jurisdiction are labeled',()=>{assert.match(html,/November 3, 2026/);assert.match(html,/Coweta County/)})
test('candidate names are not fabricated',()=>assert.doesNotMatch(html,/Candidate [A-Z][a-z]+ [A-Z][a-z]+/))
test('verification and official sources are visible',()=>{assert.match(html,/awaiting verification/i);assert.match(html,/Georgia Secretary of State/)})
test('questionnaire persists locally',()=>assert.match(fs.readFileSync('app.js','utf8'),/localStorage/))

test('questionnaire entry copy matches six current-issue questions',()=>assert.match(html,/Take the 6-question questionnaire/))

test('published image includes the evidence module dependency',()=>{assert.ok(fs.readFileSync('Dockerfile','utf8').includes('evidence.js vote-records.mjs'));assert.ok(html.includes('type="module" src="evidence.js?v='))});
test('compare page explains the path to candidate vote records',()=>{assert.ok(html.includes('expand <strong>Votes &amp; positions</strong>'));assert.ok(html.includes('Official voting record'))});
test('every static in-page link has a matching target',()=>{for(const [,target] of html.matchAll(/href="#([^"]+)"/g)){assert.ok(html.includes('id="'+target+'"')||html.includes("id='"+target+"'"),'Missing in-page target: #'+target)}});
