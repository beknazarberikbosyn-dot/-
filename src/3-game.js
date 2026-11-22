// ================= GAME: state, characters, player, enemies, HUD =================
const S={mode:'title',t:0,pause:false,fast:false,escaped:false,booked:false,inRoom:false,peeked:false,solved:[0,0,0,0,0,0],lore:[],eggs:{},hp:100,st:100,tired:false,weapon:null,med:0,crouch:false,cp:[-58.5,-40.5],
  sens:1,fear:0,shake:0,obj:'',focus:null,diff:1,fogK:1,shakeOn:true,hud:false,chased:0,deaths:0,t0:0,
  explore:false,hunt:false,inside:null,notes:[],asked:0,ints:0,mark:null};
const P={x:-37,z:-15.6,y:0,rot:PI,ph:0,atk:0,cd:0,block:false,combo:0,comboT:0,hurt:0,vis:false,lie:false,stepT:0,armsUp:0};
const CAM={eye:[-25,15,-278],tgt:[-28,0,-290],ge:[0,0,0],gt:[0,0,0],fov:.72,rate:5,zoom:1,fp:false,yaw:0,pitch:0};
const K={};const TJ={on:false,x:0,y:0};let waits=[];
const wait=t=>S.fast?Promise.resolve():new Promise(r=>waits.push({t,r}));
function tickWaits(dt){for(const w of waits)w.t-=dt;const d=waits.filter(w=>w.t<=0);waits=waits.filter(w=>w.t>0);d.forEach(w=>w.r());}

// --- character meshes
const SKIN=H('#c9a183');
function gHero(){const b=new Geo(.05),a=new Geo(.05),aw=new Geo(.05),l=new Geo(.05),coat=H('#8a7450'),coatD=H('#6f5c3e'),hat=H('#4a3a2a');
  b.bx(0,.78,0,.62,.82,.36,coat);b.bx(0,.46,0,.68,.38,.42,coatD);b.bx(0,1.5,.12,.3,.12,.16,H('#a33a30'));b.sph(0,1.8,0,.19,.21,.19,SKIN,6,4);b.cyl(0,1.9,0,.36,.36,.04,8,hat);b.cyl(0,1.94,0,.21,.18,.18,8,hat);b.bx(0,1.78,.17,.06,.06,.06,H('#b08a6e'));
  for(const g of[a,aw]){g.bx(0,-.7,0,.17,.7,.19,coat);g.sph(0,-.76,0,.09,.09,.09,SKIN,5,3);}aw.bx(0,-.76,.42,.07,.07,.95,H('#7d8388'));
  l.bx(0,-.8,0,.22,.8,.24,H('#3a3530'));l.bx(0,-.82,.06,.23,.12,.34,H('#1c1a18'));
  return{body:mesh(b),arm:mesh(a),armW:mesh(aw),leg:mesh(l)};}
function gVillager(v){const b=new Geo(.06),a=new Geo(.06),aw=new Geo(.06),l=new Geo(.06),sh=H(['#5a6b4a','#6b5346','#4f5d6b','#77705f'][v]),pn=H('#33302c');
  b.bx(0,.8,0,.66,.8,.38,sh);b.sph(0,1.78,0,.2,.22,.2,H('#b89478'),6,4);
  if(v==3){b.bx(0,.75,.2,.5,.75,.05,H('#b9b4a4'));b.bx(0,1.66,.16,.26,.14,.1,H('#55504a'));}
  else{b.cyl(0,1.9,0,.23,.2,.1,7,H('#2f3a3c'));b.bx(0,1.9,.2,.3,.04,.16,H('#2f3a3c'));if(v==1)b.bx(0,1.64,.15,.28,.2,.12,H('#6a6258'));}
  for(const g of[a,aw]){g.bx(0,-.7,0,.18,.7,.2,sh);g.sph(0,-.76,0,.09,.09,.09,SKIN,5,3);}aw.bx(0,-.76,.45,.09,.09,1,PAL.wood);
  l.bx(0,-.8,0,.24,.8,.26,pn);l.bx(0,-.82,.06,.25,.12,.34,H('#1c1a18'));
  return{body:mesh(b),arm:mesh(a),armW:mesh(aw),leg:mesh(l)};}
function gCultist(){const b=new Geo(.07),a=new Geo(.07),aw=new Geo(.07),robe=H('#4d1d22'),robeD=H('#32131a');
  b.cyl(0,0,0,.52,.3,1.55,7,robe);b.sph(0,1.72,0,.27,.3,.29,robeD,7,4);b.cyl(0,1.9,-.08,.2,0,.4,5,robeD);b.bx(0,1.7,.2,.24,.26,.14,H('#060808'));b.cyl(0,.95,0,.42,.4,.07,7,H('#b9a36a'));
  b.bx(-.045,1.72,.275,.035,.03,.01,H('#ffd27a',1));b.bx(.045,1.72,.275,.035,.03,.01,H('#ffd27a',1));
  for(const g of[a,aw]){g.bx(0,-.68,0,.22,.72,.24,robe);g.sph(0,-.76,0,.09,.09,.09,H('#8f8f7a'),5,3);}
  aw.bx(0,-.76,.4,.07,.07,.9,PAL.woodD);aw.sph(0,-.74,.9,.13,.13,.2,H('#ff8a2a',1),5,3);aw.sph(0,-.72,.98,.07,.07,.14,H('#ffe08a',1),4,3);
  return{body:mesh(b),arm:mesh(a),armW:mesh(aw),leg:null};}
// Blender part models (origin conventions: body at the feet facing +Z, arms hang from the shoulder along -Y, legs hang from the hip)
const VCOL=[['#5a6b4a','#33302c'],['#6b5346','#3a342e'],['#4f5d6b','#2e2c2a'],['#77705f','#33302c']];
function oldPartSet(prefix,fb,opt={}){const b=modelMesh(opt.bodyName||prefix+'_body',opt.body),a=modelMesh(opt.arm||prefix+'_arm',opt.armO),aw=modelMesh(opt.armW||prefix+'_armW',opt.armO),l=opt.noLeg?null:modelMesh(opt.leg||prefix+'_leg',opt.legO);
  if(!b||!a)return fb();return{body:b,arm:a,armW:aw||a,leg:l,sh:opt.sh||[.27,1.47],hip:opt.hip||[.11,.9],model:true};}
