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
const GRB={hov:[1.5,13,85],grab:[4.2,3.78,78.5],lift:[7,32,103],sea:[14,-26,104],cam:[3.6,-5.8,-2.0]};
const CL={sh:[16,29,0],neck:[0,33,-1],wing:[6,31,6.5],hip:[7,-2,0],L1:26,L2:24,eyes:[[-3.6,8.4,-9.7],[3.6,8.4,-9.7]],tip:[0,-6.6,0]};
const FIN={on:false,t:0,u:-1,cult:[],armUp:0,chant:false,look:null,lx:0,ly:0,mx:0,my:0,grab:0,fp:true,eyesOn:0,ph:'',pose:null,wet:{}};
addEventListener('mousemove',e=>{FIN.mx=e.clientX/innerWidth*2-1;FIN.my=e.clientY/innerHeight*2-1;});
const eas=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},kf=(u,a,b)=>eas((u-a)/(b-a));
// JS copy of the shader wave height, for underwater tests and spray placement
function waveH(x,z){const t=R.t,a=(.1+R.wave*1.1)*lerp(.35,1,sstep(48,62,z));let h=a*(sin(x*.11+t*.8)*.55+sin(z*.19-t*1.15+x*.06)*.38+sin((x+z)*.33+t*1.9)*.16+sin((x*.7-z)*.61-t*2.7)*.09*(.3+R.wave));
  const d=hypot(x-R.rip[0],z-R.rip[1]);h+=R.rip[2]*sin(d*.21-t*2.6)*exp(-d*.018)*sstep(R.rip[3]*30+20,R.rip[3]*30,d);return h-.55;}
// pose of the creature as a function of time since the sea started boiling (u)
function cthPose(u){const P={};const br=sin(R.t*.55);
  P.z=lerp(140,127,kf(u,27,31.5));P.x=10;
  P.y=u<4?-98:u<9?lerp(-98,-40,eas((u-4)/5)):u<14?lerp(-40,-34,kf(u,9,14)):u<19?lerp(-34,-27,kf(u,14,19)):lerp(-27,-7,kf(u,19,25))+sin(R.t*.4)*.6;
  P.lean=lerp(.08,0,kf(u,19,25))+.36*kf(u,26,31)-.18*kf(u,35,38);P.br=br;
  P.hyaw=sin(R.t*.23)*.12*(1-kf(u,26,29));P.hpitch=lerp(-.25,.05,kf(u,6,12))+.42*kf(u,25,29)-.3*kf(u,34,37)+sin(R.t*.31)*.05;
  P.wing=kf(u,9.5,14);P.flap=sin(R.t*.9)*.05*P.wing+sin(u*9)*.06*kf(u,9.5,11)*(1-kf(u,13,14));
  P.eyes=kf(u,6,8.5);
  // hand targets in creature space (later turned to world), plus finger curl
  const up=kf(u,14,18.5),down=kf(u,21,25);P.curl=[0,0];P.hand=[];
  for(const s of[-1,1]){let t=[s*24,-6,-6];t=vLerp(t,[s*30,66,-8],up);t=vLerp(t,[s*38,30,-14],down);t[1]+=sin(R.t*.7+s)*1.5*up;P.hand.push(t);}
  P.curl=[lerp(.35,-.25,up)+sin(R.t*1.3)*.08*up+.5*down*(.5+.5*sin(R.t*.8)),lerp(.35,-.25,up)+sin(R.t*1.1+1)*.08*up+.5*down*(.5+.5*sin(R.t*.8+1))];
  P.reach=kf(u,27,31.5);P.close=kf(u,31.6,32.6);P.lift=kf(u,33,38);P.plunge=kf(u,38.5,41.5);return P;}
