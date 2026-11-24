// ================= ACT 3: back to the laboratory, Father Paul's betrayal, the siege of the doctor's house, the old chapel =================
// The cave → walk back with the doctor (he tells what the serum really does and what he agreed with the Old One) → three robed
// brothers stop them by the old chapel, Father Paul comes out and declares Bernson a traitor (he has read the diary from the safe)
// → flight to the doctor's house → the chair under the door handle, the rifle, two minutes of brothers climbing in at the windows
// → Paul holds Matthew hostage → the serum is finished, they come out and are tied → the walk to the old chapel → on their knees:
// Paul's truth (two gifted ones; Bernson's mind was his own, Cthulhu only gave the blood), the lunge and the revolver, the needle
// in Matthew's neck. Cut to the credits.
const ACT3ST=['return','chase','defense','escort','chapelend'];STAGES.push(...ACT3ST);
const A3={ph:null};
const ENC=[[12.6,-2.2],[13.6,-.8],[11.4,-1]].map(([x,z])=>mkE('c',x,z,[[x,z]],{stay:true,sp:3.9}));
const ESCN=[NPC2({}),NPC2({})];   // the two brothers who escort the prisoners
// ---------------------------------------------------------------- 1. the cave → the walk back
async function act3Start(){A3.ph='cave';S.inside='cave';P.lie=false;Object.assign(AD,{show:true,x:217.8,z:-9.2,pose:'stand',rot:atan2(P.x-217.8,P.z+9.2)});
  await say('Доктор Бернсон','Теперь — в лабораторию. Закончить сыворотку можно только там. Идёмте ко мне, мистер Крейн. И держитесь рядом.',VO.doc);
  setObj('Вернитесь с доктором Бернсоном в его дом на Холмовой улице.');S.mark=[217,10.2,'cave'];$('fade').style.transitionDuration='900ms';$('fade').style.opacity=0;S.mode='play';}
addInter(217,10.4,1.6,'Выйти из пещеры',async()=>{S.mark=null;await leaveRoom(XD.cave);walkStart();},()=>S.inside==='cave'&&A3.ph==='cave');
async function walkTalk(){await wait(2.5);const d=VO.doc,h=VO.hero;
  for(const[w,t]of[[HERO,'Доктор… скажите честно. Вы правда хотите вколоть это всем? Женщинам, детям — тем, кто ни в чём не виноват?'],
    ['Доктор Бернсон','Вы так ничего и не поняли. Сыворотка не делает из человека высшее существо. Ни памяти, ни разума — только тварь. Пустая, голодная тварь.'],
    ['Доктор Бернсон','Те, что лежат у меня в лаборатории, — не неудачные опыты. Это и есть результат.'],
    [HERO,'Тогда зачем?!'],
    ['Доктор Бернсон','Затем, что я договорился с Ним. Чудовищами станут только братья — те, кто будет стоять у алтаря в последнем обряде. Все до единого.'],
    ['Доктор Бернсон','А моя кровь — Его дар — позволит мне потянуть их за собой. В воду. На дно. Навсегда.'],
    ['Доктор Бернсон','И тогда Грейхейвен впервые за сто лет станет просто городом. Люди будут свободны.'],
    [HERO,'(тихо) А вы?'],['Доктор Бернсон','А я пойду первым.']]){if(A3.ph!=='walk')return;await say(w,t,w===HERO?h:d);await wait(.5);}}
// the doctor leads along the road past the old chapel; the hero has to stay close behind him (an invisible leash)
const WALK_PATH=[[50.6,-38],[48.4,-30],[47.2,-20],[46.2,-12.4],[42.4,-8.6],[34.6,-8.4]];
function walkStart(){A3.ph='walk';A3.wi=0;S.escort=true;S.cp=[50,-41];S.mark=null;Object.assign(AD,{show:true,x:51.2,z:-40.6,walk:null,pose:'walk'});
  setObj('Идите за доктором Бернсоном. Не отставайте и не отходите от него.');walkTalk();}
function walkLead(dt){const w=WALK_PATH[min(A3.wi,WALK_PATH.length-1)],dw=hypot(w[0]-AD.x,w[1]-AD.z),d=hypot(P.x-AD.x,P.z-AD.z);AD.mv=0;
  if(dw<.5&&A3.wi<WALK_PATH.length-1)A3.wi++;
  else if(dw>=.2&&d<4.6){const s=min(dw,1.9*dt);AD.x+=(w[0]-AD.x)/dw*s;AD.z+=(w[1]-AD.z)/dw*s;AD.mv=1;AD.ph+=dt*4.4;AD.rot=atan2(w[0]-AD.x,w[1]-AD.z);}
  else if(d>=4.6||dw<.2)faceTo(AD,atan2(P.x-AD.x,P.z-AD.z),dt,3);
  if(d>6.5){const k=6.5/d;P.x=AD.x+(P.x-AD.x)*k;P.z=AD.z+(P.z-AD.z)*k;A3.warn=(A3.warn||0)-dt;if(A3.warn<=0){A3.warn=3;toast('<b>Не отходите от доктора.</b> Без него вас схватят на первой же улице.',3);}}
  if(A3.wi>=WALK_PATH.length-1&&dw<.3&&d<4.5)encounter();}
