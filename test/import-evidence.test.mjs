import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {textOf,parseSenateVoteXml,extractPositionMetadata,extractHouseEntries,extractHouseVotes,extractSenateVoteNumbers,mergeRows,mergeVoteRows,currentCongress,runImport,request,fetchFirstPartyResponse} from '../scripts/import-evidence.mjs';

test('Senate vote records retain the official roll call, date, question, source, and member vote',()=>{
 const xml=`<roll_call_vote><congress>119</congress><session>2</session><vote_number>42</vote_number><vote_date>June 3, 2026, 2:01 PM</vote_date><vote_question_text><![CDATA[On Passage of the Bill]]></vote_question_text><vote_result_text>Bill Passed (51-49)</vote_result_text><members><member><last_name>Ossoff</last_name><state>GA</state><vote_cast>Nay</vote_cast></member></members></roll_call_vote>`;
 const vote=parseSenateVoteXml(xml,{congress:119,session:2,number:42,url:'https://www.senate.gov/vote.xml'});
 assert.equal(vote.id,'senate-119-2-00042');assert.equal(vote.date,'June 3, 2026, 2:01 PM');assert.equal(vote.members[0].vote,'Nay');assert.equal(vote.sourceUrl,'https://www.senate.gov/vote.xml');
});

test('position snapshot stores first-party metadata and a content hash, not scraped page copy',()=>{
 const snapshot=extractPositionMetadata('<html><head><title>Issues &amp; priorities</title><meta name="description" content="Public priorities"><link rel="canonical" href="https://candidate.example/issues"></head></html>','https://candidate.example/');
 assert.equal(snapshot.title,'Issues & priorities');assert.equal(snapshot.description,'Public priorities');assert.equal(snapshot.url,'https://candidate.example/issues');assert.match(snapshot.contentSha256,/^[a-f0-9]{64}$/);assert.equal(Object.hasOwn(snapshot,'body'),false);
 assert.equal(snapshot.contentSha256,extractPositionMetadata('<html><head> <title>Issues &amp; priorities</title> <meta name="description" content="Public priorities"><link rel="canonical" href="https://candidate.example/issues"></head></html>','https://candidate.example/').contentSha256);
});

test('House member rows parse official results arrays and legacy item wrappers',()=>{
 const official=extractHouseEntries({houseRollCallVoteMemberVotes:{results:[{bioguideID:'J000311',voteCast:'Aye'}]}});
 const legacy=extractHouseEntries({houseRollCallVoteMemberVotes:{results:{item:[{bioguideId:'J000311',voteCast:'Aye'}]}}});
 assert.equal(official[0].bioguideID,'J000311');assert.equal(legacy[0].bioguideId,'J000311');
 assert.deepEqual(mergeRows([{id:'a'},{id:'b'}],[{id:'b',vote:'Nay'},{id:'c'}],x=>x.id),[{id:'a'},{id:'b',vote:'Nay'},{id:'c'}]);
});

test('current Congress and session calculation follows the two-year congressional cycle',()=>{
 assert.deepEqual(currentCongress(new Date('2026-10-08T00:00:00Z')),{congress:119,session:2});
 assert.deepEqual(currentCongress(new Date('2025-10-08T00:00:00Z')),{congress:119,session:1});
});

test('XML helper trims markup and decodes the common source entities',()=>assert.equal(textOf('<title>Costs &amp; care</title>','title'),'Costs & care'));
test('Senate roll call index yields unique numeric vote identifiers',()=>assert.deepEqual(extractSenateVoteNumbers('<votes><vote_number>0012</vote_number><vote_number>0012</vote_number><vote_number>13</vote_number></votes>'),[12,13]));

test('configured import positions are HTTPS first-party source pages',()=>{
 const targets=JSON.parse(fs.readFileSync('data/import-targets.json','utf8'));
 for(const candidate of targets.candidates)for(const source of candidate.positionSources){assert.equal(new URL(source).protocol,'https:');assert.ok(source.startsWith('https://'))}
});

test('daily importer fails clearly when the Congress.gov credential is absent',async()=>{
 await assert.rejects(runImport({apiKey:''}),/Set CONGRESS_API_KEY/);
});

test('transient Senate access denial is retried before failing the import',async()=>{const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return calls===1?new Response('denied',{status:403,statusText:'Forbidden'}):new Response('<votes/>',{status:200})};try{const response=await request('https://www.senate.gov/example.xml');assert.equal(response.status,200);assert.equal(calls,2)}finally{globalThis.fetch=original}});

test('position fetch stops before following a redirect to another host',async()=>{
 const original=globalThis.fetch;const requests=[];
 globalThis.fetch=async(url,options)=>{requests.push({url:String(url),options});return new Response(null,{status:302,headers:{location:'https://secure.actblue.com/donate/example'}})};
 try{
  const result=await fetchFirstPartyResponse('https://electjon.com/');
  assert.equal(result.redirected,true);assert.equal(result.targetHost,'secure.actblue.com');assert.equal(result.response,null);
  assert.equal(requests.length,1);assert.equal(requests[0].options.redirect,'manual');
  assert.equal(requests[0].options.headers.referer,undefined);
 }finally{globalThis.fetch=original}
});

test('position fetch follows same-host HTTPS redirects without sending a Senate referrer',async()=>{
 const original=globalThis.fetch;const requests=[];
 globalThis.fetch=async(url,options)=>{requests.push({url:String(url),options});return requests.length===1?new Response(null,{status:301,headers:{location:'/issues/'}}):new Response('<html><title>Issues</title></html>',{status:200})};
 try{
  const result=await fetchFirstPartyResponse('https://candidate.example/');
  assert.equal(result.redirected,false);assert.equal(result.response.status,200);
  assert.deepEqual(requests.map(x=>new URL(x.url).pathname),['/','/issues/']);
  assert.ok(requests.every(x=>x.options.redirect==='manual'&&!('referer' in x.options.headers)));
 }finally{globalThis.fetch=original}
});

test('House vote list accepts Congress.gov top-level array response and nested response shapes',()=>{
 const actual={houseRollCallVotes:[{identifier:'1192200001',rollCallNumber:1}],pagination:{count:314}};
 const nested={houseRollCallVotes:{houseRollCallVote:[{identifier:'1192200002',rollCallNumber:2}]}};
 assert.deepEqual(extractHouseVotes(actual),actual.houseRollCallVotes);
 assert.deepEqual(extractHouseVotes(nested),nested.houseRollCallVotes.houseRollCallVote);
});

test('daily imports preserve reviewed context on matching roll calls',()=>{
 const old={id:'vote-1',candidate:'Example',category:'legislation',purpose:'A bill passage vote.',effect:'Would fund the program.',contextReviewed:true,contextSources:[{title:'Official summary',url:'https://www.congress.gov/bill/119th-congress/house-bill/1'}]};
 const updated={id:'vote-1',candidate:'Example',question:'On Passage',vote:'Yea',status:'official-record-needs-context-review'};
 const merged=mergeVoteRows([old],[updated]);
 assert.equal(merged[0].vote,'Yea');assert.equal(merged[0].purpose,old.purpose);assert.equal(merged[0].effect,old.effect);assert.equal(merged[0].contextReviewed,true);assert.deepEqual(merged[0].contextSources,old.contextSources);
});
test('daily imports drop unreviewed vote context instead of preserving it',()=>{
 const merged=mergeVoteRows([{id:'vote-2',purpose:'Unreviewed guess'}],[{id:'vote-2',question:'Cloture'}]);
 assert.equal(merged[0].purpose,undefined);
});
