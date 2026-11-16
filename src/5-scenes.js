// ================= SCENES: intro drive, motel, finale, credits, main loop =================
const M_car=(()=>{const g=new Geo(.04),c=H('#80858a'),d=H('#5e6367'),k=H('#15191b');g.bx(0,.35,0,1.8,.62,4.2,c);g.bx(0,.97,-.35,1.62,.62,2.2,d);g.bx(0,1.03,-.35,1.66,.36,1.9,H('#2a4248',.25));g.bx(0,1.6,-.35,1.5,.07,2.1,c);
  for(const sx of[-.92,.92])for(const sz of[-1.35,1.35])g.at(mM(mT(sx,.36,sz),mRz(PI/2)),()=>g.cyl(0,-.13,0,.36,.36,.26,8,k));
  g.bx(-.6,.62,2.11,.32,.2,.05,H('#ffe9a8',1));g.bx(.6,.62,2.11,.32,.2,.05,H('#ffe9a8',1));g.bx(-.65,.62,-2.11,.3,.14,.05,H('#d0352a',.9));g.bx(.65,.62,-2.11,.3,.14,.05,H('#d0352a',.9));g.bx(0,.32,2.15,1.84,.14,.1,k);g.bx(0,.32,-2.15,1.84,.14,.1,k);return mesh(g);})();
const M_fogb=(()=>{const g=new Geo(0);g.sph(0,0,0,1,.5,1,[.55,.78,.76,1],8,4);return mesh(g);})();
const M_door=(()=>{const g=new Geo(.04);g.bx(0,0,0,1.2,1.9,.12,PAL.woodD);return mesh(g);})();
const CAR={x:-28,z:-292,rot:0,parked:false,wp:[[-28,-34],[-28.6,-25],[-31,-20],[-34.5,-18.2],[-38,-18]],wi:0,sp:4.4};
function updCar(dt){if(CAR.parked)return;const w=CAR.wp[CAR.wi],dx=w[0]-CAR.x,dz=w[1]-CAR.z,d=hypot(dx,dz);if(d<.7){if(++CAR.wi>=CAR.wp.length){parkCar();return;}return;}
  const sp=CAR.wi>0?2.6:CAR.sp;faceTo(CAR,atan2(dx,dz),dt,CAR.wi>0?2.2:4);CAR.x+=sin(CAR.rot)*sp*dt;CAR.z+=cos(CAR.rot)*sp*dt;}
function parkCar(){CAR.parked=true;CAR.x=-38;CAR.z=-18;CAR.rot=-PI/2;const c=col(-40.2,-19,-35.8,-17,1.4);blockRect(c);if(AU.eng){AU.eng.gain.setTargetAtTime(0,AU.ctx.currentTime,.4);}}
const DRIVE=[['col','Эдвард, ты хоть понимаешь, который час? Куда тебя понесло на ночь глядя?'],['hero','В Грейхейвен. Рыбацкая деревушка на побережье — её даже на новых картах нет.'],['col','И что там такого, ради чего стоит гнать сквозь этот туман?'],
 ['hero','За десять лет в тех краях пропало двадцать три человека. Все — приезжие. И все следы обрываются у этой деревни.'],['hero','Мне написал старый моряк. Говорит, местные — не просто нелюдимые рыбаки. Это секта.'],['col','Секта? Брось. Очередная байка для туристов.'],
 ['hero','Он пишет, что чужаков там приносят в жертву. Какому-то демону из моря… Они зовут его «Спящий».'],['col','Господи… Тогда разворачивайся. Никакая статья не стоит —'],['hero','Письмо пришло неделю назад, Уолтер. А вчера моряка нашли на берегу. Мёртвым. Я должен увидеть всё сам.'],
 ['col','Эдв… тебя… плохо слыш… ш-ш-ш…'],['hero','Уолтер? Алло?.. Связь пропала. Ну и туман. А вот и мотель.']];