function adFollow(dt){const d=hypot(P.x-AD.x,P.z-AD.z);if(d>2.4){const tx=P.x-sin(P.rot)*1.6+cos(P.rot)*1.1,tz=P.z-cos(P.rot)*1.6-sin(P.rot)*1.1;if(!goDir(AD,tx,tz,max(3.6,d*1.4),dt)&&d>9){AD.x=tx;AD.z=tz;}}else AD.rot=atan2(P.x-AD.x,P.z-AD.z);}
// ---------------------------------------------------------------- 2. the old chapel: the brothers, Father Paul, the quarrel, the flight
async function encounter(){A3.ph='enc';S.mode='talk';S.mark=null;const d=VO.doc,p=VO.paul,c=VO.cult,h=VO.hero;
  P.x=37;P.z=-8.4;AD.x=35.4;AD.z=-9.4;P.rot=-PI/2;AD.rot=-PI/2;
  const G=[[26.6,-5.4],[28.2,-4.6],[25.2,-4.8]];ENC.forEach((e,i)=>{e.x=e.hx=G[i][0];e.z=e.hz=G[i][1];e.rot=atan2(P.x-e.x,P.z-e.z);});A3.encShow=true;
  lookAt(27,1.5,-5);await wait(.6);
  await say('Брат в робе','Доктор Бернсон? Почему вы ходите с чужаком? Его ищет весь город.',c);
  lookAt(AD.x,1.6,AD.z);await say('Доктор Бернсон','Он нужен мне для последних опытов. Живым. А вы найдите мне ещё одного подопытного — к утру. Ступайте.',d);
  SFX.door();Object.assign(PAUL,{show:true,x:26,z:-12.3,rot:0,walk:[26.6,-10.4]});PAUL.sp=1.4;S.shake=.15;await wait(.5);lookAt(26,1.6,-12);await wait(1);
  await say('Отец Пол','Эдмунд? Вот так встреча. Ты ведёшь по улице того, кого мы ищем всю ночь. Объяснись.',p);
  await say('Доктор Бернсон','Пол, это не твоё дело. Он нужен мне, чтобы…',d);
  await say('Отец Пол','Довольно! *громко, на всю улицу* Братья! Слушайте меня! Бернсон — предатель. Отныне он наш враг!',{pitch:76,vol:.3});
  await say('Доктор Бернсон','Ты лжёшь, старый стервятник! Тридцать лет ты завидуешь мне — и наконец решился?!',{pitch:110,vol:.3});
  await say('Отец Пол','Я сорок лет служу Спящему, Эдмунд. Сорок. А ты — мальчишка, которого Он выловил из воды.',p);
  await say('Доктор Бернсон','Ты служишь только себе! Ты похитил этого человека, ты натравил его на меня, ты…',{pitch:110,vol:.3});
  await say('Отец Пол','*перебивает* Пусть братья узнают правду. В его доме есть доказательства: сыворотка — не спасение. Это отрава. Проклятие. Он хочет утопить вас всех — я прочёл это в его дневнике. Из его сейфа.',p);
  murmur();await say('Брат в робе','Утопить?.. Нас?..',c);
  lookAt(AD.x,1.6,AD.z);S.shake=.2;await say('Доктор Бернсон','*бледнеет* Из сейфа?.. Как ты… КАК ТЫ ЕГО ОТКРЫЛ?!',{pitch:120,vol:.32,dur:2.6});
  await say('Доктор Бернсон','*шёпотом* Крейн. Они ещё не опомнились. Бежим — ко мне в дом. СЕЙЧАС!',d);
  startChase();}
const CH_PATH=[[24,-8.4],[-20,-8.4],[-60,-8.4],[-110,-8.6],[-110,-20],[-110,-33.6]];
function startChase(){A3.ph='chase';A3.encShow=true;S.escort=false;S.cp=[34,-8.4];S.cpRoom=null;Object.assign(AD,{walk:null,path:null,ci:0});PAUL.show=false;
  A3.chaseT=S.t;for(const e of ENC){e.stay=false;e.show=true;e.active=false;e.state='patrol';e.aw=0;}
  setObj('Бегите к дому доктора на Холмовой улице! За вами гонятся культисты.');S.mark=[-110,-33.8,null];S.mode='play';SFX.alert();
  toast('<b>Бегите!</b> Доктор показывает дорогу. Не дайте братьям себя схватить.',5);}
function chaseTick(dt){if(S.t-A3.chaseT>2.4)for(const e of ENC)if(!e.active&&!e.stay){A3.encShow=false;e.active=true;e.hx=e.x;e.hz=e.z;e.state='chase';e.aw=1;e.ls=[P.x,P.z];}
  // the doctor runs ahead along the road, waits if the hero falls behind
  const w=CH_PATH[min(AD.ci,CH_PATH.length-1)],d=hypot(P.x-AD.x,P.z-AD.z),dw=hypot(w[0]-AD.x,w[1]-AD.z);AD.mv=0;
  if(dw<.8&&AD.ci<CH_PATH.length-1)AD.ci++;
  else if(dw>=.3&&(d<11||hypot(w[0]-P.x,w[1]-P.z)<dw)){const s=min(dw,5.2*dt);AD.x+=(w[0]-AD.x)/dw*s;AD.z+=(w[1]-AD.z)/dw*s;AD.mv=1;AD.ph+=dt*12;AD.rot=atan2(w[0]-AD.x,w[1]-AD.z);}
  else AD.rot=atan2(P.x-AD.x,P.z-AD.z);
  if(hypot(P.x+110,P.z+33.8)<3.2&&hypot(AD.x+110,AD.z+33.6)<4)houseIn();}