function cthMats(P){const root=mM(mT(P.x,P.y,P.z),mRy(0));const T=mM(root,mRx(-P.lean),mS(1+P.br*.018,1+P.br*.012,1+P.br*.02));
  const head=mM(T,mT(...CL.neck),mRy(P.hyaw),mRx(-P.hpitch));const M={root,T,head,arms:[],wings:[]};
  [-1,1].forEach((s,i)=>{const S=mP(T,[s*CL.sh[0],CL.sh[1],CL.sh[2]]);let tgt=mP(root,P.hand[i]),hdir,back;
    // the grabbing hand (s=-1) leaves the pose, reaches for the altar, closes round the body and lifts it to the face
    let grab=null,camP=null;if(i===0&&P.reach>0){const r=eas(P.reach);let g=vLerp(tgt,GRB.hov,r);g=vLerp(g,GRB.grab,P.close);tgt=g;grab=r;
      if(P.lift>0){// authored camera path; the fist (thumb up) is kept just below the hero's eyes
        const l=eas(P.lift),face=mP(head,[0,8,-10]);camP=vLerp(ALTAR_EYE,vAdd(face,[-3,-4,-24]),l);camP[1]+=sin(PI*l)*7;
        if(P.plunge>0){const q=eas(P.plunge);camP=vLerp(camP,[14,-24,108],q);camP[1]+=sin(PI*q)*4;}
        const hd=vNorm(vLerp(vLerp([1,0,0],[0,-.12,-1],l),[0,-1,.35],eas(P.plunge))),bk=vNorm(vLerp(vLerp([0,1,0],[1,0,.05],l),[1,0,.1],eas(P.plunge)));
        const Y=vSc(hd,-1),Z=vNorm(vSub(bk,vSc(Y,vDot(bk,Y)))),fc=vSub(camP,P.plunge>0?vSc(vCross(Y,Z),4.6):[0,4.6,0]);tgt=vAdd(fc,vAdd(vSc(Y,6),vSc(Z,2.5)));FIN.camPath=camP;}}
    const pole=mP(T,vLerp([s*48,8,22],[s*34,-34,-4],grab!=null?eas(P.lift)*(1-eas(P.plunge)*.5):0));const k=ik2(S,tgt,CL.L1,CL.L2,pole);const E=k.e,Wr=k.t;
    const fa=vNorm(vSub(Wr,E));const up=kf(FIN.u,14,18.5);
    hdir=vNorm(vLerp(fa,[0,1,-.15],up*.7));back=vNorm(vLerp([s*.3,0,1],[0,0,1],up));
    if(grab!=null){hdir=vNorm(vLerp(hdir,[1,0,0],grab));back=vNorm(vLerp(back,[0,1,0],grab));
      if(P.lift>0){const l=eas(P.lift);hdir=vNorm(vLerp(hdir,[0,-.12,-1],l));back=vNorm(vLerp(back,[1,0,.05],l));}
      if(P.plunge>0){const l=eas(P.plunge);hdir=vNorm(vLerp(hdir,[0,-1,.35],l));back=vNorm(vLerp(back,[1,0,.1],l));}}
    const U=mBasis(S,vSub(E,S),[0,0,1]),F=mBasis(E,vSub(Wr,E),[0,0,1]),Hm=mBasis(Wr,hdir,back);
    const curl=i===0&&P.reach>0?lerp(lerp(P.curl[0],-.2,P.reach),1.0,P.close):P.curl[i];
    M.arms.push({s,S,E,W:Wr,U,F,H:Hm,curl,hideThumb:i===0&&P.close>.4});if(camP)M.camP=camP;});
  [-1,1].forEach(s=>{const f=P.wing;M.wings.push({s,m:mM(T,mT(s*CL.wing[0],CL.wing[1],CL.wing[2]),mRy(-s*lerp(1.3,.05,f)),mRz(s*(lerp(-.45,0,f)+P.flap)),mRx(lerp(-.25,0,f)),mS(lerp(.3,1,f),lerp(.72,1,f),1))});});
  return M;}
