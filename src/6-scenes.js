// ================= SCENES: intro drive, motel, finale, credits, main loop =================
const M_car=modelMesh('car')||(()=>{const g=new Geo(.04),c=H('#80858a'),d=H('#5e6367'),k=H('#15191b');g.bx(0,.35,0,1.8,.62,4.2,c);g.bx(0,.97,-.35,1.62,.62,2.2,d);g.bx(0,1.03,-.35,1.66,.36,1.9,H('#2a4248',.25));g.bx(0,1.6,-.35,1.5,.07,2.1,c);
  for(const sx of[-.92,.92])for(const sz of[-1.35,1.35])g.at(mM(mT(sx,.36,sz),mRz(PI/2)),()=>g.cyl(0,-.13,0,.36,.36,.26,8,k));
  g.bx(-.6,.62,2.11,.32,.2,.05,H('#ffe9a8',1));g.bx(.6,.62,2.11,.32,.2,.05,H('#ffe9a8',1));g.bx(-.65,.62,-2.11,.3,.14,.05,H('#d0352a',.9));g.bx(.65,.62,-2.11,.3,.14,.05,H('#d0352a',.9));g.bx(0,.32,2.15,1.84,.14,.1,k);g.bx(0,.32,-2.15,1.84,.14,.1,k);return mesh(g);})();
const M_door=modelMesh('door')||(()=>{const g=new Geo(.04);g.bx(0,0,0,1.2,1.9,.12,PAL.woodD);return mesh(g);})();
const CAR={x:-28,z:-292,rot:0,parked:false,wp:[[-28,-34],[-28.6,-25],[-31,-20],[-34.5,-18.2],[-38,-18]],wi:0,sp:4.4};
function updCar(dt){if(CAR.parked)return;const w=CAR.wp[CAR.wi],dx=w[0]-CAR.x,dz=w[1]-CAR.z,d=hypot(dx,dz);if(d<.7){if(++CAR.wi>=CAR.wp.length){parkCar();return;}return;}
  const sp=CAR.wi>0?2.6:CAR.sp;faceTo(CAR,atan2(dx,dz),dt,CAR.wi>0?2.2:4);CAR.x+=sin(CAR.rot)*sp*dt;CAR.z+=cos(CAR.rot)*sp*dt;}
function parkCar(){CAR.parked=true;CAR.x=-38;CAR.z=-18;CAR.rot=-PI/2;const c=col(-40.2,-19,-35.8,-17,1.4);blockRect(c);if(AU.eng){AU.eng.gain.setTargetAtTime(0,AU.ctx.currentTime,.4);}}
const DRIVE=[['col','Эдвард, ты меня слышишь? Связь в этих лесах — просто кошмар.'],['hero','Слышу, Уолтер. Камера пишет, батареи заряжены. Ещё полчаса — и я в Грейхейвене.'],
 ['col','Слушай… я поднял всё, что смог найти. За десять лет там пропали двадцать три человека. А живыми оттуда выбрались только четверо.'],['hero','Четверо из двадцати трёх. Для первого выпуска нового сезона — лучше не придумаешь.'],
 ['col','Не смешно. Все четверо — в психушке или у мозгоправов на сеансах. Ведут себя как безумцы. И несут одно и то же — слово в слово.'],['hero','И что же они несут?'],
 ['col','Что их схватили, едва они приехали. Держали в подвале местного паба — в клетках, в кандалах. Пытали. Ставили на них какие-то опыты.'],
 ['col','А сбежали они только потому, что кандалы проржавели, а клетки сварены кое-как. Им просто повезло, Эдвард.'],
 ['hero','Четыре человека, не знакомых друг с другом, рассказывают одну и ту же историю. Это уже не бред, Уолтер. Это — сюжет.'],
 ['col','Это повод развернуться! Ты хоть свои отмычки не взял?'],['hero','Обижаешь. Какой же выпуск без пары запертых дверей. Я просто осмотрюсь: пара кадров, пара интервью — и назад.'],
 ['col','В том-то и де… Эдв… плохо слыш… ш-ш-ш…'],['hero','Уолтер? Алло?.. Пропала связь. А вот и мотель.']];
