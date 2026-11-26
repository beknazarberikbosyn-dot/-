// ================= STAGES: the townsfolk, the plain-clothes cult, Dr Bernson's house, the visions, the curfew =================
// Stage 1 — before the doctor's house: ordinary people (women, children, fishermen) live their lives in the streets and the cult keeps
//   up the face of a quiet fishing village. After the cellar fight (S.stalk) the cult knows: men in ordinary clothes tail the hero
//   (SK: see him → follow at his heels → grab him if he lets them close); his car is watched; two of them guard the doctor's door
//   (DGU) and must be lured away (stones through a window, a ringing phone, a collapsing woodpile).
// Inside the doctor's house: five pieces of evidence → Dr Edmund Bernson injects his serum → two visions (his drowning as a boy,
//   R'lyeh and the Old One; then Greyhaven burning) → the doctor breaks down and flees.
// Stage 2 — curfew (S.curfew): the townsfolk are locked in, the cult hunts in the streets → act 2 (src/5c-act2.js).
Object.assign(VO,{doc:{pitch:92},wom:{pitch:168},kid:{pitch:232},sk:{pitch:96}});

// --- people: women (long skirts, no separate legs), children (own small limbs), the doctor
function gWoman(c){const g=gVillager(0);return g;}
const CHF={
  wom:[['wom_body_0','#5a4a5a'],['wom_body_1','#6a5a44'],['wom_body_2','#3a3a3e']].map(([b,c])=>partSet('wom',()=>gWoman(c),{bodyName:b,arm:'vill_arm',armW:'vill_arm',noLeg:true,armO:{pal:{cloth:H(c)}},sh:[.25,1.47]})),
  kid:[['kid_body_0','#4a5a6a'],['kid_body_1','#7a4a44']].map(([b,c])=>partSet('kid',()=>gVillager(0),{bodyName:b,arm:'kid_arm',armW:'kid_arm',leg:'kid_leg',armO:{pal:{cloth:H(c)}},sh:[.17,.98],hip:[.075,.6]})),
  doc:partSet('doc',()=>gVillager(3),{bodyName:'doc_body',arm:'doc_arm',armW:'doc_arm',leg:'vill_leg',legO:{pal:{trousers:H('#2a2a2e')}},sh:[.27,1.47]})};
const FM=[vVar(3,'#a8862a','#2c2a27'),vVar(1,'#3a4a5a','#2a2826'),vVar(0,'#6a5a40','#33302c')];        // fishermen in oilskins and jackets
const SKV=[vVar(2,'#2f3632','#262624'),vVar(0,'#36302c','#262420'),vVar(2,'#3a3530','#262624'),vVar(1,'#2e3238','#262420')];   // the cult in ordinary clothes

// --- the townsfolk (stage 1). mode: idle | sit | work | walk (loop of waypoints) | play (children running in circles) | follow
const CIV=[
 {k:'w',v:1,x:-90.5,z:-2.7,rot:0,mode:'idle',name:'Торговка рыбой',bark:'Свежая треска, мистер! …Берите и уходите поскорее. Пожалуйста.'},
 {k:'m',v:FM[0],x:-96,z:-2.7,rot:0,mode:'idle',name:'Рыбак за прилавком',bark:'*отводит глаза* Рыба как рыба. Ничего особенного у нас тут нет.'},
 {k:'w',v:0,x:-89,z:9.3,rot:PI,mode:'idle',name:'Женщина у прилавка',bark:'*шёпотом* Вы приезжий? Не говорите со мной громко. За нами смотрят.'},
 {k:'w',v:2,x:-94.5,z:4.4,rot:PI/2,mode:'sit',name:'Старушка на скамейке',bark:'Мой сын тоже задавал вопросы. Двенадцать лет назад… *крестится и замолкает*'},
 {k:'w',v:0,mode:'walk',wp:[[-98,-5.8],[-80.4,-5.8],[-80.4,12.2],[-98,12.2]],name:'Женщина с корзиной',bark:'Добрый вечер. Туман сегодня… Лучше не задерживаться на улице.'},
 {k:'k',v:0,mode:'play',c:[-126,14.6],r:2.4,ph:0,name:'Мальчик',bark:'Дяденька, а правда, что у вас камера? Мама говорит, на таких, как вы, нельзя смотреть.'},
 {k:'k',v:1,mode:'play',c:[-126,14.6],r:2.4,ph:2.1,name:'Девочка',bark:'*хихикает и убегает* Водишь!'},
 {k:'k',v:0,mode:'play',c:[-121.4,11.8],r:1.5,ph:4.2,name:'Мальчик'},
 {k:'k',v:1,mode:'play',c:[-121.4,11.8],r:1.5,ph:1,name:'Девочка'},
 {k:'w',v:1,x:-125,z:9.4,rot:PI,mode:'idle',name:'Учительница',bark:'Дети, не подходите к забору! …Простите, мистер. Им нельзя говорить с чужими.'},
 {k:'m',v:FM[1],x:-85.4,z:-10.4,rot:0,mode:'idle',name:'Мужчина у церкви',bark:'Это новая церковь — отец Мэттью выстроил её пять лет назад. В старую часовню у моря, к отцу Полу, теперь почти никто не ходит… *осекается* Мне пора.'},
 {k:'w',v:2,mode:'walk',wp:[[-87,-9.6],[-87,-5.6],[-104,-5.6],[-104,-9.6]],name:'Прихожанка',bark:'Помолитесь за нас, раз уж приехали. Больше за нас молиться некому.'},
 {k:'w',v:0,mode:'walk',wp:[[-60,-6.2],[-122,-6.2]],name:'Прохожая',bark:'*прижимает сумку к груди* Извините, я спешу.'},
 {k:'m',v:FM[2],mode:'walk',wp:[[-26,-7.6],[30,-7.6]],name:'Прохожий',bark:'Хорошая погода для прогулок. *даже не смотрит на небо*'},
 {k:'w',v:1,mode:'walk',wp:[[8,-7.6],[8,42.6],[-64,42.6],[-64,-7.6]],name:'Женщина с дочкой',bark:'Не смотри на него, милая. Дядя скоро уедет.'},
 {k:'k',v:1,mode:'follow',lead:14,off:[.75,-.35],name:'Девочка',bark:'Мама, а почему у дяди нет жабр?'},
 {k:'m',v:FM[1],mode:'walk',wp:[[-63,-6.6],[-63,42.6],[-101.6,42.6],[-101.6,-6.6]],name:'Прохожий'},
 {k:'m',v:FM[0],x:-80,z:41.4,rot:PI,mode:'work',name:'Рыбак у сетей',bark:'Сети чиню. Ночью снова выходить. *косится на море* Если отпустят.'},
 {k:'m',v:FM[2],x:-118,z:41.6,rot:PI,mode:'work',name:'Рыбак у крана',bark:'Осторожно, мистер, ящики тяжёлые. И смотрите под ноги — тут легко упасть в воду.'},
 {k:'m',v:FM[1],x:-101,z:41.6,rot:PI,mode:'work',name:'Грузчик'},
 {k:'m',v:FM[0],mode:'walk',wp:[[-134,42.6],[-20,42.6]],name:'Рыбак',bark:'Улов хороший. Всегда хороший. Даже слишком.'},
 {k:'w',v:1,x:-109,z:9.3,rot:PI,mode:'work',name:'Женщина у белья',bark:'*снимает бельё, хотя оно ещё мокрое* Скоро совсем стемнеет. Вам бы под крышу, мистер.'},
 {k:'w',v:2,x:-72,z:9.1,rot:PI,mode:'work',name:'Пожилая женщина'},
 {k:'k',v:0,mode:'play',c:[0,-10.2],r:1.9,ph:0,name:'Мальчик',bark:'А я видел, как дядя Томас ночью ходил на пирс с факелом! *мать уводит его за руку*'},
 {k:'k',v:1,mode:'play',c:[0,-10.2],r:1.9,ph:3,name:'Девочка'},
 {k:'w',v:0,x:3.4,z:-10.2,rot:-PI/2,mode:'idle',name:'Мать',bark:'Дети, домой! Быстро!'},
 {k:'m',v:FM[2],x:-6,z:41.6,rot:PI,mode:'work',name:'Рыбак'},
 {k:'w',v:1,mode:'walk',wp:[[12,-6.6],[50,-6.6]],name:'Прохожая'}];
