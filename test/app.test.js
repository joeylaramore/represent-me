const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const html=fs.readFileSync('index.html','utf8');
test('target election and jurisdiction are labeled',()=>{assert.match(html,/November 3, 2026/);assert.match(html,/Coweta County/)})
test('candidate names are not fabricated',()=>assert.doesNotMatch(html,/Candidate [A-Z][a-z]+ [A-Z][a-z]+/))
test('verification and official sources are visible',()=>{assert.match(html,/awaiting verification/i);assert.match(html,/Georgia Secretary of State/)})
test('questionnaire persists locally',()=>assert.match(fs.readFileSync('app.js','utf8'),/localStorage/))

test('questionnaire label matches its implemented question count',()=>{const js=fs.readFileSync('app.js','utf8');assert.equal((js.match(/\{text:/g)||[]).length,3);assert.match(html,/Optional · 3 questions/i);assert.doesNotMatch(html,/6 current-issue questions/i)})