async function intro(){S.mode='drive';$('skip').style.display='block';$('gear').style.display='block';S.camFn=()=>{CAM.ge=[CAR.x+6,21,CAR.z+16];CAM.gt=[CAR.x,0,CAR.z+2];};S.focus=()=>[CAR.x,0,CAR.z+3];camSnap();
  if(AU.ctx){const c=AU.ctx,o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';o.frequency.value=58;f.type='lowpass';f.frequency.value=190;g.gain.value=.11;o.connect(f);f.connect(g);g.connect(AU.sfx);o.start();AU.eng=g;}
  fade(0,2200);{const c=$('chap');c.style.opacity=1;setTimeout(()=>c.style.opacity=0,S.fast?0:4200);}await wait(4.6);
  for(const[w,t]of DRIVE)await say(w==='hero'?HERO:'Уолтер (по телефону)',t,VO[w]);
  while(!CAR.parked&&!S.fast)await wait(.2);
  if(S.fast){$('fade').style.transitionDuration='0ms';$('fade').style.opacity=1;$('chap').style.opacity=0;if(sub)sub.res();}
  if(!CAR.parked)parkCar();await wait(.8);
  S.fast=false;$('skip').style.display='none';P.vis=true;P.x=-37;P.z=-15.8;P.rot=2.4;S.camFn=null;S.focus=null;CAM.rate=1.6;setTimeout(()=>CAM.rate=5,2500);
  S.hud=true;$('hud').style.display='block';setObj('Войдите в мотель и снимите комнату на ночь.');S.mode='play';SFX.door();fade(0,900);
  toast(document.body.classList.contains('touch')?'Джойстик слева — идти (до упора — бег), кнопки справа — действия':'<span class="kb">WASD</span>— идти, <span class="kb">Shift</span>— бежать, <span class="kb">E</span>— действие',6);}
$('skip').onclick=()=>{S.fast=true;if(sub)sub.res();const w=waits;waits=[];w.forEach(x=>x.r());};
$('start').onclick=()=>{auInit();$('title').style.display='none';intro();};

// --- the motel, the village and the pub before the hunt: src/5-story.js

// ================= CTHULHU: part rig (Blender models, primitive fallback) =================
const CTHC={a:H('#143233'),b:H('#0f2729'),c:H('#1d4543'),m:H('#11302f'),eye:H('#ff3018',1)};
function cthPart(name,fb){return modelMesh(name)||(()=>{const g=new Geo(.12);fb(g);return mesh(g);})();}
const CTH={
  torso:cthPart('cth_torso',g=>{g.sph(0,0,1,13,9,10,CTHC.b,8,5);g.sph(0,12,0,14,12,11,CTHC.a,9,6);g.sph(0,24,1,17,10,12,CTHC.b,9,6);for(const s of[-1,1])g.sph(s*15,28,0,7.5,6.5,7,CTHC.a,7,5);g.sph(0,32,0,7,5,6,CTHC.a,7,4);
    for(let i=0;i<40;i++){const th=rr(.4,2.4),ph=rr(0,6.28),y=rr(-4,30);g.sph(sin(th)*cos(ph)*13,y,sin(th)*sin(ph)*11,rr(1,2.2),rr(1,2.2),rr(1,2.2),CTHC.c,5,4);}}),
  head:cthPart('cth_head',g=>{g.sph(0,8,-1,8.5,8,9.5,CTHC.a,8,6);g.sph(0,13.5,3.5,7.6,6.4,9.2,CTHC.c,8,5);g.box(0,9.4,-8.4,12,1.5,2.4,CTHC.b);for(const s of[-1,1])g.sph(s*7.8,8,-2,2.4,3,3,CTHC.b,6,4);}),
  eye:cthPart('cth_eye',g=>g.sph(0,0,0,1.9,.75,.9,CTHC.eye,6,4)),
  tent:cthPart('cth_tent',g=>{g.cyl(0,-4,0,.82,1,4,6,CTHC.a);g.sph(0,0,0,1,1,1,CTHC.b,6,4);}),
  uarm:cthPart('cth_uarm',g=>{g.sph(0,-13,0,5.4,14,5.6,CTHC.a,8,6);g.sph(0,-1,0,6,5,6,CTHC.b,7,4);}),
  farm:cthPart('cth_farm',g=>{g.sph(0,-12,0,4.6,13,4.8,CTHC.b,8,6);for(let i=0;i<4;i++)g.at(mM(mT(0,-6-i*4,3.6),mRx(-.9)),()=>g.cyl(0,0,0,.9,0,3.2,4,CTHC.c));}),
  palm:cthPart('cth_palm',g=>{g.sph(0,-2.8,0,3.8,3.4,1.9,CTHC.a,7,5);}),
  fa:cthPart('cth_finger_a',g=>{g.cyl(0,-3.7,0,.75,.95,3.7,6,CTHC.a);g.sph(0,0,0,1,1,1,CTHC.b,5,4);}),
  fb:cthPart('cth_finger_b',g=>{g.cyl(0,-3.2,0,.5,.75,3.2,6,CTHC.a);g.sph(0,0,0,.78,.78,.78,CTHC.b,5,4);g.at(mM(mT(0,-3,0),mRx(.35)),()=>g.cyl(0,-2.6,0,0,.5,2.6,5,H('#1b1814')));}),
  wingL:cthPart('cth_wing_L',g=>wingFb(g,-1)),wingR:cthPart('cth_wing_R',g=>wingFb(g,1)),
  thigh:cthPart('cth_thigh',g=>g.sph(0,-12,0,6.5,14,7,CTHC.b,8,6)),
};
function wingFb(g,s){const A=[0,0,0],B=[s*8,-16,4],T=[[s*22,46,12],[s*42,30,16],[s*44,4,14]];const pts=[T[0],T[1],T[2],B];
  for(let k=0;k<3;k++){g.tri(A,pts[k],pts[k+1],CTHC.m);g.tri(A,pts[k+1],pts[k],CTHC.m);}
  for(const t of T){const d=vSub(t,A),len=vLen(d);g.at(mM(mT(0,0,0),mAlignY(d)),()=>g.cyl(0,0,0,1.6,.15,len*1.04,5,CTHC.b));}}
const CTHZ=250,CTHSC=1.35;   // the Old One rises far out at sea and is bigger than before
const CL={sh:[16,29,0],neck:[0,33,-1],wing:[6,31,6.5],hip:[7,-2,0],L1:26,L2:24,eyes:[[-2.9,7.7,-8.36],[2.9,7.7,-8.36]],tip:[0,-6.6,0]};
// face tentacle roots in head space (two rows, measured on the Blender head)
const TROOT=[[4.19,5.05,-6.84],[3.25,4.66,-7.8],[1.84,4.3,-8.17],[-.12,4.02,-8.63],[-1.84,4.3,-8.17],[-3.25,4.66,-7.8],[-4.19,5.05,-6.84],[4.02,3.63,-6.63],[2.79,2.9,-7.6],[1.01,2.4,-7.91],[-1.01,2.41,-7.91],[-2.79,2.9,-7.6],[-4.01,3.64,-6.63]];
const FIN={on:false,t:0,u:-1,cult:[],armUp:0,chant:false,look:null,lx:0,ly:0,mx:0,my:0,fp:true,eyesOn:0,ph:'',pose:null,wet:{},imps:[],ev:[]};
addEventListener('mousemove',e=>{FIN.mx=e.clientX/innerWidth*2-1;FIN.my=e.clientY/innerHeight*2-1;});
const eas=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},kf=(u,a,b)=>eas((u-a)/(b-a));
// JS copy of the shader wave height, for underwater tests and spray placement
function waveH(x,z){const t=R.t,a=(.1+R.wave*1.1)*lerp(.35,1,sstep(48,62,z));let h=a*(sin(x*.11+t*.8)*.55+sin(z*.19-t*1.15+x*.06)*.38+sin((x+z)*.33+t*1.9)*.16+sin((x*.7-z)*.61-t*2.7)*.09*(.3+R.wave));
  const d=hypot(x-R.rip[0],z-R.rip[1]);h+=R.rip[2]*sin(d*.21-t*2.6)*exp(-d*.018)*sstep(R.rip[3]*30+20,R.rip[3]*30,d);return h-.55;}
// pose of the creature as a function of time since the sea started boiling (u)
function cthPose(u){const P={};const br=sin(R.t*.55);
  P.z=CTHZ;P.x=10;P.sc=CTHSC;
  P.y=u<4?-98:u<9?lerp(-98,-40,eas((u-4)/5)):u<14?lerp(-40,-34,kf(u,9,14)):u<19?lerp(-34,-27,kf(u,14,19)):lerp(-27,-7,kf(u,19,25))+sin(R.t*.4)*.6;
  P.lean=lerp(.08,0,kf(u,19,25))+.1*kf(u,23,24.5)*(1-kf(u,26,28))+.2*kf(u,45,48);P.br=br;
  P.hyaw=sin(R.t*.23)*.12;P.hpitch=lerp(-.25,.05,kf(u,6,12))+sin(R.t*.31)*.05-.22*kf(u,23,24.2)*(1-kf(u,25.5,27));
  P.track=kf(u,27,29)*(1-kf(u,50,53));   // the head follows the hero, then the body falling into the sea
  P.wing=kf(u,9.5,14);P.flap=sin(R.t*.9)*.05*P.wing+sin(u*9)*.06*kf(u,9.5,11)*(1-kf(u,13,14))+sin(u*7)*.14*kf(u,23,24)*(1-kf(u,26.5,28));   // a great beat of the wings releases the swarm
  P.eyes=kf(u,6,8.5);
  const up=kf(u,14,18.5),down=kf(u,21,25),reach=kf(u,45.5,48.5);P.hand=[];
  for(const s of[-1,1]){let t=[s*24,-6,-6];t=vLerp(t,[s*30,66,-8],up);t=vLerp(t,[s*38,30,-14],down);t=vLerp(t,[s*20,8,-30],reach);t[1]+=sin(R.t*.7+s)*1.5*up;P.hand.push(t);}
  P.curl=[0,1].map(i=>lerp(.35,-.25,up)+sin(R.t*(1.3-i*.2)+i)*.08*up+.5*down*(.5+.5*sin(R.t*.8+i))-.4*reach);return P;}
function cthMats(P){const root=mM(mT(P.x,P.y,P.z),mS(P.sc,P.sc,P.sc));let T=mM(root,mRx(-P.lean),mS(1+P.br*.018,1+P.br*.012,1+P.br*.02));
  let yaw=P.hyaw,pit=P.hpitch;
  if(P.track>0&&FIN.headLook){const hp=mP(T,CL.neck),d=vSub(FIN.headLook,hp);yaw=lerp(yaw,clamp(atan2(-d[0],-d[2]),-.9,.9),P.track);pit=lerp(pit,clamp(atan2(-d[1],hypot(d[0],d[2]))+.15,-.4,.95),P.track);}
  const head=mM(T,mT(...CL.neck),mRy(yaw),mRx(-pit));const M={root,T,head,arms:[],wings:[]};const sc=P.sc,SC3=mS(sc,sc,sc);
  [-1,1].forEach((s,i)=>{const S=mP(T,[s*CL.sh[0],CL.sh[1],CL.sh[2]]);const tgt=mP(root,P.hand[i]);
    const pole=mP(T,[s*48,8,22]);const k=ik2(S,tgt,CL.L1*sc,CL.L2*sc,pole);const E=k.e,Wr=k.t;
    const fa=vNorm(vSub(Wr,E));const up=kf(FIN.u,14,18.5);
    const hdir=vNorm(vLerp(fa,[0,1,-.15],up*.7*(1-kf(FIN.u,45.5,48.5)))),back=vNorm(vLerp([s*.3,0,1],[0,0,1],up));
    M.arms.push({s,S,E,W:Wr,U:mM(mBasis(S,vSub(E,S),[0,0,1]),SC3),F:mM(mBasis(E,vSub(Wr,E),[0,0,1]),SC3),H:mM(mBasis(Wr,hdir,back),SC3),curl:P.curl[i]});});
  [-1,1].forEach(s=>{const f=P.wing;M.wings.push({s,m:mM(T,mT(s*CL.wing[0],CL.wing[1],CL.wing[2]),mRy(-s*lerp(1.3,.05,f)),mRz(s*(lerp(-.45,0,f)+P.flap)),mRx(lerp(-.25,0,f)),mS(lerp(.3,1,f),lerp(.72,1,f),1))});});
  return M;}
