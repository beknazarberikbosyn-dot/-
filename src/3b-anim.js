// ================= ANIMATION: pose continuity, falls, door and stair transitions =================
// drawChar() is told a pose every frame and used to show exactly that pose, so a switch (standing → lying, arm down → arm up,
// walking → stopped) happened in one frame. Here every drawChar call is matched to the same person's state from the previous
// frames (p.who — the game object — or else the nearest unclaimed state of the same rig within 1.6 m), and each joint is driven
// toward the requested pose by a critically damped spring. Lying down and getting up are played as falls whose style comes
// from p.fall: 'push' (shoved: stumbles back, arms windmilling, then goes over), 'shot' (thrown back off the feet),
// 'hit' (a heavy blow), 'collapse' (default: the knees give, then the body tips over). p.fallDir is the world direction of the
// push — the body ends up lying along it. A person who vanishes for a few frames or jumps more than 2.5 m starts fresh (no blend).
const PZ={L:[],fr:0,t:0,dt:.016,wm:new WeakMap()};
function poseFrame(){PZ.dt=clamp(S.t-PZ.t,0,.05);PZ.t=S.t;PZ.fr++;if(PZ.fr%60===0)PZ.L=PZ.L.filter(s=>PZ.fr-s.fr<120);}
const wrapA=a=>((a+PI)%(2*PI)+2*PI)%(2*PI)-PI;
// critically damped spring on s[k] toward v (w = stiffness, 1/s); a fresh state takes the target at once
function spr(s,k,v,w,dt){let x=s[k];if(x==null||s.snap){s[k]=v;s['v'+k]=0;return v;}let u=s['v'+k]||0;const n=Math.ceil(dt/.012)||1,h=dt/n;
  for(let i=0;i<n;i++){u+=(w*w*(v-x)-2*w*u)*h;x+=u*h;}s[k]=x;s['v'+k]=u;return x;}
function poseSt(ch,x,z,p){const fr=PZ.fr;let s=null;
  if(p.who){s=PZ.wm.get(p.who);if(!s||s.ch!==ch){s={ch,x,z,fr:-99};PZ.wm.set(p.who,s);}}
  else{let bd=1.6;for(const q of PZ.L)if(q.ch===ch&&q.fr!==fr){const d=hypot(q.x-x,q.z-z);if(d<bd){bd=d;s=q;}}if(!s){s={ch,x,z,fr:-99};PZ.L.push(s);}}
  const gap=fr-s.fr>8||hypot(s.x-x,s.z-z)>2.5;if(gap)for(const k in s)if(k!=='ch')delete s[k];
  s.snap=gap;s.fr=fr;s.x=x;s.z=z;return s;}