function drawHand(a){const H_=a.H;draw(CTH.palm,H_,.25,1,5);const kn=[-2.5,-.85,.85,2.5];
  kn.forEach((x,i)=>{const sp=(i-1.5)*.13*(1-clamp(a.curl,0,1)*.6);let m=mM(H_,mT(x,-5.3,.2),mRz(sp),mRx(a.curl*.95+abs(i-1.5)*.05));draw(CTH.fa,m,.22,1,5);m=mM(m,mT(0,-3.7,0),mRx(a.curl*1.1+.12));draw(CTH.fb,m,.2,1,5);});
  if(a.hideThumb)return;let t=mM(H_,mT(-a.s*3.4,-1.6,-.6),mRz(-a.s*(.95-a.curl*.4)),mRx(.3+a.curl*.6),mS(.92,.85,.92));draw(CTH.fa,t,.22,1,5);t=mM(t,mT(0,-3.7,0),mRx(a.curl*.8));draw(CTH.fb,t,.2,1,5);}
function drawCthulhu(){const P=FIN.pose;if(!P)return;const M=FIN.M;
  draw(CTH.torso,M.T,.3,1,5);for(const s of[-1,1])draw(CTH.thigh,mM(M.root,mT(s*CL.hip[0],CL.hip[1],CL.hip[2]),mRx(sin(R.t*.3+s)*.08-.1)),.3,1,5);
  draw(CTH.head,M.head,.3,1,5);
  for(const w of M.wings)draw(w.s<0?CTH.wingL:CTH.wingR,w.m,.25,1,5);
  for(const a of M.arms){draw(CTH.uarm,a.U,.28,1,5);draw(CTH.farm,a.F,.26,1,5);drawHand(a);}
  // face tentacles: chains that writhe; they lash out when the hero is close
  const close=P.lift>0?1-P.plunge:0;
  for(let i=0;i<9;i++){let m=mM(M.head,mT((i-4)*1.75,2.4-abs(i-4)*.38,-7.4-(i%2)*1.1),mRz((i-4)*.08),mRx(-.3-close*.22));const L=7+(i%3);
    for(let k=0;k<L;k++){m=mM(m,mRx(sin(R.t*(1+close)+i*1.3+k*.6)*(.17+close*.15)+(k>3?.12*(i%2?1:-1):.03)),mRz(sin(R.t*.8+i+k*.5)*.13));const sc=1.35*pow(.9,k);draw(CTH.tent,mMul(m,mS(sc,1,sc)),.22,1,5);m=mMul(m,mT(0,-3.9,0));}}
  if(P.eyes>.02){const g=P.eyes*(1+sin(R.t*7)*.06);for(const e of CL.eyes){const m=mM(M.head,mT(...e),mRz(e[0]<0?.4:-.4),mS(g,g,g));draw(CTH.eye,m,0);}
    const ep=mP(M.head,[0,8.4,-12]);light(ep[0],ep[1],ep[2],45*P.eyes,[.95*P.eyes,.12*P.eyes,.05*P.eyes]);}}
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
  // --- the awakening
  FIN.look=[10,6,140];CAM.rate=1.6;FIN.u=0;STORM.k=1;R.rip=[10,140,0,0];SFX.rumble(18);S.fear=2;await wait(1.5);
  say(HERO,'Море… оно кипит… Что-то поднимается со дна!',VO.hero);await wait(4.5);
  FIN.look=[10,10,138];await wait(1.2);SFX.roar(4,1.25);S.fear=3;await wait(3.8);   // eyes ignite (u≈7..9)
  FIN.look=[10,22,140];SFX.roar(5,1);S.shake=.8;await wait(5);                     // wings unfold
  FIN.look=[10,30,138];SFX.roar(5.5,.85);await wait(5);                             // arms rise, claws bared
  FIN.look=[10,26,132];SFX.rumble(8);SFX.roar(6.5,.7);S.shake=1.1;await wait(4.5);  // full rise, wave
  say(HERO,'Господи… Нет… Не смотри на меня!',{dur:2.8,pitch:150});await wait(2.2);
  // --- the reach
  FIN.look=null;CAM.rate=3.5;await wait(2.4);say(HERO,'НЕТ! НЕ-Е-ЕТ!..',{dur:3});if(AU.ctx){tone(520,2.6,{type:'sawtooth',vol:.14,to:880,lp:2400});tone(540,2.6,{type:'sawtooth',vol:.1,to:820,lp:2400});}
  FIN.hands=1;await wait(2.6);SFX.thud();S.shake=1.2;FIN.grab=1;await wait(1.2);                                   // fingers close (u≈32.6)
  SFX.roar(4.5,.6);await wait(4.6);                                                  // lifted up to the face
  await wait(1.6);SFX.bigSplash();S.shake=1.4;                                       // plunge
  await wait(2.2);SFX.bubbles();FIN.dying=1;await wait(2.5);SFX.bubbles();await wait(3);
  $('fade').style.transitionDuration='2500ms';$('fade').style.opacity=1;await wait(3);FIN.on=false;STORM.k=0;R.rain=0;R.uw=0;$('uw').style.opacity=0;$('tun').style.opacity=0;stormAudio(0,false);await wait(.6);credits();}