for(const c of CIV){if(c.wp){c.x=c.wp[0][0];c.z=c.wp[0][1];}if(c.mode==='play'){c.x=c.c[0];c.z=c.c[1];}c.wi=c.wi||0;c.ph=c.ph||rnd()*6;c.rot=c.rot||0;c.mv=0;c.bt=0;c.st=0;c.sp=c.k==='k'?2.4:1.25+rnd()*.25;}
const civCh=c=>c.k==='w'?CHF.wom[c.v]:c.k==='k'?CHF.kid[c.v]:CH.v[c.v];
function updCiv(c,dt){c.mv=0;const d=hypot(P.x-c.x,P.z-c.z);
  if(c.mode==='play'){const a=S.t*(c.r>2?.9:1.2)+c.ph,nx=c.c[0]+cos(a)*c.r,nz=c.c[1]+sin(a)*c.r*.8;c.rot=atan2(nx-c.x,nz-c.z);c.x=nx;c.z=nz;c.mv=1;c.ph2=(c.ph2||0)+dt*6;return;}
  if(c.mode==='follow'){const l=CIV[c.lead],cs=cos(l.rot),sn=sin(l.rot),tx=l.x+c.off[0]*cs+c.off[1]*sn,tz=l.z-c.off[0]*sn+c.off[1]*cs;if(hypot(tx-c.x,tz-c.z)>.3){goDir(c,tx,tz,max(1.3,l.mv?l.sp*1.15:1.3),dt);c.ph2=c.ph;}else faceTo(c,l.rot,dt,4);return;}
  if(c.mode==='walk'){if(d<1.2){faceTo(c,atan2(P.x-c.x,P.z-c.z)+PI*.5,dt,3);return;}if(c.st>0){c.st-=dt;return;}
    const w=c.wp[c.wi];if(hypot(w[0]-c.x,w[1]-c.z)<.7){c.wi=(c.wi+1)%c.wp.length;if(rnd()<.35)c.st=1.5+rnd()*2.5;return;}goDir(c,w[0],w[1],c.sp,dt);c.ph2=c.ph;return;}
  if(d<5&&c.mode!=='work')faceTo(c,atan2(P.x-c.x,P.z-c.z),dt,2);}
function drawCiv(c){const ch=civCh(c);if(!ch)return;const t=S.t+c.ph,o={ph:c.mode==='play'?c.ph2:c.ph,mv:c.mv};
  if(c.mode==='sit'){o.sit=1;o.aR=o.aL=-1.1;}else if(c.mode==='work'){o.aR=-1.15+sin(t*2.6)*.45;o.aL=-.95+sin(t*2.6+1.2)*.45;}else if(c.mode==='play')o.aR=-.5+sin(t*9)*.6;
  drawChar(ch,c.x,0,c.z,c.rot,o);}

// --- plain-clothes cultists: patrol → (they see him) → tail at his heels → grab him if he lets them close; lost after 3 s out of sight
const SKR=[[[-24,-7.4],[40,-7.4]],[[11.6,-5],[11.6,40]],[[-28,42.6],[40,42.6]],[[-60,-7.4],[-130,-7.4]],[[-99,-6],[-99,40]],[[-63,-6],[-63,40]],[[-92,5.6],[-86,7.6],[-88,1.2]],[[-130,42.6],[-66,42.6]],
  [[-36.2,-20.9]],[[-40.7,-15.3]],[[-34.5,-15.5]]];   // the last three stand around the hero's car
const SKP=[0,0,0,0,0,0,0,0,PI*.9,-.9,.9];
const SK=SKR.map((wp,i)=>({wp,wi:0,x:wp[0][0],z:wp[0][1],rot:SKP[i]||0,post:SKP[i]||null,v:SKV[i%SKV.length],ph:rnd()*6,mv:0,state:'patrol',aw:0,lose:0,st:0,on:false,ls:[0,0]}));
let SKF=null,SKFt=0;
function skSees(s,R0){if(S.inside)return false;const dx=P.x-s.x,dz=P.z-s.z,d=hypot(dx,dz)||.01,R=R0*S.diff*(S.crouch?.55:1),dot=(dx*sin(s.rot)+dz*cos(s.rot))/d;
  return(d<R&&dot>.4||d<1.8)&&los(s.x,s.z,P.x,P.z,S.crouch);}
function updSK(s,dt){if(!s.on)return;s.mv=0;const dx=P.x-s.x,dz=P.z-s.z,d=hypot(dx,dz)||.01,sees=skSees(s,10.5);
  if(s.state!=='tail'){if(sees)s.aw+=dt*(1.5*(1-d/10.5)+.5);else s.aw=max(0,s.aw-dt*.25);if(P.running&&d<8&&!S.inside){s.aw+=dt*.6;faceTo(s,atan2(dx,dz),dt,3);}
    if(s.aw>=1){s.state='tail';s.lose=0;s.ls=[P.x,P.z];if(!S.tailWarn){S.tailWarn=1;toast('<b>◉ За вами идут.</b> Этот «прохожий» не отстаёт. Оторвитесь бегом или скройтесь из виду — и не дайте ему подойти вплотную.',6);}}}
  if(s.state==='tail'){if(sees){s.lose=0;s.ls=[P.x,P.z];}else s.lose+=dt;
    if(s.lose>3.2||d>24||S.inside){s.state='search';s.st=4;s.F=field(s.ls[0],s.ls[1]);s.aw=.3;return;}
    if(d<1.25&&sees){caught('Человек в куртке','*крепко берёт за локоть* Далеко собрался, писака? Доктор хочет с тобой поговорить.');return;}
    if(d>1)if(d<4&&los(s.x,s.z,P.x,P.z,true))goDir(s,P.x,P.z,3,dt);else if(SKF)goField(s,SKF,3,dt)||goDir(s,P.x,P.z,3,dt);else goDir(s,P.x,P.z,3,dt);
    return;}
  if(s.state==='search'){if(hypot(s.ls[0]-s.x,s.ls[1]-s.z)>1.3&&goField(s,s.F,2.2,dt))return;s.st-=dt;s.rot+=dt*1.4;if(s.st<=0)s.state='patrol';return;}
  if(s.st>0){s.st-=dt;if(s.post==null)s.rot+=sin(S.t*.8+s.ph)*dt*.6;else faceTo(s,s.post+sin(S.t*.5+s.ph)*.5,dt,2);return;}
  const w=s.wp[s.wi];if(hypot(w[0]-s.x,w[1]-s.z)<1){s.wi=(s.wi+1)%s.wp.length;s.st=s.wp.length>1?1+rnd()*2:99;return;}
  if(!goField(s,field(w[0],w[1],true),1.5,dt))goDir(s,w[0],w[1],1.5,dt);}

// --- the two at the doctor's door, and what can draw them away
const DOOR=[-110,-34.2];
const DGU=[[-111.6,-33.1,SKV[1]],[-108.4,-33.1,SKV[2]]].map(([x,z,v])=>({x,z,post:[x,z,0],v,rot:0,ph:rnd()*6,mv:0,state:'post',aw:0,t:0,tgt:null,delay:0}));
function updGuard(g,dt){g.mv=0;
  if(g.delay>0){g.delay-=dt;if(g.delay<=0)g.state='go';}
  else if(g.state==='go'){const t=g.tgt;if(hypot(t[0]-g.x,t[1]-g.z)>1.1){if(!goField(g,field(t[0],t[1],true),2.5,dt))goDir(g,t[0],t[1],2.5,dt);}else{g.state='look';g.t=15;}}
  else if(g.state==='look'){g.t-=dt;faceTo(g,atan2(g.tgt[2]-g.x,g.tgt[3]-g.z)+sin(S.t*.7+g.ph)*.7,dt,2);if(g.t<=0)g.state='back';}
  else if(g.state==='back'){const p=g.post;if(hypot(p[0]-g.x,p[1]-g.z)>.5){if(!goField(g,field(p[0],p[1],true),1.8,dt))goDir(g,p[0],p[1],1.8,dt);}else g.state='post';}
  else faceTo(g,g.post[2]+sin(S.t*.4+g.ph)*.4,dt,2);
  if(S.mode!=='play'||S.inside)return;
  const busy=g.state!=='post'&&g.state!=='back',sees=skSees(g,busy?5.5:9);if(sees){g.aw+=dt*(busy?.9:1.2);if(g.aw>=1)caught('Человек у двери','Эй! А ну стой! Доктор говорил, что ты придёшь…');}else g.aw=max(0,g.aw-dt*.6);}
