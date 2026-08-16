(function(){'use strict';
const STYLE_ID='MMA_MANAGER_V73_BUGFIX_STYLE';
if(document.getElementById(STYLE_ID))return;
const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
#nextRoundBtn.v73-hidden{display:none!important}
#nextRoundBtn.v73-locked{pointer-events:none!important;opacity:.38!important}
`;
document.head.appendChild(style);

// Profile: restore native iOS momentum scrolling. Do not touch scrollTop while the user is dragging.
function profileSheet(){const sh=document.getElementById('sheet');if(!sh)return null;return /Последние бои|Статистика побед|Контракт/.test(sh.textContent||'')?sh:null}
function fixProfile(){const sh=profileSheet();if(!sh)return;sh.style.webkitOverflowScrolling='touch';sh.style.overflowY='auto';sh.style.touchAction='pan-y';}
new MutationObserver(fixProfile).observe(document.body,{childList:true,subtree:true,characterData:true});
document.addEventListener('touchstart',fixProfile,{passive:true,capture:true});

// Next round: the button is only usable after the current round has actually finished.
let roundLocked=false;
let lastRoundLabel='';
function btn(){return document.getElementById('nextRoundBtn')}
function clockDone(){
 const els=[...document.querySelectorAll('.clock,.round-action,[data-round-clock]')];
 const txt=els.map(e=>(e.textContent||'').trim()).join(' ');
 return /(?:^|\s)0{1,2}:0{1,2}(?:\s|$)/.test(txt)||/раунд\s*(?:заверш|окончен|закончен)/i.test(txt);
}
function isFightScreen(){return !!document.querySelector('.fightbox,.fight-canvas-wrap,#nextRoundBtn')}
function enforce(){
 const b=btn();if(!b||!isFightScreen())return;
 if(roundLocked){b.classList.add('v73-hidden');b.disabled=true;return}
 if(clockDone()){b.classList.remove('v73-hidden');b.disabled=false;}
 else{b.classList.add('v73-hidden');b.disabled=true;}
}
function lockAfterClick(){
 roundLocked=true;
 const b=btn();if(b){b.classList.add('v73-hidden');b.disabled=true;}
 setTimeout(()=>{roundLocked=false;enforce()},100);
}
document.addEventListener('click',function(e){const b=e.target.closest?.('#nextRoundBtn');if(!b)return;if(roundLocked||b.disabled||b.classList.contains('v73-hidden')){e.preventDefault();e.stopImmediatePropagation();return}lockAfterClick()},true);
new MutationObserver(enforce).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['style','class','disabled']});
setInterval(enforce,100);
})();