// --- jointed people (Blender): <body> + <body>_head / _jaw / _lids and shared limb segments (shoulder→elbow→wrist→knuckles, hip→knee→ankle),
// recoloured per character by palette. Lengths must match ARM_L / HAND_L / LEG_L / ANKLE / HEAD_Z in tools/zov_lib.py.
const RIG={ua:.29,fa:.27,hand:.095,th:.42,sh:.40,ank:.085,headZ:1.725};
const SEGC={};function segM(n,pal){const k=n+'|'+(pal?JSON.stringify(pal):'');if(!(k in SEGC))SEGC[k]=modelMesh(n,pal?{pal}:null);return SEGC[k];}
const dk=(c,f)=>[c[0]*f,c[1]*f,c[2]*f,c[3]||0];
const skinPal=c=>({skin:c,skin2:dk(c,.86),skin_ch:c,stubble:dk(c,.8),fd_lid:dk(c,.93),fd_lidc:dk(c,.93),fd_lidl:dk(c,.97),fd_chin:c,fd_crease:dk(c,.78),fd_socket:dk(c,.93),fd_lip:dk(c,.78),fd_bag:dk(c,.82),fd_wrinkle:dk(c,.8)});
const HUMS={hero_body:{skin:'#c9a183',sl:'#8a7450',cf:'#6f5c3e',tr:'#3a3530',w:'wpn_crowbar'},
  vill_body_0:{skin:'#a8a088',sl:'#5a6b4a',tr:'#33302c',k:1.08,w:'wpn_club'},vill_body_1:{skin:'#a8a088',sl:'#6b5346',tr:'#3a342e',w:'wpn_club'},
  vill_body_2:{skin:'#a8a088',sl:'#4f5d6b',tr:'#2e2c2a',k:.92,kz:1.05,w:'wpn_club'},vill_body_3:{skin:'#b8987e',sl:'#77705f',tr:'#33302c',k:1.16,w:'wpn_club'},
  cult_body:{skin:'#8f8f7a',sl:'#4d1d22',cf:'#32131a',k:1.05,robe:1,noLeg:1,w:'wpn_torch'},
  wom_body_0:{skin:'#c9a183',sl:'#5a4a5a',st:'#2a2624',k:.9,f:1},wom_body_1:{skin:'#c9a183',sl:'#6a5a44',st:'#3a3430',k:.9,f:1},wom_body_2:{skin:'#c9a183',sl:'#3a3a3e',st:'#1e1e20',k:.9,f:1},
  kid_body_0:{skin:'#c9a183',sl:'#4a5a6a',tr:'#3a3836',k:.74,kz:.66},kid_body_1:{skin:'#c9a183',sl:'#7a4a44',st:'#5a4a40',k:.74,kz:.66,f:1},
  doc_body:{skin:'#c4a088',sl:'#cfcab8',cf:'#b8b3a2',tr:'#2a2a2e'},
  paul_body:{skin:'#bfa08a',sl:'#1e1a1c',cf:'#141214',st:'#141214',k:.95,cass:1},matt_body:{skin:'#c8a68c',sl:'#16161a',cf:'#101014',st:'#101014',cass:1}};
let SEGN=0;
function partSet(prefix,fb,opt={}){const bn=opt.bodyName||prefix+'_body',h=HUMS[bn];
  if(!h||!getModel(bn)||!getModel(bn+'_head')||!getModel('arm_up'))return oldPartSet(prefix,fb,opt);
  const k=h.k||1,kz=h.kz||1,bp=Object.assign({},opt.body&&opt.body.pal||{}),ap=opt.armO&&opt.armO.pal||{},lp=opt.legO&&opt.legO.pal||{};
  const skin=bp.skin||ap.skin||H(h.skin),sl=ap.cloth||H(h.sl),cf=h.cf&&!ap.cloth?H(h.cf):dk(sl,.78),tr=lp.trousers||H(h.tr||'#33302c');
  const sp=(bp.skin||ap.skin)?skinPal(skin):null;if(sp)Object.assign(bp,sp);if(!h.f&&!h.robe)bp.trousers=bp.trousers||tr;
  const hp=sp?{pal:sp}:null,ar={cloth:sl,cuff:cf,skin},hs={skin};
  return{seg:true,model:true,sd:SEGN++,bn,body:modelMesh(bn,{pal:bp}),head:modelMesh(bn+'_head',hp),jaw:modelMesh(bn+'_jaw',hp),lids:modelMesh(bn+'_lids',hp),
    arm:{up:segM(h.robe?'robe_up':'arm_up',ar),lo:segM(h.robe?'robe_lo':'arm_lo',ar)},hand:[segM('hand_R',hs),segM('hand_L',hs)],fing:[segM('fing_R',hs),segM('fing_L',hs)],fist:[segM('fist_R',hs),segM('fist_L',hs)],
    leg:h.noLeg?null:h.f||h.cass?{up:null,lo:segM('stock_lo',{stock:H(h.st)}),foot:segM(h.cass?'foot':'shoe')}:{up:segM('leg_up',{trousers:tr}),lo:segM('leg_lo',{trousers:tr}),foot:segM('foot')},
    wpn:h.w?segM(h.w):null,sh:[.185*k,1.4*kz],hip:[.092*k,.9*kz],neck:(RIG.headZ-.12)*kz,kz,w:clamp(k,.75,1.12),f:!!h.f,skirt:!!(h.f||h.cass)};}
// who is talking: the nearest non-hero person to the camera while an NPC line is being spoken (the lower lip follows the syllables)
const TK={on:false,open:0,cand:null,cd:1e9,cur:null};
function talkTick(dt){let tg=0;TK.on=false;
  if(sub&&sub.who&&sub.who!==HERO&&!S.vision&&!/Уолтер|Шёпот|Голос/.test(sub.who)&&!/^\*за дверью/.test(sub.text)){const L=sub.text.length,ws=max(.6,min(sub.dur-.9,L*.05));
    if(sub.t<ws){TK.on=true;const c=(sub.text[floor(sub.t/ws*L)]||' ').toLowerCase();tg=/[аеёиоуыэюяaeiou]/.test(c)?.7+.3*abs(sin(sub.t*23)):/[\s,.!?…—-]/.test(c)?.05:.3;}}
  TK.open+=(tg-TK.open)*min(1,dt*20);}
function talkFrame(){TK.cur=TK.on?TK.cand:null;TK.cand=null;TK.cd=1e9;}
// one arm from a shoulder matrix U: elbow flex e, finger curl; s = -1 right / +1 left. Returns the wrist matrix
function drawArm(ch,U,s,e,curl,o,ws=1,kz=1){const S_=mS(ws,kz,ws);draw(ch.arm.up,mM(U,S_),o);const F=mM(U,mT(0,-RIG.ua*kz,0),mRx(-e));draw(ch.arm.lo,mM(F,S_),o);
  const W=mM(F,mT(0,-RIG.fa*kz,0),mRx(-.08)),hi=s<0?0:1,oh=o*.35;draw(ch.hand[hi],mM(W,S_),oh);drawFingers(ch,mM(W,mT(0,-RIG.hand*kz,0)),hi,s,curl,S_,oh);return W;}