const guardsAway=()=>DGU.every(g=>hypot(g.x-DOOR[0],g.z-DOOR[1])>6.5);
function lure(tx,tz,lx,lz,delay=1.2){let best=null,bd=1e9;for(const g of DGU){if(g.state!=='post'&&g.state!=='back')continue;const d=hypot(g.x-tx,g.z-tz);if(d<bd){bd=d;best=g;}}
  if(!best){toast('Оба и так уже отошли от двери — самое время!',3);return;}best.tgt=[tx,tz,lx,lz];best.delay=delay;best.state='wait';
  mumble(1,100,false,.16,true);toast(DGU.filter(g=>g.state!=='post'&&g.state!=='back').length>=2?'Оба ушли от двери. <b>Вперёд!</b>':'Один отошёл посмотреть. Нужно отвлечь и второго.',3.5);}
function ring(){for(let i=0;i<7;i++){tone(1320,.16,{type:'square',vol:.05,delay:i*.55});tone(1580,.16,{type:'square',vol:.05,delay:i*.55+.18});}}
function glassBreak(){noise(.3,{f:5200,type:'highpass',vol:.35});for(let i=0;i<5;i++)tone(2200+Math.random()*1600,.12,{type:'triangle',vol:.06,delay:.05+i*.06,to:1400});}
function logsFall(){noise(.9,{f:700,vol:.35,to:120});for(let i=0;i<8;i++)tone(110-i*6,.25,{vol:.28,delay:i*.11,to:50});}
// distractions (after the hero has seen the guards): stones through the neighbour's window, the phone on the bench, the woodpile
addInter(-116.2,-11.2,1.6,'Подобрать пару камней из кучи гравия',()=>{S.stones=2;SFX.pick();toast('Два камня в кармане. Бросать — из проулка между соседним домом и церковью: окно смотрит прямо на сад доктора.',5);},()=>S.stalk&&S.guardsMet&&!S.inside&&!(S.stones>0));
addInter(-95.8,-24.6,1.5,'Бросить камень в окно соседнего дома',()=>{if(S.tailed)return toast('Не сейчас — за вами следят!',2);S.stones--;SFX.swing();setTimeout(glassBreak,350);lure(-99.6,-28.6,-99.6,-26);},()=>S.stalk&&S.guardsMet&&!S.inside&&S.stones>0&&!S.inDoc);
addInter(-123,-29.2,1.4,'Завести будильник на телефоне и оставить его на скамейке',()=>{if(S.tailed)return toast('Не сейчас — за вами следят!',2);S.phoneUsed=1;SFX.click();toast('Будильник через пять секунд. Уходите от скамейки!',3);setTimeout(()=>{if(S.stalk&&!S.inDoc){ring();lure(-122.4,-28.4,-123,-29.6,.6);}},5000);},()=>S.stalk&&S.guardsMet&&!S.inside&&!S.phoneUsed&&!S.inDoc);
addInter(-97.6,-31.8,1.4,'Выбить подпорку поленницы',()=>{if(S.tailed)return toast('Не сейчас — за вами следят!',2);S.woodUsed=1;logsFall();S.shake=.25;lure(-98.6,-30.4,-97.6,-33.4,1.6);toast('Поленница с грохотом рухнула. Прячьтесь!',2.5);},()=>S.stalk&&S.guardsMet&&!S.inside&&!S.woodUsed&&!S.inDoc);
addInter(DOOR[0],DOOR[1],1.4,'Проскользнуть в дом доктора',()=>{if(S.tailed)return toast('Не сейчас — за вами следят!',2);enterDoc();},()=>S.stalk&&S.guardsMet&&!S.inside&&!S.inDoc&&guardsAway());

// --- caught by the plain-clothes cult (stage 1): knocked down, dumped, wakes up near the last checkpoint
async function caught(by,line){if(S.mode!=='play')return;S.mode='talk';S.deaths++;P.hurt=.4;await say(by,line,VO.sk);SFX.thud();S.shake=.6;await fade(1,600);
  resetStalk();P.x=S.cp[0];P.z=S.cp[1];S.inside=null;S.crouch=false;camSnap();await wait(.6);
  toast('Удар по затылку… Вы очнулись в канаве. Видно, приняли за пьяного и бросили — повезло. Будьте осторожнее.',5);await fade(0,800);S.mode='play';}
function resetStalk(){for(const s of SK){s.state='patrol';s.aw=0;s.wi=0;s.st=0;s.x=s.wp[0][0];s.z=s.wp[0][1];if(s.post!=null)s.rot=s.post;}
  for(const g of DGU){g.x=g.post[0];g.z=g.post[1];g.rot=0;g.state='post';g.aw=0;g.delay=0;}S.stones=0;S.phoneUsed=0;S.woodUsed=0;S.tailed=false;}
const stalkObj=()=>'Доберитесь до дома доктора Бернсона: Холмовая ул., 9 — северо-запад, за рыночной площадью.<br><span style="font-size:15px">Любой прохожий может оказаться культистом. Если за вами увязались (◉) — оторвитесь бегом или скройтесь из виду.</span>';
function startStalk(){S.stalk=true;S.alarm=S.ownerKO=true;S.cpRoom=null;for(const s of SK)s.on=true;resetStalk();S.cp=[-6.4,-20.5];setObj(stalkObj());setMark(XD.doc);}

// --- leaving the pub: the owner is found, the cult goes quiet and starts watching
const FOUND={on:false,t:0,men:[{x:-15.2,z:-2,v:SKV[3]},{x:-11.4,z:-2.6,v:SKV[0]}]};
async function sneakOut(){S.mode='talk';S.mark=null;SFX.door();await fade(1,350);S.inside=null;P.x=-6.4;P.z=-20.5;P.rot=PI/2;camSnap();await fade(0,450);
  await say(HERO,'(шёпотом) Тихо… Никто не видел.',VO.hero);
  Object.assign(FOUND,{on:true,t:0});S.camFn=()=>{CAM.ge=[-3,9.5,3];CAM.gt=[-13.2,1,-11];};CAM.rate=2.2;await wait(3.6);
  mumble(1.6,150,false,.22,true);noise(.4,{f:900,vol:.2});
  await say('Голос из паба','*глухо, из-за стены* ХОЗЯИН?! Господи… его будто загрызли! …Подвал открыт! Это тот, с камерой!',{dur:3.4,pitch:140,vol:.25});await wait(1.6);
  FOUND.on=false;S.camFn=null;CAM.rate=1.6;setTimeout(()=>CAM.rate=5,2000);
  await say(HERO,'Нашли. Быстро… Теперь они знают, что я видел подвал.',VO.hero);
  await say(HERO,'Орать на всю деревню они не станут — им нужна тихая рыбацкая деревушка. Будут просто… следить. Любой прохожий может оказаться одним из них.',VO.hero);
  await say(HERO,'Записка со стола: доктор Бернсон, Холмовая, девять. Он у них главный — и он знает, как здесь всё устроено. Иду к нему.',VO.hero);
  startStalk();S.mode='play';toast('Среди жителей в обычной одежде — культисты. Тот, кто идёт за вами по пятам (◉), схватит, если подпустить его вплотную. <b>Оторвитесь</b> бегом или <b>скройтесь</b> за домами, ящиками, пригнувшись.',9);}
async function carScene(){S.mode='talk';S.carSeen=true;S.crouch=true;const cx=-38,cz=-18,px=P.x,pz=P.z;
  S.camFn=()=>{CAM.ge=[lerp(px,cx,.45),9.5,lerp(pz,cz,.45)+8.5];CAM.gt=[cx,.8,cz];};CAM.rate=2;await wait(.8);
  await say(HERO,'(шёпотом) Чёрт… У машины трое. Не в робах — в обычных куртках, будто вышли покурить. Только смотрят все — на дорогу к мотелю.',VO.hero);
  await say(HERO,'Даже если прорвусь — шины наверняка уже проколоты. На машине отсюда не уехать.',VO.hero);
  await say(HERO,'Остаётся доктор Бернсон. Холмовая, девять — на северо-западе, за рыночной площадью.',VO.hero);
  S.camFn=null;CAM.rate=1.6;setTimeout(()=>CAM.rate=5,2000);S.mode='play';}