// ---------------------------------------------------------------- 3. the siege: the chair, the rifle, two minutes at the windows
const DWIN=[{x:261.2,z:-28.2,n:[0,-1]},{x:264.7,z:-41.8,n:[0,1]},{x:279.8,z:-31.6,n:[-1,0]},{x:258.2,z:-40.4,n:[1,0]}];   // clear of the stairs, the bookcase and the armchair
const DEF={on:false,t:0,next:2,cul:[],dur:120,adHp:100};const LABP=[[271.4,-36.9],[269.6,-37.4],[268.4,-31.1],[272.6,-38.4],[270.2,-36.2]];const RIF={cd:0,kick:0,flash:0};
for(const w of DWIN){const fr=PAL.woodD,side=w.n[0]!==0;   // frames and sills (the panes are drawn per frame: whole or broken)
  const bx=(dx,y,dz,sx,sy,sz)=>side?IG.bx(w.x+w.n[0]*.03,y,w.z+dx,sz,sy,sx,fr):IG.bx(w.x+dx,y,w.z+w.n[1]*.03,sx,sy,sz,fr);
  bx(0,.94,0,1.36,.08,.14);bx(0,2.3,0,1.36,.08,.14);bx(-.64,.94,0,.08,1.44,.14);bx(.64,.94,0,.08,1.44,.14);bx(0,.94,0,.06,1.4,.1);}
const M_pane=(()=>{const g=new Geo(0);g.bx(0,0,0,1.2,1.34,.02,H('#1c3038',.08));return mesh(g);})();
const M_hole=(()=>{const g=new Geo(0);g.bx(0,0,0,1.2,1.34,.02,H('#030405'));for(let i=0;i<7;i++){const a=i/7*6.28;g.at(mM(mT(cos(a)*.55,.67+sin(a)*.6,.02),mRz(a)),()=>g.bx(0,0,0,.18,.05,.01,H('#8aa0a4',.2)));}return mesh(g);})();
const M_rifle=(()=>{const g=new Geo(.01),wd=H('#5a3a22'),mt=H('#3a3c3e',.1);g.bx(0,-.09,-.3,.045,.11,.26,wd);g.bx(0,-.05,-.08,.042,.07,.26,wd);g.bx(0,-.04,.2,.036,.05,.32,wd);
  g.at(mM(mT(0,.0,-.12),mRx(PI/2)),()=>{g.cyl(0,0,0,.016,.016,.26,6,mt);g.cyl(0,.26,0,.011,.011,.62,6,mt);});g.bx(.03,-.005,-.09,.04,.012,.012,mt);g.bx(0,.02,.84,.008,.025,.012,mt);g.bx(0,-.06,-.04,.016,.05,.05,mt);return mesh(g);})();
const M_rev=(()=>{const g=new Geo(.01),mt=H('#2e3032',.15),wd=H('#4a2e1a');g.cyl(0,-.2,.02,.009,.009,.2,6,mt);g.cyl(0,-.06,.02,.022,.022,.05,6,mt);g.bx(0,-.03,-.04,.022,.05,.1,wd);g.bx(0,-.02,.0,.012,.03,.03,mt);return mesh(g);})();
const M_chair=modelMesh('chair')||(()=>{const g=new Geo(.02);g.bx(0,0,0,.45,.45,.45,PAL.wood);return mesh(g);})();
async function houseIn(){A3.ph='house';S.mode='talk';S.mark=null;for(const e of[...ENC])e.active=false;for(const e of EN)if(e.state==='chase'){e.state='search';e.st=2;}
  SFX.door();await fade(1,300);S.inside='doc';P.x=269;P.z=-29.4;P.rot=PI;Object.assign(AD,{x:268,z:-30.2,rot:PI,pose:'stand'});CAM.pitch=0;camSnap();await fade(0,300);
  P.rot=0;lookAt(269,.8,-28.2);await wait(.3);SFX.thud();A3.chair=true;S.shake=.2;
  await say(HERO,'Стул — под ручку. Долго не удержит.',VO.hero);
  AD.walk=[271.4,-29.4];lookAt(271.4,1.6,-29.4);await say('Доктор Бернсон','Сыворотка — в лаборатории, записи — наверху, в сейфе. Держите дверь!',VO.doc);
  await wait(1);AD.show=false;SFX.creak();await wait(1.2);
  noise(.4,{f:600,vol:.3});await say('Отец Пол','*за дверью* Эдмунд! Открой. Ты только делаешь хуже.',VO.paul);
  glassBreak();DEF.broken=[true,false,false,false];await wait(.5);lookAt(DWIN[0].x,1.4,DWIN[0].z);
  await say(HERO,'Окна! Они лезут в окна!',{pitch:140});
  Object.assign(AD,{show:true,x:271.6,z:-29.2,rot:atan2(P.x-271.6,P.z+29.2)});SFX.creak();lookAt(AD.x,1.6,AD.z);
  await say('Доктор Бернсон','Держите! Винтовка отца — из спальни. Заряжена. Стреляйте в каждого, кто полезет в окно.',VO.doc);
  await say('Доктор Бернсон','Мне нужно две минуты. Всего две минуты!',VO.doc);
  Object.assign(AD,{walk:[271.4,-36.6],pose:'work'});S.rifle=true;SFX.pick();defStart();}