function updFinale(dt){
  if(FIN.on){FIN.t+=dt;if(FIN.u>=0)FIN.u+=dt;const u=FIN.u;
    FIN.lx=lerp(FIN.lx,-FIN.mx*.5,min(1,dt*3));FIN.ly=lerp(FIN.ly,-FIN.my*.35,min(1,dt*3));
    if(FIN.chant){FIN.ct=(FIN.ct||0)-dt;if(FIN.ct<=0){FIN.ct=2.2;for(const p of[58,66,74])mumble(2,p,false,.07,true);}}
    FIN.pose=cthPose(max(u,0));FIN.M=cthMats(FIN.pose);if(u>=0)cthWater(dt);
    if(u>=0){R.rip=[10,140,(u>4?1.4:0)+1.6*kf(u,19,24)*(1-kf(u,30,40)),max(0,u-3)*.9];}
    for(const c of FIN.cult){c.kneel=lerp(c.kneel,u>8?1:0,dt*.8);}
    // first-person camera: watches the descending hand; fingers close (darkness); then the hero is held above the fist, face to face
    if(u>=27){const a=FIN.M.arms[0],pz=FIN.pose;FIN.camP=FIN.M.camP||ALTAR_EYE;
      if(pz.close>.6&&pz.lift<.08){if(!FIN.dark){FIN.dark=1;$('fade').style.transitionDuration='140ms';$('fade').style.opacity=.95;SFX.thud();}}
      if(pz.lift>=.08){if(!FIN.held){FIN.held=1;$('fade').style.transitionDuration='600ms';$('fade').style.opacity=0;CAM.eye=FIN.camP.slice();}
        S.camFn=()=>{const e=FIN.camP;CAM.ge=e;const face=mP(FIN.M.head,[0,8,-16]);let lk=face;
          if(pz.plunge>0)lk=vLerp(face,vAdd(e,[0,-14,7]),eas(min(1,pz.plunge*1.7)));if(u>41.8)lk=vLerp(lk,mP(FIN.M.head,[0,8,-10]),kf(u,41.8,44));CAM.gt=fpTarget(e,lk);};CAM.rate=14;}
      else{S.camFn=()=>{CAM.ge=ALTAR_EYE;CAM.gt=fpTarget(ALTAR_EYE,mP(FIN.M.arms[0].H,[0,-5,-1]));};}}
    // underwater
    const e=CAM.eye,uw=e[1]<waveH(e[0],e[2]);R.uw=uw?1:0;$('uw').style.opacity=uw?1:0;
    if(uw){R.surf=waveH(e[0],e[2]);if(Math.random()<.6)PT.add(2,e[0]+(Math.random()-.5)*4,e[1]-1-Math.random()*3,e[2]+(Math.random()-.5)*4,(Math.random()-.5)*.6,2+Math.random()*3,(Math.random()-.5)*.6,.15+Math.random()*.3,3,[.6,.8,.82,.6],-1.5);}
    if(FIN.dying){FIN.dying+=dt;$('tun').style.opacity=1;$('tun').style.setProperty('--r',max(0,62-FIN.dying*12)+'%');FIN.hb=(FIN.hb||0)-dt;if(FIN.hb<=0){SFX.heart(max(.2,1-FIN.dying*.15));FIN.hb=.8+FIN.dying*.35;}}}
  updStorm(dt);}