async function guardScene(){S.mode='talk';S.guardsMet=true;S.mark=null;S.cp=[-110,-11];
  S.camFn=()=>{CAM.ge=[-104,7.5,-21];CAM.gt=[-110,1,-33.5];};CAM.rate=2;await wait(.8);
  await say(HERO,'(шёпотом) Вот он — дом доктора. И у двери двое. Стоят, будто ждут гостей… Меня.',VO.hero);
  await say(HERO,'Напролом не пройти. Нужно увести их от двери — шумом, звонком… чем угодно.',VO.hero);
  await say(HERO,'Куча гравия у рыночной улицы — камнем в окно соседнего дома. Скамейка у забора — оставлю телефон с будильником. И поленница у восточного забора, на одной подпорке…',VO.hero);
  S.camFn=null;CAM.rate=1.6;setTimeout(()=>CAM.rate=5,2000);
  setObj('Отвлеките двоих у двери доктора и проскользните в дом.<br><span style="font-size:15px">Камни — из кучи гравия у рыночной улицы (в окно дома напротив сада), телефон — на скамейку у западного забора, подпорка поленницы — у восточного. Каждая уловка уводит одного.</span>');
  S.mode='play';toast('Пока сторож смотрит в сторону шума — он вас почти не видит. Пригнитесь за забором (<span class="kb">C</span>): низкий забор скрывает того, кто пригнулся.',7);}

// --- Dr Bernson's house (interior: x 258..280, z -42..-28, see ROOMS.doc) — study | laboratory | "the lab rats"
{const r=ROOMS.doc,DW=H('#5c5a52'),DW2=H('#4e4c46');iPlanks(258,-42,280,-28,['#3e3024','#372a20','#45362a']);iShell(r,3,DW,DW2);
 iWall(266,-42,266,-36.5,3,DW2);iWall(273.4,-42,273.4,-37,3,DW2);
 // study: desk, the board, bookshelves, the armchair with the personal diary
 IG.bx(262,0,-38.6,2.3,.78,1.05,PAL.wood);IG.bx(262,.78,-38.6,2.4,.05,1.15,PAL.woodD);for(const[x,ry]of[[261.4,.25],[262.2,-.2],[262.8,.1]])IG.at(mM(mT(x,.84,-38.6),mRy(ry)),()=>IG.bx(0,0,0,.42,.01,.3,PAPER2));
 ip('table_lamp',263,.82,-38.9,0,1,null,null);ip('chair',262,0,-37.4,PI,1,null,null);iCol(260.8,-39.2,263.2,-38,1);
 IG.bx(262,1.05,-41.78,3.4,1.7,.06,H('#8a6a48'));IG.bx(262,1.02,-41.8,3.6,1.76,.04,PAL.woodD);
 for(let i=0;i<12;i++)IG.bx(260.6+(i%6)*.55+rr(-.1,.1),1.35+floor(i/6)*.65+rr(-.08,.08),-41.74,.36,.42,.02,i%4?PAPER2:H('#c9c0a0'));
 for(let i=0;i<6;i++)IG.at(mM(mT(262+rr(-1.3,1.3),1.9,-41.72),mRz(rr(-1.2,1.2))),()=>IG.bx(0,0,0,1.1,.015,.01,H('#a02a20',.3)));
 IG.bx(258.3,0,-34.2,.45,2.5,4.6,PAL.woodD);for(let y=.35;y<2.4;y+=.52)for(let z=-36.3;z<-32.2;z+=.13)IG.bx(258.42,y,z,.3,.38+(z*7%3)*.03,.1,H(['#5a2a24','#2a3a4a','#3a4a2a','#6a5a3a','#2a2a2a'][floor(abs(z*13+y*7))%5]));iCol(258,-36.6,258.7,-31.9,2.5);
 ip('armchair',260.2,0,-30.4,2.4,1,null,()=>IG.bx(0,0,0,.9,.9,.9,H('#4a2b2b')));iCol(259.6,-31,260.8,-29.8,1);IG.bx(261.4,0,-30.3,.6,.62,.6,PAL.wood);IG.bx(261.4,.62,-30.3,.3,.06,.22,H('#3a1f1f'));iCol(261.1,-30.6,261.7,-30,.7);
 ip('rug',261.8,.06,-33.6,0,1,{pal:{rug:H('#3a2a2e')}},null);
 // laboratory: the restraint chair, instruments, glass tanks, the shelf of jars
 IG.bx(269.6,0,-38.9,.8,.5,1.9,IRON);IG.at(mM(mT(269.6,.5,-39.6),mRx(-.5)),()=>IG.bx(0,0,0,.8,.9,.12,H('#5a3a2a')));IG.bx(269.6,.55,-38.6,.82,.12,1.3,H('#5a3a2a'));
 for(const z of[-38.2,-39.1])IG.bx(269.6,.7,z,.86,.05,.1,H('#2a1f18'));iCol(269.1,-40,270.1,-37.9,1);
 IG.bx(271.6,0,-37.6,.6,.85,.45,IRON);for(let i=0;i<5;i++)IG.bx(271.4+i*.1,.86,-37.6,.03,.02,.32,H('#9aa0a2',.2));IG.cyl(271.9,.86,-37.5,.05,.05,.18,6,H('#7fe0a0',.6));iCol(271.3,-37.85,271.9,-37.35,1);
 for(const x of[267.2,268.9,270.6,272.3]){IG.cyl(x,0,-41.2,.5,.5,.22,10,IRON);IG.cyl(x,.22,-41.2,.44,.44,1.8,10,H('#3a6a5a',.22));IG.cyl(x,2.02,-41.2,.5,.5,.12,10,IRON);if(x<272)IG.sph(x,1.05,-41.2,.18,.42,.16,H('#1e2e28'),6,4);}iCol(266.6,-41.8,272.9,-40.6,2);
 for(const y of[1.1,1.65,2.2]){IG.bx(273.05,y,-38.6,.4,.05,2.6,PAL.woodD);for(let i=0;i<6;i++)IG.cyl(273,y+.05,-39.6+i*.42,.11,.11,.3,7,H(['#5d8a6a','#8a8a5a','#6a7a7a'][i%3],.3));}iCol(272.8,-39.9,273.3,-37.3,2.3);
 IG.bx(268.4,0,-30.4,1.2,.85,.6,H('#c9c2b0'));IG.bx(268.4,.85,-30.4,.8,.05,.4,H('#2a3a3a'));iCol(267.8,-30.7,269,-30.1,1);
 // "the lab rats": the gurney under a sheet, a cage, buckets
 IG.bx(276.6,0,-37.4,.75,.78,2,IRON);IG.bx(276.6,.78,-37.4,.82,.18,2.06,H('#c9c2b0'));IG.sph(276.6,.98,-38.1,.22,.12,.2,H('#c9c2b0'),6,4);iCol(276.2,-38.4,277,-36.4,1);
 IG.bx(276.6,.05,-35.8,.5,.01,.4,H('#2e0c0a'));
 {const cx=278.6,cz=-40.6;for(let x=cx-.9;x<=cx+.9;x+=.3)IG.bx(x,0,cz+.7,.05,1.6,.05,RUST);for(let z=cz-.7;z<cz+.7;z+=.3)for(const s of[-1,1])IG.bx(cx+s*.9,0,z,.05,1.6,.05,RUST);IG.bx(cx,1.6,cz,1.85,.06,1.45,RUST);iCol(cx-.95,cz-.75,cx+.95,cz+.75,1.6);}
 for(const[x,z]of[[274.4,-41.2],[275,-41.4]])IG.cyl(x,0,z,.22,.18,.4,7,H('#4a4e50'));
 LAMPS.push([262,2.4,-37,8,[1,.74,.45]],[263,1.3,-38.9,4,[1,.8,.5]],[269.5,2.4,-38,8,[.55,.8,.62]],[269.7,1.2,-41,5,[.3,.85,.6]],[276.5,2.3,-37,6,[.8,.7,.55]]);}