function defStart(){Object.assign(DEF,{on:true,t:0,next:1.5,cul:[],adHp:100,lab:0,labT:0});AD.walk=LABP[0];AD.pose='work';DEF.broken=DEF.broken||[false,false,false,false];S.cp=[269,-31];S.cpRoom='doc';S.hp=100;
  setObj('Отстреливайтесь от культистов в окнах, пока доктор заканчивает сыворотку.');S.mode='play';
  toast((touchUI()?'«Удар»':'<span class="kb">ЛКМ</span>')+' — выстрел. Цельтесь в тех, кто лезет в окна, — и не дайте им добраться до доктора.',6);}
function defTick(dt){if(!DEF.on)return;DEF.t+=dt;RIF.cd-=dt;
  DEF.labT-=dt;if(!walking(AD)&&DEF.labT<=0){DEF.labT=3+Math.random()*3;DEF.lab=(DEF.lab+1+floor(Math.random()*(LABP.length-1)))%LABP.length;AD.walk=LABP[DEF.lab];AD.sp=1.5;}
  if(DEF.t>=DEF.dur){defEnd();return;}
  DEF.next-=dt;const alive=DEF.cul.filter(c=>c.st!=='dead').length;
  if(DEF.next<=0&&alive<5&&DEF.t<DEF.dur-4){const free=DWIN.map((w,i)=>i).filter(i=>!DEF.cul.some(c=>c.w===i&&c.st==='sill'));
    if(free.length){const i=free[floor(Math.random()*free.length)],w=DWIN[i];if(!DEF.broken[i]){DEF.broken[i]=true;glassBreak();}
      DEF.cul.push({w:i,st:'sill',t:0,x:w.x+w.n[0]*.3,z:w.z+w.n[1]*.3,y:.86,rot:atan2(w.n[0],w.n[1]),atk:0,dead:0,ph:rnd()*6});mumble(.8,62+Math.random()*20,false,.12,true);}
    DEF.next=lerp(5.2,2.1,DEF.t/DEF.dur)*(.75+Math.random()*.5);}
  for(const c of DEF.cul){const w=DWIN[c.w];
    if(c.st==='sill'){c.t+=dt;const k=min(1,c.t/5);c.x=w.x+w.n[0]*(.3+1.1*k);c.z=w.z+w.n[1]*(.3+1.1*k);c.y=k<.85?.86:.86*(1-(k-.85)/.15);if(k>=1){c.st='in';c.y=0;}}
    else if(c.st==='in'){const dp=hypot(P.x-c.x,P.z-c.z),dd=hypot(AD.x-c.x,AD.z-c.z),toDoc=c.goDoc??(c.goDoc=Math.random()<.45);   // some go for the hero, some for the doctor
      const tx=toDoc?AD.x:P.x,tz=toDoc?AD.z:P.z,dx=tx-c.x,dz=tz-c.z,d=hypot(dx,dz)||.01;c.rot=atan2(dx,dz);c.atk-=dt;c.mv=0;
      if(d>1.2){const s=2.2*dt;if(!moveC(c,dx/d*s,dz/d*s,.3)){c.x+=dx/d*s;c.z+=dz/d*s;}c.mv=1;c.ph+=dt*7;}
      else if(c.atk<=0&&S.mode==='play'){c.atk=1.4;c.swing=.3;SFX.swing();if(toDoc){DEF.adHp-=20;SFX.hurt();S.shake=.15;if(DEF.adHp<=0){defFail();return;}if(!sub)say('Доктор Бернсон','Крейн! Помогите!',{pitch:120,vol:.3,dur:1.4});}else damage(15,null);}
      if(c.swing>0)c.swing-=dt;}
    else c.dead+=dt;}
  DEF.cul=DEF.cul.filter(c=>c.dead<4);}