// relaxed fingers bend as one at the knuckles; past ~50° they are drawn rolled into a fist
function drawFingers(ch,K,hi,s,curl,S_,o){if(curl>.85&&ch.fist[hi])draw(ch.fist[hi],S_?mM(K,S_):K,o);else draw(ch.fing[hi],S_?mM(K,mRz(-s*curl),S_):mM(K,mRz(-s*curl)),o);}
function drawLegStraight(ch,U,kn,o){if(!ch.leg)return;if(ch.leg.up)draw(ch.leg.up,U,o);const K=mM(U,mT(0,-RIG.th,0),mRx(kn));draw(ch.leg.lo,K,o);draw(ch.leg.foot,mM(K,mT(0,-RIG.sh,0)),o);}
function drawChar(ch,x,y,z,rot,p={}){if(!ch.seg)return drawCharOld(ch,x,y,z,rot,p);
  const o=p.out==null?.03:p.out,mv=p.mv||0,ph=p.ph||0,kz=ch.kz,sd=ch.sd*1.37+(p.seed||0),t=S.t,sw=sin(ph)*mv,legs=!!ch.leg;
  const lk=p.lie?1:p.lieK||0;let base=mM(mT(x,y,z),mRy(rot));if(lk)base=mM(base,mT(0,.22*lk,0),mRx(-PI/2*lk));
  let dy=-abs(sw)*.04*kz,lean=.05*mv;
  if(p.sit&&legs){dy=-.42*kz;lean=.04;}else if(p.crouch){if(legs){dy=-.3*kz;lean=.32;}else base=mM(base,mS(1,.68,1));}
  const pel=mM(base,mT(0,dy,0)),hy=ch.hip[1],tw=-sin(ph)*.09*mv,br=sin(t*1.8+sd)*.005;
  const B=mM(pel,mT(0,hy,0),mRx(lean),mRy(tw),mT(0,-hy,0));draw(ch.body,B,o);
  // head: turns to the player when he is close, idles, nods while talking; lower lip, blinking
  const dC=hypot(x-CAM.eye[0],z-CAM.eye[2]);if(TK.on&&ch!==CH.hero&&!p.lie&&dC<9&&dC<TK.cd){TK.cd=dC;TK.cand={ch,x,z};}
  const talk=p.talk||(TK.cur&&TK.cur.ch===ch&&abs(TK.cur.x-x)+abs(TK.cur.z-z)<1);
  let yaw=p.look!=null?p.look:0,pit=-lean*.7;
  if(p.look==null&&ch!==CH.hero&&!p.lie){const dx=P.x-x,dz=P.z-z,d=hypot(dx,dz);if(d<7&&d>.3){let a=atan2(dx,dz)-rot-tw;a=((a+PI)%(2*PI)+2*PI)%(2*PI)-PI;if(abs(a)<2.3)yaw=clamp(a,-1.05,1.05)*clamp((7-d)/2.5,0,1)*(1-.65*min(1,mv));}}
  if(!p.lie){yaw+=sin(t*.41+sd)*.07;pit+=sin(t*.29+sd*1.3)*.035+(talk?sin(t*4.1+sd)*.04:0);}
  const nk=ch.neck,Hm=mM(B,mT(0,nk+br,0),mRy(yaw),mRx(pit),mT(0,-nk,0)),oH=o*.4;draw(ch.head,Hm,oH);   // thin outline: a 3 cm shell would cross the face from hats and braids
  draw(ch.jaw,talk?mM(Hm,mT(0,-TK.open*.013,-TK.open*.003)):Hm,oH);if(ch.lids&&((t*.29+sd*.37)%1)<.035)draw(ch.lids,Hm,oH);
  // arms: shoulder swing/raise, automatic elbow bend, wrist, curled fingers; the right fist grips the weapon
  let grip=null;const sh=ch.sh;
  for(const s of[-1,1]){const R_=s<0;let a=R_?p.aR:p.aL;if(a==null)a=(R_?1:-1)*sw*(ch.f?.38:.48)+(p.sit?0:sin(t*.9+sd+s)*.025);
    const armed=R_&&p.armed&&(p.wpn||ch.wpn);let e=R_?p.eR:p.eL;
    if(e==null)e=.14+max(0,-a)*.45*min(1,mv*2)+(a<-.5&&a>-2.4?.32:0)+(armed?.28:0)+(p.sit?.45:0)+sin(t*1.3+sd+s)*.02;
    const U=mM(B,mT(s*sh[0],sh[1]+br,0),mRx(a),mRz(((R_?p.aRz:p.aLz)||0)+s*(.06+(ch.f?.03:0))));
    let c=R_?p.cR:p.cL;if(c==null)c=armed?1.5:p.fist?1.25:.32+sin(t*.7+sd+s)*.06;
    const W=drawArm(ch,U,s,e,c,o,ch.w,kz);if(R_){grip=W;if(armed){grip=mM(W,mT(.022*ch.w,-.1*kz,0));draw(p.wpn||ch.wpn,grip,o);}}}
  // legs: two-bone IK onto the ground; the swing foot lifts and rolls heel-to-toe
  if(legs){const hp=ch.hip,l1=RIG.th*kz,l2=RIG.sh*kz,an=RIG.ank*kz,lw=ch.w,S_=mS(lw,kz,lw);
    for(const s of[-1,1]){const lp=ph+(s<0?0:PI),H0=[s*hp[0],hp[1],0];let f,toe=0;
      if(p.sit)f=[s*(hp[0]+.03),an,.42*kz];else if(p.crouch)f=[s*(hp[0]+.05),an,(s<0?.2:-.06)*kz];
      else{const A=.23*mv*kz*(p.stride||1)*(ch.skirt?.6:1),up=max(0,cos(lp));f=[s*(hp[0]+.006),an+up*(ch.skirt?.06:.12)*mv*kz,sin(lp)*A+.012];toe=up*sin(lp)*.45*mv;}
      f[1]-=dy;
      const q=ik2(H0,f,l1,l2,[s*hp[0]*1.3,H0[1]-.3,1.6]),kn=q.e,af=q.t,d1=vNorm(vSub(kn,H0)),d2=vNorm(vSub(af,kn));
      if(ch.leg.up)draw(ch.leg.up,mM(pel,mBasis(H0,d1,[0,d1[2],-d1[1]]),S_),o);
      draw(ch.leg.lo,mM(pel,mBasis(kn,d2,[0,d2[2],-d2[1]]),S_),o);
      draw(ch.leg.foot,mM(pel,mT(af[0],af[1],af[2]),mRx(-toe),S_),o);}}
  if(!p.lie&&!p.noBlob)draw(M_blob,mT(x,.03,z),0,.38);return grip;}
const CH={hero:partSet('hero',gHero),
  v:[0,1,2,3].map(v=>partSet('vill',()=>gVillager(v),{sh:[[.29,1.47],[.27,1.47],[.25,1.52],[.31,1.47]][v],body:{},arm:'vill_arm',armW:'vill_armW',leg:'vill_leg',armO:{pal:{cloth:H(VCOL[v][0])}},legO:{pal:{trousers:H(VCOL[v][1])}},bodyName:'vill_body_'+v})),
  c:partSet('cult',gCultist,{armW:'cult_armT',noLeg:true,sh:[.3,1.45]})};
