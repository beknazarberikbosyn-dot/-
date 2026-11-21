// ================= JOURNAL & TOUCH CONTROLS =================
function el(tag,props,...kids){const e=document.createElement(tag);if(props)for(const k in props){if(k==='style')e.style.cssText=props[k];else if(k==='html')e.innerHTML=props[k];else e[k]=props[k];}for(const k of kids)if(k)e.append(k);return e;}
// the lockpick minigame shares the #puz panel: Esc / the button only close it
function closePuzzle(){if(LP.on)lpClose(false);}
$('pzX').onclick=closePuzzle;
function renderJournal(){const j=$('jbody');j.innerHTML='';j.append(el('p',{html:'<b>Цель:</b> '+S.obj}));
  if(S.notes.length){const n=el('div',{className:'lore'},el('b',{textContent:'Заметки к выпуску',style:'font-size:20px'}));S.notes.forEach(t=>n.append(el('div',{className:'hand',html:'— '+t})));j.append(n);}
  else j.append(el('p',{className:'hand',html:'<i>Записей пока нет. Что бы ни происходило в этой деревне — ответы где-то рядом.</i>'}));
  const eg=EGGS.filter(e=>S.eggs[e.id]);j.append(el('p',{className:'lore',html:'<b>Находки ('+eg.length+' / '+EGGS.length+'):</b> '+(eg.map(e=>e.t).join(', ')||'—')}));
  j.append(el('p',{style:'font-size:16px',html:'<b>Памятка:</b> жителей можно бить (ЛКМ, ЛКМ, затем F — нокаут; ПКМ вовремя — парирование). От культистов в робах — только бежать: поймают — принесут в жертву. Враги медленнее вас: оторвитесь подальше или скройтесь из виду на пару секунд — и вас потеряют. Пригнувшись (C) за ящиками, бочками и лодками, вы невидимы. Раны понемногу затягиваются, если какое-то время не попадаться.'}));}

// ================= TOUCH CONTROLS (phones / tablets) =================
(function(){const touch=('ontouchstart' in window)||navigator.maxTouchPoints>0||matchMedia('(pointer:coarse)').matches;if(!touch)return;
  document.body.classList.add('touch');document.body.style.touchAction='none';const T=$('touch'),J=$('joy'),knob=J.firstChild;
  // show the pad only while the hero can be controlled
  setInterval(()=>{T.classList.toggle('on',S.hud&&S.mode==='play'&&!S.pause);},150);
  let jid=null,cx=0,cy=0;const R_=60;
  const mv=(x,y)=>{let dx=x-cx,dy=y-cy;const d=hypot(dx,dy);if(d>R_){dx*=R_/d;dy*=R_/d;}knob.style.transform=`translate(${dx}px,${dy}px)`;TJ.x=dx/R_;TJ.y=dy/R_;};
  J.addEventListener('touchstart',e=>{e.preventDefault();auInit();const t=e.changedTouches[0];jid=t.identifier;const r=J.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;TJ.on=true;mv(t.clientX,t.clientY);},{passive:false});
  J.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches)if(t.identifier===jid)mv(t.clientX,t.clientY);},{passive:false});
  const end=e=>{for(const t of e.changedTouches)if(t.identifier===jid){jid=null;TJ.on=false;TJ.x=TJ.y=0;knob.style.transform='';}};J.addEventListener('touchend',end);J.addEventListener('touchcancel',end);
  for(const b of document.querySelectorAll('#tbtn b,#tbtn2 b')){const k=b.dataset.k;
    b.addEventListener('touchstart',e=>{e.preventDefault();auInit();if(b.dataset.t){if(k==='KeyC'){onKey('KeyC');}else{K[k]=K[k]?0:1;}b.classList.toggle('on',k==='KeyC'?S.crouch:!!K[k]);return;}
      if(subAdvance())return;K[k]=1;onKey(k);b.classList.add('on');},{passive:false});
    const up=e=>{e.preventDefault();if(b.dataset.t)return;K[k]=0;b.classList.remove('on');};b.addEventListener('touchend',up);b.addEventListener('touchcancel',up);}
  // tap anywhere else: advance subtitles; tap the "E" prompt to interact
  let lid=null,lx=0,ly=0;cv.addEventListener('touchstart',e=>{subAdvance();const t=e.changedTouches[0];lid=t.identifier;lx=t.clientX;ly=t.clientY;},{passive:true});
  cv.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===lid){if(S.mode==='play'&&!S.pause&&!S.camFn){P.rot-=(t.clientX-lx)*.006*S.sens;CAM.pitch=clamp(CAM.pitch-(t.clientY-ly)*.005*S.sens,-1.25,1.2);}lx=t.clientX;ly=t.clientY;}},{passive:true});
  cv.addEventListener('touchend',e=>{for(const t of e.changedTouches)if(t.identifier===lid)lid=null;},{passive:true});$('sub').addEventListener('touchstart',e=>{e.preventDefault();subAdvance();},{passive:false});
  $('prompt').addEventListener('touchstart',e=>{e.preventDefault();onKey('KeyE');},{passive:false});
  // finale: drag to look around
  addEventListener('touchmove',e=>{if(S.mode!=='finale')return;const t=e.touches[0];FIN.mx=t.clientX/innerWidth*2-1;FIN.my=t.clientY/innerHeight*2-1;},{passive:true});
  $('ntX').addEventListener('touchend',e=>{e.preventDefault();closeNote();});
})();