function drawFinale(){if(FIN.attacker){const a=FIN.attacker;if(FIN.atkSwing)FIN.atkSwing=min(2,FIN.atkSwing+.05);const sw=FIN.atkSwing?lerp(-2.9,-.4,clamp(FIN.atkSwing-1,0,1)):-2.4;
    const m=drawChar(CH.c,a.x,0,a.z,a.rot,{armed:true,aR:sw});torchFx(m,0);}
  if(!FIN.on)return;drawCthulhu();
  for(const c of FIN.cult){const u=FIN.armUp?-2.75+sin(S.t*2+c.ph)*.12:-1.25;const m=drawChar(CH.c,c.x,0,c.z,c.rot,{armed:true,aR:u,aL:FIN.armUp?u+.1:-.2,crouch:c.kneel>.5});torchFx(m,c.ph,true);}
  {const p=FIN.priest,m=drawChar(CH.c,p.x,0,p.z,p.rot,{armed:true,aR:-2.9+sin(S.t*1.4)*.1,aL:-2.9});torchFx(m,p.ph,true);}
  for(const b of BRAZ){light(b[0],2.3,b[1],9+sin(S.t*13+b[0])*.8,[1,.55,.22]);if(Math.random()<.4)PT.add(5,b[0],2.2,b[1],R.wind[0]*.7,1.8,R.wind[1]*.7,.08,1.2,[1,.6,.2,.9],-.3);}
  // hero's own body and, later, panicked hands in view
  if(FIN.hands&&!FIN.grab){const e=CAM.eye,f=vNorm(vSub(CAM.tgt,e)),r=vNorm(vCross(f,[0,1,0])),up=vCross(r,f);for(const s of[-1,1]){const sp=vAdd(e,vAdd(vAdd(vSc(r,s*.32),vSc(up,-.42)),vSc(f,.05)));
    const tip=vAdd(sp,vAdd(vAdd(vSc(f,.75),vSc(up,.42+sin(S.t*14+s)*.05)),vSc(r,-s*.08)));draw(CH.hero.arm,mBasis(sp,vSub(tip,sp),vSc(f,-1)),0);}}}
function credits(){S.mode='credits';$('hud').style.display='none';$('gear').style.display='none';$('sub').style.display='none';$('lids').style.display='none';cv.style.filter='';const c=$('credits');c.style.display='flex';const n=EGGS.filter(e=>S.eggs[e.id]).length,mins=Math.round((S.t-S.t0)/60);
  $('roll').innerHTML='<h1>ЗОВ ИЗ ТУМАНА</h1><div class="hand" style="font-size:30px;color:#c4b693">Эдварда Крейна больше никто не видел.<br>Через неделю Уолтеру пришло видео с его номера:<br>шторм над пирсом, факелы — и что-то огромное в море.</div><h4>Конец первой главы</h4>'+
   '<h4>По мотивам</h4>Г. Ф. Лавкрафт — «Зов Ктулху» (1928)<h4>В ролях</h4>Эдвард Крейн, ведущий канала «За гранью»<br>Уолтер, голос в трубке<br>Хозяин мотеля<br>Хозяин паба «Дьяволов риф»<br>Жители Грейхейвена<br>Жрец и братья в робах<br>и Тот, кто спит в Р\'льехе'+
   '<h4>Ваше расследование</h4>Знаков культа найдено: 5 / 5<br>Находок-отсылок: '+n+' / '+EGGS.length+'<br>Потерь сознания: '+S.deaths+'<br>Время в деревне: ~'+mins+' мин'+
   '<h4>Прототип</h4>Модели — Blender, графика — WebGL, звук синтезирован в браузере<br><br><br><span class="hand" style="font-size:34px">«Не мертво то, что в вечности пребудет…»</span><br><br><br>Спасибо за игру';
  const r=$('roll');let y=innerHeight;const hgt=r.offsetHeight;const step=()=>{y-=innerHeight/900*1.6;r.style.top=y+'px';if(y>-hgt+innerHeight*.55)requestAnimationFrame(step);else $('again').style.display='block';};step();setTimeout(()=>$('again').style.display='block',12000);}