const DOCDEAD=[[275.2,-39.4,1.2,0],[278.6,-33.6,2.1,2]];
// the board above the desk: photographs, red threads, formulas, coordinates — and an old photo of a father and his boy in a boat
let BOARD=null;
function boardImg(){const c=document.createElement('canvas');c.width=480;c.height=250;const x=c.getContext('2d');x.fillStyle='#8a6a48';x.fillRect(0,0,480,250);
  for(let i=0;i<400;i++){x.fillStyle='rgba(60,40,20,.25)';x.fillRect(Math.random()*480,Math.random()*250,2,2);}
  const ph=(px,py,w,h,r,f)=>{x.save();x.translate(px,py);x.rotate(r);x.fillStyle='#e8e2d0';x.fillRect(-w/2,-h/2,w,h);x.fillStyle='#4a4232';x.fillRect(-w/2+5,-h/2+5,w-10,h-22);f(w,h);x.restore();};
  ph(70,70,110,96,-.05,(w,h)=>{x.fillStyle='#2a2a2a';x.beginPath();x.moveTo(-40,10);x.lineTo(40,10);x.lineTo(30,22);x.lineTo(-30,22);x.fill();x.fillRect(-20,-14,8,24);x.fillRect(8,-6,6,16);x.beginPath();x.arc(-16,-20,6,0,7);x.arc(11,-11,4.5,0,7);x.fill();
    x.fillStyle='#2a1f12';x.font='14px Caveat, cursive';x.textAlign='center';x.fillText('Эд и отец, лето 1898',0,h/2-6);});
  [[200,58,.06],[300,72,-.04],[395,60,.08]].forEach(([px,py,r],k)=>ph(px,py,80,86,r,(w,h)=>{x.fillStyle=['#a89070','#8f8f72','#7a8a74'][k];x.beginPath();x.ellipse(0,-10,18,22,0,0,7);x.fill();x.fillStyle='#000';x.fillRect(-9,-14,5,3);x.fillRect(4,-14,5,3);
    if(k){x.strokeStyle='#1a0c08';x.lineWidth=1.2;for(let j=0;j<3;j++){x.beginPath();x.moveTo(-14,4+j*3);x.lineTo(-20,6+j*3);x.stroke();}}x.fillStyle='#2a1f12';x.font='13px Caveat, cursive';x.textAlign='center';x.fillText('Объект '+(29+k),0,h/2-6);}));
  x.strokeStyle='#a02a20';x.lineWidth=1.6;for(const[a,b]of[[[70,70],[200,58]],[[200,58],[300,72]],[[300,72],[395,60]],[[70,70],[240,190]],[[395,60],[240,190]]]){x.beginPath();x.moveTo(...a);x.lineTo(...b);x.stroke();}
  x.fillStyle='#e8dfc4';x.fillRect(150,150,180,80);x.fillStyle='#2a1f12';x.font='15px Caveat, cursive';x.fillText('Р\'льех — 47°9′ ю.ш. 126°43′ з.д.',158,170);x.fillText('М-7: 5 куб. — «окно»',158,192);x.fillText('стать Его народом ⇒ жертв не будет',158,214);
  x.save();x.translate(72,192);x.rotate(-.07);x.fillStyle='#eee8d6';x.beginPath();x.moveTo(-58,-34);for(let j=0;j<=12;j++)x.lineTo(-58+j*9.7,-34+(j%2?3:0));x.lineTo(58,34);x.lineTo(-58,34);x.fill();
    x.strokeStyle='rgba(70,90,140,.45)';x.lineWidth=.8;for(let j=0;j<5;j++){x.beginPath();x.moveTo(-56,-20+j*11);x.lineTo(56,-20+j*11);x.stroke();}
    x.fillStyle='#1c2448';x.font='12px Caveat, cursive';x.textAlign='left';x.fillText('Э. Крейн. Комн. 3',-52,-23);x.fillText('Кому сообщить: Уолтер',-52,-12);
    x.fillStyle='#4a4a4a';x.font='15px Caveat, cursive';x.fillText('33?',22,26);x.restore();
  x.fillStyle='#d8cfb0';x.save();x.translate(410,180);x.rotate(.08);x.fillRect(-55,-40,110,80);x.fillStyle='#2a1f12';x.font='12px Georgia';for(let j=0;j<6;j++)x.fillRect(-45,-30+j*11,60+(j*17)%30,2);x.restore();
  return c.toDataURL();}
const DOCEV=[
 {x:262,z:-37.6,label:'Осмотреть рабочий стол',t:'Рабочий стол доктора',b:'Протоколы, исписанные мелким аккуратным почерком:<br><i>«Сыворотка М-7. Объект 31 (приезжая, 24 г.): жабры раскрылись на четвёртый день, речь утрачена на шестой. Взгляд осмысленный. Прогресс.<br>Объект 32: остановка сердца на второй день.»</i><br><br>И на полях, жирно, несколько раз обведено:<br><i>«Костры на пирсе — пустая трата. Ему не нужна наша кровь. Ему нужны МЫ — другие».</i>',
  note:'Стол Бернсона: протоколы опытов с сывороткой «М-7». «Ему не нужна наша кровь. Ему нужны мы — другие».'},
 {x:262,z:-40.4,label:'Осмотреть доску над столом',t:'Доска над столом',b:()=>'<img src="'+(BOARD=BOARD||boardImg())+'" style="width:100%;margin:2px 0 6px">Фотографии подопытных, красные нити, формулы. Координаты точки посреди Тихого океана. И старый снимок: рыбак и мальчик лет двенадцати в лодке. Подпись: <i>«Эд и отец, лето 1898»</i>.<br><br>Сбоку приколот листок в линейку, с рваным краем. Мой почерк: <i>«Э. Крейн. Комн. 3. Кому сообщить: Уолтер»</i>. Внизу карандашом, мелко, рукой доктора: <i>«33?»</i>',
  note:'Доска: подопытные, координаты Р\'льеха, «М-7 — окно». И фото: мальчик Эд с отцом в лодке, лето 1898. Листок из книги постояльцев мотеля, мой почерк. Карандашом — «33?».',
  after:async()=>{S.mode='talk';await say(HERO,'(про себя) Он узнал моё имя раньше, чем я — его адрес. Пока я записывал вступление.',VO.hero);S.mode='play';}},
 {x:269.6,z:-39.8,label:'Осмотреть лабораторию',t:'Лаборатория',b:'Стеклянные баки с мутной зеленоватой водой. В одном медленно поворачивается кисть руки — пальцы срослись перепонками до самых ногтей. На полках — склянки «М-1»… «М-6», все пустые. «М-7» — полная, с этикеткой: <i>«5 куб. Открывает окно»</i>.<br><br>Кресло с ремнями. Ремни истёрты до блеска.',
  note:'Лаборатория: баки с «образцами», кресло с ремнями. Сыворотка «М-7» — «открывает окно».'},
 {x:276.6,z:-36.2,label:'Осмотреть «подопытных»',t:'«Подопытные»',b:'Под простынёй — то, что было человеком. И ещё двое на полу, под мешковиной. Серая чешуя, раздутые шеи, пальцы-плавники. На бирках рукой доктора: <i>«Объект 27. Не выдержал перемены». «Объект 28. Не выдержал перемены». «Объект 29…»</i><br><br>Лабораторные крысы. Только крысами здесь были люди.',
  note:'Тела «не выдержавших перемены». Бирки рукой доктора: объекты 27, 28, 29…'},
 {x:261.4,z:-31.2,label:'Прочесть личный дневник',t:'Личный дневник Э. Бернсона',b:'<i>«Мне было двенадцать, когда я упал за борт отцовской лодки. Вода сомкнулась, и я пошёл ко дну. Я закрывал глаза — и видел внизу город: зелёные башни, углы, которых не бывает. И Его. Он открыл глаза и заговорил со мной — без слов. Рыбаки вытащили меня через четверть часа и крестились: так долго под водой не живут.<br><br>С того дня я понимаю всё — языки, анатомию, химию. Но Он приходит. Каждую ночь, а теперь и днём, посреди улицы. Я перестал отличать, где Он, а где мой кабинет.<br><br>Он открыл мне истину: старые обряды — пустое. Если Грейхейвен не станет Его народом, Он придёт и возьмёт его сам. Я сделаю нас Его детьми — и жертвы прекратятся.<br><br>P.S. Мэттью снова звал меня в свою церковь — «отдохнуть от голосов». Добрый Мэттью. Только там, за его засовом, Он говорит со мной тише».</i>',
  note:'Дневник Бернсона: тонул в 12 лет, увидел Р\'льех и Его; с тех пор — дар и видения. Прячется от голосов в церкви отца Мэттью.'}];