// hand frame: local -Y along the fingers, local -Z = palm. Thumb sits on the +s edge (lateral with the palm forward,
// medial once the arm is raised) — it used to be on the wrong edge, which made the hands look twisted.
function drawHand(a){const H_=a.H;draw(CTH.palm,H_,.25,1,5);const kn=[-2.5,-.85,.85,2.5];
  kn.forEach((x,i)=>{const sp=(i-1.5)*.13*(1-clamp(a.curl,0,1)*.6);let m=mM(H_,mT(x,-5.3,.2),mRz(sp),mRx(a.curl*.95+abs(i-1.5)*.05));draw(CTH.fa,m,.22,1,5);m=mM(m,mT(0,-3.7,0),mRx(a.curl*1.1+.12));draw(CTH.fb,m,.2,1,5);});
  let t=mM(H_,mT(a.s*3.4,-1.6,-.6),mRz(a.s*(.95-a.curl*.4)),mRx(.3+a.curl*.6),mS(.92,.85,.92));draw(CTH.fa,t,.22,1,5);t=mM(t,mT(0,-3.7,0),mRx(a.curl*.8));draw(CTH.fb,t,.2,1,5);}
function drawCthulhu(){const P=FIN.pose;if(!P)return;const M=FIN.M;
  draw(CTH.torso,M.T,.3,1,5);for(const s of[-1,1])draw(CTH.thigh,mM(M.root,mT(s*CL.hip[0],CL.hip[1],CL.hip[2]),mRx(sin(R.t*.3+s)*.08-.1)),.3,1,5);
  draw(CTH.head,M.head,.3,1,5);
  for(const w of M.wings)draw(w.s<0?CTH.wingL:CTH.wingR,w.m,.25,1,5);
  for(const a of M.arms){draw(CTH.uarm,a.U,.28,1,5);draw(CTH.farm,a.F,.26,1,5);drawHand(a);}
  // face tentacles: chains that writhe, harder while the swarm is out and when it looks down at the body
  const ag=kf(FIN.u,23,25)*(1-kf(FIN.u,30,34))+kf(FIN.u,46,48);
  TROOT.forEach((r,i)=>{const row=i>6,x=r[0];let m=mM(M.head,mT(...r),mRz(x*.045),mRx(-.18-ag*.12));const L=row?6+(i%2):7+(i%3);
    for(let k=0;k<L;k++){m=mM(m,mRx(sin(R.t*(1+ag)+i*1.3+k*.6)*(.17+ag*.15)+(k>3?.12*(i%2?1:-1):.03)),mRz(sin(R.t*.8+i+k*.5)*.13));const sc=(row?1.1:1.3)*pow(.9,k);draw(CTH.tent,mMul(m,mS(sc,1,sc)),.22,1,5);m=mMul(m,mT(0,-3.9,0));}});
  // small almond eyes, outer corners raised (the old tilt drooped them and made it look sleepy)
  if(P.eyes>.02){const g=P.eyes*(1+sin(R.t*7)*.06);for(const e of CL.eyes){const m=mM(M.head,mT(...e),mRz(e[0]<0?-.45:.45),mS(g,g,g));draw(CTH.eye,m,0);}
    const ep=mP(M.head,[0,7.7,-11]);light(ep[0],ep[1],ep[2],60*P.eyes,[.95*P.eyes,.12*P.eyes,.05*P.eyes]);}}
// water pouring off the body while it rises
const DRIP=[['T',[0,31,4],10],['T',[-15,29,0],8],['T',[15,29,0],8],['T',[0,18,-10],8],['head',[0,15,2],7],['head',[0,9,-9],5]];
function cthWater(dt){const P=FIN.pose,M=FIN.M,u=FIN.u;if(!P||u<4)return;const rate=clamp((u-4)/2,0,1)*clamp(1.2-(u-26)/10,.15,1.2);
  const emit=(p,spread,n)=>{for(let i=0;i<n;i++){if(p[1]<R.surf+.5)continue;PT.add(3,p[0]+(Math.random()-.5)*spread,p[1],p[2]+(Math.random()-.5)*spread,(Math.random()-.5)*2,-2-Math.random()*4,(Math.random()-.5)*2,1.2+Math.random(),2.4,[.6,.72,.74,.55],22);}};
  for(const[b,lp,sp]of DRIP)emit(mP(M[b],lp),sp,floor(rate*5+Math.random()));
  for(const a of M.arms){if(u>14)emit(a.E,4,floor(rate*3+Math.random()));if(u>14)emit(a.W,3,floor(rate*2+Math.random()));}
  if(P.wing>.1)for(const w of M.wings)for(const lp of[[w.s*30,25,14],[w.s*40,6,14],[w.s*18,40,10]])emit(mP(w.m,lp),5,floor(rate*2*P.wing+Math.random()));
  // churning foam where it breaks the surface
  const n=floor((u<26?6:2)*Math.random()+1);for(let i=0;i<n;i++){const a=Math.random()*6.28,r=10+Math.random()*16;PT.add(4,P.x+cos(a)*r,R.surf+.3,P.z+sin(a)*r*.8,cos(a)*1.5,1.2+Math.random()*2.5,sin(a)*1.5,5+Math.random()*7,2.6,[.5,.6,.62,.22],.2);}}

// ================= STORM =================
const STORM={k:0,next:3,dist:0};
function strike(x,z,yEnd=R.surf,near=false){PT.bolt(x+(Math.random()-.5)*30,170,z+20+(Math.random()-.5)*30,x,yEnd,z,near?2:1.3);R.flash=max(R.flash,near?1.5:.7);STORM.fl2=.09;
  const d=hypot(x-R.eye[0],z-R.eye[2]);SFX.thunder(clamp(d/120,0,2),min(2.2,d/150));S.shake=max(S.shake,near?.6:.15);}
function updStorm(dt){const k=STORM.k;R.flash=max(0,R.flash-dt*(R.flash>1?6:4.5));if(STORM.fl2>0){STORM.fl2-=dt;if(STORM.fl2<=0)R.flash=max(R.flash,.55+Math.random()*.4);}
  R.rain=R.uw?0:k;R.wind=[1+k*2.4,.35+k*.8];R.wave=k*.9+(FIN.u>4?.3*kf(FIN.u,4,20):0);R.wet=k;stormAudio(k,R.uw>0);
  if(k>0){STORM.next-=dt;if(STORM.next<=0){const u=FIN.u;let x=rr(-60,80),z=rr(110,220),near=false;if(u>6&&u<40&&Math.random()<.45){const P=FIN.pose;x=P.x+rr(-35,35);z=P.z+rr(5,30);near=true;}strike(x,z,R.surf,near);STORM.next=(u>4&&u<40?rr(1.2,3.2):rr(4,8))/(.4+k*.6);}}
  else if(S.solved&&S.solved.filter(v=>v).length>=3&&S.mode==='play'){STORM.dist-=dt;if(STORM.dist<=0){STORM.dist=rr(22,40);R.flash=.3;SFX.thunder(2.2,1.6);}}}

