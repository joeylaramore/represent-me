const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8'),js=fs.readFileSync('mobile-nav.js','utf8'),css=fs.readFileSync('styles.css','utf8'),docker=fs.readFileSync('Dockerfile','utf8');
test('navigation links route to focused views and support browser history',()=>{for(const v of ['ballot','explore','issues','compare','sources'])assert.match(html,new RegExp('href="\\?view='+v+'"'));assert.match(js,/document\.addEventListener\('click'/);assert.match(js,/history\.pushState/);assert.match(js,/window\.addEventListener\('popstate'/)});
test('view route groups keep related ballot, issue, comparison, and source content together',()=>{assert.match(js,/ballot:\['#election','#representatives','.notice','#explore','#compare','#contests','#location-tools','#vote-plan','#ballot-mobile-bar'\]/);assert.match(js,/issues:\['\.questionnaire-promo','#beliefs','#value-match'\]/);assert.match(js,/compare:\['#representatives','#compare','#contests'\]/);assert.match(js,/sources:\['#sources','#vote-plan'\]/)});
test('mobile shortcuts are high contrast, larger, and deployed by the container',()=>{assert.match(css,/background:var\(--green\)/);assert.match(css,/font:700 12px\/1\.1 Arial/);assert.match(css,/min-height:48px/);assert.match(css,/a\[aria-current="page"\]/);assert.match(docker,/mobile-nav\.js/)});

test('focused routes always hide unrelated styled sections',()=>assert.match(css,/\[hidden\]\{display:none!important\}/));

test('initial route and browser history preserve the browser-restored scroll position',()=>{assert.match(js,/function setView\(view,\{push=false,scroll=push\}=\{\}\)/);assert.match(js,/if\(scroll\)window\.scrollTo/);assert.match(js,/setView\(view,\{scroll:false\}\)/);assert.match(js,/setView\(initial,\{scroll:false\}\)/);assert.match(js,/showHome\(\{scroll:false\}\)/)});

test('refresh saves and restores scroll after page layout settles',()=>{assert.match(js,/sessionStorage\.setItem\(scrollPrefix\+location\.pathname\+location\.search/);assert.match(js,/history\.scrollRestoration='manual'/);assert.match(js,/window\.addEventListener\('load',restore/);assert.match(js,/performance\.now\(\)-started<1800/)});

test('mobile navigation and readable styles use fresh browser cache versions',()=>{assert.match(html,/styles\.css\?v=representative-flow-1/);assert.match(html,/mobile-nav\.js\?v=representative-flow-1/)});
test('scroll position is saved while the reader moves and restored after load',()=>{assert.match(js,/window\.addEventListener\('scroll',saveScroll/);assert.match(js,/sessionStorage\.setItem\(scrollPrefix\+location\.pathname\+location\.search,String\(window\.scrollY\)\)/);assert.match(js,/performance\.now\(\)-started<1800/)});

test('candidate evidence previews and controls are easy to read on mobile',()=>{assert.match(css,/.evidence-preview\{font-size:18px/);assert.match(css,/.evidence-expand-hint\{font-size:17px/);assert.match(css,/.evidence-detail\{font-size:18px/);assert.match(css,/.official-votes>summary\{font-size:19px/)});

test('representatives appear before the election ballot and missing coverage is clear',()=>{assert.ok(html.indexOf('id="representatives"')<html.indexOf('id="contests"'));assert.match(html,/Federal representatives/);assert.match(html,/State, county, and school board representatives are still being checked/);assert.match(js,/#representatives/);});
test('representative summaries and open controls use readable text and touch targets',()=>{assert.match(css,/\.representative-summary\{font-size:18px/);assert.match(css,/\.representative-details>summary[^\{]*\{min-height:56px/);assert.match(css,/\.representative-card h3\{font:700 28px/);});