const docObj=()=>'Осмотрите дом доктора: '+DOCEV.filter(e=>e.seen).length+' / '+DOCEV.length;
for(const e of DOCEV)addInter(e.x,e.z,1.5,e.label,()=>{const b=typeof e.b==='function'?e.b():e.b;if(!e.seen){e.seen=1;S.noteCb=async()=>{addNote(e.note);if(e.after)await e.after();setObj(docObj());const left=DOCEV.filter(q=>!q.seen);S.mark=left.length&&left.length<3?[left[0].x,left[0].z,'doc']:null;if(!left.length)injection();};}openNote(e.t,b);},()=>S.inside==='doc'&&!S.escaped&&!S.injected);
async function enterDoc(){S.inDoc=true;S.mark=null;await goRoom(XD.doc);S.mode='talk';
  await say(HERO,'(шёпотом) Получилось… Дом уважаемого доктора. Пахнет формалином и морской водой.',VO.hero);setObj(docObj());S.mode='play';}

// --- the doctor, the injection and the two visions
const DOC={show:false,x:269,z:-28.6,rot:PI,ph:0,mv:0,walk:null,flee:false};
const VIS={t:0,eyesT:0,upT:0,imps:[],run:[]};const VX=600;
const VG=new Geo(.04),VR=new Geo(0);let M_vis=null,M_rays=null;
{VG.bx(VX,-46.3,60,170,.5,210,H('#16261f'));for(let i=0;i<70;i++)VG.bx(VX+rr(-70,70),-46,rr(-30,150),rr(1,4.5),rr(.4,2.2),rr(1,4.5),H(['#1e3028','#22342c','#1a2a24'][i%3]));
 for(let i=0;i<26;i++){const x=VX+rr(-50,50),z=rr(58,140),h=rr(12,36),w=rr(3,8),d=rr(3,7);
   VG.at(mM(mT(x,-46,z),mRy(rr(0,6.28)),mRz(rr(-.38,.38)),mRx(rr(-.28,.28))),()=>{VG.bx(0,0,0,w,h,d,H(['#2c4a3e','#22382f','#304d40'][i%3]));for(let k=0;k<4;k++)VG.bx(rr(-w/2,w/2)*.8,rr(2,h-2),d/2+.03,rr(.3,1.1),rr(.3,1.5),.05,H('#5fd6a0',.75));});}
 VG.at(mM(mT(VX-16,-46,112),mRy(.45),mRz(.14)),()=>{VG.bx(0,0,0,18,28,2.6,H('#1e3a30'));VG.bx(0,1,1.4,13,23,.3,H('#28463a'));for(let k=0;k<7;k++)VG.bx(rr(-5,5),rr(4,22),1.6,rr(.4,1),rr(.4,1.6),.05,H('#5fd6a0',.8));});
 for(let i=0;i<55;i++)VG.bx(VX+rr(-60,60),-46,rr(-20,110),.16,rr(4,15),.16,H(['#2a4a2c','#244026'][i%2]));
 const sq=(y,s,c)=>{VR.quad([VX-s,y,-s],[VX+s,y,-s],[VX+s,y,s+60],[VX-s,y,s+60],c);VR.quad([VX-s,y,-s],[VX-s,y,s+60],[VX+s,y,s+60],[VX+s,y,-s],c);};sq(0,70,H('#7fbcb4',.55));
 for(let i=0;i<14;i++){const x=VX+rr(-20,20),z=rr(-6,40);VR.at(mM(mT(x,0,z),mRz(rr(-.25,.25)),mRx(rr(-.2,.2))),()=>VR.bx(0,-30,0,rr(.4,1.4),30,rr(.4,1.4),H('#bfe8de',.5)));}}
function seaCam(t){let e=[VX,-1.4-min(t,18)*1.25,min(t,20)*1.1],g=vLerp([VX,2,e[2]+2.5],[VX,e[1]-6,e[2]+30],kf(t,2.5,10));
  if(VIS.eyesT){const k=kf(t,VIS.eyesT,VIS.eyesT+9);e=vLerp(e,[VX,-31,36],k);g=vLerp(g,[VX,-24,98],k);}
  if(VIS.upT){const k=kf(t,VIS.upT,VIS.upT+4);e=vLerp(e,[VX,-1.6,e[2]],k);g=vLerp(g,[VX,8,e[2]+2],k);}return[e,g];}
function visionAtmo(M){if(S.vision==='sea'){R.fog=[.01,.07,.07];R.fogD=1/62;R.fogMin=0;R.fogH=.05;R.amb=[.16,.33,.33];R.sunC=[.08,.2,.22];M.on=false;return;}
  const fl=1+sin(S.t*7)*.06+sin(S.t*17)*.04;   // the whole sky breathes with the fires
  R.fog=[.3*fl,.12*fl,.05];R.fogD=1/120;R.fogMin=.02;R.fogH=.1;R.amb=[.62*fl,.38*fl,.26];R.sunC=[.55,.26,.14];M.den=.32;M.top=7;M.col=[.3*fl,.12*fl,.05];M.maxD=130;}
function whisper(){mumble(3.2,46,false,.32,true);noise(3,{f:240,vol:.18,att:.8,to:90});tone(55,3.4,{type:'sawtooth',vol:.12,to:41,lp:300});}
// first person all the way: he comes up from behind without a cut, the hero turns — the syringe is already raised — and it goes into the neck
const M_syr=(()=>{const g=new Geo(.012),gl=H('#d8ece6',.25),lq=H('#5fd6a0',.7),mt=H('#9aa0a2',.2);g.at(mRx(PI/2),()=>{   // along +Z of the fist: plunger below, glass and needle above
  g.cyl(0,-.12,0,.008,.008,.12,5,mt);g.cyl(0,-.13,0,.022,.022,.012,6,mt);g.cyl(0,-.005,0,.026,.026,.012,6,mt);
  g.cyl(0,.0,0,.017,.017,.16,8,gl);g.cyl(0,.02,0,.013,.013,.12,7,lq);g.cyl(0,.16,0,.012,.004,.025,6,mt);g.cyl(0,.18,0,.0022,.0015,.09,4,H('#e2e6e6',.35));});return mesh(g);})();
async function injection(){S.injected=true;S.mode='talk';S.mark=null;const fx=sin(P.rot),fz=cos(P.rot);
  Object.assign(DOC,{show:true,x:clamp(P.x-fx*3.4,259,279),z:clamp(P.z-fz*3.4,-41.2,-28.8),rot:P.rot,walk:null,flee:false,syr:false,arm:0,stab:0});
  await say(HERO,'(про себя) Здесь всё: опыты, имена, его безумие… Нужно уходить, пока хозяин не…',VO.hero);
  DOC.walk=[clamp(P.x-fx*.95,259,279),clamp(P.z-fz*.95,-41.2,-28.8)];SFX.creak();await wait(2.2);DOC.walk=null;DOC.rot=atan2(P.x-DOC.x,P.z-DOC.z);
  await say('???','Любопытство — прекрасное качество, мистер Крейн…',VO.doc);
  {const r0=P.rot,p0=CAM.pitch;let d=atan2(DOC.x-P.x,DOC.z-P.z)-r0;d=((d+PI)%(2*PI)+2*PI)%(2*PI)-PI;DOC.syr=true;
   for(let k=1;k<=16;k++){P.rot=r0+d*eas(k/16);CAM.yaw=P.rot;CAM.pitch=lerp(p0,.12,eas(k/16));await wait(.03);}}
  await say('Доктор Бернсон','…для журналиста. И для подопытного.',VO.doc);
  DOC.stab=.001;SFX.swing();await wait(.22);DOC.x+=(P.x-DOC.x)*.25;DOC.z+=(P.z-DOC.z)*.25;
  noise(.18,{f:3200,type:'highpass',vol:.22});SFX.hurt();S.shake=.55;$('flash').style.opacity=.8;P.rot+=.32;CAM.yaw=P.rot;CAM.pitch=-.18;await wait(.35);$('flash').style.opacity=0;
  await say(HERO,'А-а! Шея… Что вы… что вы мне вкололи?!',VO.hero);S.drug=1;DOC.syr=false;DOC.stab=0;DOC.rot=atan2(P.x-DOC.x,P.z-DOC.z);lookAt(DOC.x,1.6,DOC.z);
  await say('Доктор Бернсон','Не бойтесь, это не яд. Это — окно. То самое, через которое смотрю я сам. Эдмунд Бернсон, к вашим услугам.',VO.doc);
  await say('Доктор Бернсон','Вы ведь приехали за правдой о Грейхейвене? Смотрите. Смотрите внимательно…',VO.doc);
  P.lie=true;SFX.thud();lids(false,1400);await wait(1.6);$('fade').style.transitionDuration='600ms';$('fade').style.opacity=1;await wait(.8);
  await visionSea();await visionFire();await visionEnd();}