// ================= IMPS («бесы»): the Old One's winged spawn =================
const IMP={body:cthPart('imp_body',g=>{g.sph(0,0,0,.28,.45,.22,CTHC.a,6,4);g.sph(0,.6,-.05,.18,.2,.18,CTHC.c,6,4);}),
  wL:cthPart('imp_wing_L',g=>{g.tri([0,0,0],[-1.9,.5,-.3],[-1.2,-.4,-.2],CTHC.m);g.tri([0,0,0],[-1.2,-.4,-.2],[-1.9,.5,-.3],CTHC.m);}),
  wR:cthPart('imp_wing_R',g=>{g.tri([0,0,0],[1.9,.5,-.3],[1.2,-.4,-.2],CTHC.m);g.tri([0,0,0],[1.2,-.4,-.2],[1.9,.5,-.3],CTHC.m);})};
// finale timeline (u = seconds since the sea started boiling)
const F_GRAB=32.6,F_TEAR=42.2,F_DEAD=43.4,F_DROP=46;
// the hero's flight in the imps' claws: off the altar, a wide swing over the sea, two tosses, torn apart, the body carried to the Old One
const HPK=[[F_GRAB,[10,1.78,74.9]],[34,[8,9,82]],[36.5,[-18,22,108]],[39,[-34,27,140]],[42,[2,31,176]],[43.4,[6,33,186]],[F_DROP,[10,36,CTHZ-34]]];
const TOSS=[[36.9,38.5,13],[39.7,41.2,9]];
function pathAt(K,u){const n=K.length;if(u<=K[0][0])return K[0][1].slice();if(u>=K[n-1][0])return K[n-1][1].slice();let i=0;while(K[i+1][0]<u)i++;
  const s=(u-K[i][0])/(K[i+1][0]-K[i][0]),p0=K[max(i-1,0)][1],p1=K[i][1],p2=K[i+1][1],p3=K[min(i+2,n-1)][1];
  return[0,1,2].map(j=>.5*(2*p1[j]+(-p0[j]+p2[j])*s+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*s*s+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*s*s*s));}
function heroPos(u){const p=pathAt(HPK,u);for(const[a,b,h]of TOSS)if(u>a&&u<b)p[1]+=h*sin(PI*(u-a)/(b-a));return p;}
function bodyPos(u){return vAdd(heroPos(u),[0,-.6,0]);}
const tossing=u=>TOSS.some(([a,b])=>u>a-.1&&u<b-.15);
function spawnImps(){FIN.imps=[];for(let i=0;i<9;i++){const s=i%2?1:-1;FIN.imps.push({i,role:i<2?'c':'e',side:s,on:0,t0:23.4+i*.2,
  spawn:[s*(9+Math.random()*12),30+Math.random()*12,5+Math.random()*4],p:[0,0,0],v:[0,0,0],flap:Math.random()*6,vmax:i<2?40:32,agi:i<2?4:2.6});}}
function impTarget(im,u){const i=im.i,a=u*(1.1+(i%3)*.25)+i*.9;
  if(u<F_GRAB-.7||(im.role!=='c'&&u<F_GRAB)){return[10+cos(a)*(4+i%3*1.5),7+(i%3)*1.6+sin(a*1.7)*1.2,77+sin(a)*(3.5+i%2*1.5)];}   // a screeching ring over the altar
  if(u<F_DROP){const dead=u>F_DEAD,h=dead?bodyPos(u):heroPos(u);let f=vSub(dead?bodyPos(u+.06):heroPos(u+.06),h);f=vLen(f)>.01?vNorm(f):[0,0,1];const side=vNorm(vCross(f,[0,1,0]));
    if(im.role==='c'){if(!dead&&tossing(u))return vAdd(h,vAdd([0,4,0],vSc(side,im.side*2.4)));
      return vAdd(h,vAdd(vAdd([0,.95+(dead?.6:0),0],vSc(f,-.45)),vSc(side,im.side*.5)));}   // claws in the shoulders
    if(u>F_TEAR&&u<F_DEAD+.2)return vAdd(h,[cos(a*3)*1.3,.5+sin(a*2)*.6,sin(a*3)*1.3]);   // all of them at once
    const r=4+(i%4)*1.2;return vAdd(h,vAdd(vAdd(vSc(f,2.5+(i%3)*1.5),vSc(side,cos(a)*r)),[0,1.5+sin(a*1.3)*2.2,0]));}
  const hd=mP(FIN.M.head,[0,14,0]);return[hd[0]+cos(a*.6)*(18+i%4*4),hd[1]+sin(a*.9)*4+(i%3)*3,hd[2]+sin(a*.6)*(14+i%3*4)];}   // back to their master
function updImps(dt,u){for(const im of FIN.imps){if(u<im.t0)continue;
  if(!im.on){im.on=1;im.p=mP(FIN.M.T,im.spawn);im.v=vAdd(vSc(vNorm(vSub([10,8,77],im.p)),10),[0,8,0]);}
  const tg=impTarget(im,u),hold=im.role==='c'&&u>=F_GRAB&&u<F_DROP+.15&&!tossing(u),p0=im.p;
  if(hold){im.p=vLerp(im.p,tg,min(1,dt*14));im.v=vSc(vSub(im.p,p0),1/max(dt,1e-3));}
  else{const d=vSub(tg,im.p),L=vLen(d);im.v=vLerp(im.v,vSc(d,min(im.vmax,L*1.8)/max(L,1e-3)),min(1,dt*im.agi));im.p=vAdd(im.p,vSc(im.v,dt));}
  im.flap+=dt*(hold?13:9+vLen(im.v)*.12);}}
function impMat(im){const sp=vLen(im.v);if(sp>.6)im.f=vNorm(im.v);const f=im.f||[0,0,1],k=clamp(sp/25,0,1);
  const up=vNorm(vAdd([0,1,0],vSc([f[0],0,f[2]],.7*k)));return mM(mBasis(im.p,vSc(up,-1),vSc(f,-1)),mS(1.15,1.15,1.15));}
function drawImp(im){if(!im.on)return;const B=impMat(im),fl=sin(im.flap)*.85+.15;
  draw(IMP.body,B,.03,1,5);draw(IMP.wL,mM(B,mT(-.1,.3,.18),mRz(-fl)),.02,1,5);draw(IMP.wR,mM(B,mT(.1,.3,.18),mRz(fl)),.02,1,5);}
function impCentroid(){let c=[0,0,0],n=0;for(const im of FIN.imps)if(im.on){c=vAdd(c,im.p);n++;}return n?vSc(c,1/n):null;}
function impCry(v){for(let k=0;k<3;k++){const f=1100+Math.random()*700;tone(f,.3+Math.random()*.35,{type:'sawtooth',vol:v,to:f*.45,lp:3600,delay:k*.12+Math.random()*.1});}}
function scream(d){tone(620,d,{type:'sawtooth',vol:.13,to:380,lp:2600});tone(655,d,{type:'sawtooth',vol:.09,to:410,lp:2600});}
function blood(p,n,s,sz=.22){for(let i=0;i<n;i++)PT.add(3,p[0]+(Math.random()-.5)*s,p[1]+(Math.random()-.5)*s,p[2]+(Math.random()-.5)*s,(Math.random()-.5)*3,Math.random()*2-1,(Math.random()-.5)*3,sz*(.7+Math.random()*.8),1.6,[.3,.015,.015,.9],14);}
function ripFx(){S.shake=1.2;FIN.red=1.25;noise(.35,{f:2200,to:300,vol:.5});SFX.hurt();impCry(.1);const e=CAM.eye,f=vNorm(vSub(CAM.tgt,e));
  for(let i=0;i<26;i++)PT.add(3,e[0]+f[0]*1.3+(Math.random()-.5)*.9,e[1]+f[1]*1.3-.3+(Math.random()-.5)*.6,e[2]+f[2]*1.3+(Math.random()-.5)*.9,(Math.random()-.5)*4,Math.random()*3,(Math.random()-.5)*4,.05+Math.random()*.08,1.2,[.35,.01,.01,.95],9);}
