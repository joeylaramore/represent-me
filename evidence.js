// Evidence is editorially curated, cited, and never inferred from party or office.
(async()=>{
 const root=document.getElementById('preliminary-ballot');if(!root)return;
 const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
 let evidence=[];
 try{const res=await fetch('data/candidate-evidence-2026.json',{cache:'no-store'});if(!res.ok)throw Error('unavailable');const json=await res.json();evidence=Array.isArray(json.candidates)?json.candidates:[]}catch{evidence=[]}
 const render=(candidate)=>{
  const sections=Array.isArray(candidate?.claims)?candidate.claims:[];
  if(!sections.length)return '<p class="evidence-empty">No verified position or voting record published yet. This does not mean the candidate has no position or record.</p>';
  return sections.map(claim=>{
   const sources=Array.isArray(claim.sources)?claim.sources.filter(s=>s&&/^https:\/\//.test(s.url)&&s.publisher&&s.title):[];
   if(!sources.length||!claim.summary||!claim.type||!claim.topic||!claim.date)return '';
   const sourceLinks=sources.map(s=>'<li><a href="'+escapeHtml(s.url)+'" target="_blank" rel="noopener noreferrer">Read '+escapeHtml(s.publisher)+' source text: '+escapeHtml(s.title)+' ↗</a></li>').join('');
   return '<article class="evidence-claim"><p class="evidence-meta">'+escapeHtml(claim.topic)+' · '+escapeHtml(claim.type)+' · '+escapeHtml(claim.date)+'</p><p class="evidence-summary">'+escapeHtml(claim.summary)+'</p><details><summary>Read actual source text ('+sources.length+')</summary><ul>'+sourceLinks+'</ul></details>'+(sources.length<2?'<small>One source available; independent corroboration pending.</small>':'')+'</article>';
  }).join('')||'<p class="evidence-empty">No publishable verified claims yet.</p>';
 };
 const enhance=()=>{
  root.querySelectorAll('.ballot-row').forEach((row,index)=>{
   if(row.querySelector('.candidate-evidence'))return;
   const office=row.querySelector('h4')?.textContent||'';
   const names=[...row.querySelectorAll('.ballot-option:not(.ballot-undecided) strong')].map(el=>el.textContent);
   const panel=document.createElement('details');panel.className='candidate-evidence';
   const title=document.createElement('summary');title.textContent='Votes & positions — read the source text';panel.appendChild(title);
   const content=document.createElement('div');content.className='evidence-candidates';
   for(const name of names){const item=document.createElement('section');const heading=document.createElement('h5');heading.textContent=name;item.appendChild(heading);const match=evidence.find(c=>c.office===office&&c.name===name);const body=document.createElement('div');body.innerHTML=render(match);item.appendChild(body);content.appendChild(item)}
   const foot=document.createElement('p');foot.className='evidence-disclaimer';foot.textContent='Evidence is dated and sourced. A recorded vote does not establish motive. Missing information is not a negative assessment. Candidate roster remains preliminary.';content.appendChild(foot);panel.appendChild(content);row.appendChild(panel);
  });
 };
 new MutationObserver(()=>{if(root.querySelector('.ballot-row:not(:has(.candidate-evidence))'))enhance()}).observe(root,{childList:true,subtree:true});enhance();
})();
