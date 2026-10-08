// All selections remain in page memory. Never write them to browser storage or a server.
(async()=>{
 const root=document.getElementById('preliminary-ballot');if(!root)return;
 const selections=new Map();
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const status=document.getElementById('ballot-selection-status');
 const progress=document.getElementById('ballot-progress-text');const progressTotal=document.getElementById('ballot-progress-total');const mobileCount=document.getElementById('mobile-ballot-count');
 const updateStatus=()=>{const count=selections.size;status.textContent='Choices are temporary and never saved.';progress.textContent=count+' race'+(count===1?'':'s')+' selected';mobileCount.textContent=count+' selected';};
 try{
  const response=await fetch('data/ballot-2026.json',{cache:'no-store'});if(!response.ok)throw Error('Ballot preview unavailable');
  const data=await response.json();const groups=['Federal','Statewide','District-dependent'];
  root.innerHTML=groups.map(scope=>{const rows=data.contests.map((c,i)=>({...c,index:i})).filter(c=>c.scope===scope);return '<section class="ballot-group"><h3>'+esc(scope==='District-dependent'?'District-dependent — verify your address':scope)+'</h3><div class="ballot-list">'+rows.map(c=>'<article class="ballot-row"><div class="ballot-race-title"><h4>'+esc(c.office)+'</h4><small>'+esc(c.scope)+'</small></div><fieldset class="ballot-candidates" aria-label="Your private notes for '+esc(c.office)+'"><legend class="visually-hidden">Private choice for '+esc(c.office)+'</legend>'+c.candidates.map((p,i)=>'<label class="ballot-option"><input type="radio" name="ballot-choice-'+c.index+'" value="'+i+'"><span><strong>'+esc(p.name)+'</strong><small>'+esc(p.party)+'</small></span></label>').join('')+'<label class="ballot-option ballot-undecided"><input type="radio" name="ballot-choice-'+c.index+'" value="skip"><span><strong>Undecided</strong></span></label></fieldset><div class="ballot-row-actions"><a href="'+esc(data.sources[c.source].url)+'" target="_blank" rel="noopener noreferrer">Check source ↗</a></div></article>').join('')+'</div></section>'}).join('');
  document.getElementById('preliminary-count').textContent=data.contests.length+' reported races';progressTotal.textContent='of '+data.contests.length+' reported races';document.getElementById('ballot-mobile-bar').hidden=false;updateStatus();
  root.addEventListener('change',event=>{const input=event.target;if(!input.matches('input[type="radio"][name^="ballot-choice-"]'))return;const index=Number(input.name.slice('ballot-choice-'.length));if(!Number.isInteger(index)||!data.contests[index])return;if(input.value==='skip')selections.delete(index);else selections.set(index,Number(input.value));updateStatus()});
  document.getElementById('clear-ballot').addEventListener('click',()=>{selections.clear();root.querySelectorAll('input[type="radio"]').forEach(input=>input.checked=false);updateStatus()});
  document.getElementById('mobile-print-ballot').addEventListener('click',()=>document.getElementById('print-ballot').click());
  document.getElementById('print-ballot').addEventListener('click',()=>{
   // Only DOM text is printed; no network calls, generated PDFs, URLs, or persisted files.
   const old=document.getElementById('private-print-sheet');if(old)old.remove();
   const sheet=document.createElement('section');sheet.id='private-print-sheet';sheet.setAttribute('aria-label','Private voting-day reference');
   const heading=document.createElement('h1');heading.textContent='My voting-day reference';sheet.appendChild(heading);
   const note=document.createElement('p');note.textContent='November 3, 2026 · Personal notes only. NOT an official ballot. Verify your precinct ballot and candidates at mvp.sos.ga.gov. This page does not record or transmit your selections.';sheet.appendChild(note);
   if(!selections.size){const p=document.createElement('p');p.textContent='No choices selected.';sheet.appendChild(p)}
   for(const [index,choice] of [...selections].sort((a,b)=>a[0]-b[0])){const contest=data.contests[index];const candidate=contest?.candidates[choice];if(!candidate)continue;const row=document.createElement('p');const label=document.createElement('strong');label.textContent=contest.office+': ';row.appendChild(label);row.appendChild(document.createTextNode(candidate.name+' ('+candidate.party+')'));sheet.appendChild(row)}
   document.body.appendChild(sheet);window.print();
   // Remove the printable DOM after the browser's print flow; original selections remain in volatile memory.
   const cleanup=()=>{sheet.remove();window.removeEventListener('afterprint',cleanup)};window.addEventListener('afterprint',cleanup,{once:true});
  });
 }catch(err){root.textContent='The preliminary ballot could not be loaded. Use Georgia My Voter Page for your official ballot.';document.getElementById('print-ballot').disabled=true}
})();