function seaSplash(p,k){for(let i=0;i<40*k;i++){const a=Math.random()*6.28,r=Math.random()*1.5*k;PT.add(3,p[0]+cos(a)*r,p[1]+.2,p[2]+sin(a)*r,cos(a)*3*k,6+Math.random()*9*k,sin(a)*3*k,.35+Math.random()*.4,1.6,[.75,.85,.88,.7],18);}
  for(let i=0;i<14*k;i++){const a=Math.random()*6.28;PT.add(4,p[0]+cos(a)*2*k,R.surf+.3,p[2]+sin(a)*2*k,cos(a)*2,1.5,sin(a)*2,2+Math.random()*3*k,2.4,[.6,.7,.72,.35],.2);}
  if(k<1)SFX.splash();else SFX.bigSplash();}
// the torn body: an arm and a leg fall away over the open sea, the rest is carried on and dropped before the Old One
function updBodies(dt,u){const g=16;
  if(u>F_DEAD&&!FIN.pieces){const h=heroPos(F_DEAD);FIN.pieces=[{k:'arm',p:vAdd(h,[.3,-.6,0]),v:[2.5,3,1.5],a:0,w:[5,3]},{k:'leg',p:vAdd(h,[-.2,-1.2,0]),v:[-2,1.5,2],a:0,w:[-4,2.5]}];}
  for(const q of FIN.pieces||[]){if(q.gone)continue;q.v[1]-=g*dt;q.p=vAdd(q.p,vSc(q.v,dt));q.a+=dt;if(Math.random()<.6)blood(q.p,1,.2);if(q.p[1]<waveH(q.p[0],q.p[2])){q.gone=1;seaSplash(q.p,.5);}}
  if(u>F_DEAD&&u<F_DROP&&Math.random()<.5)blood(bodyPos(u),1,.4);
  if(u>=F_DROP&&!FIN.fall)FIN.fall={p:bodyPos(F_DROP),v:[.8,1.5,3],a:0};
  const f=FIN.fall;if(f&&!f.gone){f.a+=dt;
    if(!f.splash){f.v[1]-=g*dt;f.p=vAdd(f.p,vSc(f.v,dt));if(Math.random()<.7)blood(f.p,1,.4);if(f.p[1]<waveH(f.p[0],f.p[2])){f.splash=f.p.slice();seaSplash(f.p,1);S.shake=max(S.shake,.3);f.v=[0,-1.2,0];}}
    else{f.p=vAdd(f.p,vSc(f.v,dt));if(f.a>9)f.gone=1;}}}
function drawCorpse(p,t,fall){const ch=CH.hero,sh=ch.sh||[.42,1.55],hp=ch.hip||[.16,.8];if(ch.seg)return drawCorpseSeg(ch,p,t,fall);
  const base=fall?mM(mT(...p),mRy(t*1.7),mRx(.6+t*2.2),mT(0,-1,0)):mM(mT(...p),mRy(sin(t*.9)*.4),mRx(.25+sin(t*2.1)*.15),mT(0,-1.45,0));
  draw(ch.body,base,.03);draw(ch.arm,mM(base,mT(sh[0],sh[1],0),mRx(fall?-2.2+sin(t*5)*.5:.15+sin(t*3)*.25)),.03);if(ch.leg)draw(ch.leg,mM(base,mT(hp[0],hp[1],0),mRx(.4+sin(t*4)*.3)),.03);}
// the torn body: one arm and one leg left, limp joints flopping
function drawCorpseSeg(ch,p,t,fall){const base=fall?mM(mT(...p),mRy(t*1.7),mRx(.6+t*2.2),mT(0,-1,0)):mM(mT(...p),mRy(sin(t*.9)*.4),mRx(.25+sin(t*2.1)*.15),mT(0,-1.45,0));
  draw(ch.body,base,.03);draw(ch.head,base,.012);draw(ch.jaw,mM(base,mT(0,-.008,-.002)),.012);
  drawArm(ch,mM(base,mT(ch.sh[0],ch.sh[1],0),mRx(fall?-2.2+sin(t*5)*.5:.15+sin(t*3)*.25)),1,.5+sin(t*4)*.4,.2,.03);
  drawLegStraight(ch,mM(base,mT(ch.hip[0],ch.hip[1],0),mRx(.4+sin(t*4)*.3)),.3+sin(t*3)*.3,.03);}
// the hero's arm in first person: two-bone IK from the shoulder to a wrist target (elbows drop and splay), palms toward the centre
function fpArm(sp,wr,s,up,f,armed,curl){const ch=CH.hero,r=vNorm(vCross(f,[0,1,0]));if(!ch.seg){draw(armed?ch.armW:ch.arm,mBasis(sp,vSub(wr,sp),vSc(f,-1)),0);return;}
  const q=ik2(sp,wr,RIG.ua,RIG.fa,vAdd(sp,vAdd(vSc(up,-1),vSc(r,s*.8)))),e=q.e,w=q.t,d1=vNorm(vSub(e,sp)),d2=vNorm(vSub(w,e)),bs=s>0?-1:1,hi=s>0?0:1;
  draw(ch.arm.up,mBasis(sp,d1,up),0);draw(ch.arm.lo,mBasis(e,d2,up),0);const W=mBasis(w,d2,up);draw(ch.hand[hi],W,0);
  drawFingers(ch,mM(W,mT(0,-RIG.hand,0)),hi,bs,curl,null,0);if(armed&&ch.wpn)draw(ch.wpn,mM(W,mT(-bs*.022,-.1,0)),0);}
// where the first-person eye looks while carried: ahead along the flight, toward the Old One; somersaults on the tosses
function carryLook(u){const e=heroPos(u);let f=vSub(heroPos(u+.2),e);f=vLen(f)>.01?vNorm(f):[0,0,1];
  const cre=vNorm(vSub(mP(FIN.M.head,[0,8,-6]),e));let d=vNorm(vAdd(vAdd(vSc(f,.55),vSc(cre,.45)),[0,-.2,0]));
  for(const[a,b]of TOSS)if(u>a&&u<b){const th=2*PI*eas((u-a)/(b-a)),up=vNorm(vSub([0,1,0],vSc(d,d[1])));d=vAdd(vSc(d,cos(th)),vSc(up,sin(th)));}
  if(u>F_TEAR){const im=FIN.imps[2+floor(u*3)%7];if(im&&im.on)d=vNorm(vLerp(d,vNorm(vSub(im.p,e)),.7));}
  if(u<F_GRAB+.8)d=vNorm(vLerp([0,-.6,.8],d,kf(u,F_GRAB,F_GRAB+.8)));
  return vAdd(e,vSc(d,10));}
function finCam(u){if(u<25.5)return;
  if(u<F_GRAB){CAM.rate=3;S.camFn=()=>{CAM.ge=ALTAR_EYE;CAM.gt=fpTarget(ALTAR_EYE,impCentroid()||[10,40,CTHZ]);};return;}
  if(u<F_DEAD+.6){FIN.carryLook=carryLook(u);CAM.rate=18;S.camFn=()=>{const e=heroPos(FIN.u);CAM.ge=e;CAM.gt=fpTarget(e,FIN.carryLook);};return;}
  const head=mP(FIN.M.head,[0,6,-8]);
  if(u<F_DROP){const bp=bodyPos(u);FIN.tce=vAdd(bp,[-11,4.5,-8]);CAM.rate=5;S.camFn=()=>{CAM.ge=FIN.tce;CAM.gt=vLerp(bp,head,.18);};}
  else if(u<48.8){CAM.rate=3;S.camFn=()=>{CAM.ge=FIN.tce;CAM.gt=FIN.fall.p;};}
  else{const k=kf(u,48.8,52.5),e=vLerp(FIN.tce,[-28,20,182],k),t=vLerp(FIN.fall.splash||FIN.fall.p,head,k*.7);CAM.rate=2;S.camFn=()=>{CAM.ge=e;CAM.gt=t;};}}
