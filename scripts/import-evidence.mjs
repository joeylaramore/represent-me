import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=new URL('../',import.meta.url);
const targetsPath=new URL('data/import-targets.json',root);
const inboxPath=new URL('data/imported-evidence-2026.json',root);
const apiRoot='https://api.congress.gov/v3';
const houseClerkRoot='https://clerk.house.gov/evs';
const senateRoot='https://www.senate.gov/legislative/LIS/roll_call_lists';
const senateMirrorRoot='https://raw.githubusercontent.com/Votega/ga-federal-legislators/main/sessions';
const headers={'user-agent':'RepresentMe evidence import/1.0 (+https://representme.jlaramore.com/)','referer':'https://www.senate.gov/legislative/votes_new.htm','accept':'application/json,text/xml,text/html'};

function textOf(xml,tag){const match=xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`,'i'));return match?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim()||''}
function parseSenateVoteXml(xml,{congress,session,number,url}){
 const members=[...xml.matchAll(/<member>([\s\S]*?)<\/member>/gi)].map(([,block])=>({lastName:textOf(block,'last_name'),state:textOf(block,'state'),vote:textOf(block,'vote_cast')}));
 return {id:`senate-${congress}-${session}-${String(number).padStart(5,'0')}`,chamber:'senate',congress,session,number:Number(number),date:textOf(xml,'vote_date'),question:textOf(xml,'vote_question_text')||textOf(xml,'vote_title'),result:textOf(xml,'vote_result_text'),sourceUrl:url,members};
}
function extractPositionMetadata(html,url){
 const title=textOf(html,'title');
 const meta=(name)=>{const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const tag=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]).find(t=>new RegExp(`(?:name|property)=["']${escaped}["']`,'i').test(t));return tag?.match(/content=["']([^"']*)["']/i)?.[1]?.replace(/&amp;/g,'&').trim()||''};
 const canonical=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1]||url;
 const stable=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<!--[\s\S]*?-->/g,'').replace(/\s+/g,' ').replace(/>\s+</g,'><').trim();
 return {title,description:meta('description').slice(0,320),url:canonical,contentSha256:createHash('sha256').update(stable).digest('hex')};
}
function extractHouseEntries(payload){
 const roots=[payload?.houseRollCallVoteMemberVotes,payload?.houseRollCallVote,payload].filter(Boolean);
 for(const root of roots){
  if(Array.isArray(root))return root.filter(Boolean);
  const rows=Array.isArray(root.results)?root.results:root.results?.item||root.houseRollCallVoteMemberVotes?.results?.item||[];
  if(rows.length)return (Array.isArray(rows)?rows:[rows]).filter(Boolean);
 }
 return [];
}
function extractHouseVotes(payload){
 const collection=payload?.houseRollCallVotes;
 const votes=Array.isArray(collection)?collection:collection?.houseRollCallVote||[];
 return (Array.isArray(votes)?votes:[votes]).filter(Boolean);
}
function extractSenateVoteNumbers(xml){return [...new Set([...xml.matchAll(/<vote_number>(\d+)<\/vote_number>/gi)].map(m=>Number(m[1])))].filter(Number.isFinite)}
function parseHouseClerkVoteXml(xml,{sourceUrl}){
 const members=[...xml.matchAll(/<recorded-vote>[\s\S]*?<legislator\b[^>]*\bname-id=["']([^"']+)["'][^>]*>[\s\S]*?<vote>([\s\S]*?)<\/vote>[\s\S]*?<\/recorded-vote>/gi)].map(([,bioguideId,vote])=>({bioguideId,voteCast:vote.replace(/<[^>]+>/g,' ').trim()}));
 return {date:textOf(xml,'action-date'),question:textOf(xml,'vote-question'),result:textOf(xml,'vote-result'),sourceUrl,members};
}
function houseClerkVoteUrl(vote,congress){
 try{const source=new URL(vote.sourceDataURL||'');if(source.protocol==='https:'&&source.hostname==='clerk.house.gov')return source.href}catch{}
 const year=new Date(vote.startDate||'').getUTCFullYear()||1790+2*(congress-1);
 return `${houseClerkRoot}/${year}/roll${String(vote.rollCallNumber).padStart(3,'0')}.xml`;
}
function ordinal(n){const mod100=n%100;const suffix=mod100>=11&&mod100<=13?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th');return `${n}${suffix}`}
function parseSenateMirrorVotes(payload,targets,existing,congress,session){
 const old=new Set(existing.map(v=>v.id));const rows=[];const voteMap=payload?.votes||{};const memberVotes=payload?.memberVotes||{};
 for(const target of targets.filter(c=>c.chamber==='senate'&&c.bioguideId)){
  for(const memberVote of memberVotes[target.bioguideId]||[]){const match=String(memberVote.voteId||'').match(/^S(\d+)_(\d+)_(\d+)$/);if(!match||Number(match[1])!==congress||Number(match[2])!==session)continue;const number=Number(match[3]);const id=`senate-${congress}-${session}-${String(number).padStart(5,'0')}`;if(old.has(`${id}-${target.name}`))continue;const vote=voteMap[memberVote.voteId];if(!vote)continue;const sourceUrl=`https://www.senate.gov/legislative/LIS/roll_call_votes/vote${congress}${session}/vote_${congress}_${session}_${String(number).padStart(5,'0')}.xml`;rows.push({id:`${id}-${target.name}`,candidate:target.name,office:target.office,memberOffice:target.memberOffice,memberId:target.bioguideId,chamber:'senate',date:vote.date||'',question:vote.motionText||vote.title||'',result:vote.resultText||vote.result||'',vote:memberVote.vote||'',billUrl:vote.billUrl||'',sourceUrl,status:'official-record-needs-context-review',retrievedVia:'VoteGA mirror of official Senate roll-call XML'});}
 }
 return rows;
}
function mergeRows(existing,incoming,key){const map=new Map(existing.map(x=>[key(x),x]));for(const row of incoming)map.set(key(row),row);return [...map.values()].sort((a,b)=>key(a).localeCompare(key(b)))}
function mergeVoteRows(existing,incoming){
 const map=new Map(existing.map(row=>[row.id,row]));
 for(const row of incoming){
  const prior=map.get(row.id)||{};
  const reviewed=prior.contextReviewed===true?{category:prior.category,purpose:prior.purpose,effect:prior.effect,contextReviewed:true,contextSources:prior.contextSources}:{};
  const base=prior.contextReviewed===true?prior:Object.fromEntries(Object.entries(prior).filter(([key])=>!['category','purpose','effect','contextReviewed','contextSources'].includes(key)));
  map.set(row.id,{...base,...row,...reviewed});
 }
 return [...map.values()].sort((a,b)=>a.id.localeCompare(b.id));
}
function currentCongress(date=new Date()){const year=date.getUTCFullYear();return {congress:Math.floor((year-1789)/2)+1,session:year%2?1:2}}
export async function request(url,options={}){const safe=new URL(url);safe.searchParams.delete('api_key');let response;for(let attempt=0;attempt<4;attempt++){try{response=await fetch(url,{headers,...options,signal:AbortSignal.timeout(20000)})}catch(error){throw new Error(`Request failed for ${safe} (${error.name||'network error'})`)}if(response.ok||(options.redirect==='manual'&&response.status>=300&&response.status<400))return response;if(![403,429,500,502,503,504].includes(response.status)||attempt===3)throw new Error(`${response.status} ${response.statusText} for ${safe}`);await new Promise(resolve=>setTimeout(resolve,1000*(2**attempt)));}throw new Error(`Request failed for ${safe}`)}
async function fetchJson(url,options={}){return request(url,options).then(r=>r.json())}
async function fetchText(url,options={}){return request(url,options).then(r=>r.text())}
export async function fetchFirstPartyResponse(url){
 const original=new URL(url);let current=original;
 const sourceHeaders={'user-agent':headers['user-agent'],'accept':headers.accept};
 for(let attempt=0;attempt<5;attempt++){
  const response=await request(current.href,{redirect:'manual',headers:sourceHeaders});
  if(response.status>=300&&response.status<400){
   const location=response.headers.get('location');if(!location)throw new Error(`Position source redirect has no Location header: ${original.hostname}`);
   const next=new URL(location,current);
   const sameHost=next.hostname.replace(/^www\./,'')===original.hostname.replace(/^www\./,'');
   if(next.protocol!=='https:'||!sameHost)return {response:null,redirected:true,targetHost:next.hostname};
   current=next;continue;
  }
  return {response,redirected:false,targetHost:current.hostname};
 }
 throw new Error(`Position source exceeded same-host redirect limit: ${original.hostname}`);
}
function authorizedUrl(path,key){const url=new URL(`${apiRoot}${path}`);url.searchParams.set('api_key',key);url.searchParams.set('format','json');return url}
async function fetchHouseVotes(targets,existing,key,congress,session){
 const ids=new Set(targets.filter(c=>c.chamber==='house').map(c=>c.bioguideId));
 const old=new Set(existing.map(v=>v.id));const newRows=[];const diagnostics={listedVotes:0,memberRows:0,targetMemberRows:0,memberSourceFallbacks:0,responseKeys:[],paginationCount:null,voteCollectionType:'missing'};let offset=0,total=Infinity;
 while(offset<total){const url=authorizedUrl(`/house-vote/${congress}/${session}`,key);url.searchParams.set('limit','250');url.searchParams.set('offset',String(offset));const page=await fetchJson(url);const collection=page.houseRollCallVotes;const root=Array.isArray(collection)?{}:(collection||{});const items=extractHouseVotes(page);if(offset===0){diagnostics.responseKeys=Object.keys(page).sort();diagnostics.paginationCount=page.pagination?.count??root.pagination?.count??null;diagnostics.voteCollectionType=Array.isArray(collection)?'array':typeof collection;}total=Number(page.pagination?.count??root.pagination?.count??items.length);if(!items.length)break;diagnostics.listedVotes+=items.length;
  for(const vote of items){const voteId=String(vote.identifier||`${congress}-${session}-${vote.rollCallNumber}`);if([...ids].every(memberId=>old.has(`house-${voteId}-${memberId}`)))continue;const base=`/house-vote/${congress}/${session}/${vote.rollCallNumber}`;const detail=await fetchJson(authorizedUrl(base,key));const memberData=await fetchJson(authorizedUrl(`${base}/members`,key));
   const full=detail.houseRollCallVote||detail;let rows=extractHouseEntries(memberData);let memberSource='Congress.gov API';if(!rows.length){const clerkUrl=houseClerkVoteUrl(vote,congress);try{const clerk=parseHouseClerkVoteXml(await fetchText(clerkUrl),{sourceUrl:clerkUrl});rows=clerk.members;memberSource='House Clerk XML';diagnostics.memberSourceFallbacks++;}catch(error){console.warn(`House member API returned no rows and House Clerk fallback failed for ${clerkUrl}: ${error.message}`);}}
   diagnostics.memberRows+=rows.length;for(const row of rows){const id=row.bioguideId||row.bioguideID;if(!ids.has(id))continue;diagnostics.targetMemberRows++;if(old.has(`house-${voteId}-${id}`))continue;const target=targets.find(c=>c.bioguideId===id);newRows.push({id:`house-${voteId}-${id}`,candidate:target.name,office:target.office,memberOffice:target.memberOffice,memberId:id,chamber:'house',date:full.startDate||vote.startDate||'',question:full.voteQuestion||vote.voteQuestion||'',result:full.result||vote.result||'',vote:row.voteCast||row.vote||'',billUrl:full.legislationUrl||vote.legislationUrl||'',sourceUrl:`https://api.congress.gov/v3/house-vote/${congress}/${session}/${vote.rollCallNumber}`,memberSourceUrl:memberSource==='House Clerk XML'?houseClerkVoteUrl(vote,congress):undefined,retrievedVia:memberSource,status:'official-record-needs-context-review'});}
  }
  offset+=items.length;if(offset>=2500)throw new Error('House vote pagination exceeded safety limit');
 }
 return {rows:newRows,diagnostics};
}
async function fetchSenateVotes(targets,existing,congress,session){
 const senators=targets.filter(c=>c.chamber==='senate'&&c.senateName);const old=new Set(existing.map(v=>v.id));const indexUrl=`${senateRoot}/vote_menu_${congress}_${session}.xml`;let xml;try{xml=await fetchText(indexUrl)}catch(error){console.warn(`Official Senate ${congress}/${session} feed unavailable: ${error.message}`);try{const mirror=await fetchJson(`${senateMirrorRoot}/${ordinal(congress)}/votes.json`,{headers:{'user-agent':headers['user-agent'],'accept':'application/json'}});const fallback=parseSenateMirrorVotes(mirror,targets,existing,congress,session);console.warn(`Loaded ${fallback.length} Senate ${congress}/${session} rows from the VoteGA mirror of official Senate XML.`);return fallback}catch(mirrorError){console.warn(`Senate mirror unavailable for ${congress}/${session}: ${mirrorError.message}`);return []}}
 const unique=extractSenateVoteNumbers(xml);const result=[];
 for(const number of unique){const id=`senate-${congress}-${session}-${String(number).padStart(5,'0')}`;if(senators.every(c=>old.has(`${id}-${c.name}`)))continue;const url=`https://www.senate.gov/legislative/LIS/roll_call_votes/vote${congress}${session}/vote_${congress}_${session}_${String(number).padStart(5,'0')}.xml`;let vote;try{vote=parseSenateVoteXml(await fetchText(url),{congress,session,number,url});}catch(error){console.warn(`Skipping unavailable Senate roll call ${url}: ${error.message}`);continue;}for(const target of senators){const member=vote.members.find(m=>m.lastName.toLowerCase()===target.senateName.toLowerCase()&&m.state===target.state);if(member)result.push({id:`${vote.id}-${target.name}`,candidate:target.name,office:target.office,memberOffice:target.memberOffice,memberId:`${target.senateName}-${target.state}`,chamber:'senate',date:vote.date,question:vote.question,result:vote.result,vote:member.vote,sourceUrl:url,status:'official-record-needs-context-review'});}}
 return result;
}
async function fetchPositions(targets,existing){
 const old=new Map(existing.map(x=>[x.candidate+'|'+x.url,x]));const rows=[];
 for(const candidate of targets)for(const url of candidate.positionSources||[]){const fetched=await fetchFirstPartyResponse(url);if(fetched.redirected){console.warn(`Skipping position source redirect outside its first-party host for ${candidate.name}: ${new URL(url).hostname} -> ${fetched.targetHost}`);continue;}const html=await fetched.response.text();const metadata=extractPositionMetadata(html,url);const prior=old.get(candidate.name+'|'+metadata.url);if(prior?.contentSha256===metadata.contentSha256)continue;rows.push({candidate:candidate.name,office:candidate.office,...metadata,changedAt:new Date().toISOString(),status:'first-party-source-needs-human-review'});}
 return rows;
}
export {textOf,parseSenateVoteXml,parseHouseClerkVoteXml,extractPositionMetadata,extractHouseEntries,extractHouseVotes,extractSenateVoteNumbers,mergeRows,mergeVoteRows,currentCongress,fetchSenateVotes,parseSenateMirrorVotes};
export async function runImport({targetsPathArg=targetsPath,inboxPathArg=inboxPath,apiKey=process.env.CONGRESS_API_KEY,now=new Date()}={}){
 if(!apiKey)throw new Error('Set CONGRESS_API_KEY to use the official Congress.gov House vote API.');
 const targets=JSON.parse(await fs.readFile(targetsPathArg,'utf8'));const inbox=JSON.parse(await fs.readFile(inboxPathArg,'utf8'));const {congress,session}=currentCongress(now);const votes=[];
 for(const s of new Set([session,session===1?2:1])){const year=(s===1?1789+2*(congress-1):1790+2*(congress-1));if(year>now.getUTCFullYear())continue;const house=await fetchHouseVotes(targets.candidates,inbox.votes.filter(v=>v.chamber==='house'),apiKey,congress,s);votes.push(...house.rows);console.log(`Congress.gov House ${congress}/${s}: ${JSON.stringify({...house.diagnostics,newVotes:house.rows.length})}`);votes.push(...await fetchSenateVotes(targets.candidates,inbox.votes.filter(v=>v.chamber==='senate'),congress,s));}
 const positions=await fetchPositions(targets.candidates,inbox.positionSources);const merged={...inbox,votes:mergeVoteRows(inbox.votes,votes),positionSources:mergeRows(inbox.positionSources,positions,x=>x.candidate+'|'+x.url)};
 await fs.writeFile(inboxPathArg,JSON.stringify(merged,null,2)+'\n');return {newVotes:votes.length,newPositionSnapshots:positions.length};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])runImport().then(count=>console.log(JSON.stringify(count))).catch(error=>{console.error(error.message);process.exitCode=1;});