const FALLT={collapse:.95,push:1.25,shot:.62,hit:.8,rise:1.15};
function poseAnim(ch,x,y,z,rot,p){const st=poseSt(ch,x,z,p),dt=PZ.dt,want=p.lie?1:0;
  if(p.lieK!=null){st.lie=p.lieK>.5?1:0;st.F=null;}
  else if(st.lie==null)st.lie=want;   // first sight: no transition
  else if(want!==st.lie){st.lie=want;st.F={k:want?(FALLT[p.fall]?p.fall:'collapse'):'rise',t:0,sl0:st.sl||0,ph0:p.ph||0};if(want)st.ly=p.fallDir!=null?p.fallDir+PI:null;}
  if(!st.lie&&!st.F)st.ly=null;
  const A={st,dt,x,y,z,rot,mv:0,ph:p.ph||0,cr:0,si:0,lk:0,th:0,lift:0,sl:0,dy:0,lean:0,hp:0,fl:0,fa:[0,0],fe:.2,fz:0,fc:.4,wA:16};
  const rT=st.ly!=null?st.ly:rot;A.rot=spr(st,'r',st.r==null?rT:st.r+wrapA(rT-st.r),st.F?12:9,dt);
  let mvT=p.mv||0,cr=spr(st,'cr',p.crouch?1:0,9,dt),si=spr(st,'si',p.sit?1:0,7,dt),lk=p.lieK!=null?p.lieK:st.lie,th=lk*PI/2,lift=.22*lk,sl=st.sl||0;
  const F=st.F;
  if(F){F.t+=dt;const T=FALLT[F.k],u=min(1,F.t/T),k=F.k;mvT=0;A.wA=k==='shot'||k==='hit'?20:12;
    if(k==='rise'){const e=eas(u);th=PI/2*(1-e);lift=.22*(1-e);sl=F.sl0*(1-e);cr=max(cr,.85*sin(PI*min(1,u*1.1)));
      A.fl=sin(PI*u)*.8;A.fa=[-.5,-.4];A.fe=.6;A.fz=.3;A.fc=.3;A.hp=.3*sin(PI*u);}
    else{let v;
      if(k==='collapse'){v=clamp((u-.22)/.78,0,1);cr=max(cr,.75*sstep(0,.3,u)*(1-sstep(.55,1,u)));sl=F.sl0;A.lean=-.1*v;
        A.fl=.7*sstep(0,.2,u);A.fa=[.15,.25];A.fe=.35;A.fz=.15;A.fc=.35;A.hp=.4*sstep(0,.3,u);}
      else if(k==='push'){const q=min(1,u/.4);v=clamp((u-.33)/.67,0,1);sl=F.sl0+.55*(1-(1-q)*(1-q))+.3*v;A.lean=-.35*q*(1-v);
        mvT=1-sstep(.3,.45,u);A.ph=F.ph0+q*2*PI;cr=max(cr,.45*sin(PI*v));A.fl=1-sstep(.8,1,u)*.6;
        A.fa=[-2.3+sin(F.t*16)*.6*(1-v*.6),-2.0+sin(F.t*16+2.2)*.6*(1-v*.6)];A.fe=.3;A.fz=.5;A.fc=.6;A.hp=.3*sin(PI*v);}
      else{const S_=k==='shot'?1.25:.45;v=min(1,Math.pow(u,1.25));sl=F.sl0+S_*(1-(1-u)*(1-u));   // shot / hit: thrown back off the feet
        A.lean=-.55*exp(-F.t*9);A.hp=.6*exp(-F.t*7);A.fl=1-sstep(.75,1.4,F.t/T);A.fa=k==='shot'?[-2.4,-2.1]:[-1.6,-1.2];A.fe=.15;A.fz=.8;A.fc=.2;
        A.dy=(k==='shot'?.16:.06)*sin(PI*u);}
      th=PI/2*v*v;lift=.22*v;if(k==='shot'||k==='hit'){th=PI/2*v;lift=.22*v;}
      if(u>=1){if(!F.hit){F.hit=1;const bx=x-sin(A.rot)*(sl+.9),bz=z-cos(A.rot)*(sl+.9);dust(bx,.05,bz,6,.8);
          if(hypot(bx-P.x,bz-P.z)<25){noise(.22,{f:260,type:'lowpass',vol:.2,to:80});tone(70,.25,{vol:.22,to:40});}}
        const b=clamp((F.t-T)/.3,0,1);th=PI/2-.09*sin(PI*b)*(1-b);lift=.22+.03*sin(PI*b);}}
    if(F.t>=T+(k==='rise'?0:.3)){st.F=null;st.sl=k==='rise'?0:sl;}}
  else if(!st.lie)st.sl=sl=0;
  // falling from a height (the window sill): the body drops to the floor
  if(st.lie&&y>0){st.yk=min(1,(st.yk||0)+dt*2.4);A.y=y*(1-st.yk*st.yk);}else st.yk=0;
  if(F&&F.k==='push'&&mvT>0){st.mv=mvT;st.vmv=0;A.mv=mvT;}else A.mv=spr(st,'mv',mvT,8,dt);
  Object.assign(A,{cr,si,lk:th/(PI/2),th,lift,sl});return A;}

// --- first-person hands: the hand target (in the camera's own axes) and the finger curl ease toward the requested pose
const FPS={};
function fpSmooth(s,sp,tip,r,up,f,curl){const st=FPS[s]||(FPS[s]={}),d=vSub(tip,sp),dt=PZ.dt;st.snap=st.fr==null||PZ.fr-st.fr>8;st.fr=PZ.fr;
  const a=spr(st,'r',vDot(d,r),26,dt),b=spr(st,'u',vDot(d,up),26,dt),c=spr(st,'f',vDot(d,f),26,dt);
  return[vAdd(sp,vAdd(vAdd(vSc(r,a),vSc(up,b)),vSc(f,c))),spr(st,'c',curl,18,dt)];}