async function intro(){S.mode='drive';$('skip').style.display='block';$('gear').style.display='block';S.camFn=()=>{CAM.ge=[CAR.x+6,21,CAR.z+16];CAM.gt=[CAR.x,0,CAR.z+2];};S.focus=()=>[CAR.x,0,CAR.z+3];camSnap();
  if(AU.ctx){const c=AU.ctx,o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';o.frequency.value=58;f.type='lowpass';f.frequency.value=190;g.gain.value=.11;o.connect(f);f.connect(g);g.connect(AU.sfx);o.start();AU.eng=g;}
  fade(0,2200);await wait(2);
  for(const[w,t]of DRIVE)await say(w==='hero'?HERO:'Уолтер (по телефону)',t,VO[w]);
  while(!CAR.parked&&!S.fast)await wait(.2);
  if(S.fast){$('fade').style.transitionDuration='0ms';$('fade').style.opacity=1;if(sub)sub.res();}
  if(!CAR.parked)parkCar();await wait(.8);
  S.fast=false;$('skip').style.display='none';P.vis=true;P.x=-37;P.z=-15.8;P.rot=2.4;S.camFn=null;S.focus=null;CAM.rate=1.6;setTimeout(()=>CAM.rate=5,2500);
  S.hud=true;$('hud').style.display='block';setObj('Войдите в мотель и снимите комнату на ночь.');S.mode='play';SFX.door();fade(0,900);
  toast('<span class="kb">WASD</span>— идти, <span class="kb">Shift</span>— бежать, <span class="kb">E</span>— действие',6);}
$('skip').onclick=()=>{S.fast=true;if(sub)sub.res();const w=waits;waits=[];w.forEach(x=>x.r());};
$('start').onclick=()=>{auInit();$('title').style.display='none';intro();};

// --- motel story
let doorShut=false;
addInter(-43.5,-32.1,1.8,'Поговорить с хозяином мотеля',async()=>{S.mode='talk';P.rot=PI;
  await say(HERO,'Добрый вечер. Мне нужна комната на одну ночь.',VO.hero);await say('Хозяин мотеля','…Приезжий. Мы тут приезжих не жалуем.',VO.own);await say(HERO,'Я заплачу вперёд.',VO.hero);
  await say('Хозяин мотеля','Все вы платите. Третья комната, в конце коридора. И ночью по деревне не шляйтесь. Туман… мало ли что.',VO.own);
  S.booked=true;S.mode='play';setObj('Идите в комнату №3 — налево, в конец коридора.');SFX.pick();},()=>!S.booked);
addInter(-55.6,-34,1.5,'Заглянуть в дыру в стене',async()=>{S.mode='talk';await fade(1,500);owner.x=-50.3;owner.z=-33;owner.rot=-2.4;con.x=-51.6;con.z=-35.4;con.rot=.7;
  CAM.fp=true;S.camFn=()=>{CAM.ge=[-54.7,1.42,-34];CAM.gt=[-51.4,1.3,-34.2];};camSnap();$('peek').style.opacity=1;await fade(0,700);
  await say('Хозяин мотеля','Он один. Никто не знает, что он здесь.',VO.own);await say('Житель','Звёзды встанут сегодня. Жрец сказал: жертва нужна до рассвета.',VO.vil);
  await say('Хозяин мотеля','Значит, газетчик и ляжет на алтарь. Спящий получит своё.',VO.own);await say('Житель','Берём его сейчас, пока не лёг. Я позову остальных.',VO.vil);
  await fade(1,500);$('peek').style.opacity=0;CAM.fp=false;S.camFn=null;camSnap();S.peeked=true;await fade(0,600);SFX.door();S.shake=.2;
  await say(HERO,'Они говорят обо мне… В дверь уже ломятся. Окно!',VO.hero);setObj('Бегите через окно в дальней стене!');S.mode='play';},()=>S.inRoom&&!S.peeked);
addInter(-58.5,-37.4,1.6,'Вылезти в окно',async()=>{S.mode='talk';await fade(1,450);P.x=-58.5;P.z=-39.5;P.rot=PI;S.escaped=true;S.cp=[-58.5,-40.5];
  owner.x=-44;owner.z=-27.6;con.x=-47;con.z=-23;for(const e of EN){e.active=true;e.hx=e.x;e.hz=e.z;}camSnap();noise(.4,{f:1800,vol:.2,to:400});await fade(0,600);S.mode='play';
  setObj('Найдите знаки культа: 0 / 5<br><span style="font-size:15px">Машина выведена из строя. Единственный путь из деревни — катер, ключи от которого заперты в конторе начальника порта.</span>');
  say(HERO,'Нужно понять, с чем я имею дело, — и найти способ выбраться отсюда.',VO.hero).then(()=>toast('<span class="kb">C</span>— пригнуться: за ящиками, бочками и лодками вас не видно. Жителей можно оглушить, от <b>культистов с факелами</b> — только бежать.',9));},()=>S.peeked&&!S.escaped);
addInter(-38,-18,2.5,'Осмотреть машину',()=>toast('Все четыре шины проколоты. На машине отсюда уже не уехать.',4),()=>S.escaped);
function story(dt){
  if(!S.escaped){for(const[e,t]of[[con,'Чего уставился, городской? Катился бы ты отсюда.'],[loaf,'*сплёвывает под ноги* Ещё один…']]){const d=hypot(e.x-P.x,e.z-P.z);if(d<5&&!S.peeked)faceTo(e,atan2(P.x-e.x,P.z-e.z),dt,3);if(d<3&&!e.barked&&!sub){e.barked=1;say('Житель',t,VO.vil);}}
    if(!S.peeked)faceTo(owner,atan2(P.x-owner.x,P.z-owner.z),dt,2);}
  if(S.booked&&!S.inRoom&&P.x<-55.5&&P.z<-30){S.inRoom=true;doorShut=true;blockRect(col(-59.1,-29.15,-57.9,-28.85,3));SFX.door();(async()=>{S.mode='talk';
    await say(HERO,'Ну и дыра. Сыростью и рыбой несёт… Постой. Голоса за стеной?',VO.hero);setObj('Осмотрите дыру в стене справа.');S.mode='play';})();}
}

// --- Cthulhu
const CTH=(()=>{const g=new Geo(.12),c=H('#143233'),c2=H('#0f2729'),c3=H('#1d4543');
  const parts=[[0,20,2,14,18,11],[0,36,0,17,12,12],[0,43,6,13,9,10],[0,53,-5,8.5,8,9.5]];
  g.sph(0,20,2,14,18,11,c,9,6);g.sph(0,36,0,17,12,12,c2,9,6);g.sph(0,43,6,13,9,10,c2,8,5);g.sph(0,4,3,15,10,12,c2,8,4);
  for(const s of[-1,1]){g.sph(s*17,40,0,7.5,6.5,7,c,7,5);g.at(mM(mT(s*20,38,-1),mRz(s*.22),mRx(.2)),()=>g.sph(0,-9,0,5,11.5,5.2,c2,7,5));g.at(mM(mT(s*24,20,-4),mRx(.55)),()=>g.sph(0,-8,0,4.2,10.5,4.4,c,7,5));
    g.sph(s*24,4,-12,4.6,3.6,5.2,c2,6,4);for(let k=-1;k<=1;k++)g.at(mM(mT(s*24+k*2.6,2.5,-15),mRx(-2.3)),()=>g.cyl(0,0,0,1.1,0,6.5,5,c3));
    g.at(mM(mT(s*3.7,52.3,-13.9),mRz(-s*.4)),()=>g.sph(0,0,0,1.9,.75,.9,H('#ff3018',1),6,4));
    const A=[s*8,44,10],B=[s*13,26,11],T=[[s*30,92,22],[s*48,66,24],[s*46,36,20]];const mem=H('#11302f'),pts=[T[0],T[1],T[2],B];
    for(let k=0;k<3;k++){g.tri(A,pts[k],pts[k+1],mem);g.tri(A,pts[k+1],pts[k],mem);}
    for(const t of T){const d=[t[0]-A[0],t[1]-A[1],t[2]-A[2]],len=hypot(d[0],d[1],d[2]);g.at(mM(mT(A[0],A[1],A[2]),mAlignY(d)),()=>g.cyl(0,0,0,1.5,.1,len*1.05,5,c2));}}
  g.sph(0,53,-5,8.5,8,9.5,c,8,6);g.sph(0,58.5,-.5,7.6,6.4,9.2,c3,8,5);g.at(mT(0,54.6,-13.2),()=>g.box(0,0,0,12,1.5,2.4,c2));
  for(let i=0;i<64;i++){const p=parts[floor(rnd()*4)],th=rr(.5,2.3),ph=rr(0,2*PI),d=[sin(th)*cos(ph),cos(th),sin(th)*sin(ph)],q=[p[0]+d[0]*p[3]*.95,p[1]+d[1]*p[4]*.95,p[2]+d[2]*p[5]*.95];if(q[2]<-9&&q[1]>44)continue;
    if(rnd()<.6)g.at(mM(mT(q[0],q[1],q[2]),mAlignY([d[0],d[1]-.5,d[2]])),()=>g.cyl(0,-.5,0,rr(.8,1.5),0,rr(3,7.5),5,c3));else g.sph(q[0],q[1],q[2],rr(1.2,2.4),rr(1.2,2.4),rr(1.2,2.4),c3,5,4);}
  for(let i=0;i<12;i++){const s=i%2?1:-1;let x=s*rr(8,21),y=rr(28,42),z=rr(-9,8);let r=rr(1.3,2);for(let k=0;k<7;k++){g.sph(x,y,z,r,r*1.5,r,k%2?c:c2,5,4);y-=r*2.1;x+=s*rr(-.3,1);z+=rr(-.9,.5);r*=.86;}}
  const sg=new Geo(.1);sg.cyl(0,-4,0,.82,1,4,6,c);sg.sph(0,0,0,1,1,1,c2,6,4);
  const h=new Geo(.1);h.sph(0,0,0,4.6,2.2,5,c2,7,5);for(let f=-1.5;f<=1.5;f++){let y=-.5,z=-4.5;for(let k=0;k<3;k++){h.sph(f*2.3,y,z,1.2,1.3,1.6,c,5,4);y-=1.6+k*.5;z-=1.6-k*.9;}h.at(mM(mT(f*2.3,y,z+.6),mRx(PI+.5)),()=>h.cyl(0,0,0,.8,0,3,5,c3));}
  h.at(mM(mT(0,1,3),mAlignY([0,.52,.85])),()=>h.cyl(0,0,0,4,6,85,7,c2));
  return{body:mesh(g),seg:mesh(sg),hand:mesh(h)};})();
const FIN={on:false,rise:0,hand:-1,grab:false,shake:0,t:0,cult:[],armUp:0,hx:10,hy:60,hz:110};
function drawCthulhu(){const y=-76+70*(FIN.rise<1?1-Math.pow(1-FIN.rise,2):1)+sin(S.t*.5)*.6,base=mM(mT(10,y,150),mRz(sin(S.t*.33)*.02));draw(CTH.body,base,.3);
  for(let i=0;i<8;i++){let M=mM(base,mT((i-3.5)*1.9,48.2-abs(i-3.5)*.35,-12.6-(i%2)*1.2),mRz((i-3.5)*.07),mRx(-.28));const L=6+(i%3);
    for(let k=0;k<L;k++){M=mM(M,mRx(sin(S.t*.9+i*1.3+k*.6)*.16+(k>3?.14*(i%2?1:-1):.03)),mRz(sin(S.t*.7+i+k*.5)*.12));const sc=1.25-k*.12;draw(CTH.seg,mMul(M,mS(sc,1,sc)),.25);M=mMul(M,mT(0,-3.9,0));}}
  light(10,y+53,132,70,[.9,.12,.06]);
  if(FIN.hand>=0)draw(CTH.hand,mT(FIN.hx,FIN.hy,FIN.hz),.25);}
async function finale(){S.mode='finale';S.fear=2;await say(HERO,'Они ждали меня с самого начала… Нужно бежать. Сейчас же —',VO.hero);
  SFX.thud();S.shake=.8;$('flash').style.opacity=1;$('fade').style.transitionDuration='90ms';$('fade').style.opacity=1;await wait(.4);toast('Удар по лбу. Темнота.',2.5);await wait(2.8);
  // stage
  S.hud=false;$('bars').style.display=$('obj').style.display=$('prompt').style.display=$('det').style.display='none';const f=$('face');f.style.width=f.style.height='150px';f.style.left='auto';f.style.right='16px';f.style.bottom='auto';f.style.top='16px';
  for(const e of EN)e.active=false;owner.show=con.show=loaf.show=false;FIN.on=true;P.vis=false;pierGate.off=true;
  for(let i=0;i<10;i++){const a=.55+i/9*(2*PI-1.1);FIN.cult.push({x:10+sin(a)*5.6,z:76+cos(a)*5.2,rot:a+PI,ph:i*1.7});}
  let ang=2.7;S.camFn=()=>{CAM.ge=[10,1.75,76.4];CAM.gt=[10+sin(ang)*4,2.1+cos(ang*.5)*.6,76.4+cos(ang)*4];};CAM.fp=true;CAM.fov=.95;camSnap();S.focus=()=>CAM.eye;FIN.pan=dt=>{ang=max(.12,ang-dt*.3);};
  fade(0,3000);await wait(1.2);await say(HERO,'Голова… Где я? Верёвки… Я не могу пошевелиться!',VO.hero);
  FIN.chant=true;await say('Культисты','Пх\'нглуи мглв\'нафх Ктулху Р\'льех вгах\'нагл фхтагн!',VO.cult);FIN.armUp=1;
  await say('Жрец','Звёзды встали верно! Спящий в глубине — прими чужую кровь и восстань!',{pitch:58,vol:.24});
  // the rise
  SFX.rumble(16);FIN.shake=.25;await wait(1.6);await fade(1,350);FIN.pan=null;CAM.fp=false;CAM.fov=.98;FIN.rising=true;
  S.camFn=()=>{const r=FIN.rise;CAM.ge=[5.5,1.4,56];CAM.gt=[10,4+r*19,110];};camSnap();await fade(0,500);
  say(HERO,'Море… оно поднимается… Господи, что это?!',VO.hero);await wait(4.2);SFX.roar();FIN.shake=.7;S.fear=3;await wait(5.5);FIN.shake=.35;
  say('Культисты','Ктулху фхтагн! Ктулху фхтагн!',VO.cult);await wait(3.2);SFX.roar();FIN.shake=.6;
  // the hand
  FIN.hand=0;if(AU.ctx){tone(520,2.6,{type:'sawtooth',vol:.14,to:880,lp:2400});tone(540,2.6,{type:'sawtooth',vol:.1,to:820,lp:2400});}say(HERO,'НЕТ! НЕ-Е-ЕТ!..',{dur:3});
  await wait(3.4);FIN.grab=true;S.shake=1;SFX.thud();FIN.hand=1;await wait(4.4);SFX.splash();await fade(1,1400);FIN.shake=0;await wait(1.2);credits();}
function updFinale(dt){if(!FIN.on)return;FIN.t+=dt;if(FIN.pan)FIN.pan(dt);if(FIN.rising)FIN.rise=min(1,FIN.rise+dt/13);S.shake=max(S.shake,FIN.shake);
  if(FIN.chant){FIN.ct=(FIN.ct||0)-dt;if(FIN.ct<=0){FIN.ct=2.2;for(const p of[58,66,74])mumble(2,p,false,.07,true);}}
  if(FIN.hand>=0&&!FIN.grab){FIN.hand=min(1,FIN.hand+dt/3.2);const t=FIN.hand*FIN.hand*(3-2*FIN.hand);FIN.hx=10;FIN.hy=lerp(46,4.4,t);FIN.hz=lerp(112,77.5,t);}
  else if(FIN.grab){FIN.gt=(FIN.gt||0)+dt/4.2;const t=min(1,FIN.gt)**2;FIN.hy=lerp(4.4,-14,t)+sin(min(1,FIN.gt)*PI)*16;FIN.hz=lerp(77.5,118,t);}}
function drawFinale(){if(!FIN.on)return;drawCthulhu();
  for(const c of FIN.cult){const u=FIN.armUp?-2.75+sin(S.t*2+c.ph)*.12:-1.25;const m=drawChar(CH.c,c.x,0,c.z,c.rot,{armed:true,aR:u,aL:FIN.armUp?u+.1:-.2});const f=mP(m,[0,-.74,.9]);light(f[0],f[1],f[2],8.5+sin(S.t*11+c.ph),[1,.5,.18]);}
  if(FIN.grab)drawChar(CH.hero,FIN.hx,FIN.hy-2.6,FIN.hz-2.5,PI,{lie:true,aR:-2.6,aL:-2.4});else if(!CAM.fp)drawChar(CH.hero,10,1.14,75.1,0,{lie:true,noBlob:true,aR:-2.9+sin(S.t*9)*.15,aL:-2.9});}
function credits(){S.mode='credits';$('hud').style.display='none';$('gear').style.display='none';$('sub').style.display='none';const c=$('credits');c.style.display='flex';const n=EGGS.filter(e=>S.eggs[e.id]).length,mins=Math.round((S.t-S.t0)/60);
  $('roll').innerHTML='<h1>ЗОВ ИЗ ТУМАНА</h1><div class="hand" style="font-size:30px;color:#c4b693">Эдварда Крейна больше никто не видел.<br>Через неделю в редакцию пришло письмо от «старого моряка» —<br>на имя нового репортёра.</div>'+
   '<h4>По мотивам</h4>Г. Ф. Лавкрафт — «Зов Ктулху» (1928)<h4>В ролях</h4>Эдвард Крейн, журналист<br>Уолтер, голос в трубке<br>Хозяин мотеля<br>Жители Грейхейвена<br>Жрец и братья в робах<br>и Тот, кто спит в Р\'льехе'+
   '<h4>Ваше расследование</h4>Знаков культа найдено: 5 / 5<br>Находок-отсылок: '+n+' / '+EGGS.length+'<br>Потерь сознания: '+S.deaths+'<br>Время в деревне: ~'+mins+' мин'+
   '<h4>Прототип</h4>Графика, звук и код собраны процедурно, без единого файла ассетов<br><br><br><span class="hand" style="font-size:34px">«Не мертво то, что в вечности пребудет…»</span><br><br><br>Спасибо за игру';
  const r=$('roll');let y=innerHeight;const hgt=r.offsetHeight;const step=()=>{y-=innerHeight/900*1.6;r.style.top=y+'px';if(y>-hgt+innerHeight*.55)requestAnimationFrame(step);else $('again').style.display='block';};step();setTimeout(()=>$('again').style.display='block',12000);}
$('again').onclick=()=>{try{location.reload();}catch(e){}};

// --- frame
function drawAll(){
  draw(M_ground,null,0);draw(M_world,null,.035);draw(M_sea,mT(0,-.55+sin(S.t*.6)*.06,0),0);
  for(const l of LAMPS)light(l[0],l[1],l[2],l[3]*(1+sin(S.t*8+l[0])*.03),l[4]);
  for(const e of EN){if(!e.active&&e.show===false)continue;if(!e.active&&e.grp>3)continue;const c=e.kind==='c';
    let aR=c?-1.25:e.state==='chase'?-.7:null;if(e.wind>0)aR=-2.7;if(e.atk>0){e.atk-=.016;aR=lerp(.4,-2.6,e.atk/.3);}
    const m=drawChar(c?CH.c:CH.v[e.v],e.x,0,e.z,e.rot,{armed:c||e.active,ph:e.ph,mv:e.mv,aR,lie:e.state==='ko'});
    if(c&&e.state!=='ko'){const f=mP(m,[0,-.74,.9]);light(f[0],f[1],f[2],9+sin(S.t*12+e.ph)*.7,[1,.52,.2]);}}
  if(P.vis&&!CAM.fp){let aR=null,aL=null;if(P.atk>0){const t=1-P.atk/.28;if(P.shove){aR=aL=lerp(-.6,-1.6,sin(t*PI));}else aR=lerp(-2.5,.5,t);}else if(P.block){aR=-1.9;aL=-1.7;}
    drawChar(CH.hero,P.x,0,P.z,P.rot,{armed:!!S.weapon,ph:P.ph,mv:P.mv,aR,aL,crouch:S.crouch,lie:P.lie});}
  draw(M_car,mM(mT(CAR.x,0,CAR.z),mRy(CAR.rot)),.04);if(!CAR.parked){const fx=CAR.x+sin(CAR.rot)*7,fz=CAR.z+cos(CAR.rot)*7;light(fx,1.5,fz,15,[1,.9,.6]);light(CAR.x,3,CAR.z,7,[.5,.5,.45]);}
  if(doorShut)draw(M_door,mT(-58.5,0,-29),.03);
  if(S.escaped&&!FIN.on){for(const p of pickups)if(!p.taken)draw(p.t==='m'?M_med:M_wpn,mM(mT(p.x,.55+sin(S.t*2+p.x)*.08,p.z),mRy(S.t*1.2)),.03);
    for(const z of PZ){if(S.solved[z.i])continue;const dim=z.i===5&&S.solved.slice(0,5).some(v=>!v);draw(M_beacon,mM(mT(z.x,2.7+sin(S.t*2+z.i)*.15,z.z),mRy(S.t*1.5),mS(dim?.5:1,dim?.5:1,dim?.5:1)),0);if(!dim)light(z.x,2.2,z.z+.8,6.5,[.25,.8,.7]);}}
  for(const e of EGGS){if(S.eggs[e.id]||!(e.id==='book'?S.inRoom:S.escaped)||FIN.on)continue;draw(M_egg,mM(mT(e.x,e.y+.55+sin(S.t*2.4+e.x)*.07,e.z),mRy(S.t*1.8)),0);}
  drawFinale();
  if(!FIN.on){const f=R.focus;for(let i=0;i<16;i++){const bx=((i*37.7+S.t*(.5+i%3*.25))%56)-28,bz=((i*23.3+S.t*.18*(i%2?1:-1))%44+44)%44-24;draw(M_fogb,mM(mT(f[0]+bx,1.2+i%4*.5,f[2]+bz),mS(7+i%5*2,1,4+i%3*2)),0,.05+.02*(i%3));}}}
let last=0;
function frame(now){const dt=min(.05,(now-last)/1000||.016);last=now;
  if(!S.pause){S.t+=dt;tickWaits(dt);tickSub(dt);
    if(S.mode==='drive')updCar(dt);
    if(S.mode==='play'){updPlayer(dt);story(dt);PFt-=dt;if(PFt<=0){PFt=.3;PF=EN.some(e=>e.active&&e.state==='chase')?field(P.x,P.z):null;}for(const e of EN)updEnemy(e,dt);}
    updFinale(dt);if(S.hud||S.mode==='finale')updHud(dt);}
  camGoal();const k=S.fast?1:1-exp(-dt*CAM.rate);for(let i=0;i<3;i++){CAM.eye[i]=lerp(CAM.eye[i],CAM.ge[i],k);CAM.tgt[i]=lerp(CAM.tgt[i],CAM.gt[i],k);}
  S.shake=max(0,S.shake-dt*1.4);const sh=S.shakeOn?S.shake*.55:0,eye=[CAM.eye[0]+(Math.random()-.5)*sh,CAM.eye[1]+(Math.random()-.5)*sh,CAM.eye[2]+(Math.random()-.5)*sh];
  if(FIN.on){const g=FIN.rising?min(1,FIN.rise*3):0;R.fogMin=0;R.fog=[lerp(.09,.17,g),lerp(.19,.34,g),lerp(.2,.35,g)];R.fogD=S.fogK/105;R.amb=[.42,.56,.58];}else{R.fogD=S.fogK/(S.mode==='drive'?30:23);R.fogMin=.07*S.fogK;}
  R.focus=S.focus?S.focus():[P.x,0,P.z];drawAll();render(eye,CAM.tgt,CAM.fov);hud2d();requestAnimationFrame(frame);}
// title backdrop
$('title').style.display='flex';S.camFn=()=>{CAM.ge=[-23,15,-279];CAM.gt=[-28,0,-292];};S.focus=()=>[-28,0,-289];camSnap();drawFace();requestAnimationFrame(frame);
// debug / test hooks
window.DBG={R,S,P,EN,CAM,FIN,PB,PZ,cols,blocked,field,finale,solvePuzzle,openPuzzle,closePuzzle,
  toPlay(){S.fast=true;if(sub)sub.res();const w=waits;waits=[];w.forEach(x=>x.r());setTimeout(()=>{S.fast=false;S.booked=S.inRoom=S.peeked=S.escaped=true;P.x=-58.5;P.z=-40.5;for(const e of EN){e.active=true;}owner.x=-44;owner.z=-27.6;$('fade').style.opacity=0;setObj('Найдите знаки культа: 0 / 5');},300);}};
</script>
</body>
</html>