const M_flame=modelMesh('flame')||(()=>{const g=new Geo(0);g.sph(0,.1,0,.13,.2,.13,H('#ff8a2a',1),5,3);g.sph(0,.15,0,.07,.13,.07,H('#ffe08a',1),4,3);return mesh(g);})();
const TORCH_TIP=[0,-.08,.9];   // in the torch's own space (held in the fist)
const M_blob=(()=>{const g=new Geo(0);g.cyl(0,0,0,.55,.55,.01,10,[0,0,0,0]);return mesh(g);})();
const mkRing=c=>{const g=new Geo(0),p=(a,r)=>[cos(a)*r,0,sin(a)*r];for(let i=0;i<48;i+=2){const a0=i/48*2*PI,a1=(i+1.2)/48*2*PI;g.quad(p(a0,.98),p(a1,.98),p(a1,1),p(a0,1),c);g.quad(p(a0,.98),p(a0,1),p(a1,1),p(a1,.98),c);}return mesh(g);};
const M_ringR=mkRing(H('#ff5a48',1)),M_ringY=mkRing(H('#f0c060',1));
const M_beacon=(()=>{const g=new Geo(.02);g.cyl(0,0,0,.28,0,.45,4,H('#7fffe0',1));g.cyl(0,-.45,0,0,.28,.45,4,H('#5fd6c0',1));return mesh(g);})();
const M_egg=(()=>{const g=new Geo(.02);g.bx(0,-.15,0,.26,.32,.03,H('#f1e3b0',.85));return mesh(g);})();
function drawCharOld(ch,x,y,z,rot,p={}){let base=mM(mT(x,y,z),mRy(rot));if(p.lie)base=mM(base,mT(0,.22,0),mRx(-PI/2));else if(p.crouch)base=mMul(base,mS(1,.68,1));
  const o=p.out==null?.03:p.out,sh=ch.sh||[.42,1.55],hp=ch.hip||[.16,.8];draw(ch.body,base,o);const sw=sin(p.ph||0)*(p.mv||0);
  const aR=mM(base,mT(-sh[0],sh[1],0),mRx(p.aR!=null?p.aR:sw*.7),mRz(p.aRz||0));draw(p.armed?ch.armW:ch.arm,aR,o);
  draw(ch.arm,mM(base,mT(sh[0],sh[1],0),mRx(p.aL!=null?p.aL:-sw*.7),mRz(p.aLz||0)),o);
  if(ch.leg){draw(ch.leg,mM(base,mT(-hp[0],hp[1],0),mRx(-sw*.75)),o);draw(ch.leg,mM(base,mT(hp[0],hp[1],0),mRx(sw*.75)),o);}
  if(!p.lie&&!p.noBlob)draw(M_blob,mT(x,.03,z),0,.38);return aR;}
// torch flame + embers for a cultist arm matrix
function torchFx(m,ph,big){const f=mP(m,TORCH_TIP),k=1+sin(S.t*17+ph)*.12+sin(S.t*29+ph*2)*.08;draw(M_flame,mM(mT(f[0],f[1],f[2]),mRy(S.t*3+ph),mS(k*(big?1.3:1),k*(1.2+sin(S.t*11+ph)*.2)*(big?1.4:1),k*(big?1.3:1))),0);
  light(f[0],f[1]+.2,f[2],(big?10:9)+sin(S.t*12+ph)*.7,[1,.52,.2]);if(Math.random()<(big?.5:.18))PT.add(5,f[0]+(Math.random()-.5)*.1,f[1]+.25,f[2]+(Math.random()-.5)*.1,R.wind[0]*.8+(Math.random()-.5)*.4,1.4+Math.random(),R.wind[1]*.8+(Math.random()-.5)*.4,.06+Math.random()*.05,.9+Math.random()*.6,[1,.55+Math.random()*.25,.2,.9],-.4);return f;}
// --- UI helpers
let toastT=0;function toast(t,d=4.5){const e=$('toast');e.innerHTML=t;e.style.opacity=1;toastT=d;}
function setObj(t){S.obj=t;$('obj').innerHTML='<small>Цель</small>'+t;}
let sub=null;
function say(who,text,o={}){if(S.fast)return Promise.resolve();if(sub)sub.res();const dur=o.dur||(1.5+text.length*.052);const e=$('sub');e.style.display='block';e.innerHTML='<b>'+who+'</b><span></span>';
  if(o.pitch)mumble(min(dur-.9,text.length*.05),o.pitch,o.phone,o.vol);return new Promise(res=>{sub={t:0,dur,text,who,res:()=>{sub=null;e.style.display='none';mumbleStop();res();},n:0};});}
