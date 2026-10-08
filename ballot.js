(async()=>{
 const root=document.getElementById('preliminary-ballot');if(!root)return;
 try{
  const response=await fetch('data/ballot-2026.json',{cache:'no-store'});if(!response.ok)throw Error('Ballot preview unavailable');
  const data=await response.json();const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const groups=['Federal','Statewide','District-dependent'];
  root.innerHTML=groups.map(scope=>{const rows=data.contests.filter(c=>c.scope===scope);return '<section class="ballot-group"><h3>'+esc(scope==='District-dependent'?'District-dependent — verify your address':scope)+'</h3><div class="ballot-list">'+rows.map(c=>'<article class="ballot-row"><div><small>'+esc(c.scope)+'</small><h4>'+esc(c.office)+'</h4></div><div class="ballot-candidates">'+c.candidates.map(p=>'<div><strong>'+esc(p.name)+'</strong><span>'+esc(p.party)+'</span></div>').join('')+'</div><a href="'+esc(data.sources[c.source].url)+'" target="_blank" rel="noopener noreferrer">Roster source ↗</a></article>').join('')+'</div></section>'}).join('');
  document.getElementById('preliminary-count').textContent=data.contests.length+' reported contests';
 }catch(err){root.textContent='The preliminary ballot could not be loaded. Use Georgia My Voter Page for your official ballot.';}
})();