async function visionSea(){$('hud').style.display='none';S.vision='sea';Object.assign(VIS,{t:0,eyesT:0,upT:0});R.uw=1;CAM.fp=true;CAM.fov=1.05;CAM.rate=4;$('uw').style.opacity=1;
  S.camFn=()=>{const[e,g]=seaCam(VIS.t);CAM.ge=e;CAM.gt=g;};camSnap();lids(true,1600);$('fade').style.transitionDuration='1600ms';$('fade').style.opacity=0;SFX.bubbles();
  await say('Доктор Бернсон','Мне было двенадцать. Лето тысяча восемьсот девяносто восьмого. Отец впервые взял меня в открытое море…',VO.doc);
  await say('Доктор Бернсон','Волна. Палуба ушла из-под ног — и вода сомкнулась надо мной. Холодная. Тяжёлая. Я тонул.',VO.doc);SFX.bubbles();
  await say('Доктор Бернсон','Я закрывал глаза… и видел внизу город. Башни из зелёного камня. Углы, которых не бывает. Р\'льех.',VO.doc);
  VIS.eyesT=VIS.t;SFX.roar(4,1.6);
  await say('Доктор Бернсон','И Его. Он открыл глаза — и заговорил со мной. Без слов. Он сказал, что я Ему нужен.',VO.doc);
  whisper();await say('Шёпот','…ты… станешь… одним из нас… ты приведёшь их… ко мне…',{dur:3.6});
  VIS.upT=VIS.t;SFX.bubbles();
  await say('Доктор Бернсон','Рыбаки вытащили меня через четверть часа. И крестились: так долго под водой не живут.',VO.doc);
  await say('Доктор Бернсон','С тех пор я понимаю всё. Языки, анатомию, химию — за месяцы. Но Он приходит. Каждую ночь.',VO.doc);
  await say('Доктор Бернсон','И Он открыл мне истину: костры на пирсе — пустое. Мы должны стать Его народом — тогда жертвы прекратятся. А теперь… смотрите, что Он покажет вам.',VO.doc);
  $('fade').style.transitionDuration='900ms';$('fade').style.opacity=1;await wait(1);$('uw').style.opacity=0;R.uw=0;}
async function visionFire(){S.vision='fire';VIS.t=0;CAM.fp=true;CAM.rate=3;
  VIS.imps=[];for(let i=0;i<11;i++)VIS.imps.push({on:1,i,p:[0,20,0],v:[1,0,0],f:[1,0,0],flap:rnd()*6,r:22+rnd()*26,h:12+rnd()*14,ph:rnd()*6,sp:.25+rnd()*.25});
  VIS.run=[];for(let i=0;i<8;i++)VIS.run.push({k:i%3===0?'k':i%2?'w':'m',v:i%2,x:-50-rnd()*20,z:-6.6+rr(-1.4,1.4),sp:4+rnd()*1.5,ph:rnd()*6});
  S.camFn=()=>{const k=kf(VIS.t,0,15);CAM.ge=vLerp([-126,30,-47],[-118,21,-40],k);CAM.gt=vLerp([-42,8,40],[-52,15,48],k);};camSnap();
  $('fade').style.transitionDuration='1300ms';$('fade').style.opacity=0;SFX.roar(6,.8);await wait(2.6);
  await say(HERO,'(хрипло) Что это… Грейхейвен… Он горит. Весь…',VO.hero);await wait(1);
  await say(HERO,'Люди… кричат в огне… А над крышами — эти твари. Крылатые. И Он — там, в море. Смотрит.',VO.hero);await wait(2.6);
  $('fade').style.transitionDuration='700ms';$('fade').style.opacity=1;await wait(.9);}
async function visionEnd(){$('hud').style.display='block';S.vision=null;R.uw=0;S.drug=0;cv.style.filter='';CAM.fp=false;CAM.fov=.72;S.inside='doc';P.lie=true;
  Object.assign(DOC,{show:true,x:P.x+1.1,z:P.z+.7});DOC.rot=atan2(P.x-DOC.x,P.z-DOC.z);
  S.camFn=()=>{CAM.ge=[P.x+2.6,5.2,P.z+5.2];CAM.gt=[P.x+.5,.7,P.z];};camSnap();lids(true,1500);$('fade').style.transitionDuration='1500ms';$('fade').style.opacity=0;await wait(1.2);
  await say('Доктор Бернсон','Ну? Что вы видели? Город на дне? Зелёные башни? Его — на троне?',VO.doc);
  await say(HERO,'(едва ворочая языком) Нет… Город… Грейхейвен. Он горел. Люди горели. А Он стоял в море… и крылатые твари… над крышами…',{pitch:112,dur:5.4});
  await say('Доктор Бернсон','…Что? Нет. Нет-нет-нет. Вы путаете, это действие сыворотки, вы…',VO.doc);S.shake=.6;
  await say('Доктор Бернсон','НЕТ! ЭТО НЕВОЗМОЖНО!',{pitch:120,vol:.32,dur:1.9});
  await say('Доктор Бернсон','ОН НЕ МОГ МЕНЯ ОБМАНУТЬ! Тридцать лет… ТРИДЦАТЬ ЛЕТ я служил Ему!',{pitch:126,vol:.32,dur:3.4});DOC.flee=true;
  await say('Доктор Бернсон','ЭТО ВСЁ ЛОЖЬ! ЛО-О-ОЖЬ!!!',{pitch:136,vol:.34,dur:2.2});scream(1.6);await wait(1.4);SFX.door();await wait(1);DOC.show=false;
  P.lie=false;await wait(.6);
  await say(HERO,'Он сбежал… Голова раскалывается. Что это было? Бред от его отравы — или предупреждение?',VO.hero);
  await say(HERO,'Неважно. Если у этого «доктора» и есть ответы — они наверху. В кабинете, у входа, лестница на второй этаж.',VO.hero);
  bellToll(5);await wait(1.4);
  await say(HERO,'Колокол… Похоже, Бернсон поднял их всех. Теперь на улицах будет только культ.',VO.hero);
  S.camFn=null;CAM.rate=1.6;setTimeout(()=>CAM.rate=5,2000);stage2();S.mode='play';}

// --- stage 2: the curfew — the townsfolk are behind locked doors, the cult hunts in the streets
{const pairs=[[[-100,-6],[-100,40],[-64,42.6],[-64,-6]],[[-130,-7.4],[-64,-7.4]],[[-110,-12],[-110,-30],[-122,-29],[-110,-12]]];
 mkE('c',-100,-6,pairs[0]);mkE('c',-130,-7.4,pairs[1]);const b=mkE('c',-90,8,[[-90,8],[-82,0],[-98,0]]);mkE('c',-89,7,null,{leader:b,off:[1.3,-1.3],grp:b.grp});mkE('v',-110,-12,pairs[2]);}
function stage2(skip){S.stalk=false;S.curfew=true;S.tailed=false;for(const s of SK)s.on=false;DOC.show=false;
  startHunt();S.escaped=true;S.cp=[-110,-29];S.cpRoom=null;for(let i=0;i<10;i++)alarmLight();
  setObj('Осмотрите второй этаж дома доктора — лестница в кабинете, у входа.');S.mark=[271.4,-29.4,'doc'];
  if(!skip)toast('<b>Комендантский час.</b> Жители заперлись по домам, на улицах — только культ. Жителей можно оглушить, от культистов с факелами — только бежать и прятаться.',8);}

