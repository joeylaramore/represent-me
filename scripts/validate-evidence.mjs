import fs from 'node:fs';
const roster=JSON.parse(fs.readFileSync('data/ballot-2026.json','utf8'));
const evidence=JSON.parse(fs.readFileSync('data/candidate-evidence-2026.json','utf8'));
const errors=[];
const validTypes=new Set(['stated-position','recorded-vote','sponsored-legislation','public-action','campaign-commitment']);
const allowedNames=new Set(roster.contests.flatMap(c=>c.candidates.map(p=>c.office+'|'+p.name)));
if(!Array.isArray(evidence.candidates))errors.push('candidates must be an array');
for(const [i,c] of (evidence.candidates||[]).entries()){
 const loc='candidates['+i+']';
 if(!allowedNames.has(c.office+'|'+c.name))errors.push(loc+': candidate not found in preliminary roster; verify roster first');
 if(!Array.isArray(c.claims))errors.push(loc+': claims must be array');
 for(const [j,claim] of (c.claims||[]).entries()){
  const at=loc+'.claims['+j+']';
  if(!validTypes.has(claim.type))errors.push(at+': invalid claim type');
  if(typeof claim.topic!=='string'||!claim.topic.trim())errors.push(at+': topic required');
  if(typeof claim.summary!=='string'||claim.summary.trim().length<20)errors.push(at+': neutral summary required (20+ characters)');
  if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(claim.date||'')||Number.isNaN(Date.parse(claim.date)))errors.push(at+': valid YYYY-MM-DD date required');
  if(!Array.isArray(claim.sources)||claim.sources.length===0)errors.push(at+': at least one original source required');
  const domains=new Set();
  for(const [k,source] of (claim.sources||[]).entries()){
   const ref=at+'.sources['+k+']';
   if(!source.publisher||!source.title)errors.push(ref+': publisher and title required');
   try{const url=new URL(source.url);if(url.protocol!=='https:')throw Error('HTTPS required');domains.add(url.hostname.replace(/^www\\./,''))}catch{errors.push(ref+': valid HTTPS URL required')}
  }
  if((claim.sources||[]).length>=2&&domains.size<2)errors.push(at+': two citations must be on distinct source domains');
  if(claim.type==='recorded-vote'&&!(claim.sources||[]).some(s=>/\\.(gov|ga\\.us)(\\/|$)/.test(new URL(s.url).hostname+'/')))errors.push(at+': recorded vote requires an official government record');
 }
}
if(errors.length){console.error('Evidence validation failed:\\n'+errors.join('\\n'));process.exit(1)}
console.log('Evidence validated: '+(evidence.candidates||[]).length+' candidate profiles');