function tickSub(dt){talkTick(dt);if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').style.opacity=0;}if(!sub)return;sub.t+=dt;const n=min(sub.text.length,floor(sub.t*48));if(n!==sub.n){sub.n=n;$('sub').lastChild.textContent=sub.text.slice(0,n);}if(sub.t>sub.dur)sub.res();}
function subAdvance(){if(!sub)return false;if(sub.n<sub.text.length){sub.t=sub.text.length/48;}else sub.res();return true;}
const VO={hero:{pitch:128},col:{pitch:150,phone:true},own:{pitch:82},vil:{pitch:100},cult:{pitch:66,vol:.2}};
const HERO='Эдвард Крейн';
function fade(to,ms=1200){const f=$('fade');f.style.transitionDuration=(S.fast?0:ms)+'ms';f.style.opacity=to;return wait(ms/1000);}

// --- interactions / pickups / eggs
const inter=[];// {x,z,r,label,fn,on}
function addInter(x,z,r,label,fn,on){const o={x,z,r,label,fn,on:on||(()=>true)};inter.push(o);return o;}
const pickups=[];   // weapons and medkits are gone from the map: the only weapon is the bat in the pub cellar
const EGGS=[
 {id:'book',x:-56.2,z:-30.2,r:1.6,y:1.4,t:'Книга на столике',b:'Потрёпанный том без названия. На форзаце кто-то вывел: «Список с „Некрономикона“ безумного араба». Одна строка подчёркнута дважды — о том, что вечно лежащее не мертво, и что в странные эпохи умереть может даже сама смерть.<br><br><i>Почему такая книга лежит в номере мотеля вместо Библии?</i>'},
 {id:'mail',x:-6.6,z:-11.8,r:1.6,y:1.5,t:'Почтовый ящик',b:'На ржавой табличке: «Проф. Дж. Г. Энджелл, семитские языки. Провиденс». Внутри — невостребованное письмо от 1926 года: «Профессор, барельеф готов. Сны не прекращаются. — Г. Э. Уилкокс».'},
 {id:'alert',x:34,z:44,r:2.2,y:1.6,t:'Разбитая яхта',b:'На корме ещё читается название: «ALERT». Рядом в песке — спасательный круг с другой надписью: «EMMA, Окленд».<br><br><i>Два судна из одной старой газетной истории о единственном выжившем моряке...</i>'},
 {id:'news',x:15.6,z:-14.4,r:1.7,y:1.6,t:'Доска объявлений',b:'Пожелтевшая вырезка, «Сидней Буллетин», апрель 1925: «В море найдено брошенное судно. На борту один живой и один мёртвый. Выживший, норвежец Йохансен, отказывается говорить о том, что видел на неизвестном острове».'},
 {id:'crate',x:-6,z:38.6,r:1.8,y:1.6,t:'Ящик с маркировкой',b:'«МИСКАТОНИКСКИЙ УНИВЕРСИТЕТ, АРКХЕМ. Экспедиционное имущество. Не вскрывать». Ящик вскрыт. Внутри — пустая форма под статуэтку и клочок бумаги: «Идол из луизианских болот. Изъят инсп. Леграссом, 1907».'},
 {id:'graf',x:-2.5,z:20.6,r:1.7,y:1.6,t:'Надпись на стене',b:'Выцарапано гвоздём, снова и снова:<br><b>«Ph\'nglui mglw\'nafh Cthulhu R\'lyeh wgah\'nagl fhtagn»</b><br><br><i>Ни один человеческий язык так не звучит.</i>'},
 {id:'idol',x:17.6,z:5.5,r:1.6,y:1.7,t:'Статуэтка в окне',b:'За мутным стеклом — фигурка из зеленоватого камня: существо с головой спрута, перепончатыми крыльями и когтистыми лапами сидит на постаменте, исписанном неведомыми знаками. Она стоит в каждом втором окне этой деревни.'},
];
function openNote(t,b){$('ntT').textContent=t;$('ntB').innerHTML=b;$('note').style.display='flex';S.pause=true;SFX.page();}
function closeNote(){$('note').style.display='none';S.pause=false;if(S.noteCb){const f=S.noteCb;S.noteCb=null;f();}}
EGGS.forEach(e=>{W;addInter(e.x,e.z,e.r,'Осмотреть: '+e.t,()=>{if(!S.eggs[e.id]){S.eggs[e.id]=1;}openNote(e.t,e.b);},()=>e.id=='book'?S.inRoom:S.explore&&!S.inside);});

// --- enemies
const EN=[];let grpN=0;
function mkE(kind,x,z,wp,o={}){const e=Object.assign({kind,x,z,hx:x,hz:z,rot:0,ph:rnd()*6,wp,wi:0,state:'patrol',aw:0,hp:4,wind:0,cd:0,stun:0,lose:0,st:0,active:false,v:floor(rnd()*3),sp:kind=='c'?2.7:2.4,mv:0,grp:++grpN,ls:[x,z],F:null},o);EN.push(e);return e;}
const owner=mkE('v',-43.5,-35,[[-44,-23],[-36,-14],[-52,-18]],{v:3,rot:0});
const con=mkE('v',-46.5,-22.6,[[-47,-22],[-66,-22],[-66,-34]],{v:1,rot:1});
const loaf=mkE('v',-40.6,-21.2,[[-40,-14],[-31.5,-20],[-34,-10]],{v:0,rot:-1.2});
mkE('v',-20,-8,[[-27,-8],[-8,-8],[8,-8]]);mkE('v',32,10,[[30,-7],[33,12],[41,22]]);
{mkE('c',-10,-8,[[-18,-8],[10,-8],[36,-8],[10,-8]]);
 const b=mkE('c',10,30,[[10,30],[30,22.5],[44,24],[30,22.5]]);mkE('c',9,29,null,{leader:b,off:[1.3,-1.3],grp:b.grp});
 mkE('c',-28,20,[[-28,20],[-28,39.5],[-5,40],[-5,22],[-11,21]]);}
loaf.stay=true;
function alertE(e){for(const o of EN)if(o.grp===e.grp&&o.active&&o.state!=='ko'&&o.state!=='chase'){o.state='chase';o.aw=1;o.lose=0;o.ls=[P.x,P.z];}SFX.alert();}
function faceTo(e,a,dt,k=8){let d=a-e.rot;while(d>PI)d-=2*PI;while(d<-PI)d+=2*PI;e.rot+=d*min(1,dt*k);}
function goDir(e,tx,tz,sp,dt){const dx=tx-e.x,dz=tz-e.z,d=hypot(dx,dz);if(d<.05)return;const s=min(d,sp*dt);const ox=e.x,oz=e.z;moveC(e,dx/d*s,dz/d*s,.34);e.mv=1;e.ph+=dt*sp*2.3;faceTo(e,atan2(dx,dz),dt);return hypot(e.x-ox,e.z-oz)>s*.3;}
function goField(e,F,sp,dt){const i=cellI(e.x),j=cellJ(e.z);let best=F[j*GW+i];if(best<0)best=32000;let bi=0,bj=0;
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=GW||nj>=GH)continue;const v=F[nj*GW+ni];if(v<0||v>=best)continue;if(di&&dj&&(blocked[j*GW+ni]||blocked[nj*GW+i]))continue;best=v;bi=di;bj=dj;}
  if(!bi&&!bj)return false;goDir(e,GX0+i+bi+.5,GZ0+j+bj+.5,sp,dt);return true;}
