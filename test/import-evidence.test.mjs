import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {textOf,parseSenateVoteXml,extractPositionMetadata,extractHouseEntries,mergeRows,currentCongress,runImport} from '../scripts/import-evidence.mjs';

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

test('House member rows are selected by official Bioguide ID and votes merge without duplicates',()=>{
 const rows=extractHouseEntries({houseRollCallVoteMemberVotes:{results:{item:[{bioguideId:'J000311',voteCast:'Aye'}]}}});
 assert.equal(rows[0].bioguideId,'J000311');assert.deepEqual(mergeRows([{id:'a'},{id:'b'}],[{id:'b',vote:'Nay'},{id:'c'}],x=>x.id),[{id:'a'},{id:'b',vote:'Nay'},{id:'c'}]);
});

test('current Congress and session calculation follows the two-year congressional cycle',()=>{
 assert.deepEqual(currentCongress(new Date('2026-10-08T00:00:00Z')),{congress:119,session:2});
 assert.deepEqual(currentCongress(new Date('2025-10-08T00:00:00Z')),{congress:119,session:1});
});

test('XML helper trims markup and decodes the common source entities',()=>assert.equal(textOf('<title>Costs &amp; care</title>','title'),'Costs & care'));

test('configured import positions are HTTPS first-party source pages',()=>{
 const targets=JSON.parse(fs.readFileSync('data/import-targets.json','utf8'));
 for(const candidate of targets.candidates)for(const source of candidate.positionSources){assert.equal(new URL(source).protocol,'https:');assert.ok(source.startsWith('https://'))}
});

test('daily importer fails clearly when the Congress.gov credential is absent',async()=>{
 await assert.rejects(runImport({apiKey:''}),/Set CONGRESS_API_KEY/);
});
