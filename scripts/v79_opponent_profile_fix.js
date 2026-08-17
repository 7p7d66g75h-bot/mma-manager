(function(){
'use strict';
if(window.__MM_V79_OPP_PROFILE)return; window.__MM_V79_OPP_PROFILE=true;

function state(){try{return typeof s!=='undefined'?s:window.s}catch(e){return window.s}}
function allFighters(){
 const st=state(); if(!st)return [];
 const out=[]; const seen=new Set();
 function add(v){if(!Array.isArray(v))return; v.forEach(f=>{if(f&&typeof f==='object'&&!seen.has(f.id)){seen.add(f.id);out.push(f)}})}
 add(st.fighters); add(st.world); add(st.allFighters); add(st.roster); add(st.freeAgents);
 return out;
}
function currentProfileFighter(sheet){
 const st=state();
 // Prefer an explicitly remembered fighter from the organization flow.
 const candidates=[window.__MM_PROFILE_FIGHTER,st&&st.__profileFighter,st&&st.profileFighter,st&&st.selectedOpponent];
 for(const f of candidates)if(f&&typeof f==='object')return f;
 const text=(sheet?.innerText||'').replace(/\s+/g,' ').trim();
 if(!text)return null;
 const fs=allFighters();
 // Match the longest fighter name present in the profile sheet.
 let best=null,bestLen=0;
 for(const f of fs){const n=String(f.name||'').trim();if(n.length>bestLen&&n&&text.includes(n)){best=f;bestLen=n.length}}
 return best;
}
function hasOpponentProfile(sheet){
 const t=(sheet?.innerText||'').toLowerCase();
 return t.includes('вести дела') || t.includes('переговор') || t.includes('отказаться');
}
function close(){try{if(typeof closeModal==='function')closeModal();}catch(e){} try{document.querySelector('.modal.open')?.classList.remove('open')}catch(e){}}
function goBack(){
 close();
 try{if(typeof matchmake==='function'){matchmake();return}}catch(e){}
 try{if(typeof render==='function')render()}catch(e){}
}
function negotiate(f){
 if(!f)return false;
 window.__MM_PROFILE_FIGHTER=f;
 try{if(typeof window.negotiate==='function'){window.negotiate(f);return true}}catch(e){console.error(e)}
 try{if(typeof negotiate==='function'){negotiate(f);return true}}catch(e){console.error(e)}
 return false;
}

// Capture-phase interception is intentional: it runs before broken/obsolete
// inline handlers attached by the old organization module.
document.addEventListener('click',function(e){
 const b=e.target&&e.target.closest?e.target.closest('button'):null;
 if(!b)return;
 const sheet=b.closest('.sheet');
 if(!sheet || !hasOpponentProfile(sheet))return;
 const label=(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
 if(label==='вести дела' || label.includes('вести дела')){
   e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
   const f=currentProfileFighter(sheet);
   if(!negotiate(f)){
     try{window.dispatchEvent(new CustomEvent('mma:opponent-negotiate',{detail:{fighter:f}}))}catch(_){ }
   }
   return;
 }
 if(label==='назад' || label==='закрыть'){
   e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
   goBack();
 }
},true);

// Remember fighters when the organization module opens a profile. This wraps
// the public profile function only as a recorder; original behavior remains.
try{
 const p=window.profile;
 if(typeof p==='function'&&!p.__v79wrapped){
   const w=function(f,back){window.__MM_PROFILE_FIGHTER=f;return p.apply(this,arguments)};
   w.__v79wrapped=true; window.profile=w;
 }
}catch(e){}
})();
