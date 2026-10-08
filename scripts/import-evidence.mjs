import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=new URL('../',import.meta.url);
const targetsPath=new URL('data/import-targets.json',root);
const inboxPath=new URL('data/imported-evidence-2026.json',root);
const apiRoot='https://api.congress.gov/v3';
const senateRoot='https://www.senate.gov/legislative/LIS/roll_call_lists';
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
 const root=payload?.houseRollCallVoteMemberVotes||payload?.houseRollCallVote||payload;
 const rows=root?.results?.item||root?.houseRollCallVoteMemberVotes?.results?.item||[];
 return (Array.isArray(rows)?rows:[rows]).filter(Boolean);
}
function extractSenateVoteNumbers(xml){return [...new Set([...xml.matchAll(/<vote_number>(\d+)<\/vote_number>/gi)].map(m=>Number(m[1])))].filter(Number.isFinite)}
function mergeRows(existing,incoming,key){const map=new Map(existing.map(x=>[key(x),x]));for(const row of incoming)map.set(key(row),row);return [...map.values()].sort((a,b)=>key(a).localeCompare(key(b)))}
function currentCongress(date=new Date()){const year=date.getUTCFullYear();return {congress:Math.floor((year-1789)/2)+1,session:year%2?1:2}}
export async function request(url,options={}){const safe=new URL(url);safe.searchParams.delete('api_key');let response;for(let attempt=0;attempt<4;attempt++){try{response=await fetch(url,{headers,...options,signal:AbortSignal.timeout(20000)})}catch(error){throw new Error(`Request failed for ${safe} (${error.name||'network error'})`)}if(response.ok)return response;if(![403,429,500,502,503,504].includes(response.status)||attempt===3)throw new Error(`${response.status} ${response.statusText} for ${safe}`);await new Promise(resolve=>setTimeout(resolve,1000*(2**attempt)));}throw new Error(`Request failed for ${safe}`)}
async function fetchJson(url){return request(url).then(r=>r.json())}
async function fetchText(url){return request(url).then(r=>r.text())}
function authorizedUrl(path,key){const url=new URL(`${apiRoot}${path}`);url.searchParams.set('api_key',key);url.searchParams.set('format','json');return url}
async function fetchHouseVotes(targets,existing,key,congress,session){
 const ids=new Set(targets.filter(c=>c.chamber==='house').map(c=>c.bioguideId));
 const old=new Set(existing.map(v=>v.id));const newRows=[];let offset=0,total=Infinity;
 while(offset<total){const url=authorizedUrl(`/house-vote/${congress}/${session}`,key);url.searchParams.set('limit','250');url.searchParams.set('offset',String(offset));const page=await fetchJson(url);const root=page.houseRollCallVotes||{};const votes=root.houseRollCallVote||[];const items=Array.isArray(votes)?votes:[votes];total=Number(page.pagination?.count??root.pagination?.count??items.length);if(!items.length)break;
  for(const vote of items){const voteId=String(vote.identifier||`${congress}-${session}-${vote.rollCallNumber}`);if([...ids].every(memberId=>old.has(`house-${voteId}-${memberId}`)))continue;const base=`/house-vote/${congress}/${session}/${vote.rollCallNumber}`;const detail=await fetchJson(authorizedUrl(base,key));const memberData=await fetchJson(authorizedUrl(`${base}/members`,key));
   const full=detail.houseRollCallVote||detail;const rows=extractHouseEntries(memberData);for(const row of rows){const id=row.bioguideId||row.bioguideID;if(!ids.has(id)||old.has(`house-${voteId}-${id}`))continue;const target=targets.find(c=>c.bioguideId===id);newRows.push({id:`house-${voteId}-${id}`,candidate:target.name,office:target.office,memberOffice:target.memberOffice,memberId:id,chamber:'house',date:full.startDate||vote.startDate||'',question:full.voteQuestion||vote.voteQuestion||'',result:full.result||vote.result||'',vote:row.voteCast||row.vote||'',billUrl:full.legislationUrl||vote.legislationUrl||'',sourceUrl:`https://api.congress.gov/v3/house-vote/${congress}/${session}/${vote.rollCallNumber}`,status:'official-record-needs-context-review'});}
  }
  offset+=items.length;if(offset>=2500)throw new Error('House vote pagination exceeded safety limit');
 }
 return newRows;
}
async function fetchSenateVotes(targets,existing,congress,session){
 const senators=targets.filter(c=>c.chamber==='senate'&&c.senateName);const old=new Set(existing.map(v=>v.id));const indexUrl=`${senateRoot}/vote_menu_${congress}_${session}.xml`;const xml=await fetchText(indexUrl);
 const unique=extractSenateVoteNumbers(xml);const result=[];
 for(const number of unique){const id=`senate-${congress}-${session}-${String(number).padStart(5,'0')}`;if(senators.every(c=>old.has(`${id}-${c.name}`)))continue;const url=`https://www.senate.gov/legislative/LIS/roll_call_votes/vote${congress}${session}/vote_${congress}_${session}_${String(number).padStart(5,'0')}.xml`;let vote;try{vote=parseSenateVoteXml(await fetchText(url),{congress,session,number,url});}catch(error){console.warn(`Skipping unavailable Senate roll call ${url}: ${error.message}`);continue;}for(const target of senators){const member=vote.members.find(m=>m.lastName.toLowerCase()===target.senateName.toLowerCase()&&m.state===target.state);if(member)result.push({id:`${vote.id}-${target.name}`,candidate:target.name,office:target.office,memberOffice:target.memberOffice,memberId:`${target.senateName}-${target.state}`,chamber:'senate',date:vote.date,question:vote.question,result:vote.result,vote:member.vote,sourceUrl:url,status:'official-record-needs-context-review'});}}
 return result;
}
async function fetchPositions(targets,existing){
 const old=new Map(existing.map(x=>[x.candidate+'|'+x.url,x]));const rows=[];
 for(const candidate of targets)for(const url of candidate.positionSources||[]){const response=await request(url);const final=new URL(response.url);const original=new URL(url);if(final.protocol!=='https:'||final.hostname.replace(/^www\./,'')!==original.hostname.replace(/^www\./,''))throw new Error(`Position source redirected outside its first-party host: ${url}`);const html=await response.text();const metadata=extractPositionMetadata(html,url);const prior=old.get(candidate.name+'|'+metadata.url);if(prior?.contentSha256===metadata.contentSha256)continue;rows.push({candidate:candidate.name,office:candidate.office,...metadata,changedAt:new Date().toISOString(),status:'first-party-source-needs-human-review'});}
 return rows;
}
export {textOf,parseSenateVoteXml,extractPositionMetadata,extractHouseEntries,extractSenateVoteNumbers,mergeRows,currentCongress};
export async function runImport({targetsPathArg=targetsPath,inboxPathArg=inboxPath,apiKey=process.env.CONGRESS_API_KEY,now=new Date()}={}){
 if(!apiKey)throw new Error('Set CONGRESS_API_KEY to use the official Congress.gov House vote API.');
 const targets=JSON.parse(await fs.readFile(targetsPathArg,'utf8'));const inbox=JSON.parse(await fs.readFile(inboxPathArg,'utf8'));const {congress,session}=currentCongress(now);const votes=[];
 for(const s of new Set([session,session===1?2:1])){const year=(s===1?1789+2*(congress-1):1790+2*(congress-1));if(year>now.getUTCFullYear())continue;votes.push(...await fetchHouseVotes(targets.candidates,inbox.votes.filter(v=>v.chamber==='house'),apiKey,congress,s));votes.push(...await fetchSenateVotes(targets.candidates,inbox.votes.filter(v=>v.chamber==='senate'),congress,s));}
 const positions=await fetchPositions(targets.candidates,inbox.positionSources);const merged={...inbox,votes:mergeRows(inbox.votes,votes,x=>x.id),positionSources:mergeRows(inbox.positionSources,positions,x=>x.candidate+'|'+x.url)};
 await fs.writeFile(inboxPathArg,JSON.stringify(merged,null,2)+'\n');return {newVotes:votes.length,newPositionSnapshots:positions.length};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])runImport().then(count=>console.log(JSON.stringify(count))).catch(error=>{console.error(error.message);process.exitCode=1;});