function finEvents(){const H_=VO.hero;return[
  [23.3,()=>{impCry(.09);SFX.roar(4,.9);}],[25.5,()=>say(HERO,'Из него что-то вылетает… Их много… Они летят сюда!',H_)],
  [28,()=>impCry(.12)],[30,()=>{FIN.hands=1;impCry(.14);}],[31,()=>say(HERO,'Нет-нет-нет… Уберите их! Помогите!',H_)],
  [F_GRAB,()=>{SFX.thud();S.shake=1.3;impCry(.18);FIN.red=.6;say(HERO,'А-А-А! Отпустите меня!',{dur:1.8,pitch:150});}],
  [34.2,()=>impCry(.12)],[36.9,()=>{SFX.swing();say(HERO,'НЕ-Е-ЕТ!',{dur:1.4,pitch:160});}],[38.5,()=>{SFX.thud();S.shake=.8;}],
  [39.7,()=>{SFX.swing();impCry(.15);scream(1.4);}],[41.2,()=>{SFX.thud();S.shake=.8;}],
  [F_TEAR,()=>{ripFx();scream(1.2);}],[42.6,ripFx],[42.95,ripFx],[43.2,()=>{ripFx();FIN.hands=0;}],
  [43.32,()=>{$('fade').style.transitionDuration='90ms';$('fade').style.opacity=1;SFX.thud();}],
  [44.0,()=>{FIN.red=0;$('flash').style.opacity=0;$('fade').style.transitionDuration='900ms';$('fade').style.opacity=0;}],
  [F_DROP,()=>impCry(.12)],[48.9,()=>{SFX.roar(6,.75);S.shake=.5;}],[50,()=>impCry(.08)],
  [51.8,()=>{$('fade').style.transitionDuration='2600ms';$('fade').style.opacity=1;}]];}
// ================= FINALE (first person from the safe to the end) =================
function lids(open,ms=900){const L=$('lids');L.style.display='block';for(const e of L.children){e.style.transitionDuration=ms+'ms';e.style.transform=open?(e.className==='t'?'translateY(-100%)':'translateY(100%)'):'translateY(0)';}}
function fpTarget(eye,tgt){const d=vNorm(vSub(tgt,eye));let yaw=atan2(d[0],d[2]),pit=Math.asin(clamp(d[1],-1,1));yaw+=FIN.lx;pit=clamp(pit+FIN.ly,-1.5,1.5);return vAdd(eye,[sin(yaw)*cos(pit)*10,sin(pit)*10,cos(yaw)*cos(pit)*10]);}
const ALTAR_EYE=[10,1.78,74.9];
async function finale(){S.mode='finale';S.fear=1;S.hud=false;$('bars').style.display=$('obj').style.display=$('prompt').style.display=$('det').style.display='none';{const f=$('face');f.style.width=f.style.height='150px';f.style.left='auto';f.style.right='16px';f.style.bottom='auto';f.style.top='16px';}for(const e of EN)e.active=false;
  const z=PZ[5],eye=[z.ix,1.62,z.iz];FIN.attacker={x:eye[0]-1.9,z:eye[2]+.5,rot:atan2(1.9,-.5),arm:-1.2};
  FIN.look=[z.x,z.y,z.z];CAM.fp=true;CAM.rate=4;S.camFn=()=>{CAM.ge=eye;CAM.gt=fpTarget(eye,FIN.look);};
  await say(HERO,'Ключи от катера… и моё имя в их книге. Они уже всё решили за меня…',VO.hero);
  SFX.creak();await wait(.5);await say(HERO,'Кто здесь?!',VO.hero);FIN.look=[FIN.attacker.x,1.7,FIN.attacker.z];CAM.rate=3.2;await wait(1.1);S.fear=3;
  FIN.atkSwing=1;SFX.swing();await wait(.32);SFX.thud();S.shake=1;$('flash').style.opacity=1;FIN.look=vAdd(eye,[-2,-1.4,1]);CAM.rate=9;S.camFn=()=>{CAM.ge=[eye[0],lerp(CAM.ge[1],.35,.08),eye[2]];CAM.gt=fpTarget(CAM.ge,FIN.look);};
  await wait(.35);lids(false,250);await wait(.5);$('fade').style.transitionDuration='300ms';$('fade').style.opacity=1;$('flash').style.opacity=0;FIN.attacker=null;
  noise(2.5,{f:200,vol:.25,att:1,delay:.6});await wait(3.2);
  // --- the pier at night: storm, torches, altar
  FIN.on=true;S.inside=null;P.vis=false;pierGate.off=true;owner.show=con.show=loaf.show=false;STORM.k=.55;R.rain=.55;PT.update(0,ALTAR_EYE);
  for(let i=0;i<10;i++){const a=1.05+i/9*(2*PI-2.1);FIN.cult.push({x:10+sin(a)*6.2,z:76+cos(a)*5.6,rot:a+PI,ph:i*1.7,kneel:0});}
  FIN.priest={x:6.2,z:80.6,rot:.5,ph:.3};
  S.camFn=()=>{const e=ALTAR_EYE;CAM.ge=e;CAM.gt=fpTarget(e,FIN.look);};FIN.look=[10.4,14,77.5];CAM.rate=2.2;CAM.fov=1.05;camSnap();
  S.fear=1;cv.style.filter='blur(7px)';lids(false,10);await wait(.2);$('fade').style.transitionDuration='1800ms';$('fade').style.opacity=0;
  await wait(1);lids(true,1300);await wait(1.5);lids(false,260);await wait(.4);lids(true,700);cv.style.transition='filter 3s';cv.style.filter='blur(1.2px)';
  await say(HERO,'Голова… Дождь… Где я? Верёвки — я не могу пошевелиться!',VO.hero);cv.style.filter='';
  FIN.look=[4,1.8,76];await wait(1.6);FIN.look=[16,1.8,77];FIN.chant=true;await wait(1.8);FIN.look=[10,2.4,80];
  await say('Культисты','Пх\'нглуи мглв\'нафх Ктулху Р\'льех вгах\'нагл фхтагн!',VO.cult);FIN.armUp=1;
  await say('Жрец','Звёзды встали верно! Спящий в глубине — прими чужую кровь и восстань!',{pitch:58,vol:.24});
  // --- the awakening, far out at sea
  FIN.look=[10,8,CTHZ];CAM.rate=1.6;FIN.u=0;FIN.ev=finEvents();STORM.k=1;R.rip=[10,CTHZ,0,0];SFX.rumble(18);S.fear=2;await wait(1.5);
  say(HERO,'Там, вдали… море кипит… Что-то поднимается со дна!',VO.hero);await wait(4.5);
  FIN.look=[10,18,CTHZ];await wait(1.2);SFX.roar(4,1.25);S.fear=3;await wait(3.8);   // eyes ignite (u≈7..9)
  FIN.look=[10,34,CTHZ];SFX.roar(5,1);S.shake=.5;await wait(5);                     // wings unfold
  FIN.look=[10,46,CTHZ];SFX.roar(5.5,.85);await wait(5);                             // arms rise, claws bared
  FIN.look=[10,42,CTHZ];SFX.rumble(8);SFX.roar(6.5,.7);S.shake=.7;await wait(4.5);  // full rise; the swarm bursts out of it (u≈23.4)
  // from here the timeline runs off FIN.u in updFinale: imps cross the sea, seize the hero, toss and tear him, drop the body
  FIN.look=null;while(FIN.u<54.5)await wait(.25);
  FIN.on=false;STORM.k=0;R.rain=0;R.uw=0;$('uw').style.opacity=0;$('tun').style.opacity=0;$('flash').style.opacity=0;stormAudio(0,false);await wait(.6);credits();}