// --- opening a front door: the hand reaches for it, the leaf swings open on its hinge, the camera steps into the doorway
const DOORA={d:null,t0:0,cf:null,rate:5};
const M_leaf=(()=>{const g=new Geo(.02);g.bx(.5,0,0,.98,1.98,.07,H('#4a3426'));g.bx(.5,.02,.04,.86,.05,.02,H('#3a281c'));g.bx(.5,1.9,.04,.86,.05,.02,H('#3a281c'));
  g.bx(.86,.95,.055,.05,.05,.05,H('#b08d3c'));return mesh(g);})();
const M_doorGap=(()=>{const g=new Geo(0);g.bx(0,0,0,1.02,2.02,.5,H('#060505'));return mesh(g);})();
const doorK=()=>DOORA.d?clamp((S.t-DOORA.t0)/1.05,0,1):0;
async function doorOpen(d){if(!d||!d.n||d.n[1]!==1||S.fast)return false;
  const e0=[CAM.eye[0],CAM.eye[1],CAM.eye[2]],g0=[CAM.tgt[0],CAM.tgt[1],CAM.tgt[2]],fr=[d.x+d.n[0]*.55,1.6,d.z+d.n[1]*.55],c=[d.x,1.25,d.z],far=[d.x-d.n[0]*4,1.35,d.z-d.n[1]*4];
  Object.assign(DOORA,{d,t0:S.t,cf:S.camFn,rate:CAM.rate});S.fpPose='palm';CAM.rate=9;let snd=0;
  S.camFn=()=>{const k=doorK(),m=eas(k*1.7);CAM.ge=vLerp(e0,fr,eas((k-.3)/.7)*.85+m*.15);CAM.gt=vLerp(vLerp(g0,c,m),far,sstep(.45,1,k));S.fpPlay=true;CAM.fov=1.15;
    if(!snd&&k>.22){snd=1;SFX.door();}};
  await wait(.8);return true;}
function doorDone(){if(!DOORA.d)return;S.camFn=DOORA.cf;CAM.rate=DOORA.rate;DOORA.d=null;S.fpPose=null;}
function doorDraw(){const d=DOORA.d;if(!d||S.inside)return;const k=doorK(),R_=mM(mT(d.x-d.n[0]*.14,0,d.z-d.n[1]*.14),mRy(atan2(d.n[0],d.n[1])));
  draw(M_doorGap,R_,0);const a=1.75*eas(sstep(.2,.85,k));draw(M_leaf,mM(R_,mT(-.5,0,.26),mRy(-a)),.03);
  if(k>.3)light(d.x-d.n[0]*1.2,1.4,d.z-d.n[1]*1.2,3.5*sstep(.3,.7,k),[.9,.7,.45]);}

// --- going down / up a flight of stairs: the camera walks onto the first step and then rides the treads one by one
// (step-sound per tread, a slight dip of the head on each landing). o: {x, z0 (first tread edge), dz (per tread, signed),
// dy (per tread, signed), n, T (s)}. Resolves (with the function that gives the camera back) when the fade can start.
async function stairWalk(o){if(S.fast)return()=>{};const e0=[CAM.eye[0],CAM.eye[1],CAM.eye[2]],y0=e0[1],cf=S.camFn,rate=CAM.rate,t0=S.t,T=o.T||2;let last=-1;
  const top=[o.x,y0,o.z0-Math.sign(o.dz)*.25];CAM.rate=10;
  S.camFn=()=>{const u=clamp((S.t-t0)/T,0,1),w=eas(u/.2),s=clamp((u-.2)/.8,0,1)*o.n,i=min(floor(s),o.n-1),f=s-i,on=u>.2;
    if(on&&i!==last){last=i;SFX.step();}
    const ex=lerp(e0[0],o.x,w),ez=on?top[2]+o.dz*s:lerp(e0[2],top[2],w),ey=y0+(on?o.dy*(i+sstep(.15,.75,f))-.05*sin(PI*f):0);
    CAM.ge=[ex,ey,ez];CAM.gt=[ex,ey+(o.dy<0?-1.3:.9)*sstep(0,.3,u),ez+Math.sign(o.dz)*4];S.fpPlay=true;CAM.fov=1.15;};
  await wait(T*.72);return()=>{S.camFn=cf;CAM.rate=rate;};}
