const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const html=fs.readFileSync('index.html','utf8');
test('target election and jurisdiction are labeled',()=>{assert.match(html,/November 3, 2026/);assert.match(html,/Coweta County/)})
test('candidate names are not fabricated',()=>assert.doesNotMatch(html,/Candidate [A-Z][a-z]+ [A-Z][a-z]+/))
test('verification and official sources are visible',()=>{assert.match(html,/awaiting verification/i);assert.match(html,/Georgia Secretary of State/)})
test('questionnaire answers stay in memory and copy matches six questions',()=>{const js=fs.readFileSync('app.js','utf8');assert.equal((js.match(/\{topic:/g)||[]).length,6);assert.match(html,/Optional · 6 current-issue questions/i);assert.match(html,/Take the 6-question questionnaire/i);assert.doesNotMatch(js,/localStorage|sessionStorage|XMLHttpRequest|navigator\.sendBeacon/)})

test('questionnaire entry copy matches six current-issue questions',()=>assert.match(html,/Take the 6-question questionnaire/))