function updFinale(dt){
  if(FIN.on){FIN.t+=dt;if(FIN.u>=0)FIN.u+=dt;const u=FIN.u;
    FIN.lx=lerp(FIN.lx,-FIN.mx*.5,min(1,dt*3));FIN.ly=lerp(FIN.ly,-FIN.my*.35,min(1,dt*3));
    if(FIN.chant){FIN.ct=(FIN.ct||0)-dt;if(FIN.ct<=0){FIN.ct=2.2;for(const p of[58,66,74])mumble(2,p,false,.07,true);}}
    FIN.pose=cthPose(max(u,0));FIN.M=cthMats(FIN.pose);if(u>=0)cthWater(dt);
    if(u>=0){R.rip=[10,CTHZ,(u>4?1.4:0)+1.6*kf(u,19,24)*(1-kf(u,30,40)),max(0,u-3)*.9];}
    for(const c of FIN.cult){c.kneel=lerp(c.kneel,u>8?1:0,dt*.8);}
    if(u>=23&&!FIN.imps.length)spawnImps();
    while(FIN.ev.length&&FIN.ev[0][0]<=u)FIN.ev.shift()[1]();
    if(FIN.imps.length){updImps(dt,u);updBodies(dt,u);}
    FIN.headLook=u<F_DEAD?heroPos(u):u<F_DROP?bodyPos(u):FIN.fall?FIN.fall.p:null;
    finCam(u);
    if(u>F_GRAB){FIN.red=max(0,(FIN.red||0)-dt*1.4);$('flash').style.opacity=min(1,FIN.red);}
    const e=CAM.eye,uw=e[1]<waveH(e[0],e[2]);R.uw=uw?1:0;$('uw').style.opacity=uw?1:0;if(uw)R.surf=waveH(e[0],e[2]);}
  updStorm(dt);}
function drawFinale(){if(FIN.attacker){const a=FIN.attacker;if(FIN.atkSwing)FIN.atkSwing=min(2,FIN.atkSwing+.05);const sw=FIN.atkSwing?lerp(-2.9,-.4,clamp(FIN.atkSwing-1,0,1)):-2.4;
    const m=drawChar(CH.c,a.x,0,a.z,a.rot,{armed:true,aR:sw});torchFx(m,0);}
  if(!FIN.on)return;drawCthulhu();
  for(const im of FIN.imps)drawImp(im);
  if(FIN.u>F_DEAD){const t=FIN.u-F_DEAD;if(!FIN.fall)drawCorpse(bodyPos(FIN.u),t,false);else if(!FIN.fall.gone)drawCorpse(FIN.fall.p,FIN.fall.a,true);
    for(const q of FIN.pieces||[])if(!q.gone){const M=mM(mT(...q.p),mRy(q.a*q.w[1]),mRx(q.a*q.w[0]));if(!CH.hero.seg)draw(q.k==='leg'&&CH.hero.leg?CH.hero.leg:CH.hero.arm,M,.03);
      else if(q.k==='leg')drawLegStraight(CH.hero,M,.2+sin(q.a*3)*.3,.03);else drawArm(CH.hero,M,-1,.4+sin(q.a*4)*.4,.2,.03);}}
  for(const c of FIN.cult){const u=FIN.armUp?-2.75+sin(S.t*2+c.ph)*.12:-1.25;const m=drawChar(CH.c,c.x,0,c.z,c.rot,{armed:true,aR:u,aL:FIN.armUp?u+.1:-.2,crouch:c.kneel>.5});torchFx(m,c.ph,true);}
  {const p=FIN.priest,m=drawChar(CH.c,p.x,0,p.z,p.rot,{armed:true,aR:-2.9+sin(S.t*1.4)*.1,aL:-2.9});torchFx(m,p.ph,true);}
  for(const b of BRAZ){light(b[0],2.3,b[1],9+sin(S.t*13+b[0])*.8,[1,.55,.22]);if(Math.random()<.4)PT.add(5,b[0],2.2,b[1],R.wind[0]*.7,1.8,R.wind[1]*.7,.08,1.2,[1,.6,.2,.9],-.3);}
  // hero's own body and, later, panicked hands in view
  if(FIN.hands){const e=CAM.eye,f=vNorm(vSub(CAM.tgt,e)),r=vNorm(vCross(f,[0,1,0])),up=vCross(r,f);for(const s of[-1,1]){const sp=vAdd(e,vAdd(vAdd(vSc(r,s*.32),vSc(up,-.42)),vSc(f,.05)));
    const tip=vAdd(sp,vAdd(vAdd(vSc(f,.38),vSc(up,.3+sin(S.t*14+s)*.05)),vSc(r,-s*.06)));fpArm(sp,tip,s,up,f,false,.05+abs(sin(S.t*9+s))*.3);}}}
function credits(){S.mode='credits';$('hud').style.display='none';$('gear').style.display='none';$('sub').style.display='none';$('lids').style.display='none';cv.style.filter='';const c=$('credits');c.style.display='flex';const n=EGGS.filter(e=>S.eggs[e.id]).length,mins=Math.round((S.t-S.t0)/60);
  $('roll').innerHTML='<h1>ЗОВ ИЗ ТУМАНА</h1><div class="hand" style="font-size:30px;color:#c4b693">Эдварда Крейна больше никто не видел.<br>Через неделю Уолтеру пришло видео с его номера:<br>шторм над пирсом, факелы, крылатые тени над водой — и что-то огромное в море.</div><h4>Конец первой главы</h4>'+
   '<h4>По мотивам</h4>Г. Ф. Лавкрафт — «Зов Ктулху» (1928)<h4>В ролях</h4>Эдвард Крейн, ведущий канала «За гранью»<br>Уолтер, голос в трубке<br>Хозяин мотеля<br>Хозяин паба «Дьяволов риф»<br>Жители Грейхейвена<br>Жрец и братья в робах<br>и Тот, кто спит в Р\'льехе'+
   '<h4>Ваше расследование</h4>Знаков культа найдено: 5 / 5<br>Находок-отсылок: '+n+' / '+EGGS.length+'<br>Потерь сознания: '+S.deaths+'<br>Время в деревне: ~'+mins+' мин'+
   '<h4>Прототип</h4>Модели — Blender, графика — WebGL, звук синтезирован в браузере<br><br><br><span class="hand" style="font-size:34px">«Не мертво то, что в вечности пребудет…»</span><br><br><br>Спасибо за игру';
  const r=$('roll');let y=innerHeight;const hgt=r.offsetHeight;const step=()=>{y-=innerHeight/900*1.6;r.style.top=y+'px';if(y>-hgt+innerHeight*.55)requestAnimationFrame(step);else $('again').style.display='block';};step();setTimeout(()=>$('again').style.display='block',12000);}
$('again').onclick=()=>{try{location.reload();}catch(e){}};