let PF=null,PFt=0;
function updEnemy(e,dt){
  if(!e.active||e.state==='ko')return;e.mv=0;e.cd-=dt;
  if(e.stun>0){e.stun-=dt;e.wind=0;return;}
  if(e.flee){fleeE(e,dt);return;}
  if(e.kind==='f')return updFish(e,dt);
  const dx=P.x-e.x,dz=P.z-e.z,d=hypot(dx,dz)||.01;
  // perception
  const Rv=(e.kind==='c'?14:11)*S.diff*(S.crouch?.55:1);e.rv=Rv;e.lr=(e.kind==='c'?16:12.5)*S.diff;const fx=sin(e.rot),fz=cos(e.rot),dt_=(dx*fx+dz*fz)/d;
  let sees=d<Rv&&dt_>.3&&los(e.x,e.z,P.x,P.z,S.crouch);if(d<2.3&&los(e.x,e.z,P.x,P.z,S.crouch))sees=true;if(P.lie||S.disguise||S.escort)sees=false;
  if(e.state!=='chase'){if(sees)e.aw+=dt*(2.4*(1-d/Rv)+.45)*S.diff;else e.aw-=dt*.3;if(P.running&&d<7.5&&!S.disguise&&!S.escort){e.aw+=dt*.55;faceTo(e,atan2(dx,dz),dt,3);}e.aw=clamp(e.aw,0,1);if(e.aw>=1)alertE(e);}
  if(e.state==='chase'){S.chased=.6;
    const out=d>e.lr&&!e.direct;if(sees&&!out||e.direct){e.ls=[P.x,P.z];e.lose=0;}else{e.lose+=dt;if(out||e.lose>2.5){e.state='search';e.st=4;e.F=field(e.ls[0],e.ls[1]);e.aw=.2;e.wind=0;if(!EN.some(o=>o.active&&o.state==='chase'))toast('Вас потеряли из виду. Не попадайтесь снова.',3);return;}}
    if(e.wind>0){e.wind-=dt;faceTo(e,atan2(dx,dz),dt,10);if(e.wind<=0){strike(e,d);}return;}
    const reach=e.kind==='c'?1.55:1.45;
    if(d<reach&&sees){if(e.cd<=0){e.wind=e.kind==='c'?.45:.6;}faceTo(e,atan2(dx,dz),dt,10);return;}
    if(e.direct||d<3&&los(e.x,e.z,P.x,P.z,true)){if(!goDir(e,P.x,P.z,e.sp,dt)&&PF&&!e.direct)goField(e,PF,e.sp,dt);}else if(PF)goField(e,PF,e.sp,dt)||goDir(e,P.x,P.z,e.sp,dt);
    return;}
  if(e.state==='search'){if(hypot(e.ls[0]-e.x,e.ls[1]-e.z)>1.3&&goField(e,e.F,e.sp*.6,dt))return;e.st-=dt;e.rot+=dt*1.6;if(e.st<=0)e.state='patrol';return;}
  // patrol
  if(e.leader){const l=e.leader;if(l.state==='ko'){e.leader=null;e.wp=[[e.x,e.z]];return;}const c=cos(l.rot),s=sin(l.rot),tx=l.x+e.off[0]*c+e.off[1]*s,tz=l.z-e.off[0]*s+e.off[1]*c;if(hypot(tx-e.x,tz-e.z)>.5)goDir(e,tx,tz,2.6,dt);else faceTo(e,l.rot,dt,4);return;}
  if(!e.wp)return;if(e.st>0){e.st-=dt;e.rot+=sin(S.t*.9+e.ph)*dt*.9;return;}
  const w=e.wp[e.wi];if(hypot(w[0]-e.x,w[1]-e.z)<1.1){e.wi=(e.wi+1)%e.wp.length;e.st=e.wp.length>1?1.2+rnd()*1.8:99;return;}
  if(!goField(e,field(w[0],w[1],true),e.kind==='c'?1.9:1.6,dt))goDir(e,w[0],w[1],1.6,dt);
}
function strike(e,d){e.cd=e.kind==='c'?1.5:e.kind==='f'?1.15:1.25;e.atk=.3;SFX.swing();if(d>(e.kind==='c'?2.1:1.95))return;
  const facing=cos(P.rot-atan2(e.x-P.x,e.z-P.z))>.2;
  if(P.block&&facing){if(e.kind!=='c'){e.stun=e.kind==='f'?.9:1.3;S.st=max(0,S.st-10);SFX.parry();toast('Парировано! Бейте, пока он оглушён.',2);return;}S.st=max(0,S.st-30);damage(18,e);return;}
  damage(e.kind==='c'?34:e.kind==='f'?30:14,e);}
function damage(n,e){if(S.mode!=='play')return;S.hp-=n;P.hurt=.5;S.shake=max(S.shake,.35);SFX.hurt();if(e){const a=atan2(P.x-e.x,P.z-e.z);moveC(P,sin(a)*.7,cos(a)*.7);}S.lastHurt=S.t;if(S.hp<=0){S.hp=0;die(e);}}
function playerAttack(shove){if(S.mode!=='play'||S.pause||P.cd>0||P.block)return;if(S.rifle){fireRifle();return;}const cost=shove?14:9;if(S.st<cost){toast('Нет сил...',1.5);return;}S.st-=cost;P.cd=shove?.6:.42;P.atk=.28;P.shove=shove;SFX.swing();
  let best=null,bd=2.05;for(const e of EN){if(!e.active||e.state==='ko')continue;const d=hypot(e.x-P.x,e.z-P.z);if(d<bd&&cos(P.rot-atan2(e.x-P.x,e.z-P.z))>-.2){bd=d;best=e;}}
  if(!best){P.combo=0;return;}
  if(best.kind==='f'){hitFish(best);return;}
  if(best.kind==='c'){SFX.hit();toast('Бесполезно — он даже не пошатнулся. <b>Бегите!</b>',2.5);if(best.state!=='chase')alertE(best);return;}
  SFX.hit();const a=P.rot;
  if(shove){if(P.combo>=2&&P.comboT>0){best.state='ko';best.aw=0;toast('Нокаут!',1.8);P.combo=0;S.shake=.2;}else{best.stun=.7;moveC(best,sin(a)*1.1,cos(a)*1.1,.34);}}
  else{best.hp-=S.weapon?S.weapon.dmg:1;best.stun=max(best.stun,.38);moveC(best,sin(a)*.35,cos(a)*.35,.34);P.combo++;P.comboT=1.6;
    if(S.weapon&&--S.weapon.dur<=0){toast(S.weapon.name+' — сломано!',2.5);S.weapon=null;}
    if(best.hp<=0){best.state='ko';best.aw=0;toast('Житель без сознания.',1.8);}}
  if(best.state!=='ko'&&best.state!=='chase')alertE(best);}
async function die(e){if(e&&e.kind==='c'&&S.curfew){S.hp=0;sacrifice();return;}S.mode='dead';S.deaths++;P.lie=true;SFX.thud();toast('Удар… темнота.',3);await fade(1,900);await wait(1.2);
  S.inside=S.cpRoom||null;P.x=S.cp[0];P.z=S.cp[1];P.lie=false;S.hp=75;S.st=100;S.crouch=false;for(const e of EN){if(!e.active||e.kind==='f')continue;if(e.state!=='ko'){e.x=e.hx;e.z=e.hz;e.state='patrol';e.aw=0;e.wind=0;e.stun=0;e.st=0;e.wi=0;}}
  act3Respawn();if(S.cellarFight){cellarReset();toast('Тварь вцепилась вам в горло… Ещё раз — бита лежит у клеток.',4);}else toast('Вы очнулись в тени. Кажется, вас потеряли из виду…',4);S.mode='play';camSnap();await fade(0,900);}

