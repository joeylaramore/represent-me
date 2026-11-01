import fs from 'node:fs';
const targets=JSON.parse(fs.readFileSync('data/import-targets.json','utf8'));
const inbox=JSON.parse(fs.readFileSync('data/imported-evidence-2026.json','utf8'));
const names=new Set(targets.candidates.map(c=>c.name));const ballot=JSON.parse(fs.readFileSync('data/ballot-2026.json','utf8'));const roster=new Map(ballot.contests.flatMap(contest=>contest.candidates.map(candidate=>[candidate.name,contest.office])));const errors=[];
for(const key of ['votes','positionSources'])if(!Array.isArray(inbox[key]))errors.push(`${key} must be an array`);
for(const [i,row] of (inbox.votes||[]).entries()){
 const at=`votes[${i}]`;if(!names.has(row.candidate))errors.push(`${at}: candidate is not configured`);
 if(!['house','senate'].includes(row.chamber))errors.push(`${at}: invalid chamber`);
 if(!row.vote)errors.push(`${at}: recorded vote required`);
 if(row.contextReviewed===true){
  if(!['procedural','legislation'].includes(row.category))errors.push(`${at}: reviewed context requires category procedural or legislation`);
  if(typeof row.purpose!=='string'||!row.purpose.trim())errors.push(`${at}: reviewed context requires what the vote was for`);
  if(typeof row.effect!=='string'||!row.effect.trim())errors.push(`${at}: reviewed context requires what the measure would do`);
  if(!Array.isArray(row.contextSources)||!row.contextSources.length)errors.push(`${at}: reviewed context requires citation sources`);
  for(const [j,source] of (row.contextSources||[]).entries()){try{if(!source||typeof source.title!=='string'||!source.title.trim())throw new Error();const u=new URL(source.url);if(u.protocol!=='https:')errors.push(`${at}.contextSources[${j}]: HTTPS URL required`)}catch{errors.push(`${at}.contextSources[${j}]: title and valid HTTPS citation URL required`)}}
 }
 try{const u=new URL(row.sourceUrl);if(u.protocol!=='https:'||!['api.congress.gov','www.senate.gov','clerk.house.gov'].includes(u.hostname))errors.push(`${at}: source must be an official HTTPS vote record`)}catch{errors.push(`${at}: valid source URL required`)}
 if(row.memberSourceUrl){try{const u=new URL(row.memberSourceUrl);if(u.protocol!=='https:'||u.hostname!=='clerk.house.gov')errors.push(`${at}: House member source must be an official HTTPS House Clerk URL`)}catch{errors.push(`${at}: valid House member source URL required`)}}
}
for(const [i,target] of targets.candidates.entries()){
 const expected=target.chamber==='house'?'U.S. House':target.chamber==='senate'?'U.S. Senate':'';
 if(expected&&!String(target.office||'').startsWith(expected))errors.push(`targets.candidates[${i}]: ${target.chamber} target office must start with ${expected}`);
}
for(const [i,row] of (inbox.positionSources||[]).entries()){
 const at=`positionSources[${i}]`;if(!names.has(row.candidate))errors.push(`${at}: candidate is not configured`);
 if(!row.contentSha256||!/^[a-f0-9]{64}$/.test(row.contentSha256))errors.push(`${at}: SHA-256 required`);
 if(row.body!==undefined||row.html!==undefined)errors.push(`${at}: source page content must not be copied into the inbox`);
 try{const u=new URL(row.url);if(u.protocol!=='https:')errors.push(`${at}: HTTPS URL required`)}catch{errors.push(`${at}: valid source URL required`)}
}
for(const [i,row] of (inbox.newsLeads||[]).entries()){
 const at='newsLeads['+i+']';if(roster.get(row.candidate)!==row.office)errors.push(at+': candidate and office must match the ballot roster');
 if(!row.title||!row.publisher)errors.push(at+': article title and publisher required');
 if(row.status!=='news-report-needs-human-review')errors.push(at+': news lead must remain marked for human review');
 try{const u=new URL(row.url);if(u.protocol!=='https:'||u.hostname!=='news.google.com')errors.push(at+': source URL must be an HTTPS Google News article link')}catch{errors.push(at+': valid HTTPS source URL required')}
 if(row.publisherUrl){try{const u=new URL(row.publisherUrl);if(u.protocol!=='https:')errors.push(at+': publisher URL must use HTTPS')}catch{errors.push(at+': valid publisher URL required')}}
}
if(errors.length){console.error('Import inbox validation failed:\n'+errors.join('\n'));process.exit(1)}
console.log(`Import inbox validated: ${(inbox.votes||[]).length} votes, ${(inbox.positionSources||[]).length} source snapshots, ${(inbox.newsLeads||[]).length} news leads`);