// --- per-frame: always (cutscenes too) and in play mode
function stageTick(dt){
  if(FOUND.on){FOUND.t+=dt;}dbrTick(dt);auRoom();cellarTick(dt);act2Tick(dt);act3Tick(dt);
  if(DOC.syr)DOC.arm=min(1,DOC.arm+dt*1.3);if(DOC.stab>0&&DOC.stab<1)DOC.stab=min(1,DOC.stab+dt*5);
  if(DOC.show){DOC.mv=0;if(DOC.flee){if(hypot(269-DOC.x,-28.2-DOC.z)>.4)goDir(DOC,269,-28.2,4.6,dt);}else if(DOC.walk&&hypot(DOC.walk[0]-DOC.x,DOC.walk[1]-DOC.z)>.15)goDir(DOC,DOC.walk[0],DOC.walk[1],1.6,dt);}
  if(S.vision){VIS.t+=dt;}
  if(S.drug){const t=S.t;cv.style.filter='blur('+(.8+.7*sin(t*1.3)).toFixed(2)+'px) saturate(1.6) hue-rotate('+(sin(t*.6)*28).toFixed(1)+'deg)';}
  if(!S.curfew&&S.explore&&!FIN.on)for(const c of CIV)updCiv(c,dt);}
function stage(dt){act2Play(dt);act3Play(dt);
  if(S.stalk){SKFt-=dt;S.tailed=SK.some(s=>s.on&&s.state==='tail');if(S.tailed&&SKFt<=0){SKFt=.4;SKF=field(P.x,P.z);}
    for(const s of SK)updSK(s,dt);if(S.guardsMet&&!S.inDoc)for(const g of DGU)updGuard(g,dt);
    if(!S.carSeen&&!S.inside&&hypot(P.x+38,P.z+18)<17)carScene();
    if(!S.guardsMet&&!S.inside&&hypot(P.x-DOOR[0],P.z-DOOR[1])<24)guardScene();}
  // townsfolk speak when the hero walks up to them (stage 1)
  if(!S.curfew&&!S.inside&&!sub)for(const c of CIV){c.bt-=dt;if(c.bark&&c.bt<=0&&hypot(P.x-c.x,P.z-c.z)<2.8){c.bt=45;say(c.name,c.bark,VO[c.k==='w'?'wom':c.k==='k'?'kid':'vil']);break;}}}
function drawStage(){
  if(S.vision==='sea'){if(!M_vis){M_vis=mesh(VG);M_rays=mesh(VR);}draw(M_vis,null,.03);draw(M_rays,null,0,.22);const b=modelMesh('boat_a');if(b)draw(b,mM(mT(VX,-.35,2.5),mRy(.3),mS(1.3,1.3,1.3)),.03);
    const u=VIS.eyesT?4+min(5,(VIS.t-VIS.eyesT)*.7):3,sp=FIN.pose,sm=FIN.M;FIN.pose=cthPose(u);Object.assign(FIN.pose,{x:VX,y:-70,z:102,sc:1.1});FIN.M=cthMats(FIN.pose);drawCthulhu();FIN.pose=sp;FIN.M=sm;
    light(VX,-2,4,26,[.5,.85,.85]);light(VX-12,-36,82,42,[.2,.8,.5]);light(VX+16,-30,104,42,[.2,.7,.5]);return;}
  if(S.vision==='fire'){const t=VIS.t,sp=FIN.pose,sm=FIN.M;FIN.pose=cthPose(24);Object.assign(FIN.pose,{x:-34,y:-12,z:96,sc:2.1});FIN.M=cthMats(FIN.pose);drawCthulhu();FIN.pose=sp;FIN.M=sm;
    HOUSES.forEach((b,i)=>{if(i%2&&i>3)return;const cx=(b[0]+b[2])/2,cz=(b[1]+b[3])/2,o=b[4],y=(o.h||3.2)+(o.rh||2.2)*.6,k=1+sin(S.t*13+i)*.15;
      draw(M_flame,mM(mT(cx,y-1,cz),mRy(S.t*2+i),mS(9*k,13*k*(1+sin(S.t*7+i)*.2),9*k)),0);if(i%3===0)light(cx,y+2,cz,22,[1,.5,.18]);
      if(Math.random()<.7)PT.add(5,cx+rr(-3,3),y+rr(0,3),cz+rr(-3,3),rr(-1,1)+2,3+Math.random()*3,rr(-1,1),.2+Math.random()*.3,2.2,[1,.5+Math.random()*.3,.15,.9],-.6);});
    for(const im of VIS.imps){const a=t*im.sp+im.ph,c=[-60,0,8],np=[c[0]+cos(a)*im.r,im.h+sin(a*2)*3,c[2]+sin(a)*im.r*.7];im.v=vSc(vSub(np,im.p),60);im.p=np;im.flap+=.25;drawImp(im);}
    for(const r of VIS.run){const x=r.x-t*r.sp;drawChar(r.k==='w'?CHF.wom[r.v]:r.k==='k'?CHF.kid[r.v]:CH.v[FM[r.v]],x,0,r.z,-PI/2,{ph:t*r.sp*2.3+r.ph,mv:1,aR:-2.4+sin(t*14+r.ph)*.4,aL:-2.5});}
    if(Math.random()<.05)tone(500+Math.random()*450,.7+Math.random()*.6,{type:'sawtooth',vol:.05,to:300+Math.random()*150,lp:2200});if(Math.random()<.2)noise(.12,{f:900+Math.random()*1500,type:'bandpass',q:1,vol:.08});
    return;}
  if(FOUND.on){const t=FOUND.t;for(const[i,m]of FOUND.men.entries()){if(t>2.8&&t<4.6)continue;const k=kf(t,0,2.8),x=lerp(m.x,-13.2,k),z=lerp(m.z,-11.8,k),out=t>4.6;
    drawChar(CH.v[m.v],out?-13.2+(t-4.6)*(i?3.6:-3.6):x,0,out?-11.2+(t-4.6)*1.6:z,out?(i?PI/2:-PI/2):PI,{ph:t*7,mv:1});}}
  if(S.inside==='doc'){for(const[x,z,r,i]of DOCDEAD)drawChar(CH.v[DEAD[i]],x,0,z,r,{lie:true,noBlob:true,aR:.3,aL:.5});if(DOC.show)drawChar(CHF.doc,DOC.x,0,DOC.z,DOC.rot,{ph:DOC.ph,mv:DOC.mv,aR:DOC.flee?-2.5+sin(S.t*12)*.4:DOC.syr?lerp(lerp(-.15,-1.5,eas(DOC.arm)),-.7,eas(DOC.stab)):null,eR:DOC.syr?lerp(.9,.15,eas(DOC.stab)):null,aRz:DOC.syr?.1-.3*eas(DOC.stab):0,aL:DOC.flee?-2.4:null,armed:DOC.syr,wpn:M_syr,cR:DOC.syr?1.5:null});}
  if(S.inside||FIN.on||S.mode==='finale')return;
  if(!S.curfew&&S.explore){const cx=CAM.tgt[0],cz=CAM.tgt[2];for(const c of CIV)if(abs(c.x-cx)<46&&abs(c.z-cz)<40)drawCiv(c);}
  if(S.stalk){for(const s of SK)if(s.on)drawChar(CH.v[s.v],s.x,0,s.z,s.rot,{ph:s.ph,mv:s.mv});if(S.guardsMet&&!S.inDoc)for(const g of DGU)drawChar(CH.v[g.v],g.x,0,g.z,g.rot,{ph:g.ph,mv:g.mv});}}
function stageHud(c,w,h){if(S.mode!=='play'||!S.stalk||S.inside)return;c.textAlign='center';c.textBaseline='middle';
  const mark=(x,z,t,col)=>{const p=proj(x,2.5,z);if(p.w<=0)return;c.font='bold 26px Georgia';c.lineWidth=5;c.strokeStyle='#0b1416';c.strokeText(t,p.x*w,p.y*h);c.fillStyle=col;c.fillText(t,p.x*w,p.y*h);};
  for(const s of SK){if(!s.on)continue;if(s.state==='tail')mark(s.x,s.z,'◉','#f0c060');else if(s.aw>.15||s.state==='search')mark(s.x,s.z,'?','#d9cdb0');}
  if(S.guardsMet&&!S.inDoc)for(const g of DGU){if(g.aw>.15)mark(g.x,g.z,'!','#ff6a5a');else if(g.state==='look'||g.state==='go'||g.state==='wait')mark(g.x,g.z,'?','#d9cdb0');}}