// --- input
addEventListener('keydown',e=>{if(e.code==='Tab'||e.code==='Space')e.preventDefault();if(K[e.code])return;K[e.code]=1;onKey(e.code);});
addEventListener('keyup',e=>{K[e.code]=0;});addEventListener('blur',()=>{for(const k in K)K[k]=0;P.block=false;});
cv.addEventListener('mousedown',e=>{if(subAdvance())return;if(S.mode==='play'&&!S.pause&&document.pointerLockElement!==cv){try{cv.requestPointerLock();}catch(_){}return;}if(e.button===0)playerAttack(false);if(e.button===2)K.RMB=1;});
addEventListener('mousemove',e=>{if(document.pointerLockElement!==cv||S.mode!=='play'||S.pause||S.camFn)return;P.rot-=e.movementX*.0025*S.sens;CAM.pitch=clamp(CAM.pitch-e.movementY*.0022*S.sens,-1.25,1.2);});
addEventListener('mouseup',e=>{if(e.button===2)K.RMB=0;});addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('wheel',e=>{CAM.zoom=clamp(CAM.zoom+Math.sign(e.deltaY)*.08,.7,1.3);},{passive:true});
function curInter(){let b=null,bd=1e9;for(const o of inter){if(!o.on())continue;const d=hypot(o.x-P.x,o.z-P.z);if(d<o.r&&d<bd){bd=d;b=o;}}return b;}
function onKey(c){
  if(LP.on){if(c==='KeyE'||c==='Space'||c==='Enter'||c==='KeyJ')lpPress();else if(c==='Escape')lpClose(false);return;}
  if(c==='Escape'&&SAC.on){sacSkip();return;}
  if(c==='Escape'){if($('puz').style.display==='flex')return closePuzzle();if($('note').style.display==='flex')return closeNote();if($('journal').style.display==='flex')return toggleJournal();return toggleSettings();}
  if($('note').style.display==='flex'){if(c==='KeyE'||c==='Enter'||c==='Space')closeNote();return;}
  if(c==='Tab'&&S.hud&&$('puz').style.display!=='flex'&&$('settings').style.display!=='flex')return toggleJournal();
  if(S.pause)return;
  if((c==='Space'||c==='Enter')&&subAdvance())return;
  if(S.mode!=='play')return;
  if(c==='KeyE'){const o=curInter();if(o)o.fn();}
  if(c==='KeyJ')playerAttack(false);if(c==='KeyF')playerAttack(true);
  if(c==='KeyC'||c==='ControlLeft'){S.crouch=!S.crouch;}
}
function toggleSettings(){const s=$('settings'),o=s.style.display==='flex';if(!o&&(S.mode==='title'||$('journal').style.display==='flex'))return;s.style.display=o?'none':'flex';S.pause=!o||$('puz').style.display==='flex';SFX.click();}
function toggleJournal(){const j=$('journal'),o=j.style.display==='flex';if(!o)renderJournal();j.style.display=o?'none':'flex';S.pause=!o;SFX.page();}
$('gear').onclick=toggleSettings;$('sClose').onclick=toggleSettings;$('jClose').onclick=toggleJournal;$('ntX').onclick=closeNote;
$('sVol').oninput=e=>{AU.vol=e.target.value/100;auVol();};$('sAmb').oninput=e=>{AU.ambVol=e.target.value/100;auVol();};
$('sQ').onchange=e=>{R.scale=+e.target.value;};$('sFog').onchange=e=>{S.fogK=+e.target.value;};$('sDiff').onchange=e=>{S.diff=+e.target.value;};
$('sSub').onchange=e=>{document.documentElement.style.setProperty('--subsz',e.target.value);};$('sOut').onchange=e=>{R.outline=e.target.checked;};$('sHatch').onchange=e=>{R.hatch=e.target.checked;};$('sShake').onchange=e=>{S.shakeOn=e.target.checked;};

// --- player
function updPlayer(dt){
  // first person: W/S along the view, A/D strafe, arrows ←/→ turn; the joystick works the same way
  let sx=(K.KeyD?1:0)-(K.KeyA?1:0),fw=(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0);if(TJ.on&&hypot(TJ.x,TJ.y)>.18){sx=TJ.x;fw=-TJ.y;}
  P.rot+=((K.ArrowLeft?1:0)-(K.ArrowRight?1:0))*dt*2.2;CAM.yaw=P.rot;
  const fx=sin(P.rot),fz=cos(P.rot);let mx=fx*fw-fz*sx,mz=fz*fw+fx*sx;const mov=!!(sx||fw);
  P.block=!!(K.KeyK||K.RMB)&&P.atk<=0;S.st=100;S.tired=false;   // no stamina any more
  P.running=mov&&(K.ShiftLeft||K.ShiftRight||(TJ.on&&hypot(TJ.x,TJ.y)>.92))&&!S.tired&&!S.crouch&&!P.block;
  const sp=S.crouch?2.2:P.running?6.7:P.block?1.7:4.1;
  if(mov){const l=hypot(mx,mz);mx/=l;mz/=l;moveC(P,mx*sp*dt,mz*sp*dt);P.ph+=dt*sp*2.3;P.stepT-=dt*sp;if(P.stepT<=0){P.stepT=S.crouch?3.2:2.6;if(!S.crouch)SFX.step();}}
  P.mv=mov?1:0;
  if(S.frozen){P.mv=0;CAM.yaw=P.rot;return;}
  if(S.hp<100&&S.t-(S.lastHurt||0)>6&&!(S.chased>0)&&!DEF.on)S.hp=min(100,S.hp+dt*3);   // no medkits: wounds close while he stays out of trouble
  P.atk-=dt;P.cd-=dt;P.hurt-=dt;if(P.comboT>0){P.comboT-=dt;if(P.comboT<=0)P.combo=0;}
  if(!S.explore&&!S.inside&&(P.x>-24.6||P.z>-6.4)){P.x=min(P.x,-24.6);P.z=min(P.z,-6.4);if(toastT<=0)toast(S.booked?'Сначала — в номер: занести вещи и записать вступление к выпуску.':'Ночь, туман… Сначала нужно снять комнату в мотеле.',3);}
}
// --- HUD
const hctx=$('hud2d').getContext('2d'),fctx=$('face').getContext('2d');
function drawFace(){const c=fctx,f=S.fear,sh=f>=3?(Math.random()-.5)*5:f>=2?(Math.random()-.5)*1.6:0;c.setTransform(1,0,0,1,0,0);c.fillStyle='#1c3033';c.fillRect(0,0,104,104);
  c.strokeStyle='rgba(127,214,200,.13)';c.lineWidth=1;for(let i=-104;i<104;i+=7){c.beginPath();c.moveTo(i,0);c.lineTo(i+104,104);c.stroke();}
  c.translate(sh,sh*.6);c.lineJoin='round';c.lineCap='round';c.strokeStyle='#0b1416';c.lineWidth=2.5;
  c.fillStyle='#8a7450';c.beginPath();c.moveTo(14,104);c.lineTo(26,84);c.lineTo(78,84);c.lineTo(90,104);c.fill();c.stroke();
  const pale=f>=3?'#d9d2c0':f>=2?'#cdb8a0':'#c9a183';c.fillStyle=pale;c.beginPath();c.ellipse(52,56,24,29,0,0,7);c.fill();c.stroke();
  c.fillStyle='#4a3a2a';c.beginPath();c.ellipse(52,34,40,7,0,0,7);c.fill();c.stroke();c.beginPath();c.moveTo(30,33);c.lineTo(34,10);c.lineTo(70,10);c.lineTo(74,33);c.closePath();c.fill();c.stroke();
  const ew=[4.5,5.5,7,8.5][f],ey=52+(f>=2?1:0);for(const s of[-1,1]){c.fillStyle='#f4efe2';c.beginPath();c.ellipse(52+s*10,ey,ew,[3,4.5,6.5,8.5][f],0,0,7);c.fill();c.stroke();c.fillStyle='#0b1416';c.beginPath();c.arc(52+s*10+(f==1?s*1.5:0),ey,[2.4,2.2,1.7,1.2][f],0,7);c.fill();
    c.beginPath();const by=ey-[8,9,12,15][f];c.moveTo(52+s*16,by+(f>=2?3:-1));c.lineTo(52+s*5,by+(f>=2?-3:1));c.stroke();}
  c.beginPath();if(f==0){c.moveTo(45,70);c.lineTo(59,70);c.stroke();}else if(f==1){c.moveTo(45,71);c.quadraticCurveTo(52,67,59,71);c.stroke();}else{c.fillStyle='#2a0f0f';c.ellipse(52,71+(f==3?2:0),f==3?8:5,f==3?10:5,0,0,7);c.fill();c.stroke();}
  if(f>=2){c.fillStyle='#9fd8e8';for(const[x,y]of f>=3?[[30,46],[75,50],[34,66]]:[[30,46]]){c.beginPath();c.moveTo(x,y-4);c.quadraticCurveTo(x+4,y+3,x,y+4);c.quadraticCurveTo(x-4,y+3,x,y-4);c.fill();}}
  c.strokeStyle='rgba(11,20,22,.35)';c.lineWidth=1.2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(66+i*2,62+i*2);c.lineTo(72+i*.6,74+i);c.stroke();}}
