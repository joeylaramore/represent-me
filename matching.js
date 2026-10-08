// Candidate alignment is explicit, reviewed evidence only. Never infer a match from party, office, or prose.
(async()=>{
 const section=document.getElementById('value-match');const root=document.getElementById('value-match-content');if(!section||!root)return;
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const render=async answers=>{
  section.hidden=false;root.innerHTML='<p class="source-note">Loading reviewed candidate evidence…</p>';
  let json;try{const res=await fetch('data/candidate-evidence-2026.json',{cache:'no-store'});if(!res.ok)throw Error();json=await res.json()}catch{root.innerHTML='<p class="evidence-empty">Candidate evidence is unavailable. No comparison was made.</p>';return}
  const candidates=Array.isArray(json.candidates)?json.candidates:[];const questions=window.representMeQuestions||[];
  if(!candidates.length){root.innerHTML='<div class="match-empty"><strong>No candidate alignment published yet.</strong><p>That is intentional: the system will not infer a candidate’s values from party, silence, or a headline. Reviewed source-backed claims will appear here as alignment, tension, or insufficient evidence.</p></div>';return}
  root.innerHTML=candidates.map(candidate=>{const claims=Array.isArray(candidate.claims)?candidate.claims:[];const rows=questions.map((q,i)=>{const claim=claims.find(c=>c.topic===q.topic&&['supports','conflicts','mixed'].includes(c.alignment));if(!claim)return '<div class="match-row"><strong>'+esc(q.topic)+'</strong><span class="match-unknown">Insufficient evidence</span></div>';const label=claim.alignment==='supports'?'Potential alignment':claim.alignment==='conflicts'?'Potential tension':'Mixed or changing evidence';const source=Array.isArray(claim.sources)&&claim.sources[0];return '<div class="match-row"><strong>'+esc(q.topic)+'</strong><span class="match-'+esc(claim.alignment)+'">'+label+'</span><p>'+esc(claim.summary)+'</p>'+(source?'<a href="'+esc(source.url)+'" target="_blank" rel="noopener noreferrer">Read source text ↗</a>':'')+'</div>'}).join('');return '<article class="match-card"><h3>'+esc(candidate.name)+'</h3><p class="muted">'+esc(candidate.office||'Office not specified')+'</p>'+rows+'</article>'}).join('')+'<p class="source-note">Alignment labels are issue-specific, evidence-based, and not an endorsement or overall candidate score.</p>';
 };
 window.renderValueMatches=render;
 try{const saved=JSON.parse(localStorage.getItem('represent-me-beliefs')||'null');if(saved&&typeof saved==='object')render(saved)}catch{}
})();
