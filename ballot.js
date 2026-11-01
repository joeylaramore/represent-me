// Selections stay in page memory only. Nothing is written to storage or sent to a server.
(async()=>{
 const root=document.getElementById('preliminary-ballot');if(!root)return;
 const selections=new Map();
 const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const status=document.getElementById('ballot-selection-status');
 const progress=document.getElementById('ballot-progress-text');
 const progressTotal=document.getElementById('ballot-progress-total');
 const mobileCount=document.getElementById('mobile-ballot-count');
 const preview=document.getElementById('ballot-preview-content');const locationLabel=document.getElementById('location-label');
 const locationReady=()=>{try{return localStorage.getItem('represent-me-location-ready-v2')==='true'}catch{return false}};
 const enablePreview=()=>{preview.hidden=false;document.getElementById('ballot-mobile-bar').hidden=false;if(locationLabel)locationLabel.textContent='Location set'};
 window.addEventListener('represent-me-location-ready',enablePreview);if(locationReady())enablePreview();
 const updateStatus=()=>{const count=selections.size;status.textContent='Choices are temporary and never saved.';progress.textContent=count+' race'+(count===1?'':'s')+' selected';mobileCount.textContent=count+' selected'};
 try{
  const response=await fetch('data/ballot-2026.json',{cache:'no-store'});if(!response.ok)throw Error('Ballot preview unavailable');
  const data=await response.json();const groups=['Federal','Statewide','District-dependent'];root.className='ballot-paper';
  root.innerHTML=groups.map(scope=>{const rows=data.contests.map((contest,index)=>({...contest,index})).filter(contest=>contest.scope===scope);return '<section class="ballot-group"><h3>'+esc(scope==='District-dependent'?'District-dependent — verify your address':scope)+'</h3><div class="ballot-list">'+rows.map(contest=>'<article class="ballot-row"><div class="ballot-race-title"><h4>'+esc(contest.office)+'</h4><small>'+esc(contest.scope)+'</small><span class="ballot-instruction">Vote for one</span></div><fieldset class="ballot-candidates" aria-label="Vote for one in '+esc(contest.office)+'"><legend class="visually-hidden">Vote for one in '+esc(contest.office)+'</legend>'+contest.candidates.map((candidate,index)=>'<label class="ballot-option"><input type="radio" name="ballot-choice-'+contest.index+'" value="'+index+'"><span><strong>'+esc(candidate.name)+'</strong><small>'+esc(candidate.party)+'</small></span></label>').join('')+'<label class="ballot-option ballot-undecided"><input type="radio" name="ballot-choice-'+contest.index+'" value="skip"><span><strong>Undecided</strong></span></label></fieldset><div class="ballot-row-actions"><a href="'+esc(data.sources[contest.source].url)+'" target="_blank" rel="noopener noreferrer">Check source ↗</a></div></article>').join('')+'</div></section>'}).join('');
  document.getElementById('preliminary-count').textContent=data.contests.length+' reported races';progressTotal.textContent='of '+data.contests.length+' reported races';if(locationReady())document.getElementById('ballot-mobile-bar').hidden=false;updateStatus();
  root.addEventListener('change',event=>{const input=event.target;if(!input.matches('input[type="radio"][name^="ballot-choice-"]'))return;const index=Number(input.name.slice('ballot-choice-'.length));if(!Number.isInteger(index)||!data.contests[index])return;if(input.value==='skip')selections.delete(index);else selections.set(index,Number(input.value));updateStatus()});
  document.getElementById('clear-ballot').addEventListener('click',()=>{selections.clear();root.querySelectorAll('input[type="radio"]').forEach(input=>input.checked=false);updateStatus()});
  document.getElementById('mobile-print-ballot').addEventListener('click',()=>document.getElementById('print-ballot').click());
  document.getElementById('print-ballot').addEventListener('click',()=>{
   const old=document.getElementById('private-print-sheet');if(old)old.remove();
   const sheet=document.createElement('section');sheet.id='private-print-sheet';sheet.setAttribute('aria-label','Private voting-day reference');
   const heading=document.createElement('h1');heading.textContent='My voting-day reference';sheet.appendChild(heading);
   const note=document.createElement('p');note.textContent='November 3, 2026 · Personal reference only. NOT an official ballot. Verify your exact ballot at mvp.sos.ga.gov. Choices are not saved or sent by this page.';sheet.appendChild(note);
   for(const scope of groups){const group=document.createElement('section');group.className='print-ballot-group';const groupHeading=document.createElement('h2');groupHeading.textContent=scope;group.appendChild(groupHeading);for(const [index,contest] of data.contests.map((item,itemIndex)=>[itemIndex,item]).filter(([,item])=>item.scope===scope)){const race=document.createElement('div');race.className='print-ballot-race';const title=document.createElement('h3');title.textContent=contest.office;race.appendChild(title);const instruction=document.createElement('small');instruction.textContent='Vote for one';race.appendChild(instruction);for(const [candidateIndex,candidate] of contest.candidates.entries()){const option=document.createElement('p');option.className='print-ballot-option';option.textContent=(selections.get(index)===candidateIndex?'☒ ':'☐ ')+candidate.name+' ('+candidate.party+')';race.appendChild(option)}group.appendChild(race)}sheet.appendChild(group)}
   document.body.appendChild(sheet);window.print();
   const cleanup=()=>{sheet.remove();window.removeEventListener('afterprint',cleanup)};window.addEventListener('afterprint',cleanup,{once:true});
  });
 }catch(error){root.textContent='The preliminary ballot could not be loaded. Use Georgia My Voter Page for your official ballot.';document.getElementById('print-ballot').disabled=true}
})();
