const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const html=fs.readFileSync('index.html','utf8');
test('target election and jurisdiction are labeled',()=>{assert.match(html,/November 3, 2026/);assert.match(html,/Coweta County/)})
test('candidate names are not fabricated',()=>assert.doesNotMatch(html,/Candidate [A-Z][a-z]+ [A-Z][a-z]+/))
test('verification and official sources are visible',()=>{assert.match(html,/awaiting verification/i);assert.match(html,/Georgia Secretary of State/)})
test('questionnaire persists locally',()=>assert.match(fs.readFileSync('app.js','utf8'),/localStorage/))

test('questionnaire entry copy matches six current-issue questions',()=>assert.match(html,/Take the 6-question questionnaire/))

test('published image includes the evidence module dependency',()=>{assert.ok(fs.readFileSync('Dockerfile','utf8').includes('evidence.js vote-records.mjs'));assert.ok(html.includes('type="module" src="evidence.js?v='))});
test('compare page uses clear progressive candidate instructions',()=>{assert.ok(html.includes('open <strong>Candidate details</strong>'));assert.ok(html.includes('plain-language explanation and its sources'));assert.ok(html.includes('Recorded votes'))});
test('every static in-page link has a matching target',()=>{for(const [,target] of html.matchAll(/href="#([^"]+)"/g)){assert.ok(html.includes('id="'+target+'"')||html.includes("id='"+target+"'"),'Missing in-page target: #'+target)}});
test('nginx serves the ES module helper with a JavaScript MIME type',()=>{assert.ok(fs.readFileSync('nginx.conf','utf8').includes('location ~ \\.mjs$ { default_type application/javascript; try_files $uri =404; }'))});

test('candidate claims start as previews and reveal context and citations on demand',()=>{const evidence=fs.readFileSync('evidence.js','utf8');assert.ok(evidence.includes('<details class="evidence-claim"><summary>'));assert.ok(evidence.includes('Open explanation and sources'));assert.ok(evidence.includes('<p class="evidence-summary">'));assert.ok(evidence.includes('Sources and cross-checks ('))});