function fireRifle(){if(RIF.cd>0){return;}RIF.cd=.8;RIF.kick=1;RIF.flash=.08;   // the kick is only visual: the aim comes back by itself
  SFX.shot();setTimeout(()=>SFX.bolt(),420);{const o=CAM.eye,d=vNorm(vSub(CAM.tgt,o)),m=vAdd(o,vSc(d,.9));for(let i=0;i<6;i++)PT.add(4,m[0],m[1]-.1,m[2],d[0]*1.5+rr(-.3,.3),.3+rr(0,.4),d[2]*1.5+rr(-.3,.3),.14,1.1,[.55,.55,.52,.35],-.3);}   // muzzle smoke
  const o=CAM.eye,d=vNorm(vSub(CAM.tgt,o));let best=null,bt=1e9;
  for(const c of DEF.cul){if(c.st==='dead')continue;for(let h=.35;h<=1.75;h+=.2){const q=[c.x,c.y+h,c.z],v=vSub(q,o),t=vDot(v,d);if(t<.2)continue;const off=vLen(vSub(v,vSc(d,t)));if(off<.33&&t<bt){bt=t;best=c;}}}
  if(best){best.st='dead';best.dead=0;SFX.hit();for(let i=0;i<12;i++)PT.add(1,best.x,best.y+1.3,best.z,rr(-1.5,1.5),rr(0,2.5),rr(-1.5,1.5),.05,.9,[.45,.04,.03,.95],1);mumble(.5,90,false,.14,true);}
  else{const t=rayHit(o,d,40),p=vAdd(o,vSc(d,t));for(let i=0;i<5;i++)PT.add(5,p[0],p[1],p[2],rr(-1,1),rr(0,1),rr(-1,1),.04,.4,[1,.8,.4,.9],-.2);
    if(t<40)debris(p[0],p[1],p[2],6,'wood',{vx:-d[0]*3,vz:-d[2]*3,sp:2.2,sz:.07});}}
async function defEnd(){DEF.on=false;S.mode='talk';for(const c of DEF.cul)if(c.st!=='dead'){c.st='dead';c.dead=3;}await wait(1.5);
  const p={pitch:76,vol:.26};lookAt(269,1.5,-28.2);
  await say('Отец Пол','*за дверью* Хватит, Эдмунд! Хватит прятаться за чужаком. Выходи сам.',p);
  await say('Отец Пол','*за дверью* Со мной твой добрый друг. Скажи ему что-нибудь, Мэттью.',p);
  await say('Отец Мэттью','*за дверью* Эд… Не слушай его! Не выходи! Ради Бога, не…',{pitch:104,vol:.24});SFX.thud();
  await say('Отец Пол','*за дверью* Если через пять минут ты не выйдешь с готовой сывороткой — святой отец умрёт. Здесь, на твоём пороге.',p);
  Object.assign(AD,{walk:[270,-32.2],pose:'stand'});await wait(1.6);lookAt(AD.x,1.6,AD.z);
  await say('Доктор Бернсон','*стискивает зубы* Мэттью… Хорошо! ХОРОШО, Пол! Я выйду! Дай мне закончить!',{pitch:112,vol:.32});
  await say('Доктор Бернсон','*тихо* Простите, мистер Крейн. Я не могу дать ему умереть.',VO.doc);
  AD.walk=[271.4,-36.6];AD.pose='work';await wait(1.4);for(let i=0;i<5;i++){tone(900+i*120,.12,{type:'triangle',vol:.05});await wait(.7);}
  await say('Доктор Бернсон','…Готово. Да простит меня Бог.',VO.doc);
  S.rifle=false;A3.chair=false;await fade(1,900);escortStart();}
// ---------------------------------------------------------------- 4. tied, the walk to the old chapel
const ESC_PATH=[[-110,-30.6],[-110,-9],[-60,-8.4],[0,-8.4],[24,-8.4]];
async function escortStart(){A3.ph='escort';S.inside=null;S.tied=true;P.x=-110;P.z=-31.6;P.rot=0;CAM.pitch=0;A3.ei=1;
  Object.assign(PAUL,{show:true,walk:null});Object.assign(MATT,{show:true,walk:null});Object.assign(AD,{show:true,walk:null,pose:'walk'});ESCN.forEach(n=>Object.assign(n,{show:true,walk:null}));
  escortPlace(0);camSnap();await wait(.4);$('fade').style.transitionDuration='1200ms';$('fade').style.opacity=0;
  setObj('Вас ведут к старой часовне у моря.');const d=VO.doc,p=VO.paul,h=VO.hero,m={pitch:104};
  await say(HERO,'(про себя) Руки стянуты верёвкой. Мэттью — рядом, лицо разбито. Двое братьев позади, с факелами.',h);
  A3.look=AD;await say('Доктор Бернсон','Зачем тебе сыворотка, Пол? Ты же знаешь — она не делает богов. Только чудовищ без разума.',d);
  A3.look=PAUL;await say('Отец Пол','Знаю. Потому она мне и нужна. Братья мне верны — зачем мне губить их? Я вколю её другим. Обычным людям. Таким, как наш добрый Мэттью.',p);
  A3.look=MATT;await say('Отец Мэттью','*шёпотом* Отче наш, сущий на небесах…',m);
  A3.look=PAUL;await say(HERO,'Вы просто трус, святой отец. Завистливый старик, который сорок лет смотрит в спину мальчишке и хочет забрать себе его роль. Избранный… Да вы обычный вор.',h);
  await wait(2.2);await say('Отец Пол','*молчит*',{dur:1.6});
  A3.look=AD;await say('Доктор Бернсон','Скажи мне одно, Пол. Как ты прочёл мой дневник? Сейф был заперт. Шифр знаю только я.',d);
  A3.look=PAUL;await say('Отец Пол','У меня есть свои секреты, Эдмунд. Ответов на них ты не узнаешь никогда.',p);
  A3.look=null;await wait(1.5);await fade(1,900);chapelScene();}
