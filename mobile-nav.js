(()=>{
 const nav=document.querySelector('.mobile-nav'),main=document.querySelector('main');if(!nav||!main)return;
 const locationReady=()=>{try{return localStorage.getItem('represent-me-location-ready-v3')==='true'&&Boolean(localStorage.getItem('represent-me-location-state-v3'))}catch{return false}};
 const pages={
  ballot:['#election','#location-tools','.notice','#contests','#ballot-mobile-bar'],
  explore:['#explore','#vote-plan'],
  issues:['.questionnaire-promo','#beliefs','#value-match'],
  compare:['#representatives','#compare','#contests'],
  sources:['#sources','#vote-plan']
 };
 const units=[...main.children],originalOrder=[...main.children],footer=document.querySelector('body > footer');
 const viewName=Object.fromEntries(Object.entries(pages).map(([k,v])=>[k,k[0].toUpperCase()+k.slice(1)]));
 function setView(view,{push=false,scroll=push}={}){
  const selectors=pages[view];if(!selectors)return;
  const visible=selectors.filter(selector=>view!=='ballot'||locationReady()||!['.notice','#contests','#ballot-mobile-bar'].includes(selector)).map(selector=>main.querySelector(selector)).filter(Boolean);
  for(const el of units)el.hidden=!visible.includes(el);
  for(const el of visible)main.appendChild(el);
  if(footer)footer.hidden=true;
  nav.querySelectorAll('[data-view]').forEach(link=>{if(link.dataset.view===view)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')});
  document.body.dataset.mobileView=view;document.title='Represent Me | '+viewName[view];
  if(push){const url=new URL(location.href);url.searchParams.set('view',view);history.pushState({view},'',url)}
  if(scroll)window.scrollTo({top:0,behavior:'instant'});
 }
 function showHome({push=false,scroll=push}={}){setView('ballot',{push:false,scroll:false});if(push){history.pushState({},'',location.pathname)}if(scroll)window.scrollTo({top:0,behavior:'instant'})}
 document.addEventListener('click',event=>{const link=event.target.closest('[data-view]');if(!link)return;event.preventDefault();setView(link.dataset.view,{push:true})});
 document.querySelector('.brand')?.addEventListener('click',event=>{if(document.body.dataset.mobileView){event.preventDefault();showHome({push:true})}});
 window.addEventListener('popstate',()=>{const view=new URL(location.href).searchParams.get('view');if(pages[view])setView(view,{scroll:false});else showHome({scroll:false})});
 window.addEventListener('represent-me-location-ready',()=>{if(document.body.dataset.mobileView==='ballot')setView('ballot',{scroll:false})});
 window.addEventListener('location-cleared',()=>{if(document.body.dataset.mobileView==='ballot')setView('ballot',{scroll:false})});
 const initial=new URL(location.href).searchParams.get('view');const mainView=!initial||initial==='ballot';
 const scrollPrefix='represent-me-scroll:';
 const saveScroll=()=>{if(mainView)return;try{sessionStorage.setItem(scrollPrefix+location.pathname+location.search,String(window.scrollY))}catch{}};
 window.addEventListener('scroll',saveScroll,{passive:true});
 window.addEventListener('pagehide',saveScroll);
 function restoreSavedScroll(y){
  let userMoved=false;const stop=()=>{userMoved=true;['wheel','touchstart','pointerdown','keydown'].forEach(type=>window.removeEventListener(type,stop))};
  ['wheel','touchstart','pointerdown','keydown'].forEach(type=>window.addEventListener(type,stop,{once:true,passive:true}));
  const started=performance.now();
  const restore=()=>{if(userMoved)return;window.scrollTo({top:y,behavior:'instant'});if(performance.now()-started<1800)requestAnimationFrame(restore);else ['wheel','touchstart','pointerdown','keydown'].forEach(type=>window.removeEventListener(type,stop))};
  requestAnimationFrame(restore);
 }
 const savedScroll=mainView?null:sessionStorage.getItem(scrollPrefix+location.pathname+location.search);
 if(mainView){history.scrollRestoration='manual';window.scrollTo({top:0,behavior:'instant'})}
 if(pages[initial])setView(initial,{scroll:false});
 else setView('ballot',{scroll:false});
 if(mainView)window.scrollTo({top:0,behavior:'instant'});
 if(savedScroll!==null&&Number.isFinite(Number(savedScroll))){
  history.scrollRestoration='manual';
  const restore=()=>restoreSavedScroll(Number(savedScroll));
  if(document.readyState==='complete')restore();else window.addEventListener('load',restore,{once:true});
 }
})();