// --- frame
function drawAll(){talkFrame();
  draw(M_ground,null,0,1,1);draw(M_world,null,.035);draw(M_far,null,0);R.items[R.items.length-1].nodepth=1;draw(M_veg,null,0,1,3);draw(M_sea,mT(0,-.55,0),0,1,2);
  for(const l of LAMPS)light(l[0],l[1],l[2],l[3]*(1+sin(S.t*8+l[0])*.03),l[4]);
  for(const e of EN){if(!e.active&&e.show===false)continue;if(!e.active&&e.grp>3)continue;if(FIN.on)continue;const c=e.kind==='c';
    let aR=c?-1.25:e.state==='chase'?-.7:null;if(e.wind>0)aR=-2.7;if(e.atk>0){e.atk-=.016;aR=lerp(.4,-2.6,e.atk/.3);}
    if(e.flee&&e.state!=='ko'&&e.stun<=0)aR=-2.6+sin(S.t*10)*.35;   // the pub owner waving his arms while he yells
    const m=drawChar(c?CH.c:CH.v[e.v],e.x,0,e.z,e.rot,{armed:c||e.active&&!e.unarmed,ph:e.ph,mv:e.mv,aR,lie:e.state==='ko'});
    if(c&&e.state!=='ko')torchFx(m,e.ph);}
  if(S.fpPlay&&P.vis&&!P.lie)drawFpArms();
  if(P.vis&&!CAM.fp&&!S.fpPlay){let aR=null,aL=null;if(P.atk>0){const t=1-P.atk/.28;if(P.shove){aR=aL=lerp(-.6,-1.6,sin(t*PI));}else aR=lerp(-2.5,.5,t);}else if(P.block){aR=-1.9;aL=-1.7;}
    drawChar(CH.hero,P.x,0,P.z,P.rot,{armed:!!S.weapon,ph:P.ph,mv:P.mv,aR,aL,crouch:S.crouch,lie:P.lie});}
  draw(M_car,mM(mT(CAR.x,0,CAR.z),mRy(CAR.rot)),.04);if(!CAR.parked){const fx=CAR.x+sin(CAR.rot)*7,fz=CAR.z+cos(CAR.rot)*7;light(fx,1.5,fz,15,[1,.9,.6]);light(CAR.x,3,CAR.z,7,[.5,.5,.45]);}
  if(S.explore&&!FIN.on&&S.mode!=='finale')for(const p of pickups)if(!p.taken)draw(p.t==='m'?M_med:M_wpn,mM(mT(p.x,.55+sin(S.t*2+p.x)*.08,p.z),mRy(S.t*1.2)),.03);
  if(S.escaped&&!FIN.on&&S.mode!=='finale'){
    for(const z of PZ){if(S.solved[z.i])continue;const dim=z.i===5&&S.solved.slice(0,5).some(v=>!v);draw(M_beacon,mM(mT(z.x,2.7+sin(S.t*2+z.i)*.15,z.z),mRy(S.t*1.5),mS(dim?.5:1,dim?.5:1,dim?.5:1)),0);if(!dim)light(z.x,2.2,z.z+.8,6.5,[.25,.8,.7]);}}
  for(const e of EGGS){if(S.eggs[e.id]||!(e.id==='book'?S.inRoom:S.explore)||FIN.on||S.mode==='finale')continue;draw(M_egg,mM(mT(e.x,e.y+.55+sin(S.t*2.4+e.x)*.07,e.z),mRy(S.t*1.8)),0);}
  drawStory();drawFinale();}
// the hero's own arms in first person: swing on attack, raised on block, the weapon in the right hand
function drawFpArms(){const e=CAM.eye,f=vNorm(vSub(CAM.tgt,e)),r=vNorm(vCross(f,[0,1,0])),up=vCross(r,f),sw=P.mv?sin(P.ph)*.03:0;
  for(const s of[1,-1]){let a=0;if(s>0&&P.atk>0){const t=1-P.atk/.28;a=P.shove?sin(t*PI)*.5:sin(t*PI)*1.1;}if(P.block)a=.55;if(P.shove&&P.atk>0)a=sin((1-P.atk/.28)*PI)*.5;
    const sp=vAdd(e,vAdd(vAdd(vSc(r,s*.3),vSc(up,-.48+sw)),vSc(f,-.05)));const tip=vAdd(sp,vAdd(vAdd(vSc(f,.48+a*.25),vSc(up,.1+a*.42)),vSc(r,-s*(.06+a*.12))));
    fpArm(sp,tip,s,up,f,s>0&&!!S.weapon,s>0&&S.weapon?1.5:P.block||P.atk>0?1.3:.45);}}
function atmosphere(){const q=R.scale,M=R.mist;M.steps=q>=1?10:q>=.8?7:0;M.on=M.steps>0;
  if(S.vision){visionAtmo(M);return;}
  if(R.uw){R.fog=[.012,.05,.056];R.fogD=1/30;R.fogMin=0;R.amb=[.12,.2,.22];R.sunC=[.05,.1,.12];M.on=false;return;}
  R.sunC=[.34,.42,.46];
  if(FIN.on){const g=FIN.u>0?kf(FIN.u,4,20):0;R.fog=[lerp(.06,.13,g),lerp(.13,.25,g),lerp(.145,.27,g)];R.fogD=S.fogK/lerp(80,175,g);R.fogMin=.03;R.fogH=.04;R.amb=[.3,.41,.45];
    M.den=.75*S.fogK;M.top=6.5;M.col=[.22,.32,.34];M.maxD=80;return;}
  if(S.inside){const I=ROOMS[S.inside];R.fog=I.fog||[.025,.03,.032];R.amb=I.amb||[.28,.3,.3];R.sunC=[.1,.12,.13];R.fogD=1/60;R.fogMin=0;R.fogH=.05;M.den=(I.mist||.22)*S.fogK;M.top=1.5;M.col=[.16,.17,.17];M.maxD=40;return;}
  R.fog=[.075,.15,.165];R.amb=[.36,.47,.5];R.fogH=.15;M.col=[.3,.42,.43];M.maxD=90;
  if(S.mode==='drive'||S.mode==='title'){R.fogD=S.fogK/30;R.fogMin=.03;M.den=.75*S.fogK;M.top=3.2;}else{R.fogD=S.fogK/25;R.fogMin=.05*S.fogK;M.den=1.05*S.fogK;M.top=3.5;}}
let last=0;
function frame(now){const dt=min(.05,(now-last)/1000||.016)*(S.ts||1);last=now;
  if(!S.pause){S.t+=dt;R.t=S.t;tickWaits(dt);tickSub(dt);
    if(S.mode==='drive')updCar(dt);
    if(S.mode==='play'){updPlayer(dt);story(dt);PFt-=dt;if(PFt<=0){PFt=.3;PF=EN.some(e=>e.active&&e.state==='chase')?field(P.x,P.z):null;}for(const e of EN)updEnemy(e,dt);}
    updFinale(dt);stageTick(dt);PT.update(dt,CAM.eye);if(S.hud||S.mode==='finale')updHud(dt);}
  camGoal();if(document.pointerLockElement===cv&&(S.pause||S.mode!=='play'||S.camFn))document.exitPointerLock();const k=S.fast||S.fpPlay&&!S.camBlend?1:1-exp(-dt*CAM.rate);if(S.fpPlay&&S.camBlend)S.camBlend=max(0,S.camBlend-dt);for(let i=0;i<3;i++){CAM.eye[i]=lerp(CAM.eye[i],CAM.ge[i],k);CAM.tgt[i]=lerp(CAM.tgt[i],CAM.gt[i],k);}
  S.shake=max(0,S.shake-dt*1.4);const sh=S.shakeOn?S.shake*(CAM.fp?.22:.55):0,eye=[CAM.eye[0]+(Math.random()-.5)*sh,CAM.eye[1]+(Math.random()-.5)*sh,CAM.eye[2]+(Math.random()-.5)*sh];
  atmosphere();R.focus=S.focus?S.focus():CAM.fp?CAM.eye:[P.x,0,P.z];drawAll();render(eye,CAM.tgt,CAM.fov);hud2d();requestAnimationFrame(frame);}
// title backdrop
$('title').style.display='flex';S.camFn=()=>{CAM.ge=[-23,15,-279];CAM.gt=[-28,0,-292];};S.focus=()=>[-28,0,-289];camSnap();drawFace();requestAnimationFrame(frame);
// debug / test hooks
window.DBG={R,S,P,EN,CAM,FIN,PB,PZ,PT,STORM,cols,blocked,field,finale,solvePuzzle,openPuzzle,closePuzzle,cthPose,waveH,
  // skip the intro and jump to a story stage: 'town', 'pub', 'back', 'cellar', 'alarm', 'stalk', 'doctor', 'play' (default: the puzzle hunt)
  toPlay(st='play'){S.fast=true;if(sub)sub.res();const w=waits;waits=[];w.forEach(x=>x.r());setTimeout(()=>{S.fast=false;storySkip(st);},300);},storySkip,XD,ROOMS,CIV,SK,DGU,DOCEV,VIS,get LP(){return LP;}};
</script>
</body>
</html>