function escortPlace(dt){const w=ESC_PATH[A3.ei]||ESC_PATH[ESC_PATH.length-1],dx=w[0]-P.x,dz=w[1]-P.z,d=hypot(dx,dz);
  if(dt&&d>.2){const s=min(d,1.5*dt);P.x+=dx/d*s;P.z+=dz/d*s;}else if(dt&&A3.ei<ESC_PATH.length-1)A3.ei++;
  const a=atan2(dx,dz),fx=sin(a),fz=cos(a),rx=-fz,rz=fx;   // r = the hero's left
  const put=(n,f,r)=>{n.x=P.x+fx*f+rx*r;n.z=P.z+fz*f+rz*r;n.rot=a;n.mv=dt?1:0;n.ph+=dt*3.5;};
  put(PAUL,2.3,0);put(AD,.2,-1.1);put(MATT,.2,1.1);put(ESCN[0],-1.9,.8);put(ESCN[1],-1.9,-.8);
  if(dt){let want=a;if(A3.look&&A3.look.show)want=atan2(A3.look.x-P.x,A3.look.z-P.z);let df=want-P.rot;df=((df+PI)%(2*PI)+2*PI)%(2*PI)-PI;P.rot+=df*min(1,dt*2.5);CAM.yaw=P.rot;CAM.pitch*=.95;}}
// ---------------------------------------------------------------- 5. the old chapel: on their knees, the truth, the revolver, the needle
const LUNGE={on:false,go:false};
addInter(290,-1.9,3,'Броситься на Пола',()=>{LUNGE.go=true;},()=>LUNGE.on&&S.inside==='chapel');
async function chapelScene(){A3.ph='chapel';S.inside='chapel';S.tied=true;setObj('Старая часовня отца Пола.');P.x=290;P.z=-1.9;P.rot=PI;S.kneel=true;CAM.pitch=.12;
  Object.assign(PAUL,{show:true,x:290,z:-4.4,rot:0,walk:null});Object.assign(AD,{show:true,x:288.8,z:-2,rot:PI,walk:null,pose:'kneel'});Object.assign(MATT,{show:true,x:291.2,z:-2,rot:PI,walk:null,kneel:true});
  ESCN.forEach((n,i)=>Object.assign(n,{show:true,x:288.6+i*2.8,z:1.4,rot:PI,walk:null}));camSnap();$('fade').style.transitionDuration='1100ms';$('fade').style.opacity=0;await wait(1);
  const p=VO.paul,d=VO.doc;lookAt(PAUL.x,1.6,PAUL.z);
  await say('Отец Пол','На колени. Все трое. *братьям* А вы — выйдите. Ждите снаружи.',p);
  ESCN[0].walk=[289.4,6.6];ESCN[1].walk=[290.6,6.6];await wait(2.6);SFX.door();ESCN.forEach(n=>n.show=false);
  await say('Отец Пол','Ты всю жизнь думал, что ты один такой, Эдмунд. Избранный. Мальчик, которого Он выловил со дна.',p);
  await say('Отец Пол','Но одарённых в Грейхейвене было двое. Ты — и я. Я стал Его послушником за семь лет до того, как ты упал за борт отцовской лодки.',p);
  await say('Отец Пол','Ко мне Он пришёл не случайно. Я сам позвал Его — в той самой пещере, куда ты бегаешь плакаться.',p);
  await say('Отец Пол','И вот чего ты не знаешь: Его дар — это кровь. Особая кровь и умение сварить из неё сыворотку. Только это. Больше ничего.',p);
  // the hero's chance: get up and rush him (or it happens anyway)
  LUNGE.on=true;LUNGE.go=false;S.frozen=true;S.mode='play';toast('Пол не смотрит на вас. <b>Сейчас</b> — или никогда.',4);
  const sayP=say('Отец Пол','А твой ум, твои языки, твоя химия — не Его дар. Это твоё, Эдмунд. С рождения. Он лишь… подтолкнул.',p);
  const t0=S.t;while(!LUNGE.go&&S.t-t0<7)await wait(.1);LUNGE.on=false;S.frozen=false;S.mode='talk';if(sub)sub.res();
  S.kneel=false;P.z-=.55;lookAt(PAUL.x,1.5,PAUL.z);SFX.swing();await wait(.25);PAUL.gun=true;SFX.click();S.shake=.2;
  await say('Отец Пол','*выхватывает из-под робы револьвер* Сядь. СЯДЬ, я сказал.',{pitch:72,vol:.32});
  P.z+=.55;S.kneel=true;lookAt(PAUL.x,1.6,PAUL.z);await wait(.5);
  await say('Отец Пол','Понимаешь теперь? Для Него ты был удачей, Эдмунд. Удобным инструментом, который подвернулся в нужный час.',p);
  await say('Отец Пол','Не будь ты таким умным мальчишкой — ты бы просто утонул тогда, как тонут все.',p);
  await say('Отец Пол','А настоящим пророком всё это время был я. И дар повелевать изменёнными есть не только у тебя.',p);
  PAUL.gun=false;PAUL.syr=true;PAUL.arm=0;
  await say('Отец Пол','Мэттью. Подойди ко мне. А вы двое — смотрите.',p);
  MATT.kneel=false;MATT.faceP=0;MATT.walk=[290.72,-3.82];await say('Отец Мэттью','Пол… Не надо… Ради всего святого…',{pitch:104});
  while(walking(MATT))await wait(.1);MATT.rot=atan2(PAUL.x-MATT.x,PAUL.z-MATT.z);PAUL.faceP=0;PAUL.rot=atan2(MATT.x-PAUL.x,MATT.z-PAUL.z);lookAt((MATT.x+PAUL.x)/2,1.5,(MATT.z+PAUL.z)/2);await wait(.9);
  PAUL.stab=.001;SFX.swing();await wait(.25);noise(.2,{f:3200,type:'highpass',vol:.2});S.shake=.3;
  await say('Доктор Бернсон','НЕ-Е-ЕТ! МЭТТЬЮ!!!',{pitch:130,vol:.36,dur:2.2});scream(1.6);
  $('fade').style.transitionDuration='1800ms';$('fade').style.opacity=1;await wait(2.4);S.kneel=false;S.tied=false;PAUL.faceP=1;MATT.faceP=1;credits();}
