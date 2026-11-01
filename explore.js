// Location is used only to guide the voter to Georgia's official personalized ballot.
(()=>{
 const form=document.getElementById('location-form');const address=document.getElementById('voting-address');const status=document.getElementById('location-status');const useLocation=document.getElementById('use-location');
 const officialUrl='https://mvp.sos.ga.gov/';
 const markLocationReady=()=>{try{localStorage.setItem('represent-me-location-ready-v2','true')}catch{};window.dispatchEvent(new Event('represent-me-location-ready'))};
 const openOfficial=message=>{markLocationReady();status.textContent=message;window.open(officialUrl,'_blank','noopener,noreferrer')};
 form.addEventListener('submit',e=>{e.preventDefault();const value=address.value.trim();if(!value){status.textContent='Enter an address or ZIP code, or use your location.';address.focus();return}openOfficial('Opening Georgia’s official ballot lookup. Your address stays on this page and was not saved.');});
 useLocation.addEventListener('click',()=>{if(!navigator.geolocation){status.textContent='Location sharing is not available. Enter your address or ZIP code.';address.focus();return}status.textContent='Requesting your location…';navigator.geolocation.getCurrentPosition(()=>{markLocationReady();status.textContent='Location found. Confirm your address on Georgia’s official site.';window.location.assign(officialUrl)},()=>{status.textContent='Location was not shared. Enter your address or ZIP code instead.';address.focus()},{enableHighAccuracy:false,maximumAge:300000,timeout:8000})});
 document.getElementById('clear-location').addEventListener('click',()=>{address.value='';status.textContent='Location entry cleared. Nothing was saved.'});
 const root=document.getElementById('explore-results'),filter=document.getElementById('explore-scope'),search=document.getElementById('explore-search');
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&quot;',"'":'&#39;'}[c]));
 fetch('data/ballot-2026.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('unavailable');return r.json()}).then(data=>{
 const render=()=>{const term=search.value.trim().toLocaleLowerCase();const matches=data.contests.filter(c=>(filter.value==='all'||c.scope===filter.value)&&(!term||(c.office+' '+c.scope+' '+c.candidates.map(p=>p.name).join(' ')).toLocaleLowerCase().includes(term)));
 root.innerHTML=matches.length?'<p class="source-note">'+matches.length+' reported races · not an official personalized ballot</p><div class="explore-list">'+matches.map(c=>'<article class="explore-card"><p class="eyebrow">'+esc(c.scope)+'</p><h3>'+esc(c.office)+'</h3><p>'+c.candidates.map(p=>esc(p.name)+' ('+esc(p.party)+')').join(' · ')+'</p><a href="?view=compare#contests">See preliminary ballot &amp; research ↓</a></article>').join('')+'</div>':'<p>No reported races match your search. This dataset is limited to the current Georgia research preview.</p>'};filter.addEventListener('change',render);search.addEventListener('input',render);render();
 }).catch(()=>root.textContent='Election research data is unavailable. Check official election resources for current candidates.');
})();
