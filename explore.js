// No address storage, geocoding, or requests containing user-entered location.
(()=>{
 const form=document.getElementById('location-form');const address=document.getElementById('voting-address');const status=document.getElementById('location-status');
 form.addEventListener('submit',e=>{e.preventDefault();const value=address.value.trim();status.textContent=value?'For your privacy, the address you typed is not sent or saved here. Enter it directly in Georgia My Voter Page to see your certified ballot and polling place.':'Use Georgia My Voter Page to verify your official ballot and polling place.';address.value='';window.open('https://mvp.sos.ga.gov/','_blank','noopener,noreferrer')});
 document.getElementById('clear-location').addEventListener('click',()=>{address.value='';status.textContent='Location entry cleared. No address was saved.'});
 const root=document.getElementById('explore-results'),filter=document.getElementById('explore-scope'),search=document.getElementById('explore-search');
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&quot;',"'":'&#39;'}[c]));
 fetch('data/ballot-2026.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('unavailable');return r.json()}).then(data=>{
 const render=()=>{const term=search.value.trim().toLocaleLowerCase();const matches=data.contests.filter(c=>(filter.value==='all'||c.scope===filter.value)&&(!term||(c.office+' '+c.scope+' '+c.candidates.map(p=>p.name).join(' ')).toLocaleLowerCase().includes(term)));
 root.innerHTML=matches.length?'<p class="source-note">'+matches.length+' reported races · not an official personalized ballot</p><div class="explore-list">'+matches.map(c=>'<article class="explore-card"><p class="eyebrow">'+esc(c.scope)+'</p><h3>'+esc(c.office)+'</h3><p>'+c.candidates.map(p=>esc(p.name)+' ('+esc(p.party)+')').join(' · ')+'</p><a href="#contests">See preliminary ballot &amp; research ↓</a></article>').join('')+'</div>':'<p>No reported races match your search. This dataset is limited to the current Georgia research preview.</p>'};filter.addEventListener('change',render);search.addEventListener('input',render);render();
 }).catch(()=>root.textContent='Election research data is unavailable. Check official election resources for current candidates.');
})();