// ---------------------------------------------------------------- per-frame hooks, drawing, HUD, respawn, debug
function act3Tick(dt){RIF.kick=max(0,RIF.kick-dt*5);RIF.flash-=dt;
  if(PAUL.syr)PAUL.arm=min(1,(PAUL.arm||0)+dt*1.2);if(PAUL.stab>0&&PAUL.stab<1)PAUL.stab=min(1,PAUL.stab+dt*5);
  if(A3.ph==='escort'&&S.mode==='talk')escortPlace(dt);
  if(A3.ph==='house'&&AD.show)npcStep(AD,dt);if(A3.ph==='chapel'){for(const n of ESCN)npcStep(n,dt);}
  defTick(dt);}
function act3Play(dt){if(A3.ph==='walk')walkLead(dt);else if(A3.ph==='chase')chaseTick(dt);}
function drawAct3(){const t=S.t;
  if(!S.inside&&AD.show&&(A3.ph==='walk'||A3.ph==='enc'||A3.ph==='chase'))drawChar(CHF.doc,AD.x,0,AD.z,AD.rot,{ph:AD.ph,mv:AD.mv,aR:A3.ph==='chase'&&AD.mv?-1.1+sin(AD.ph)*.6:null,aL:A3.ph==='chase'&&AD.mv?-1.1-sin(AD.ph)*.6:null});
  if(!S.inside&&A3.encShow)for(const e of ENC){const m=drawChar(CH.c,e.x,0,e.z,e.rot,{armed:true,aR:-1.25});torchFx(m,e.ph);}
  if(!S.inside&&PAUL.show&&A3.ph==='enc')drawChar(CHF.paul,PAUL.x,0,PAUL.z,PAUL.rot,{ph:PAUL.ph,mv:PAUL.mv,aR:-.5+sin(t*2)*.2,aL:-.3});
  if(A3.ph==='escort'&&!S.inside){drawChar(CHF.paul,PAUL.x,0,PAUL.z,PAUL.rot,{ph:PAUL.ph,mv:1});drawChar(CHF.doc,AD.x,0,AD.z,AD.rot,{ph:AD.ph,mv:1,aR:-.55,aL:-.55,cR:1.2,cL:1.2});
    drawChar(CHF.matt,MATT.x,0,MATT.z,MATT.rot,{ph:MATT.ph,mv:1,aR:-.55,aL:-.55,cR:1.2,cL:1.2});for(const n of ESCN){const m=drawChar(CH.c,n.x,0,n.z,n.rot,{ph:n.ph,mv:1,armed:true,aR:-1.25});torchFx(m,n.ph);}}
  if(S.inside==='doc'){for(const[i,w]of DWIN.entries()){const side=w.n[0]!==0,M=mM(mT(w.x+w.n[0]*.02,.97,w.z+w.n[1]*.02),mRy(side?PI/2:0));draw(DEF.broken&&DEF.broken[i]?M_hole:M_pane,M,0);}
    if(A3.chair)draw(M_chair,mM(mT(269,0,-28.75),mRy(PI),mRx(-.42),mT(0,0,0)),.03);
    if(A3.ph==='house'&&AD.show){const wk=AD.pose==='work'&&!AD.mv;drawChar(CHF.doc,AD.x,0,AD.z,AD.rot,{ph:AD.ph,mv:AD.mv,aR:wk?-1.1+sin(t*5)*.25:null,aL:wk?-1.0+sin(t*4+1)*.25:null});}
    for(const c of DEF.cul){const o={noBlob:c.st==='sill'};if(c.st==='sill'){o.crouch=1;o.aR=-1.5;o.aL=-1.6;}else if(c.st==='in'){o.ph=c.ph;o.mv=c.mv;o.aR=c.swing>0?lerp(.3,-2.4,c.swing/.3):-2.2;o.aL=-1.2;}else{o.lie=true;}
      drawChar(CH.c,c.x,c.y,c.z,c.rot,o);}
    if(RIF.flash>0){const e=CAM.eye,f=vNorm(vSub(CAM.tgt,e));light(e[0]+f[0]*1.2,e[1]+f[1]*1.2,e[2]+f[2]*1.2,14,[1,.8,.45]);}}
  if(S.inside==='chapel'&&A3.ph==='chapel'){const o={ph:PAUL.ph,aR:PAUL.gun?-1.42:PAUL.syr?lerp(lerp(-.15,-1.5,eas(PAUL.arm)),-.75,eas(PAUL.stab||0)):null,eR:PAUL.gun?.04:PAUL.syr?lerp(.9,.15,eas(PAUL.stab||0)):null,aRz:PAUL.gun?.12:0,armed:PAUL.gun||PAUL.syr,wpn:PAUL.gun?M_rev:M_syr,look:PAUL.faceP?undefined:0,cR:PAUL.gun||PAUL.syr?1.5:null};
    drawChar(CHF.paul,PAUL.x,0,PAUL.z,PAUL.rot,o);drawChar(CHF.doc,AD.x,0,AD.z,AD.rot,{crouch:1,aR:-.4,aL:-.4,cR:1.2,cL:1.2});
    drawChar(CHF.matt,MATT.x,0,MATT.z,MATT.rot,MATT.kneel?{crouch:1,aR:-.4,aL:-.4,cR:1.2,cL:1.2}:{ph:MATT.ph,mv:MATT.mv,aR:-.45,aL:-.45,cR:1.2,cL:1.2});
    for(const n of ESCN)if(n.show){const m=drawChar(CH.c,n.x,0,n.z,n.rot,{ph:n.ph,mv:n.mv,armed:true,aR:-1.25});torchFx(m,n.ph);}}}