$('again').onclick=()=>{try{location.reload();}catch(e){}};

// --- frame
function drawAll(){
  draw(M_ground,null,0,1,1);draw(M_world,null,.035);draw(M_far,null,0);R.items[R.items.length-1].nodepth=1;draw(M_veg,null,0,1,3);draw(M_sea,mT(0,-.55,0),0,1,2);
  for(const l of LAMPS)light(l[0],l[1],l[2],l[3]*(1+sin(S.t*8+l[0])*.03),l[4]);
  for(const e of EN){if(!e.active&&e.show===false)continue;if(!e.active&&e.grp>3)continue;if(FIN.on)continue;const c=e.kind==='c';
    let aR=c?-1.25:e.state==='chase'?-.7:null;if(e.wind>0)aR=-2.7;if(e.atk>0){e.atk-=.016;aR=lerp(.4,-2.6,e.atk/.3);}
    if(e.flee&&e.state!=='ko'&&e.stun<=0)aR=-2.6+sin(S.t*10)*.35;   // the pub owner waving his arms while he yells
    const m=drawChar(c?CH.c:CH.v[e.v],e.x,0,e.z,e.rot,{armed:c||e.active&&!e.unarmed,ph:e.ph,mv:e.mv,aR,lie:e.state==='ko'});
    if(c&&e.state!=='ko')torchFx(m,e.ph);}
  if(P.vis&&!CAM.fp){let aR=null,aL=null;if(P.atk>0){const t=1-P.atk/.28;if(P.shove){aR=aL=lerp(-.6,-1.6,sin(t*PI));}else aR=lerp(-2.5,.5,t);}else if(P.block){aR=-1.9;aL=-1.7;}
    drawChar(CH.hero,P.x,0,P.z,P.rot,{armed:!!S.weapon,ph:P.ph,mv:P.mv,aR,aL,crouch:S.crouch,lie:P.lie});}
  draw(M_car,mM(mT(CAR.x,0,CAR.z),mRy(CAR.rot)),.04);if(!CAR.parked){const fx=CAR.x+sin(CAR.rot)*7,fz=CAR.z+cos(CAR.rot)*7;light(fx,1.5,fz,15,[1,.9,.6]);light(CAR.x,3,CAR.z,7,[.5,.5,.45]);}
  if(S.explore&&!FIN.on&&S.mode!=='finale')for(const p of pickups)if(!p.taken)draw(p.t==='m'?M_med:M_wpn,mM(mT(p.x,.55+sin(S.t*2+p.x)*.08,p.z),mRy(S.t*1.2)),.03);
  if(S.escaped&&!FIN.on&&S.mode!=='finale'){
    for(const z of PZ){if(S.solved[z.i])continue;const dim=z.i===5&&S.solved.slice(0,5).some(v=>!v);draw(M_beacon,mM(mT(z.x,2.7+sin(S.t*2+z.i)*.15,z.z),mRy(S.t*1.5),mS(dim?.5:1,dim?.5:1,dim?.5:1)),0);if(!dim)light(z.x,2.2,z.z+.8,6.5,[.25,.8,.7]);}}
  for(const e of EGGS){if(S.eggs[e.id]||!(e.id==='book'?S.inRoom:S.explore)||FIN.on||S.mode==='finale')continue;draw(M_egg,mM(mT(e.x,e.y+.55+sin(S.t*2.4+e.x)*.07,e.z),mRy(S.t*1.8)),0);}
  drawStory();drawFinale();}
