import fs from 'node:fs';
const targets=JSON.parse(fs.readFileSync('data/import-targets.json','utf8'));
const inbox=JSON.parse(fs.readFileSync('data/imported-evidence-2026.json','utf8'));
const names=new Set(targets.candidates.map(c=>c.name));const errors=[];
for(const key of ['votes','positionSources'])if(!Array.isArray(inbox[key]))errors.push(`${key} must be an array`);
for(const [i,row] of (inbox.votes||[]).entries()){
 const at=`votes[${i}]`;if(!names.has(row.candidate))errors.push(`${at}: candidate is not configured`);
 if(!['house','senate'].includes(row.chamber))errors.push(`${at}: invalid chamber`);
 if(!row.vote)errors.push(`${at}: recorded vote required`);
 try{const u=new URL(row.sourceUrl);if(u.protocol!=='https:'||!['api.congress.gov','www.senate.gov'].includes(u.hostname))errors.push(`${at}: source must be an official HTTPS vote record`)}catch{errors.push(`${at}: valid source URL required`)}
}
for(const [i,row] of (inbox.positionSources||[]).entries()){
 const at=`positionSources[${i}]`;if(!names.has(row.candidate))errors.push(`${at}: candidate is not configured`);
 if(!row.contentSha256||!/^[a-f0-9]{64}$/.test(row.contentSha256))errors.push(`${at}: SHA-256 required`);
 if(row.body!==undefined||row.html!==undefined)errors.push(`${at}: source page content must not be copied into the inbox`);
 try{const u=new URL(row.url);if(u.protocol!=='https:')errors.push(`${at}: HTTPS URL required`)}catch{errors.push(`${at}: valid source URL required`)}
}
if(errors.length){console.error('Import inbox validation failed:\n'+errors.join('\n'));process.exit(1)}
console.log(`Import inbox validated: ${(inbox.votes||[]).length} votes, ${(inbox.positionSources||[]).length} source snapshots`);