// the rifle in first person: both hands on it, kick on the shot
function drawFpRifle(e,f,r,up){const k=RIF.kick,b=vAdd(e,vAdd(vAdd(vSc(r,.15),vSc(up,-.2+k*.02)),vSc(f,.3-k*.07))),X=vSc(r,-1);
  const M=[X[0],X[1],X[2],0,up[0],up[1],up[2],0,f[0],f[1],f[2],0,b[0],b[1],b[2],1];draw(M_rifle,M,0);
  const ch=CH.hero,sp1=vAdd(e,vAdd(vAdd(vSc(r,.3),vSc(up,-.48)),vSc(f,-.05))),sp2=vAdd(e,vAdd(vAdd(vSc(r,-.26),vSc(up,-.46)),vSc(f,-.02)));
  fpArm(sp1,mP(M,[0,-.08,-.14]),1,up,f,false,1.35,vNorm(vAdd(vSc(up,-1),vSc(f,.35))));fpArm(sp2,mP(M,[-.01,-.07,.3]),-1,up,f,false,1.0,vNorm(vAdd(vSc(up,-.7),vSc(r,.7))));
  if(RIF.flash>0){const mz=mP(M,[0,.0,.9]);for(let i=0;i<4;i++)PT.add(5,mz[0],mz[1],mz[2],f[0]*4+rr(-1,1),f[1]*4+rr(-1,1),f[2]*4+rr(-1,1),.05,.12,[1,.85,.4,1],0);}}
function act3Hud(c,w,h){if(!DEF.on||S.mode!=='play')return;
  if(RIF.cd>0){c.font='15px Georgia';c.fillStyle='#d9cdb0';c.fillText('перезарядка…',w/2,h/2+46);}}
async function defFail(){S.mode='talk';scream(1.2);await say('Доктор Бернсон','А-а-а…',{pitch:110,dur:1.4});await fade(1,600);
  P.x=269;P.z=-31;P.rot=PI;Object.assign(AD,{x:LABP[0][0],z:LABP[0][1],walk:null});camSnap();act3Respawn();await fade(0,600);S.mode='play';}
function act3Respawn(){if(DEF.on){Object.assign(DEF,{t:0,next:2,cul:[],adHp:100});S.hp=100;setObj('Отстреливайтесь от культистов в окнах, пока доктор заканчивает сыворотку.');toast(DEF.adHp<=0?'Доктора убили… Защищайте и его. Ещё раз.':'Они прорвались… Ещё раз.',4);DEF.adHp=100;}
  if(A3.ph==='chase'){Object.assign(AD,{x:P.x-1.2,z:P.z-1,ci:0});A3.chaseT=S.t+1;for(const[i,e]of ENC.entries()){e.active=false;e.x=e.hx=P.x+18+i;e.z=e.hz=-6+i;e.state='patrol';}}}
function act3Skip(st){S.up=S.paulScene=S.paul=S.robe=true;S.h1=S.h2=S.h3=S.knock=S.rock=S.winBroken=S.church=S.toCave=S.inCave=S.caveTalk=true;tearRobe();S.cp=[-87,-9.4];
  if(st==='return'){S.inside=null;P.x=50.4;P.z=-42;P.rot=PI;walkStart();}
  else if(st==='chase'){S.inside=null;P.x=34;P.z=-8.4;P.rot=-PI/2;Object.assign(AD,{show:true,x:33,z:-9.4});ENC.forEach((e,i)=>{e.x=26.6-i;e.z=-5;});startChase();}
  else if(st==='defense'){S.inside='doc';P.x=269;P.z=-31;P.rot=PI;A3.ph='house';A3.chair=true;Object.assign(AD,{show:true,x:271.4,z:-36.6,rot:PI,pose:'work'});DEF.broken=[true,false,false,false];S.rifle=true;defStart();}
  else if(st==='escort'){S.mode='talk';escortStart();}
  else{S.mode='talk';chapelScene();}}