function atmosphere(){const q=R.scale,M=R.mist;M.steps=q>=1?10:q>=.8?7:0;M.on=M.steps>0;
  if(R.uw){R.fog=[.012,.05,.056];R.fogD=1/30;R.fogMin=0;R.amb=[.12,.2,.22];R.sunC=[.05,.1,.12];M.on=false;return;}
  R.sunC=[.34,.42,.46];
  if(FIN.on){const g=FIN.u>0?kf(FIN.u,4,20):0;R.fog=[lerp(.06,.13,g),lerp(.13,.25,g),lerp(.145,.27,g)];R.fogD=S.fogK/lerp(80,108,g);R.fogMin=.03;R.fogH=.04;R.amb=[.3,.41,.45];
    M.den=.75*S.fogK;M.top=6.5;M.col=[.22,.32,.34];M.maxD=80;return;}
  if(S.inside){const I=ROOMS[S.inside];R.fog=I.fog||[.025,.03,.032];R.amb=I.amb||[.28,.3,.3];R.sunC=[.1,.12,.13];R.fogD=1/60;R.fogMin=0;R.fogH=.05;M.den=(I.mist||.22)*S.fogK;M.top=1.5;M.col=[.16,.17,.17];M.maxD=40;return;}
  R.fog=[.075,.15,.165];R.amb=[.36,.47,.5];R.fogH=.15;M.col=[.3,.42,.43];M.maxD=90;
  if(S.mode==='drive'||S.mode==='title'){R.fogD=S.fogK/30;R.fogMin=.03;M.den=.75*S.fogK;M.top=3.2;}else{R.fogD=S.fogK/25;R.fogMin=.05*S.fogK;M.den=1.05*S.fogK;M.top=3.5;}}
let last=0;
function frame(now){const dt=min(.05,(now-last)/1000||.016)*(S.ts||1);last=now;
  if(!S.pause){S.t+=dt;R.t=S.t;tickWaits(dt);tickSub(dt);
    if(S.mode==='drive')updCar(dt);
    if(S.mode==='play'){updPlayer(dt);story(dt);PFt-=dt;if(PFt<=0){PFt=.3;PF=EN.some(e=>e.active&&e.state==='chase')?field(P.x,P.z):null;}for(const e of EN)updEnemy(e,dt);}
    updFinale(dt);PT.update(dt,CAM.eye);if(S.hud||S.mode==='finale')updHud(dt);}
  camGoal();const k=S.fast?1:1-exp(-dt*CAM.rate);for(let i=0;i<3;i++){CAM.eye[i]=lerp(CAM.eye[i],CAM.ge[i],k);CAM.tgt[i]=lerp(CAM.tgt[i],CAM.gt[i],k);}
  S.shake=max(0,S.shake-dt*1.4);const sh=S.shakeOn?S.shake*(CAM.fp?.22:.55):0,eye=[CAM.eye[0]+(Math.random()-.5)*sh,CAM.eye[1]+(Math.random()-.5)*sh,CAM.eye[2]+(Math.random()-.5)*sh];
  atmosphere();R.focus=S.focus?S.focus():CAM.fp?CAM.eye:[P.x,0,P.z];drawAll();render(eye,CAM.tgt,CAM.fov);hud2d();requestAnimationFrame(frame);}
// title backdrop
$('title').style.display='flex';S.camFn=()=>{CAM.ge=[-23,15,-279];CAM.gt=[-28,0,-292];};S.focus=()=>[-28,0,-289];camSnap();drawFace();requestAnimationFrame(frame);
// debug / test hooks
window.DBG={R,S,P,EN,CAM,FIN,PB,PZ,PT,STORM,cols,blocked,field,finale,solvePuzzle,openPuzzle,closePuzzle,cthPose,waveH,
  // skip the intro and jump to a story stage: 'town', 'pub', 'back', 'cellar', 'alarm', 'play' (default: the puzzle hunt)
  toPlay(st='play'){S.fast=true;if(sub)sub.res();const w=waits;waits=[];w.forEach(x=>x.r());setTimeout(()=>{S.fast=false;storySkip(st);},300);},storySkip,XD,ROOMS,get LP(){return LP;}};
</script>
</body>
</html>