let faceT=0;
function updHud(dt){
  $('items').innerHTML=(S.weapon?'🔧 '+S.weapon.name+' &nbsp; ':'')+(S.disguise?'🜏 в робе культиста &nbsp; ':'')+(S.crouch?'▾ пригнулся':'');
  const o=S.mode==='play'&&!S.pause?curInter():null,p=$('prompt');if(o){p.style.display='block';p.innerHTML='<kbd>E</kbd>'+o.label;}else p.style.display='none';
  let mx=0;for(const e of EN)if(e.active&&e.state!=='ko')mx=max(mx,e.state==='chase'?2:e.aw);
  $('det').innerHTML=S.chased>0?'<span style="color:#ff6a5a">● Погоня! Бегите и прячьтесь</span>':S.tailed?'<span style="color:#f0c060">◉ За вами следят — оторвитесь или скройтесь из виду</span>':'';
  const f=S.mode==='finale'?S.fear:S.chased>0||S.hp<30?2:mx>.15||S.tailed?1:0;faceT-=dt;if(f!==S.fear||f>=2&&faceT<=0||faceT<-5){if(S.mode!=='finale')S.fear=f;drawFace();faceT=.08;}
  $('flash').style.opacity=clamp(P.hurt*2.2,0,.95)+(S.hp<30&&S.mode==='play'?.18+.1*sin(S.t*5):0);
  if(S.chased>0){S.chased-=dt;S.hbT=(S.hbT||0)-dt;if(S.hbT<=0){SFX.heart();S.hbT=.75;}}}
function hud2d(){const c=hctx,w=c.canvas.width,h=c.canvas.height;c.clearRect(0,0,w,h);if(!S.hud||CAM.fp||S.mode==='finale')return;c.textAlign='center';c.textBaseline='middle';
  if(S.fpPlay&&S.mode==='play'){c.fillStyle='rgba(230,225,205,.7)';c.beginPath();c.arc(w/2,h/2,2.4,0,7);c.fill();if(document.pointerLockElement!==cv&&!document.body.classList.contains('touch')){c.font='15px Georgia';c.fillStyle='rgba(230,225,205,.8)';c.fillText('Щёлкните, чтобы управлять взглядом мышью',w/2,h/2+34);}}
  for(const e of EN){if(!e.active||e.state==='ko')continue;const ch=e.state==='chase';if(!ch&&e.aw<.06&&e.state!=='search'&&e.stun<=0&&e.wind<=0)continue;const p=proj(e.x,2.5,e.z);if(p.w<=0)continue;const x=p.x*w,y=p.y*h;
    if(e.wind>0){c.fillStyle='#fff';c.font='bold 30px Georgia';c.fillText('⚔',x,y-4);continue;}if(e.stun>0){c.fillStyle='#f0c060';c.font='22px Georgia';c.fillText('✶✶',x,y);continue;}
    if(!ch)continue;c.font='bold 30px Georgia';c.lineWidth=5;c.strokeStyle='#0b1416';c.strokeText('!',x,y);c.fillStyle='#ff5a48';c.fillText('!',x,y);}
  if(S.mode==='play'){const T=markTarget();if(T)edgeArrow(c,w,h,T[0],T[1],'#f0c060',()=>{c.fillStyle='#f0c060';c.font='bold 24px Georgia';c.fillText('!',0,1);});}
  storyHud(c,w,h);}
// arrow at the screen edge towards an off-screen world point (x,z)
function edgeArrow(c,w,h,wx,wz,col,icon){const p=proj(wx,1.5,wz);let x=(p.x-.5),y=(p.y-.5);if(p.w<=0){x=-x;y=-y;}
  if(p.w>0&&abs(x)<.44&&abs(y)<.42)return;const a=atan2(y*h,x*w),rx=w/2-46,ry=h/2-86,k=1/max(abs(cos(a))/rx,abs(sin(a))/ry),px=w/2+cos(a)*k,py=h/2+sin(a)*k;
  c.save();c.translate(px,py);c.fillStyle='rgba(11,20,22,.8)';c.strokeStyle=col;c.lineWidth=2.5;c.beginPath();c.arc(0,0,19,0,7);c.fill();c.stroke();icon();c.rotate(a);c.fillStyle=col;c.beginPath();c.moveTo(31,0);c.lineTo(23,-7);c.lineTo(23,7);c.fill();c.restore();}
function camSnap(){camGoal();CAM.eye=CAM.ge.slice();CAM.tgt=CAM.gt.slice();S.camBlend=0;}
function camGoal(){S.fpPlay=false;if(S.camFn){S.hadCam=1;S.camFn();return;}if(S.hadCam){S.hadCam=0;S.camBlend=1.1;CAM.rate=4;}S.fpPlay=true;CAM.fov=1.15;
  const h=P.lie?.35:S.kneel?.95:S.seated?1.2:S.crouch?1.08:1.62,bob=P.mv&&!P.lie?sin(P.ph*1)*.035:0,pt=CAM.pitch+(S.rifle?RIF.kick*.035:0),cp=cos(pt);CAM.ge=[P.x,h+bob,P.z];CAM.gt=[P.x+sin(P.rot)*cp*10,h+bob+sin(pt)*10,P.z+cos(P.rot)*cp*10];}
