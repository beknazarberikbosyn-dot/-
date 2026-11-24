// ================= STORY: the vlog, exploring the village, the pub and its cellar, the alarm; interiors and lockpicks =================
// Order of the new opening: motel → vlog intro in room №3 → asking the locals → pub «Дьяволов риф» (interviews, thrown out)
// → back door (lockpicks) → cellar (cages, photos, bodies, desk) → the owner raises the alarm → knock him out → the hunt
// → the car is guarded by cultists → the hero decides to go to Dr Bernson → the old puzzle chain (S.escaped).
// Interiors are roofless cut-away rooms (like the motel) built far east of the village (x 128..298, z -42..7):
// a door fades out and moves the hero there; S.inside holds the room key while he is inside.

const IG=new Geo(.06);   // interiors + new village details (one static mesh, M_int)
Object.assign(VO,{pub:{pitch:78},old:{pitch:70},fish:{pitch:96},grim:{pitch:86},shout:{pitch:132,vol:.3}});
const touchUI=()=>document.body.classList.contains('touch');

// --- extra people: recoloured villagers, the pub owner, the dead
function vVar(v,cloth,trou,o={}){CH.v.push(partSet('vill',()=>gVillager(v),{sh:[[.29,1.47],[.27,1.47],[.25,1.52],[.31,1.47]][v],bodyName:'vill_body_'+v,
  body:{pal:Object.assign({cloth:H(cloth)},o.body||{})},arm:'vill_arm',armW:'vill_armW',leg:'vill_leg',armO:{pal:Object.assign({cloth:H(cloth)},o.arm||{})},legO:{pal:{trousers:H(trou)}}}));return CH.v.length-1;}
const PUBV=vVar(3,'#44505a','#2a2826',{body:{apron:H('#d8d0bc')}});   // the pub owner: apron, glasses, moustache
const VV=[vVar(0,'#3f4f5c','#2c2a27'),vVar(1,'#5c4a3a','#30302c'),vVar(2,'#55604a','#2e2c29'),vVar(0,'#6a5a48','#34302b')];
const DSK={skin:H('#6f8878'),cloth:H('#3b3832')};
const DEAD=[vVar(0,'#3b3832','#2b2925',{body:DSK,arm:DSK}),vVar(2,'#3a3a34','#2b2925',{body:DSK,arm:DSK}),vVar(1,'#34322d','#2b2925',{body:DSK,arm:DSK})];

// --- small builders writing into IG
function iCol(x0,z0,x1,z1,h=3){const c=col(x0,z0,x1,z1,h);blockRect(c);return c;}
const ip=(name,x,y,z,ry,s,opt,fb)=>prop(name,x,y,z,ry||0,s||1,opt,fb,IG);
function iCrate(x,z,s=1.1,ry=0,y=0){ip(rnd()<.5?'crate_a':'crate_b',x,y,z,ry,s/1.1,null,()=>IG.bx(0,0,0,1.1,1.1,1.1,PAL.wood));if(!y)iCol(x-s/2,z-s/2,x+s/2,z+s/2,1.1);}
function iBarrel(x,z){ip('barrel',x,0,z,rnd()*6.28,1,null,()=>IG.cyl(0,0,0,.42,.42,1.1,7,H('#5d4630')));iCol(x-.4,z-.4,x+.4,z+.4,1.1);}
function iPlanks(x0,z0,x1,z1,cl,hole){for(let x=x0;x<x1-.01;x+=.42){const w=min(.42,x1-x),cx=x+w/2,c=H(cl[floor(rnd()*cl.length)]);
  if(hole&&cx>hole[0]&&cx<hole[2]){if(hole[1]>z0)IG.bx(cx,0,(z0+hole[1])/2,w-.02,.05,hole[1]-z0,c);if(hole[3]<z1)IG.bx(cx,0,(hole[3]+z1)/2,w-.02,.05,z1-hole[3],c);}
  else IG.bx(cx,0,(z0+z1)/2,w-.02,.05,z1-z0,c);}}
function iTiles(x0,z0,x1,z1,cl){IG.bx((x0+x1)/2,-.02,(z0+z1)/2,x1-x0,.04,z1-z0,H('#262a29'));
  for(let x=x0;x<x1-.01;x+=1)for(let z=z0;z<z1-.01;z+=1){const w=min(1,x1-x),d=min(1,z1-z);IG.bx(x+w/2,0,z+d/2,w-.06,.05,d-.06,H(cl[floor(rnd()*cl.length)]));}}
// wall segment like the motel's (wainscot or stone courses), with collision
function iWall(x0,z0,x1,z1,h,c,o={}){const sx=max(.3,x1-x0),sz=max(.3,z1-z0),cx=(x0+x1)/2,cz=(z0+z1)/2;IG.bx(cx,0,cz,sx,h,sz,c);
  if(o.stone){for(let y=.5;y<h-.1;y+=.55)IG.bx(cx,y,cz,sx+.04,.05,sz+.04,H('#2c3130'));IG.bx(cx,0,cz,sx+.1,.3,sz+.1,H('#3a403e'));}
  else{if(h>2){IG.bx(cx,0,cz,sx+.06,1,sz+.06,WAIN);IG.bx(cx,1,cz,sx+.08,.07,sz+.08,PAL.woodD);}IG.bx(cx,0,cz,sx+.1,.14,sz+.1,PAL.woodD);}
  IG.bx(cx,h,cz,max(.36,x1-x0+.06),.08,max(.36,z1-z0+.06),o.stone?H('#3a403e'):PAL.woodD);col(min(x0,x1)-.15,min(z0,z1)-.15,max(x0,x1)+.15,max(z0,z1)+.15,3);}
// room shell (first person): four full-height walls, a doorway with a lintel in the front wall, a ceiling with beams
function iShell(r,h,c,c2,o={}){const{x0,z0,x1,z1,gap}=r;iWall(x0,z0,x1,z0,h,c,o);iWall(x0,z0,x0,z1,h,c,o);iWall(x1,z0,x1,z1,h,c,o);
  IG.bx((x0+x1)/2,h,(z0+z1)/2,x1-x0+.4,.14,z1-z0+.4,o.stone?H('#2c302f'):H('#2e2620'));for(let x=x0+1.6;x<x1-.8;x+=2.4)IG.bx(x,h-.22,(z0+z1)/2,.22,.22,z1-z0,o.stone?H('#3a403e'):PAL.woodD);
  if(gap==null)iWall(x0,z1,x1,z1,h,c2,o);else{iWall(x0,z1,gap-.75,z1,h,c2,o);iWall(gap+.75,z1,x1,z1,h,c2,o);IG.bx(gap,2.1,z1,1.7,h-2.1,.36,c2);col(gap-.8,z1+.25,gap+.8,z1+.6,3);IG.bx(gap,.05,z1-.45,1.3,.02,.8,H('#3a2c20'));}}
function iDoor(x,z,ry,dark){IG.at(mM(mT(x,0,z),mRy(ry)),()=>{if(!IG.model('door',dark?{k:.7}:null))IG.bx(0,0,0,1.2,1.9,.12,PAL.woodD);
  IG.bx(0,1.92,0,1.45,.14,.2,PAL.wood);IG.bx(-.67,0,0,.1,1.98,.2,PAL.wood);IG.bx(.67,0,0,.1,1.98,.2,PAL.wood);});}
const RUST=H('#5a3a28'),IRON=H('#2a2e30'),PAPER2=H('#d8cfb0');

// --- interiors
const ROOMS={
  pub:{x0:128,z0:-6,x1:152,z1:6,gap:145,door:'pubF',amb:[.34,.31,.28],fog:[.035,.03,.025]},
  cellar:{x0:180,z0:-6,x1:200,z1:6,amb:[.16,.19,.19],fog:[.012,.016,.017],mist:.5},
  work:{x0:233,z0:-5,x1:247,z1:5,gap:240,door:'work'},
  chapel:{x0:282,z0:-7,x1:298,z1:7,gap:290,door:'chapel',amb:[.22,.3,.3]},
  light:{x0:136.2,z0:-39.8,x1:143.8,z1:-32.2,gap:140,door:'light'},
  doc:{x0:258,z0:-42,x1:280,z1:-28,gap:269,door:'doc',amb:[.33,.35,.34],fog:[.02,.028,.028],mist:.25},
  ware:{x0:181,z0:-42,x1:199,z1:-30,gap:190,door:'ware'},
  office:{x0:234,z0:-41,x1:246,z1:-31,gap:240,door:'office'}};
// darkness around the cut-away rooms
IG.bx(205,-.12,-17,190,.06,74,H('#030506'));

// PUB «Дьяволов риф»: back room (x 128..134) with the cellar stairs and the back door, hall (x 134..152) with the bar
{const PW=H('#6b5a48'),PW2=H('#5e5040'),r=ROOMS.pub;
 iPlanks(128,-6,134,6,['#4f3d2c','#47372a','#56432f'],[128.3,-5.9,130.7,-3]);iPlanks(134,-6,152,6,['#5c4632','#523e2c','#664e37']);
 iShell(r,2.8,PW,PW2);iWall(134,-6,134,6,2.8,PW2);
 iDoor(133.83,-3.8,-PI/2);iDoor(134.17,-3.8,PI/2);IG.bx(134.22,2.08,-3.8,.04,.24,.86,H('#c9c2b0',.1));IG.bx(134.25,2.13,-3.8,.03,.06,.7,H('#8a2a20'));// «Только для персонала»
 iDoor(128.17,2,PI/2);   // back door
 // cellar stairs (going down towards -z) in the back room
 for(let k=0;k<5;k++)IG.bx(129.5,-.32*(k+1),-3.26-k*.52,2.2,.32,.52,PAL.woodD);IG.bx(129.5,-2.4,-4.45,2.4,.05,2.9,H('#020303'));
 for(const x of[128.38,130.62])IG.bx(x,-2.4,-4.45,.08,2.4,2.9,H('#0a0c0c'));
 for(const z of[-3.05,-5.8])IG.bx(130.78,0,z,.09,1,.09,PAL.woodD);IG.bx(130.78,.95,-4.42,.08,.07,2.85,PAL.woodD);col(128.3,-5.9,130.85,-3.0,2);
 iCrate(131.7,-5.2);iCrate(132.9,-5.25,1);iCrate(132.3,-5.2,.8,.3,1.1);iBarrel(128.8,4.9);iBarrel(129.8,5.2);iBarrel(128.8,3.95);
 for(const[x,z]of[[132.8,4.9],[133.3,5.3],[132.6,5.4]])IG.sph(x,.3,z,.38,.32,.3,H('#7a6a48'),6,4);iCol(132.2,4.4,133.8,5.8,1);
 IG.cyl(131.4,0,4.6,.24,.2,.4,7,H('#4a4e50'));IG.bx(131.6,0,4.3,.05,1.4,.05,PAL.wood);
 for(const y of[1.1,1.7])IG.bx(132,y,-5.7,2.6,.05,.4,PAL.woodD);for(let i=0;i<7;i++)IG.cyl(130.9+i*.36,1.15+(i%2)*.6,-5.7,.1,.1,.26,6,H(['#5d8a6a','#8a6a3a','#9ab0a8'][i%3],.15));
 // hall: bar counter (customer side faces +x), bottle shelves, stools, taps
 ip('counter',136.3,0,.5,PI/2,1,null,()=>{IG.bx(0,0,0,5,1.05,.9,PAL.wood);IG.bx(0,1.05,0,5.2,.08,1.1,PAL.woodD);});iCol(135.7,-2,136.85,3,1.1);
 for(const y of[1.15,1.6,2.05]){IG.bx(134.36,y,.5,.32,.05,4.4,PAL.woodD);for(let i=0;i<11;i++){const z=-1.5+i*.4,c=H(['#2f6a4a','#8a5a20','#9ab0a8','#5a2a20'][(i*7+y*10|0)%4],.25);IG.cyl(134.38,y+.05,z,.065,.065,.24,6,c);IG.cyl(134.38,y+.29,z,.025,.025,.1,4,c);}}
 for(const z of[-1,0,1])IG.cyl(136.15,1.1,z,.04,.04,.32,5,H('#b08d3c',.25));
 for(const z of[-1.2,.4,2])IG.cyl(137.35,0,z,.05,.05,.7,5,PAL.woodD),IG.cyl(137.35,.7,z,.22,.22,.06,8,H('#4a2b2b'));
 // tables with chairs
 for(const[x,z]of[[142,-2.6],[147,1.6],[141.2,2.8]]){IG.cyl(x,0,z,.08,.08,.72,6,PAL.woodD);IG.cyl(x,.72,z,.6,.6,.06,10,PAL.wood);IG.cyl(x+.15,.78,z+.1,.06,.05,.16,6,H('#c9b98a',.2));iCol(x-.55,z-.55,x+.55,z+.55,1);
   for(const a of[.6,2.6,4.5])ip('chair',x+sin(a)*.95,0,z+cos(a)*.95,a+PI,1,null,()=>{IG.bx(0,0,0,.45,.45,.45,PAL.wood);IG.bx(0,.45,-.2,.45,.5,.06,PAL.woodD);});}
 // fireplace, dartboard, trophy fish, anchor, barrels, sconces, rug
 IG.bx(147,0,-5.55,2.6,1.7,.9,H('#5a605e'));IG.bx(147,.12,-5.08,1.5,1.05,.06,H('#0b0807'));IG.bx(147,1.7,-5.42,3,.12,1.05,PAL.woodD);IG.bx(147,1.82,-5.72,1.8,.98,.55,H('#545a58'));
 IG.sph(147,.32,-5.0,.36,.28,.18,H('#ff7a22',1),6,4);IG.sph(147,.42,-4.98,.18,.24,.12,H('#ffe08a',1),5,3);for(const s of[-1,1])IG.at(mM(mT(147,.16,-5.0),mRy(s*.4),mRz(PI/2)),()=>IG.cyl(0,-.5,0,.09,.09,1,6,H('#3a2618')));
 iCol(145.7,-6,148.3,-5.0,1.7);
 IG.at(mM(mT(140,1.75,-5.84),mRx(PI/2)),()=>{IG.cyl(0,0,0,.32,.32,.05,12,H('#1f1f1a'));IG.cyl(0,.05,0,.2,.2,.02,12,H('#7a2a20'));IG.cyl(0,.07,0,.06,.06,.02,8,H('#2a6a3a'));});
 IG.bx(143.6,1.5,-5.83,1.3,.55,.06,PAL.wood);IG.sph(143.5,1.77,-5.74,.5,.16,.1,H('#6a8a80'),7,4);IG.at(mM(mT(144.05,1.77,-5.74),mRz(.6)),()=>IG.bx(0,-.15,0,.06,.3,.08,H('#5a7a70')));
 ip('anchor',150.7,0,-5.1,0,.8,null,()=>{IG.bx(0,0,0,.12,1.4,.12,IRON);IG.bx(0,.2,0,.9,.12,.12,IRON);});iCol(150.2,-5.6,151.2,-4.6,1.2);
 iBarrel(151.1,4.6);iBarrel(151.1,3.6);iBarrel(150.2,5.2);ip('rug',146,.06,-1.2,0,1.4,{pal:{rug:H('#4a2b2b')}},null);
 for(const x of[138,150])IG.bx(x,1.85,-5.8,.18,.26,.12,H('#f6cf70',1));
 LAMPS.push([138,2,-5,7,[1,.7,.4]],[150,2,-5,7,[1,.68,.38]],[143,2.4,1,9,[1,.7,.42]],[136,2.3,.5,6,[1,.72,.4]],[131,2.2,0,6.5,[.7,.52,.32]]);}

// CELLAR: cages, shackles, operating table, photos, the desk, the dead in the corner
{const SW=H('#4f5553'),SW2=H('#454a49'),so={stone:true};
 iTiles(180,-6,200,6,['#3f4442','#383d3b','#454a48']);iShell(ROOMS.cellar,2.8,SW,SW2,so);
 for(let k=0;k<6;k++)IG.bx(181.5,0,-3.35-k*.45,2.1,.3*(k+1),.45,PAL.woodD);for(const z of[-3.2,-5.7])IG.bx(182.62,0,z,.08,2.2,.08,PAL.woodD);IG.bx(182.62,1.1,-4.45,.07,.07,2.6,PAL.woodD);col(180.2,-6,182.75,-3.1,2);
 const cage=(cx,cz,w,d,open)=>{const zf=cz+d/2,h=2.15;for(let x=cx-w/2;x<=cx+w/2+.01;x+=.3){if(open&&abs(x-cx)<.5)continue;IG.bx(x,0,zf,.06,h,.06,RUST);}
   for(const sx of[-1,1])for(let z=cz-d/2;z<zf;z+=.3)IG.bx(cx+sx*w/2,0,z,.06,h,.06,RUST);
   for(const[x,z,a,b]of[[cx,zf,w,.08],[cx,cz-d/2,w,.08],[cx-w/2,cz,.08,d],[cx+w/2,cz,.08,d]])IG.bx(x,h,z,a,.08,b,RUST);
   IG.bx(cx,.05,cz,w-.2,.03,d-.2,H('#5e5230'));IG.cyl(cx+.6,.05,cz-.5,.2,.16,.12,7,IRON);
   if(open){for(const s of[-1,1])IG.at(mM(mT(cx+s*.3,0,zf),mRz(s*.35)),()=>IG.bx(0,0,0,.06,h*.95,.06,RUST));IG.at(mM(mT(cx-.55,0,zf+.7),mRy(1.1)),()=>{for(let x=-.45;x<.5;x+=.3)IG.bx(x,0,0,.06,h,.06,RUST);IG.bx(0,h-.1,0,1,.08,.08,RUST);});}
   iCol(cx-w/2-.05,cz-d/2,cx+w/2+.05,zf+.05,2.2);};
 cage(185.3,-4.7,2.6,2.4,false);cage(188.5,-4.7,2.6,2.4,true);cage(191.7,-4.7,2.6,2.4,false);
 for(const z of[-1.8,-.4,1])IG.at(mT(199.82,0,z),()=>{IG.at(mM(mT(0,1.75,0),mRz(PI/2)),()=>IG.cyl(0,-.03,0,.1,.1,.06,8,IRON));for(let k=0;k<6;k++)IG.bx(-.04,1.66-k*.11,0,.04,.08,.06,IRON);
   IG.at(mM(mT(-.06,.95,0),mRz(PI/2),mRx(.4)),()=>IG.cyl(0,-.03,0,.13,.13,.06,8,IRON));});
 IG.bx(189.5,0,1.6,.9,.82,2.1,H('#4d5559'));IG.bx(189.5,.82,1.6,1.02,.08,2.24,H('#7a8488'));for(const z of[.9,1.6,2.3])IG.bx(189.5,.9,z,1.06,.03,.12,H('#2a1f18'));
 IG.bx(189.4,.91,1.85,.62,.012,.8,H('#3a0e0c'));IG.bx(188.4,.052,2.9,1.3,.01,.8,H('#2e0c0a'));IG.bx(190.6,.052,.3,.6,.01,.5,H('#2e0c0a'));IG.cyl(190,.051,3.3,.25,.25,.012,8,H('#101212'));iCol(188.95,.45,190.05,2.75,1);
 IG.bx(191.2,0,.4,.5,.8,.4,IRON);for(let i=0;i<4;i++)IG.bx(191.05+i*.1,.81,.4,.03,.02,.3,H('#9aa0a2',.2));
 IG.bx(180.2,1,1.5,.06,1.25,2.5,H('#6a5236'));for(let i=0;i<10;i++)IG.bx(180.25,1.12+(i%3)*.4,.55+i*.2+(i%2)*.06,.02,.34,.26,PAPER2),IG.bx(180.27,1.17+(i%3)*.4,.55+i*.2+(i%2)*.06,.01,.22,.2,H('#3a3228'));
 IG.bx(199.1,0,2.6,.9,.78,2,PAL.wood);IG.bx(199.1,.78,2.6,1,.05,2.1,PAL.woodD);for(const[z,r]of[[2.2,.2],[2.6,-.3],[3.1,.1]])IG.at(mM(mT(198.95,.84,z),mRy(r)),()=>IG.bx(0,0,0,.42,.01,.3,PAPER2));
 IG.cyl(199.3,.83,1.9,.1,.1,.03,6,IRON);IG.cyl(199.3,.86,1.9,.02,.02,.4,4,IRON);IG.sph(199.2,1.26,1.95,.1,.06,.1,H('#ffe08a',1),5,3);IG.cyl(199.25,.83,3.4,.05,.05,.16,6,H('#d8cfb0',.3));
 ip('chair',198,0,2.6,-PI/2,1,null,()=>IG.bx(0,0,0,.45,.45,.45,PAL.wood));iCol(198.6,1.55,199.7,3.65,1);
 for(const y of[1,1.6])IG.bx(195.2,y,-5.72,2.6,.05,.42,PAL.woodD);for(let i=0;i<8;i++){const x=194.1+(i%4)*.72,y=1.05+floor(i/4)*.6;IG.cyl(x,y,-5.72,.15,.15,.34,8,H('#5d8a6a',.35));IG.sph(x,y+.16,-5.72,.09,.08,.07,H('#c9c2a8',.15),5,3);}
 IG.bx(198.2,.05,-4.6,2.3,.06,1.6,H('#5a4a32'));col(196.1,-5.9,199.9,-3.1,.5);
 LAMPS.push([190,2.4,0,11,[.85,.72,.48]],[199,1.4,2,5,[1,.8,.5]],[195.2,1.4,-5.1,4,[.3,.7,.45]],[186,2,-3,5,[.5,.5,.42]]);}

// WORKSHOP of the sculptor (house 1): the broken bas-relief (puzzle 1)
{iPlanks(233,-5,247,5,['#6a553c','#5f4b35','#735c41']);iShell(ROOMS.work,2.8,H('#7d7262'),MW2);
 ip('sculptor_table',240,0,-2,0,1,null,()=>{IG.bx(0,0,0,1.7,.9,.7,PAL.wood);IG.at(mM(mT(0,1.2,-.15),mRx(-.35)),()=>IG.box(0,0,0,.75,.62,.08,H('#9a8a68')));});iCol(239.1,-2.4,240.9,-1.6,1);
 const statue=(x,z,s)=>{IG.bx(x,0,z,.7,.9,.7,H('#6f6a60'));const c=H('#8a7a5c');IG.sph(x,.9+.55*s,z,.32*s,.42*s,.3*s,c,6,4);IG.sph(x,.9+1.08*s,z,.34*s,.3*s,.32*s,c,6,4);
   for(let k=0;k<5;k++)IG.at(mM(mT(x+(k-2)*.1*s,.9+.92*s,z+.2*s),mRx(.35)),()=>IG.cyl(0,-.5*s,0,.015,.05*s,.5*s,4,c));for(const sd of[-1,1])IG.at(mM(mT(x+sd*.3*s,.9+1.0*s,z-.1),mRz(sd*1.1)),()=>IG.cyl(0,0,0,.05,.01,.5*s,4,c));iCol(x-.35,z-.35,x+.35,z+.35,1);};
 statue(235,-3.8,1);statue(236.6,-4,.8);statue(245.3,-3.8,1.1);statue(245.6,2.6,.9);
 for(let i=0;i<5;i++){const x=237+i*1.2;IG.bx(x,1.2+(i%2)*.25,-4.83,.62,.8,.02,PAPER2);IG.bx(x,1.45+(i%2)*.25,-4.81,.4,.04,.01,H('#3a3228'));IG.bx(x,1.6+(i%2)*.25,-4.81,.3,.3,.01,H('#4a4238'));}
 ip('bed',234.6,0,1.8,0,.9,{pal:{blanket:H('#5a4a40')}},()=>IG.bx(0,0,0,2,.55,3.4,H('#5a4a40')));iCol(233.5,-.1,235.7,3.7,1);
 IG.bx(243.4,0,-1.6,1.4,.75,.8,PAL.wood);for(let i=0;i<4;i++)IG.cyl(242.9+i*.3,.75,-1.6,.12,.09,.2,6,H('#7a6a50'));iCol(242.7,-2,244.1,-1.2,1);
 for(const[x,z]of[[238,3.6],[238.6,3.9]])IG.cyl(x,0,z,.25,.22,.5,7,H('#4a4e50'));ip('table_lamp',243.6,.75,-1.4,0,1,null,null);
 LAMPS.push([240,2.3,-1,9,[1,.72,.42]],[235.5,2,-3.5,5,[.9,.65,.4]],[243.5,1.4,-1.4,4,[1,.75,.45]]);}

// CHAPEL: pews, the altar, the vestry door with the ring lock (puzzle 2)
{const CW=H('#5f6765'),so={stone:true};iTiles(282,-7,298,7,['#4f5654','#474e4c','#565d5a']);iShell(ROOMS.chapel,3.2,CW,CW,so);
 IG.bx(290,.05,0,1.6,.02,13,H('#4a1f22'));
 for(let z=-3;z<=4.3;z+=1.8)for(const x of[285.6,294.4]){IG.bx(x,0,z,5,.45,.5,PAL.woodD);IG.bx(x,.45,z+.28,5,.6,.08,PAL.wood);iCol(x-2.5,z-.25,x+2.5,z+.35,1);}
 ip('altar',290,0,-5.6,0,.75,{pal:{blood:H('#2a0e0c'),rune:H('#3aa57a',.4)}},()=>{IG.bx(0,0,0,1.4,1,2.8,H('#555e5c'));IG.bx(0,1,0,1.7,.16,3.1,H('#3c4543'));});iCol(289.3,-6.8,290.7,-4.4,1);
 for(const[x,z]of[[289.5,-5],[290.5,-5],[289.4,-6.1],[290.6,-6.1]])ip('candle',x,.8,z,0,1,null,()=>IG.cyl(0,0,0,.05,.05,.2,5,H('#e8e0c0',.3)));
 IG.bx(290,1.3,-6.8,3.4,1.9,.1,H('#47504e'));{const g=H('#3f7f6a',.25);IG.sph(290,2.5,-6.72,.42,.38,.08,g,7,4);for(let k=0;k<6;k++)IG.at(mM(mT(289.62+k*.15,2.2,-6.72),mRz((k-2.5)*.08)),()=>IG.cyl(0,-.55,0,.015,.05,.55,4,g));
   for(const s of[-1,1])IG.at(mM(mT(290+s*.4,2.5,-6.72),mRz(s*-.9)),()=>IG.cyl(0,0,0,.08,.01,.9,4,g));IG.sph(290,1.55,-6.72,.32,.4,.07,g,6,4);}
 iDoor(295,-6.83,0);IG.at(mM(mT(295,1.05,-6.74),mRx(PI/2)),()=>{[[.34,0],[.24,1],[.14,2]].forEach(([r,k])=>IG.cyl(0,k*.02,0,r,r,.05,16,H('#b08d3c',.3)));});
 for(const x of[282.17,297.83])for(const z of[-3.5,1,5])IG.bx(x,1.2,z,.06,1.6,.7,H('#57c79a',.85));
 LAMPS.push([284,2.2,-2,7,[.3,.75,.55]],[296,2.2,-2,7,[.3,.75,.55]],[290,1.6,-5,6,[1,.7,.4]],[290,2.4,3,8,[.4,.6,.55]]);}

// LIGHTHOUSE keeper's room: round, inside the tower (r 3.8): the log on the lectern (puzzle 3), spiral stairs up the wall
// circular wall: back half full height, front half low (cut-away), doorway gap facing +z
function iRound(cx,cz,r,h,c,n=22){const L=2*r*sin(PI/n)+.1;
  for(let i=0;i<n;i++){const am=(i+.5)/n*2*PI,x=cx+sin(am)*r,z=cz+cos(am)*r;if(abs(atan2(sin(am),cos(am)))<.2){IG.at(mM(mT(x,2.1,z),mRy(am)),()=>IG.bx(0,0,0,L,h-2.1,.5,c));continue;}const hh=h;
    IG.at(mM(mT(x,0,z),mRy(am)),()=>{IG.bx(0,0,0,L,hh,.5,c);for(let y=.5;y<hh-.1;y+=.55)IG.bx(0,y,0,L+.03,.05,.54,H('#2c3130'));IG.bx(0,0,0,L+.08,.3,.6,H('#3a403e'));IG.bx(0,hh,0,L+.06,.08,.56,H('#3a403e'));});
    col(x-.55,z-.55,x+.55,z+.55,3);}}
{const cx=140,cz=-36,r=3.8,LW=H('#a8a394');IG.cyl(cx,-.03,cz,r+.3,r+.3,.05,24,H('#262a29'));
 for(let k=0;k<3;k++)IG.cyl(cx,-.02+k*.005,cz,r-.2-k*1.2,r-.2-k*1.2,.05,24,H(['#5a605e','#525856','#626866'][k]));
 iRound(cx,cz,r,3.2,LW);IG.cyl(cx,3.2,cz,r+.4,r+.4,.14,22,H('#2c302f'));for(let k=0;k<4;k++)IG.at(mM(mT(cx,3.0,cz),mRy(k*PI/4)),()=>IG.bx(0,0,0,2*r,.2,.2,PAL.woodD));
 for(let k=0;k<11;k++){const a=1.15+k*.19;IG.at(mM(mT(cx+sin(a)*(r-.75),.28*k,cz+cos(a)*(r-.75)),mRy(a)),()=>{IG.bx(0,0,0,1.3,.1,.62,PAL.woodD);IG.bx(.62,0,0,.06,.9,.06,PAL.woodD);});}
 IG.at(mM(mT(cx+sin(2.6)*(r-.75),3.1,cz+cos(2.6)*(r-.75))),()=>IG.bx(0,0,0,1.3,.08,1.3,H('#2a2622')));col(cx+1.4,cz-3.6,cx+3.8,cz+.2,2);
 ip('lectern',140,0,-38,0,1,null,()=>{IG.bx(0,0,0,.5,1.05,.5,PAL.woodD);IG.bx(0,1.05,0,.6,.08,.5,H('#d9cdb0',.3));});iCol(139.75,-38.25,140.25,-37.75,1);
 IG.at(mM(mT(137.3,0,-37.4),mRy(-.9)),()=>{IG.bx(0,0,0,1.5,.78,.8,PAL.wood);IG.bx(0,.78,0,1.4,.02,.7,PAPER2);for(let i=0;i<3;i++)IG.bx(-.4+i*.4,.8,(i-1)*.15,.45,.01,.04,H('#3a3228'));});iCol(136.6,-38.2,138,-36.6,1);
 iBarrel(137.6,-34.2);IG.cyl(138.6,0,-39.2,.24,.24,.8,8,IRON);IG.sph(138.6,1.15,-39.2,.4,.45,.4,H('#f3e6a0',.8),8,5);iCol(138.2,-39.6,139,-38.8,1.5);
 ip('bed',142.7,0,-34.6,PI/2+.5,.62,null,()=>IG.bx(0,0,0,2,.55,3.4,H('#5a6a6a')));iCol(141.6,-35.6,143.6,-33.6,1);ip('ropecoil',141.6,0,-38.4,0,.8,null,null);
 LAMPS.push([140,2.3,-36,8,[1,.82,.5]],[138.6,1.4,-38.6,4,[1,.9,.5]]);}

// FISH WAREHOUSE (house 8): the idol shelf (puzzle 5)
{iPlanks(181,-42,199,-30,['#4a3c2c','#423528','#54432f']);const WH=H('#5d5346');iShell(ROOMS.ware,3,WH,WH);
 iCrate(183,-40.8);iCrate(184.2,-40.9,1);iCrate(183.1,-40.8,1,.2,1.1);iCrate(196.8,-40.7);iCrate(197.9,-40.8,1);iCrate(197.4,-39.4,1);iCrate(182.4,-33,1.1);iCrate(182.6,-31.8,.9);
 iBarrel(186,-41);iBarrel(186.9,-41.2);iBarrel(194,-41.1);iBarrel(197.8,-33.4);iBarrel(197,-32.6);
 IG.bx(186,0,-35,2,.6,1,H('#8fb0b8',.12));for(let i=0;i<6;i++)IG.sph(185.3+i*.28,.66,-35+(i%2)*.2,.06,.05,.28,H('#9aa6a2'),5,3);iCol(185,-35.5,187,-34.5,.6);
 IG.bx(190,2.25,-37.5,8.4,.03,.03,H('#b9a36a'));for(const x of[185.75,194.25]){IG.bx(x,0,-37.5,.14,2.45,.14,PAL.woodD);IG.bx(x,0,-37.5,.5,.1,.5,PAL.woodD);IG.at(mM(mT(x,1.4,-37.5),mRz(x<190?.5:-.5)),()=>IG.bx(0,0,0,.08,.9,.08,PAL.woodD));}iCol(185.6,-37.65,185.9,-37.35,2);iCol(194.1,-37.65,194.4,-37.35,2);
 for(let x=186.3;x<194;x+=.7)IG.bx(x,1.95,-37.5,.01,.3,.01,H('#b9a36a'));for(let x=186.3;x<194;x+=.7)IG.sph(x,1.88,-37.5,.08,.3,.05,H('#8a9a94'),5,3);
 ip('netrack',194.5,0,-36,0,1,null,null);iCol(192.8,-36.1,196.2,-35.9,2);
 ip('idol_shelf',190,0,-40.6,0,1,null,()=>{IG.bx(0,0,0,2.8,1,.6,PAL.stone);for(let i=0;i<4;i++){IG.cyl(-1+i*.66,1,0,.16,.1,.42,5,H('#5c8a6a',.25));IG.sph(-1+i*.66,1.5,0,.13,.13,.13,H('#5c8a6a',.25),5,3);}});iCol(188.6,-40.9,191.4,-40.3,1.1);
 LAMPS.push([190,2.4,-35.5,10,[.8,.72,.52]],[190,1.8,-39.2,5,[.9,.7,.4]]);}

// HARBOUR MASTER'S OFFICE (house 10): the safe (puzzle 6) and the finale ambush
{iPlanks(234,-41,246,-31,['#5c4632','#523e2c','#664e37']);iShell(ROOMS.office,2.8,H('#6f6a5a'),MW2);
 IG.bx(237,0,-38.2,1.9,.78,.9,PAL.wood);IG.bx(237,.78,-38.2,2,.06,1,PAL.woodD);for(const[x,r]of[[236.6,.2],[237.4,-.15]])IG.at(mM(mT(x,.85,-38.2),mRy(r)),()=>IG.bx(0,0,0,.42,.01,.3,PAPER2));
 ip('table_lamp',236.3,.84,-38.5,0,1,null,null);iCol(236,-38.7,238,-37.7,1);ip('chair',237,0,-37.2,PI,1,null,null);
 for(const x of[240.5,241.4,242.3])IG.bx(x,0,-40.6,.85,1.6,.7,H('#4a4a42')),IG.bx(x,1.1,-40.24,.3,.05,.02,H('#b08d3c',.2));iCol(240,-41,242.8,-40.2,1.6);
 IG.bx(237.5,1.2,-40.83,2.2,1.2,.03,H('#c9bf9a'));for(let i=0;i<5;i++)IG.at(mM(mT(236.7+i*.42,1.55+sin(i*1.7)*.2,-40.8),mRz(i*.7)),()=>IG.bx(0,0,0,.5,.03,.01,H('#4a4238')));
 IG.at(mM(mT(234.18,1.7,-35),mRz(PI/2)),()=>{IG.cyl(0,0,0,.5,.5,.06,12,PAL.woodD);IG.cyl(0,.02,0,.38,.38,.06,12,H('#1a1410'));for(let k=0;k<8;k++)IG.at(mRy(k*PI/4),()=>IG.bx(.45,0,0,.4,.06,.06,PAL.wood));});
 ip('safe',244.4,0,-35,-PI/2,1,null,()=>{IG.bx(0,0,0,.55,.8,.55,H('#3a4448'));IG.cyl(0,.4,.28,.1,.1,.06,6,H('#b08d3c',.3));});iCol(244.1,-35.3,244.7,-34.7,1);
 IG.cyl(235,0,-32.2,.04,.04,1.8,5,PAL.woodD);IG.sph(235.15,1.5,-32.2,.18,.5,.12,H('#2e3a40'),6,4);
 LAMPS.push([240,2.3,-36,9,[1,.74,.45]],[236.3,1.3,-38.2,4,[1,.8,.5]]);}

// --- new details in the village: the pub sign, its back door and back yard (house 0 is the pub)
{const sg=H('#2e2218'),X=-9.4,Z=-11.4;IG.bx(X-1,0,Z,.1,2.1,.1,PAL.woodD);IG.bx(X+1,0,Z,.1,2.1,.1,PAL.woodD);IG.bx(X,1.25,Z,2.2,.85,.08,sg);IG.bx(X,1.22,Z,2.3,.05,.12,PAL.wood);IG.bx(X,2.08,Z,2.3,.05,.12,PAL.wood);
 const br=H('#c9a23a',.35),zf=Z+.06;IG.bx(X,1.42,zf,.06,.52,.03,br);IG.bx(X,1.8,zf,.36,.05,.03,br);IG.at(mM(mT(X,1.42,zf),mRz(.9)),()=>IG.bx(0,0,0,.36,.05,.03,br));IG.at(mM(mT(X,1.42,zf),mRz(-.9)),()=>IG.bx(0,0,0,.36,.05,.03,br));
 for(const x of[X-.65,X+.65])IG.bx(x,1.35,zf,.24,.05,.03,H('#7fd6c8',.35));
 iCol(X-1.2,Z-.15,X+1.2,Z+.15,2);LAMPS.push([X,2.2,Z+.6,8,[1,.72,.38]],[-13.2,1.6,-11.4,7,[.85,.55,.25]]);
 iBarrel(-6.2,-24.6);iBarrel(-7.1,-25.4);iBarrel(-5.8,-25.8);iCrate(-6.4,-15.4,1);iCrate(-6.5,-14.4,.8,.3);iCrate(-6.4,-15.3,.8,.2,1);}
let M_int=null;   // built lazily on the first frame, after src/5b-district.js has added the doctor's house

// --- doors: exterior door → room (lockpicked once). n = outward normal; in = spawn [x, z, rot] inside
const XD={
  pubF:{x:-13.2,z:-12.6,n:[0,1],room:'pub',in:[145,4.4,PI]},
  pubB:{x:-8,z:-20.5,n:[1,0],room:'pub',in:[129.3,2,PI/2],pins:3},
  work:{x:.5,z:-13,n:[0,1],room:'work',in:[240,3.4,PI],pins:4,name:'мастерская скульптора'},
  chapel:{x:26,z:-12.9,n:[0,1],room:'chapel',in:[290,5.4,PI],pins:4,name:'часовня'},
  light:{x:47,z:34,n:[-1,0],room:'light',in:[140,-33.2,PI],pins:4,name:'маяк'},
  doc:{x:-110,z:-35,n:[0,1],room:'doc',in:[269,-29.2,PI],name:'дом доктора Бернсона'},
  ware:{x:-16.5,z:36,n:[0,1],room:'ware',in:[190,-31.6,PI],pins:4,name:'рыбный склад'},
  office:{x:18,z:39,n:[0,1],room:'office',in:[240,-32.6,PI],pins:5,name:'контора начальника порта'}};
const chased=()=>EN.some(e=>e.active&&e.state==='chase');
function roomCp(room){const d=XD[ROOMS[room].door];return[d.x+d.n[0]*1.6,d.z+d.n[1]*1.6];}
function markTarget(){const m=S.mark;if(!m)return null;const room=m[2]||null;if(room===S.inside)return m;if(!S.inside&&room&&ROOMS[room].door){const d=XD[ROOMS[room].door];return[d.x,d.z];}return null;}
const setMark=m=>{S.mark=m&&m.n?[m.x+m.n[0]*.95,m.z+m.n[1]*.95]:m;};
async function goRoom(d){S.mode='talk';SFX.door();await fade(1,380);S.inside=d.room;P.x=d.in[0];P.z=d.in[1];P.rot=d.in[2];S.crouch=false;camSnap();await fade(0,480);S.mode='play';}
async function leaveRoom(d){S.mode='talk';SFX.door();await fade(1,350);S.inside=null;P.x=d.x+d.n[0]*1.4;P.z=d.z+d.n[1]*1.4;P.rot=atan2(d.n[0],d.n[1]);camSnap();await fade(0,450);S.mode='play';}
function doorOn(d){if(S.inside||FIN.on||d.k==='doc')return false;if(d.k==='pubF')return S.explore&&!S.alarm;if(d.k==='pubB')return S.kicked&&!S.alarm;return d.on?d.on():false;}
function doorLabel(d){if(d.k==='pubF')return S.kicked?'Дверь паба «Дьяволов риф»':'Войти в паб «Дьяволов риф»';if(d.k==='pubB')return d.lock?'Вскрыть замок чёрного хода отмычками':'Войти через чёрный ход';
  return(d.lock?'Вскрыть отмычками: ':'Войти: ')+d.name;}
async function useDoor(d){
  if(d.k==='pubF'){if(S.kicked){toast('Заперто. Изнутри доносятся смех и звон кружек.',3);return;}
    if(!S.pubKnown){say(HERO,'Паб «Дьяволов риф»… Сначала пройдусь по деревне и послушаю, что говорят на улицах.',VO.hero);return;}
    await goRoom(d);if(!S.pubIn){S.pubIn=true;pubFirst();}return;}
  if(chased()){toast('Не сейчас — за вами гонятся!',2);return;}
  const go=async()=>{await goRoom(d);if(d.k==='pubB'&&!S.backIn)backRoom();};
  if(d.lock)lockpick(d,()=>{d.lock=false;go();});else go();}
for(const k in XD){const d=XD[k];d.k=k;d.lock=!!d.pins;const o=addInter(d.x+d.n[0]*.95,d.z+d.n[1]*.95,1.6,'',()=>useDoor(d),()=>doorOn(d));Object.defineProperty(o,'label',{get:()=>doorLabel(d)});}
// exits from the rooms (the doorway gap in the low front wall)
for(const key in ROOMS){const r=ROOMS[key];if(r.gap==null)continue;addInter(r.gap,r.z1-.55,1,'Выйти на улицу',()=>leaveRoom(XD[r.door]),()=>S.inside===key&&!(key==='pub'&&S.backIn)&&!(key==='doc'&&(!S.robe||A3.ph)));}

// --- lockpicking: lift the pins one by one to the shear line
let LP={on:false};const LPT=.68;
function lockpick(d,ok){if(chased()){toast('Не сейчас — за вами гонятся!',2);return;}
  LP={on:true,n:d.pins||3,k:0,ok,t0:performance.now(),done:false};S.pause=true;SFX.click();
  CAM.fp=true;CAM.rate=3.5;S.camFn=()=>{CAM.ge=[d.x+d.n[0]*1.25,1.5,d.z+d.n[1]*1.25];CAM.gt=[d.x,1.05,d.z];};
  $('pzT').textContent='Замок';$('pzD').innerHTML='Отмычка в замке. Поднимайте штифты по одному: жмите <b>«Поддеть»</b> (E, пробел или клик), когда жёлтый штифт дойдёт до <span style="color:#b0281c">красной линии</span>. Промах — штифт сорвётся и звякнет.';
  const b=$('pzB');b.innerHTML='';const cvs=el('canvas',{width:380,height:220,style:'max-width:100%;cursor:pointer;display:block;margin:4px auto'});cvs.onclick=lpPress;LP.ctx=cvs.getContext('2d');
  LP.msg=el('div',{className:'hand',style:'min-height:30px'},'Штифтов: '+LP.n);b.append(cvs,LP.msg,el('button',{className:'b',textContent:'Поддеть',onclick:lpPress}));
  $('pzX').textContent='Отступить (Esc)';$('puz').style.display='flex';LP.raf=requestAnimationFrame(lpTick);}
function lpPos(){const t=(performance.now()-LP.t0)/1000,ph=(t*(.85+LP.k*.2))%2;return 1-abs(ph-1);}
const lpWin=()=>.11-LP.k*.012;
function lpTick(){if(!LP.on)return;lpDraw();LP.raf=requestAnimationFrame(lpTick);}
function lpPress(){if(!LP.on||LP.done)return;const p=lpPos();
  if(abs(p-LPT)<lpWin()){LP.k++;tone(900+LP.k*120,.07,{type:'triangle',vol:.14});noise(.04,{f:4000,type:'highpass',vol:.1});LP.msg.textContent='Щёлк. Штифт на месте ('+LP.k+' / '+LP.n+').';LP.t0=performance.now()-Math.random()*900;
    if(LP.k>=LP.n){LP.done=true;LP.msg.textContent='Замок поддался!';SFX.door();setTimeout(()=>lpClose(true),650);}}
  else{tone(1500,.05,{type:'square',vol:.07});noise(.12,{f:2600,type:'highpass',vol:.14});LP.msg.textContent=LP.k?'Сорвалось! Предыдущий штифт упал.':'Мимо. Ещё раз.';if(LP.k>0)LP.k--;
    if(S.hunt)for(const e of EN){if(!e.active||e.state==='ko'||e.state==='chase')continue;if(hypot(e.x-P.x,e.z-P.z)<9){e.aw=min(1,e.aw+.3);e.rot=atan2(P.x-e.x,P.z-e.z);if(e.aw>=1)alertE(e);}}}}
function lpClose(ok){if(!LP.on)return;LP.on=false;cancelAnimationFrame(LP.raf);$('puz').style.display='none';S.pause=false;S.camFn=null;CAM.fp=false;CAM.rate=5;if(ok&&LP.ok)LP.ok();}
function lpDraw(){const c=LP.ctx,n=LP.n,p=lpPos(),sy=112,amp=58,rest=sy+amp*LPT,xs=k=>70+k*(240/max(1,n-1));c.clearRect(0,0,380,220);c.lineJoin='round';c.lineCap='round';
  c.fillStyle='#b08d3c';c.strokeStyle='#2a1f08';c.lineWidth=3;c.beginPath();c.moveTo(30,14);c.arcTo(366,14,366,210,16);c.arcTo(366,210,14,210,16);c.arcTo(14,210,14,14,16);c.arcTo(14,14,366,14,16);c.fill();c.stroke();
  c.fillStyle='#9a7a32';c.fillRect(26,sy,328,88);c.strokeRect(26,sy,328,88);
  for(let k=0;k<n;k++){const x=xs(k),set=k<LP.k,cur=k===LP.k&&!LP.done,ty=set||LP.done?sy:cur?rest-p*amp:rest;c.fillStyle='#3a2c10';c.fillRect(x-13,24,26,176);
    if(cur){const w=lpWin()*amp;c.fillStyle='rgba(176,40,28,.22)';c.fillRect(x-16,sy-w,32,2*w);}
    c.strokeStyle='#77776e';c.lineWidth=2;c.beginPath();for(let i=0;i<=8;i++)c.lineTo(x+(i%2?7:-7),28+(ty-30-28)*i/8);c.stroke();
    c.fillStyle='#c9c2b0';c.strokeStyle='#2a1f08';c.fillRect(x-9,ty-30,18,28);c.strokeRect(x-9,ty-30,18,28);
    c.fillStyle=set||LP.done?'#6fd6a0':cur?'#f0c060':'#d0b060';c.beginPath();c.moveTo(x-9,ty);c.lineTo(x+9,ty);c.lineTo(x+9,ty+26);c.lineTo(x,ty+34);c.lineTo(x-9,ty+26);c.closePath();c.fill();c.stroke();}
  c.strokeStyle='#b0281c';c.lineWidth=2.5;c.setLineDash([8,6]);c.beginPath();c.moveTo(20,sy);c.lineTo(360,sy);c.stroke();c.setLineDash([]);
  const kx=xs(min(LP.k,n-1)),ky=LP.done?rest+40:rest-p*amp+36;c.strokeStyle='#1c2224';c.lineWidth=5;c.beginPath();c.moveTo(0,214);c.lineTo(kx-34,ky+12);c.lineTo(kx,ky);c.stroke();
  c.lineWidth=6;c.beginPath();c.moveTo(380,214);c.lineTo(350,186);c.lineTo(362,178);c.stroke();}

// --- notes in the journal
function addNote(t){S.notes.push(t);toast('✎ Заметка в блокноте ('+(touchUI()?'кнопка «Блокнот»':'<span class="kb">Tab</span>')+')',2.4);SFX.page();}
const exploreObj=()=>'Осмотрите Грейхейвен и расспросите местных: '+S.asked+' / 3';
const intObj=()=>'Возьмите интервью у посетителей паба: '+S.ints+' / 3';
function recOn(on){S.rec=on;S.recT0=S.t;$('rec').style.display=on?'block':'none';$('hud').style.display=on?'none':'block';}

// --- motel: check in, room №3, the vlog intro
addInter(-43.5,-32.1,1.8,'Поговорить с хозяином мотеля',async()=>{S.mode='talk';P.rot=PI;
  await say(HERO,'Добрый вечер. Мне нужна комната на пару ночей.',VO.hero);await say('Хозяин мотеля','…Приезжий. Мы тут приезжих не жалуем.',VO.own);
  await say(HERO,'Я заплачу вперёд. Я веду канал о необъяснимом — может, расскажете пару местных историй?',VO.hero);
  await say('Хозяин мотеля','*долго смотрит на камеру у тебя на груди* …Историй у нас нет. Третья комната, в конце коридора. И ночью по деревне не шляйтесь. Туман… мало ли что.',VO.own);
  S.booked=true;S.mode='play';setObj('Идите в комнату №3 — налево, в конец коридора.');SFX.pick();},()=>!S.booked);
const REC_INTRO=['Всем привет. С вами Эдвард Крейн и «За гранью» — канал о местах, о которых не принято говорить.','Сегодня — Грейхейвен. Рыбацкая деревня, которой нет на новых картах. Двадцать три пропавших за десять лет.',
  'И четверо выживших, которые рассказывают одно и то же: подвал местного паба, клетки, кандалы… и опыты над людьми.','Врачи называют это массовым психозом. А я хочу увидеть всё своими глазами. Начинаем.'];
addInter(-57.6,-34.4,1.5,'Записать вступление к выпуску',async()=>{S.mode='talk';S.mark=null;P.x=-57.6;P.z=-34.4;P.rot=0;S.crouch=false;
  S.camFn=()=>{CAM.ge=[P.x+.6,1.75,P.z+2.5];CAM.gt=[P.x,1.45,P.z];};CAM.rate=3;recOn(true);SFX.click();await wait(.8);
  for(const t of REC_INTRO)await say(HERO+' · запись',t,VO.hero);
  recOn(false);SFX.click();S.camFn=null;CAM.rate=1.6;setTimeout(()=>CAM.rate=5,2000);S.explore=true;
  await say(HERO,'Так. Теперь — пройдусь по деревне и поговорю с местными. Блокнот под рукой, отмычки в кармане… на всякий случай.',VO.hero);
  setObj(exploreObj());S.mode='play';toast((touchUI()?'«Блокнот»':'<span class="kb">Tab</span>')+'— блокнот с заметками. Значок <b>…</b> над жителем — с ним можно поговорить (<span class="kb">E</span>).',6);},()=>S.inRoom&&!S.explore);
addInter(-38,-18,2.6,'Машина',()=>{if(S.escaped||S.carSeen)toast('Все четыре шины проколоты, провода под капотом вырваны. На машине отсюда уже не уехать.',4);
  else say(HERO,'Уехать сейчас? Без единого кадра? Ну уж нет.',VO.hero);},()=>S.explore&&!S.inside&&(!S.alarm||S.escaped||S.carSeen));

// --- the villagers out in the fog (before the hunt): they stare, and answer through their teeth
const TOWN=[
 {name:'Старик у скамейки',v:VV[1],x:.2,z:-6.5,rot:0,vo:'old',lines:[['h','Добрый вечер! Я снимаю фильм о деревне. Можно пару вопросов?'],['n','*медленно поворачивает голову, не моргая* …Фильм. Сюда приезжают снимать. Потом — не уезжают.'],['h','(про себя) Кожа серая, шелушится, как рыбья чешуя… И он ни разу не моргнул.']],
  note:'Старик у скамейки: серая шелушащаяся кожа, немигающий взгляд. «Сюда приезжают снимать. Потом не уезжают».'},
 {name:'Человек у колодца',v:VV[2],x:13,z:-13.6,rot:0,vo:'vil',lines:[['h','Простите, вы не слышали о пропавших туристах?'],['n','Туристах? *шея под шарфом подрагивает* Туман здесь густой, люди теряются. Иди своей дорогой, приезжий.'],['h','(про себя) Складки на шее шевелятся, когда он дышит. Как жабры.']],
  note:'У колодца: под шарфом на шее — складки, похожие на жабры. Шевелятся при дыхании.'},
 {name:'Рыбак у сетей',v:VV[0],x:-20,z:40.4,rot:PI,vo:'fish',lines:[['h','Хорошие сети. Много рыбы ловите?'],['n','Рыба сама приходит. Когда зовут. *перебирает сеть длинными пальцами* Ты задаёшь много вопросов.'],['h','(про себя) Пальцы… между ними перепонки. Или мне уже мерещится.']],
  note:'Рыбак у сетей: длинные пальцы, между ними — перепонки. «Рыба сама приходит, когда зовут».'},
 {name:'Рыбак у пирса',v:VV[3],x:6.2,z:44.6,rot:0,vo:'vil',lines:[['h','Говорят, из Грейхейвена сбежали четверо. Вы что-нибудь о них знаете?'],['n','*сплёвывает в воду* Сбежали — и хорошо им. Хочешь сплетен — иди в паб «Дьяволов риф», у поворота к мотелю. Только не задерживайся там.']],
  note:'Рыбак у пирса отправил меня в паб «Дьяволов риф» у поворота к мотелю. Почти дружелюбно.'}];
for(const n of TOWN){n.c=col(n.x-.3,n.z-.3,n.x+.3,n.z+.3,1.8);addInter(n.x,n.z,1.8,'Расспросить: '+n.name.toLowerCase(),()=>askTown(n),()=>S.explore&&!S.alarm&&!n.done&&!S.inside);}
async function talkSeq(n,lines){S.mode='talk';P.rot=atan2(n.x-P.x,n.z-P.z);n.rot=atan2(P.x-n.x,P.z-n.z);for(const[w,t]of lines)await say(w==='h'?HERO:n.name,t,w==='h'?VO.hero:VO[n.vo||'vil']);}
async function askTown(n){await talkSeq(n,n.lines);n.done=1;S.asked++;addNote(n.note);
  if(S.asked>=3&&!S.pubKnown){S.pubKnown=true;await say(HERO,'Ни одного прямого ответа. Зато все косятся в сторону паба у поворота к мотелю… «Дьяволов риф». Там и поговорим.',VO.hero);
    setObj('Найдите паб «Дьяволов риф» — у поворота к мотелю — и поговорите с посетителями.');setMark(XD.pubF);}
  else if(!S.pubKnown)setObj(exploreObj());S.mode='play';}

// --- the pub: the owner, the regulars, the forbidden door
const PUBN=[
 {id:'own',name:'Хозяин паба',v:PUBV,x:135.15,z:.5,rot:PI/2,vo:'pub',room:'pub'},
 {id:'old',name:'Старый моряк',v:1,x:142.9,z:-2.05,rot:-2.2,sit:1,vo:'old',room:'pub',lines:[['h','Говорят, из Грейхейвена живыми уехали только четверо. Что скажете?'],['n','*выпускает дым трубки* Уехали? Отсюда не уезжают, сынок. Отсюда — уплывают. Все. Рано или поздно.'],['h','Уплывают? Куда?'],['n','Туда, где тихо и темно. На глубину. *смеётся — зубы мелкие и острые, как у рыбы*']],
  note:'Старый моряк: «Отсюда не уезжают — уплывают. На глубину». Зубы мелкие и острые, как у рыбы.'},
 {id:'fish',name:'Рыбак у стойки',v:0,x:137.65,z:-.7,rot:-PI/2,vo:'fish',room:'pub',lines:[['h','Те четверо беглецов рассказывали о подвале этого паба. О клетках.'],['n','Психи из лечебницы? *фыркает* Они и до приезда были психами. А камеру свою убери — здесь не любят, когда на них смотрят.']],
  note:'Рыбак у стойки: про беглецов знает. Нервничает, когда видит камеру.'},
 {id:'mute',name:'Посетитель',v:2,x:137.7,z:1.9,rot:-PI/2,room:'pub'},
 {id:'grim',name:'Угрюмый посетитель',v:VV[2],x:146.3,z:-3.7,rot:PI,vo:'grim',room:'pub',lines:[['h','Вы здесь давно живёте? Ничего странного не замечали?'],['n','Странное здесь — это ты. Чужаки всегда спрашивают. А потом уходят в туман. Сами. *быстро косится на дверь за стойкой*']],
  note:'Угрюмый посетитель: «Чужаки уходят в туман. Сами». И быстрый взгляд на дверь за стойкой.'}];
const pubOwner=PUBN[0];
for(const n of PUBN){n.c=col(n.x-.3,n.z-.3,n.x+.3,n.z+.3,1.8);
  if(n.lines)addInter(n.x,n.z,1.9,'Взять интервью: '+n.name.toLowerCase(),()=>interview(n),()=>S.inside==='pub'&&!S.backIn&&!S.kicked&&!n.done);}
addInter(pubOwner.x+1.5,pubOwner.z,1.6,'Поговорить с хозяином',async()=>{await talkSeq(pubOwner,[['h','А вы что скажете о пропавших?'],['n','Пьёшь — пей. Спрашиваешь — спрашивай других. Мне некогда.']]);S.mode='play';},()=>S.inside==='pub'&&!S.backIn&&!S.kicked);
addInter(PUBN[3].x,PUBN[3].z,1.6,'Заговорить с посетителем',async()=>{await talkSeq(PUBN[3],[['h','Добрый вечер. Можно вас на пару слов?'],['n','*смотрит сквозь тебя, не моргая. Медленно отворачивается к кружке.*']]);S.mode='play';},()=>S.inside==='pub'&&!S.backIn&&!S.kicked);
async function pubFirst(){S.mode='talk';await say(HERO,'(про себя) Стоило войти — и все замолчали. Ничего. И не таких разговаривали.',VO.hero);
  await say('Хозяин паба','Чего надо?',VO.pub);await say(HERO,'Пинту чего-нибудь местного. И немного вашего времени — я снимаю выпуск о Грейхейвене.',VO.hero);
  await say('Хозяин паба','Пинту — налью. А время у нас дорогое. Особенно для таких, как ты.',VO.pub);S.mark=null;setObj(intObj());S.mode='play';}
async function interview(n){await talkSeq(n,n.lines);n.done=1;S.ints++;addNote(n.note);
  if(S.ints>=3){await say(HERO,'(про себя) Каждый, кому я задаю вопрос, смотрит на ту дверь за стойкой. «Только для персонала»… А беглецы говорили именно о подвале паба.',VO.hero);
    setObj('Загляните за дверь «Только для персонала» — за стойкой.');setMark([134.75,-3.8,'pub']);}else setObj(intObj());S.mode='play';}
addInter(134.75,-3.8,1.2,'Дверь «Только для персонала»',async()=>{if(S.ints<3){await talkSeq(pubOwner,[['n','Эй! Туда — только персоналу. Сиди и пей.']]);S.mode='play';return;}kickOut();},()=>S.inside==='pub'&&!S.backIn&&!S.kicked);
addInter(133.2,-3.8,1.2,'Дверь в зал',()=>toast('За дверью — голоса и смех. Хозяин совсем рядом. Туда нельзя.',3),()=>S.inside==='pub'&&S.backIn);
async function kickOut(){S.mode='talk';S.mark=null;pubOwner.x=135.3;pubOwner.z=-2.7;pubOwner.rot=atan2(P.x-pubOwner.x,P.z-pubOwner.z);P.rot=atan2(pubOwner.x-P.x,pubOwner.z-P.z);
  await say('Хозяин паба','Эй! Куда?! Туда посторонним нельзя!',VO.pub);
  await say(HERO,'Я только посмотрю. Те четверо, что сбежали, описывали подвал вашего паба — клетки, кандалы…',VO.hero);
  await say('Хозяин паба','Опять эти сказки! Ты не местный. Ты лезешь куда не просят и задаёшь слишком много вопросов.',VO.pub);
  await say('Рыбак у стойки','Ещё и снимает всё на свою камеру. Начитался теорий заговора, умник.',VO.fish);
  await say('Хозяин паба','Вон отсюда. И если ещё раз увижу тебя у этой двери — пожалеешь, что приехал.',VO.pub);
  await fade(1,400);SFX.door();S.kicked=true;S.inside=null;pubOwner.x=135.15;pubOwner.z=.5;pubOwner.rot=PI/2;P.x=-13.2;P.z=-10.9;P.rot=0;camSnap();await wait(.3);SFX.thud();S.shake=.35;await fade(0,500);
  await say(HERO,'Ладно… Если они так берегут свой подвал — значит, мне именно туда.',VO.hero);
  await say(HERO,'У таких заведений всегда есть чёрный ход. А отмычки — при мне.',VO.hero);
  setObj('Найдите чёрный ход паба — в проулке, с восточной стороны — и вскройте замок отмычками.');setMark(XD.pubB);S.mode='play';}
async function backRoom(){S.backIn=true;S.mode='talk';await say(HERO,'(шёпотом) Тихо… Хозяин за стеной, в зале. А вот и лестница вниз.',VO.hero);setObj('Спуститесь в подвал.');setMark([129.5,-2.4,'pub']);S.mode='play';}
addInter(129.5,-2.4,1.5,'Спуститься в подвал',async()=>{S.mode='talk';S.mark=null;SFX.creak();await fade(1,450);S.inside='cellar';P.x=183.6;P.z=-2.3;P.rot=PI/2;camSnap();await fade(0,700);
  if(!S.cellarIn){S.cellarIn=true;await say(HERO,'…Господи. Они не врали.',VO.hero);setObj('Осмотрите подвал: 0 / 3');}S.mode='play';},()=>S.inside==='pub'&&S.backIn&&!S.alarm);
addInter(181.6,-2.5,1.3,'Подняться наверх',async()=>{S.mode='talk';SFX.creak();await fade(1,400);S.inside='pub';P.x=129.5;P.z=-2.2;P.rot=0;camSnap();await fade(0,500);if(S.ownerKO)setMark([129,2,'pub']);S.mode='play';},()=>S.inside==='cellar'&&(!S.alarm||S.ownerKO));
addInter(129,2,1.3,'Выйти через чёрный ход',()=>S.ownerKO?sneakOut():leaveRoom(XD.pubB),()=>S.inside==='pub'&&S.backIn&&(!S.alarm||S.ownerKO)&&!S.stalk);

// --- the cellar: what the four survivors described
let PHOTOS=null;
function polaroids(){const c=document.createElement('canvas');c.width=480;c.height=200;const x=c.getContext('2d');
  [[18,16,-.06],[175,10,.04],[330,18,-.03]].forEach(([px,py,r],st)=>{x.save();x.translate(px+65,py+88);x.rotate(r);x.fillStyle='#e8e2d0';x.fillRect(-65,-85,130,168);x.strokeStyle='#2a1f12';x.lineWidth=1.5;x.strokeRect(-65,-85,130,168);
    x.fillStyle=['#5a4a36','#4a4232','#3a3a2e'][st];x.fillRect(-56,-76,112,120);const hy=-14;x.strokeStyle='#120c06';x.lineWidth=2.2;x.lineJoin='round';
    x.beginPath();x.moveTo(-52,44);x.quadraticCurveTo(-30,16,-12,14);x.lineTo(12,14);x.quadraticCurveTo(30,16,52,44);x.stroke();
    x.fillStyle=['#a89070','#8f8f72','#7a8a74'][st];x.beginPath();x.ellipse(0,hy,[25,28,31][st],[33,32,29][st],0,0,7);x.fill();x.stroke();
    for(const s of[-1,1]){x.fillStyle='#f1ead8';x.beginPath();x.ellipse(s*11,hy-6,[6,9,12][st],[4,8,12][st],0,0,7);x.fill();x.stroke();x.fillStyle='#000';x.beginPath();x.arc(s*11+(st===2?s*2:0),hy-6,[2.6,2,1.3][st],0,7);x.fill();
      x.beginPath();x.moveTo(s*18,hy-18+(st?2:-1));x.lineTo(s*5,hy-14-(st?3:0));x.stroke();}
    x.fillStyle='#1a0808';x.beginPath();x.ellipse(0,hy+16,[5,8,11][st],[3,9,8][st],0,0,7);x.fill();x.stroke();
    if(st){x.lineWidth=1.5;for(const s of[-1,1])for(let k=0;k<3;k++){x.beginPath();x.moveTo(s*(13+k*3),hy+21+k*3);x.quadraticCurveTo(s*(19+k*3),hy+25+k*3,s*(24+k*2),hy+20+k*3);x.stroke();}
      for(let k=0;k<(st===2?18:7);k++){const a=k*2.4,rad=11+(k%4)*5;x.beginPath();x.arc(cos(a)*rad*1.1,hy+sin(a)*rad*.55-12+(k%3)*4,3,0,PI);x.stroke();}}
    x.fillStyle='rgba(0,0,0,.2)';for(let k=0;k<70;k++)x.fillRect(-56+Math.random()*112,-76+Math.random()*120,1.5,1.5);
    x.fillStyle='#2a1f12';x.font='17px Caveat, cursive';x.textAlign='center';x.fillText(['№17 · день 2','№17 · день 5','№17 · день 9'][st],0,64);x.restore();});
  return c.toDataURL();}
const EVID=[
 {id:'cage',x:188.5,z:-2.8,label:'Осмотреть клетки и кандалы',t:'Клетки и кандалы',b:'Три клетки из арматуры, сваренной кое-как. Прутья средней разогнуты — <b>изнутри</b>. На стене — кандалы: цепи в ржавчине, одно кольцо лопнуло по шву. На полу клетки кто-то нацарапал десятки чёрточек — счёт дней.<br><br><i>«Сбежали, потому что кандалы и клетки были плохого качества»… Уолтер, они говорили правду.</i>',
  note:'Подвал паба: клетки и ржавые кандалы. Одна клетка разогнута изнутри. Беглецы не врали.'},
 {id:'photo',x:181.3,z:1.5,label:'Осмотреть фотографии на стене',t:'Фотографии на стене',b:()=>'<img src="'+(PHOTOS=PHOTOS||polaroids())+'" style="width:100%;margin:2px 0 6px">Десятки снимков на ржавых гвоздях. Люди в клетках — день за днём. На первых — испуганные, но обычные лица. На последних — чешуя на щеках, жаберные щели на шее, выпученные немигающие глаза, пальцы, сросшиеся перепонками.<br>И в этих глазах — ужас. И безумие.',
  note:'Фотографии: люди день за днём превращаются во что-то рыбье. На последних снимках — безумие в глазах.'},
 {id:'dead',x:197.2,z:-2.7,label:'Осмотреть тела в углу',t:'Тела в углу',b:'Под мешковиной — тела. Трое. Серая кожа в чешуе, раздутые шеи с жабрами, растянутые рты, огромные остекленевшие рыбьи глаза. Они уже почти не похожи на людей. Почти.<br><br><i>На запястье одного — бирка от ключа мотеля. Номер 3.<br>Моя комната.</i>',
  note:'Тела в углу — наполовину люди, наполовину рыбы. У одного на запястье бирка от ключа мотеля: номер 3. Моя комната.'}];
S.ev=0;
for(const e of EVID)addInter(e.x,e.z,1.6,e.label,()=>{const b=typeof e.b==='function'?e.b():e.b;if(!e.seen){e.seen=1;S.ev++;S.noteCb=()=>{addNote(e.note);setObj(S.ev<3?'Осмотрите подвал: '+S.ev+' / 3':'Осмотрите рабочий стол у стены.');if(S.ev>=3)setMark([198,2.6,'cellar']);};}openNote(e.t,b);},()=>S.inside==='cellar'&&!S.alarm);
addInter(198,2.6,1.6,'Осмотреть рабочий стол',()=>{if(S.ev<3){toast('Стол завален бумагами. Сначала — оглядеться.',2.5);return;}S.mark=null;
  S.noteCb=()=>{addNote('Записки со стола: культ «Спящего», опыты по превращению людей. Подпись — д-р Э. Бернсон, Холмовая ул., 9.');alarmSeq();};
  openNote('Рабочий стол','Журнал наблюдений, исписанный аккуратным почерком:<br><i>«Объект 19. День 6. Чешуя на предплечьях, жаберные щели раскрылись. Во сне повторяет: „Он зовёт“. Перемена идёт хорошо.<br>Объект 20. День 3. Сердце не выдержало. Тело — в угол, до прилива.»</i><br><br>И записка, прижатая подсвечником:<br><i>«Тех, кто не вынесет перемены, — Спящему, на пирс, при факелах. Остальных — в море, к Отцу. Слава Спящему, что видит сны в глубине. Жду отчёт к новолунию.<br>— Д-р Э. Бернсон, Холмовая ул., 9»</i>');},()=>S.inside==='cellar'&&!S.alarm);

// --- the cellar: the owner comes down alone to knock the hero out quietly — and one of the "dead" fish-men wakes up behind him,
// tears him down and feeds. His bat flies across the floor: pick it up and beat the thing to death before it turns on you.
const crier=mkE('v',182.6,-3.4,[[182.6,-3.4]],{v:PUBV,direct:true,sp:2.6,hp:5});
const fishE=mkE('f',196.5,-3.7,null,{v:DEAD[2],direct:true,sp:3.2,hp:6,state:'dead',rot:1.05});
const CF={on:false,walk:false,rise:0,leap:0,bat:null,blood:0};
const BAT=[186.8,-1.7];
const SHOUTS=['ЧУЖАК!','ОН БЫЛ В ПОДВАЛЕ!','ПРОСЫПАЙТЕСЬ!','ЛОВИТЕ ЕГО!','ОН ВСЁ ВИДЕЛ!'],ALARML=[];
function alarmLight(){if(ALARML.length>=14)return;const h=HOUSES[floor(Math.random()*HOUSES.length)];ALARML.push([(h[0]+h[2])/2+rr(-3,3),1.7,h[3]+1,6.5,[.95,.62,.3]]);}
function bellToll(n=3){for(let i=0;i<n;i++){const t=i*1.7;for(const[f,v]of[[196,.15],[392,.08],[588,.035],[790,.03]])tone(f,3.4,{type:'sine',vol:v,att:.004,delay:t});noise(.08,{f:3000,type:'highpass',vol:.05,delay:t});}}
function fleeE(e,dt){const w=e.wp[e.wi];if(hypot(w[0]-e.x,w[1]-e.z)<1.3){e.wi=(e.wi+1)%e.wp.length;return;}
  const sp=hypot(P.x-e.x,P.z-e.z)<3.5?3.9:3.3;if(!goField(e,field(w[0],w[1],true),sp,dt))goDir(e,w[0],w[1],sp,dt);}
function groan(v=.3){tone(70,1.6,{type:'sawtooth',vol:v,to:52,lp:420});noise(1.2,{f:260,type:'bandpass',q:2,vol:v*.6,to:120});}
function gore(){noise(.22,{f:700,type:'bandpass',q:1.4,vol:.22,to:260});tone(95,.18,{vol:.12,to:60});}
const gush=(x,z,n=8)=>{for(let i=0;i<n;i++)PT.add(1,x+rr(-.2,.2),.5+rr(0,.3),z+rr(-.2,.2),rr(-1.4,1.4),1+Math.random()*2.2,rr(-1.4,1.4),.06+Math.random()*.05,.9,[.42,.04,.03,.95],1);};
async function alarmSeq(){S.mode='talk';SFX.creak();await wait(.5);SFX.door();pubOwner.room=null;CF.on=true;
  Object.assign(crier,{x:182.6,z:-3.4,hx:182.6,hz:-3.4,active:true,state:'script',hp:5,stun:0,wind:0,aw:0,cd:1.2,unarmed:false});
  Object.assign(fishE,{x:196.5,z:-3.7,hx:196.5,hz:-3.7,rot:1.05,active:true,state:'dead',hp:6,stun:0,wind:0,cd:1});
  crier.rot=atan2(P.x-crier.x,P.z-crier.z);P.rot=atan2(crier.x-P.x,crier.z-P.z);CAM.pitch=-.05;
  S.alarm=true;S.cellarFight=true;S.cp=[196.6,1.4];S.cpRoom='cellar';
  await say('Хозяин паба','Я же сказал тебе — НЕ СОВАТЬСЯ!',VO.pub);S.shake=.3;CF.walk=true;
  await say('Хозяин паба','*перехватывает биту и медленно идёт к вам* Тише, тише… Наверху никто не услышит. Уснёшь здесь — а проснёшься уже в клетке.',VO.pub);
  while(hypot(P.x-crier.x,P.z-crier.z)>3.3)await wait(.1);
  groan(.25);CF.rise=.001;await wait(.8);
  await say(HERO,'(шёпотом) За ним… тело в углу… Оно шевелится.',VO.hero);
  await say('Хозяин паба','Не пытайся меня отвлечь, писака. Старый трюк.',VO.pub);
  while(CF.rise<1)await wait(.1);groan(.4);CF.leap=.001;CF.l0=[fishE.x,fishE.z];while(CF.leap<1)await wait(.05);
  scream(1.6);SFX.thud();S.shake=.9;crier.state='ko';crier.unarmed=true;crier.rot=fishE.rot+PI;
  CF.bat={p:[crier.x,1.1,crier.z],v:[(BAT[0]-crier.x)/.9,4.2,(BAT[1]-crier.z)/.9],a:0,t:0};SFX.swing();gush(crier.x,crier.z,20);
  fishE.state='feed';fishE.t=0;
  await say('Хозяин паба','А-А-А! ПУСТИ! ПУСТИ-И-И!..',{pitch:96,vol:.32,dur:2});await wait(.8);gore();
  await say(HERO,'Господи… Оно его… грызёт. Бита — отлетела к клеткам. Пока эта тварь занята…',VO.hero);
  setObj('Подберите биту и забейте мертвеца, пока он не набросился на вас.');setMark([BAT[0],BAT[1],'cellar']);S.mode='play';
  toast('Кулаками его не взять. Подберите <b>биту</b> (<span class="kb">E</span>) и бейте (<span class="kb">ЛКМ</span>). <span class="kb">ПКМ</span> в момент его броска — отбить.',7);}
addInter(BAT[0],BAT[1],1.5,'Подобрать биту',()=>{CF.bat.taken=true;S.mark=null;S.weapon={name:'Бита',dmg:2,dur:99,m:segM('wpn_club')};SFX.pick();
  if(fishE.state==='feed'){fishE.state='chase';groan(.45);}setObj('Забейте мертвеца битой!');},()=>S.cellarFight&&CF.bat&&CF.bat.t>=1&&!CF.bat.taken);
// per frame (cutscenes too): the owner's walk, the rise, the leap, the flying bat
function cellarTick(dt){if(!CF.on)return;const t=S.t;
  if(CF.walk&&crier.state==='script'){crier.mv=0;CF.wi=CF.wi||0;const W=[[184.3,-1.5],[193.6,-1]],w=CF.wi<W.length?W[CF.wi]:[P.x,P.z],dx=w[0]-crier.x,dz=w[1]-crier.z,d=hypot(dx,dz);   // around the cages, ignoring the clutter
    if(CF.wi<W.length&&d<.3)CF.wi++;else if(CF.wi<W.length||hypot(P.x-crier.x,P.z-crier.z)>2.6){const s_=min(d,1.5*dt);crier.x+=dx/d*s_;crier.z+=dz/d*s_;crier.mv=1;crier.ph+=dt*3.5;faceTo(crier,atan2(dx,dz),dt,6);}else faceTo(crier,atan2(P.x-crier.x,P.z-crier.z),dt,4);}
  if(CF.rise>0&&CF.rise<1)CF.rise=min(1,CF.rise+dt*.75);
  if(CF.leap>0&&CF.leap<1){const L0=CF.l0,L=hypot(crier.x-L0[0],crier.z-L0[1])||1;CF.leap=min(1,CF.leap+dt*7/L);const k=CF.leap;fishE.x=lerp(L0[0],crier.x+.45,k);fishE.z=lerp(L0[1],crier.z-.35,k);fishE.rot=atan2(crier.x-fishE.x,crier.z-fishE.z);}
  const b=CF.bat;if(b&&b.t<1){b.t=min(1,b.t+dt/.9);b.v[1]-=11*dt;b.p=vAdd(b.p,vSc(b.v,dt));b.a+=dt*14;if(b.p[1]<.06){b.p[1]=.06;b.t=1;b.p=[BAT[0],.06,BAT[1]];noise(.15,{f:600,vol:.2});}}
  if(fishE.state==='feed'){fishE.t+=dt;fishE.rot=atan2(crier.x-fishE.x,crier.z-fishE.z);CF.blood-=dt;if(CF.blood<=0){CF.blood=.5+Math.random()*.6;gush(crier.x,crier.z,4);gore();}
    if(S.mode==='play'&&(fishE.t>11||hypot(P.x-fishE.x,P.z-fishE.z)<2.4)){fishE.state='chase';groan(.45);}}}
function updFish(e,dt){if(e.state!=='chase')return;const dx=P.x-e.x,dz=P.z-e.z,d=hypot(dx,dz)||.01;S.chased=.6;
  if(e.wind>0){e.wind-=dt;faceTo(e,atan2(dx,dz),dt,10);if(e.wind<=0)strike(e,d);return;}
  if(d<1.45){if(e.cd<=0)e.wind=.42;faceTo(e,atan2(dx,dz),dt,10);return;}goDir(e,P.x,P.z,e.sp,dt);}
function hitFish(e){if(!S.weapon){SFX.hit();e.stun=max(e.stun,.2);toast('Голыми руками его не остановить — <b>нужна бита!</b>',2.2);return;}
  SFX.hit();gore();gush(e.x,e.z,6);e.hp-=S.weapon.dmg;e.stun=max(e.stun,.5);moveC(e,sin(P.rot)*.4,cos(P.rot)*.4,.34);if(e.hp<=0){e.state='ko';e.active=true;fishDead();}}
function drawFish(e){const ch=CH.v[e.v],t=S.t;if(!ch)return;
  if(e.state==='dead'&&!CF.rise)return drawChar(ch,e.x,0,e.z,e.rot,{lie:true,noBlob:true,aR:.3,aL:.45});
  if(e.state==='ko')return drawChar(ch,e.x,0,e.z,e.rot,{lie:true,noBlob:true,aR:-.4,aL:.6});
  if(e.state==='dead')return drawChar(ch,e.x,0,e.z,e.rot,{lieK:1-eas(CF.rise),noBlob:true,aR:-1.6*CF.rise,aL:-1.5*CF.rise,look:0,cR:1.3,cL:1.3});
  if(e.state==='feed')return drawChar(ch,e.x,0,e.z,e.rot,{crouch:1,aR:-.7+sin(t*9)*.55,aL:-.9+sin(t*9+1.6)*.55,cR:1.2,cL:1.2,look:sin(t*3)*.25});
  const up=e.wind>0?-2.6:e.atk>0?lerp(.2,-2.4,e.atk/.3):-1.35+sin(t*7)*.15;
  drawChar(ch,e.x,0,e.z,e.rot,{ph:e.ph,mv:e.mv,aR:up,aL:up+.1,cR:1.3,cL:1.3,look:0});}
function drawCellarFight(){if(!CF.on)return;drawFish(fishE);const b=CF.bat;
  if(b&&!b.taken){const m=segM('wpn_club');if(m)draw(m,b.t<1?mM(mT(...b.p),mRy(b.a*.4),mRx(b.a)):mM(mT(b.p[0],.05,b.p[2]),mRy(.9),mRx(PI/2),mT(0,0,-.45)),.03);}
  if(crier.state==='ko'&&crier.unarmed)draw(M_pool,mM(mT(crier.x,.02,crier.z),mS(1.6,1,1.3)),0,.85);}
const M_pool=(()=>{const g=new Geo(0);g.cyl(0,0,0,.6,.6,.01,9,H('#3a0806'));return mesh(g);})();
async function fishDead(){S.mode='talk';S.cellarFight=false;S.cpRoom=null;S.ownerKO=true;S.mark=null;groan(.2);await wait(.9);
  await say(HERO,'(тяжело дыша) Всё… Оно больше не встанет. Надеюсь.',VO.hero);
  await say(HERO,'Хозяин… мёртв. Его загрызло то, что он сам держал в этом подвале.',VO.hero);
  S.weapon=null;await say(HERO,'Бита треснула пополам. Неважно. Крик наверняка слышали — уходить нужно тихо, через чёрный ход.',VO.hero);
  setObj('Тихо выберитесь из паба через чёрный ход.');setMark([181.6,-2.5,'cellar']);S.mode='play';}
function cellarReset(){if(!CF.on||!S.cellarFight)return;Object.assign(fishE,{x:crier.x+.5,z:crier.z-.4,state:'feed',t:6,hp:6,stun:0,wind:0,cd:1,active:true});
  S.weapon=null;if(CF.bat){CF.bat.taken=false;CF.bat.t=1;CF.bat.p=[BAT[0],.06,BAT[1]];}setObj('Подберите биту и забейте мертвеца, пока он не набросился на вас.');setMark([BAT[0],BAT[1],'cellar']);}
// the robed cultists guarding the car (they show up with the hunt)
const GUARD=[[-36.2,-20.9,PI],[-40.7,-15.3,-.8],[-34.5,-15.5,.8]].map(([x,z,r])=>mkE('c',x,z,[[x,z]],{rot:r}));GUARD.forEach(g=>g.grp=GUARD[0].grp);
function startHunt(){S.hunt=true;S.cp=[-23.6,-19.6];for(const n of TOWN)n.c.off=true;owner.x=-44;owner.z=-27.6;con.x=-47;con.z=-23;
  for(const e of EN){if(e===crier)continue;if(e.stay){e.show=false;continue;}e.active=true;e.hx=e.x;e.hz=e.z;}SFX.alert();}
// --- per-frame story logic (play mode)
function story(dt){
  if(!S.hunt){for(const[e,t]of[[con,'Чего уставился, городской? Катился бы ты отсюда.'],[loaf,'*сплёвывает под ноги* Ещё один… с камерой.']]){const d=hypot(e.x-P.x,e.z-P.z);if(d<5)faceTo(e,atan2(P.x-e.x,P.z-e.z),dt,3);if(d<3&&!e.barked&&!sub){e.barked=1;say('Житель',t,VO.vil);}}
    faceTo(owner,atan2(P.x-owner.x,P.z-owner.z),dt,2);
    if(!S.inside)for(const n of TOWN){if(hypot(n.x-P.x,n.z-P.z)<6)faceTo(n,atan2(P.x-n.x,P.z-n.z),dt,2.5);}}
  if(S.inside==='pub')for(const n of PUBN){if(n.room==='pub'&&hypot(n.x-P.x,n.z-P.z)<4.5&&!S.backIn)faceTo(n,atan2(P.x-n.x,P.z-n.z),dt,2);}
  if(S.booked&&!S.inRoom&&P.x<-55.5&&P.z<-30){S.inRoom=true;(async()=>{S.mode='talk';await say(HERO,'Ну и дыра. Сыростью и рыбой несёт… Зато для выпуска — атмосфера что надо.',VO.hero);
    setObj('Поставьте камеру и запишите вступление к выпуску.');setMark([-57.6,-34.4]);S.mode='play';})();}
  stage(dt);}

// --- drawing: interiors, people, beacons
const M_beaconY=(()=>{const g=new Geo(.02);g.cyl(0,0,0,.28,0,.45,4,H('#ffd77a',1));g.cyl(0,-.45,0,0,.28,.45,4,H('#e0b050',1));return mesh(g);})();
const DEADP=[[197.5,-5,1.45,0],[198.8,-3.9,1.8,1],[196.5,-3.7,1.05,2]];
const drawNPC=n=>drawChar(CH.v[n.v],n.x,0,n.z,n.rot,{sit:n.sit,aR:n.sit?-1.1:null,aL:n.sit?-1.1:null});
function drawStory(){if(!M_int)M_int=mesh(IG);draw(M_int,null,.035);if(FIN.on||S.mode==='finale')return;
  if(!S.curfew&&!S.inside)for(const n of TOWN)drawNPC(n);
  if(S.inside==='pub'||S.inside==='cellar'){for(const n of PUBN)if(n.room===S.inside)drawNPC(n);}
  if(S.inside==='pub')light(147,.9,-4.6,8+sin(S.t*11)*.6+sin(S.t*23)*.4,[1,.55,.25]);
  if(S.inside==='cellar'){drawCellarFight();for(const[x,z,r,i]of DEADP)if(i!==2||!CF.on)drawChar(CH.v[DEAD[i]],x,0,z,r,{lie:true,noBlob:true,aR:.25,aL:.4});light(190,2.2,0,3+abs(sin(S.t*.7))*1.5,[.5,.45,.3]);}
  for(const l of ALARML)light(...l);
  if(S.mode==='play'){const T=markTarget();if(T)draw(M_beaconY,mM(mT(T[0],2.6+sin(S.t*2.4)*.15,T[1]),mRy(S.t*1.6)),0);}
  drawAct3();drawAct2();drawStage();dbrDraw();}
function storyHud(c,w,h){if(S.rec){const s=floor(S.t-S.recT0);$('recT').textContent='00:'+String(floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
  if(S.mode!=='play')return;c.textAlign='center';c.textBaseline='middle';
  const bub=(x,z)=>{if(hypot(x-P.x,z-P.z)>13)return;const p=proj(x,2.4,z);if(p.w<=0)return;c.save();c.translate(p.x*w,p.y*h);c.fillStyle='rgba(11,20,22,.82)';c.strokeStyle='#d9cdb0';c.lineWidth=2;
    c.beginPath();c.ellipse(0,0,17,12,0,0,7);c.fill();c.stroke();c.beginPath();c.moveTo(-4,10);c.lineTo(-9,19);c.lineTo(3,11);c.fill();c.fillStyle='#d9cdb0';for(const k of[-6,0,6]){c.beginPath();c.arc(k,0,2,0,7);c.fill();}c.restore();};
  if(S.explore&&!S.alarm&&!S.inside)for(const n of TOWN)if(!n.done)bub(n.x,n.z);
  if(S.inside==='pub'&&!S.backIn&&!S.kicked)for(const n of PUBN)if(n.lines&&!n.done)bub(n.x,n.z);
  stageHud(c,w,h);act2Hud(c,w,h);act3Hud(c,w,h);
  if(crier.active&&crier.flee&&crier.yellT>0){const p=proj(crier.x,2.8,crier.z);if(p.w>0){c.font='bold 22px Georgia';c.lineWidth=5;c.strokeStyle='#0b1416';c.strokeText(crier.yell,p.x*w,p.y*h-12);c.fillStyle='#ff6a5a';c.fillText(crier.yell,p.x*w,p.y*h-12);}}}

// --- debug: jump to a story stage ('town', 'pub', 'back', 'cellar', 'alarm', 'stalk', 'doctor', 'play')
const STAGES=['town','pub','back','cellar','alarm','stalk','doctor','play'];
function storySkip(st){S.booked=S.inRoom=S.explore=true;S.hud=true;$('hud').style.display='block';$('skip').style.display='none';P.vis=true;S.mode='play';$('fade').style.opacity=0;S.camFn=null;S.focus=null;CAM.fp=false;if(!CAR.parked)parkCar();
  const past=s=>STAGES.indexOf(st)>=STAGES.indexOf(s);
  if(past('pub')){S.asked=3;S.pubKnown=true;for(const n of TOWN)n.done=1;}
  if(past('back')){S.pubIn=S.kicked=true;S.ints=3;for(const n of PUBN)n.done=1;}
  if(past('cellar')){S.backIn=S.cellarIn=true;XD.pubB.lock=false;}
  if(past('stalk')){S.ev=3;EVID.forEach(e=>e.seen=1);S.alarm=S.ownerKO=true;Object.assign(crier,{active:true,state:'ko',x:190,z:-1,unarmed:true});CF.on=true;CF.bat={taken:true,t:1,p:[0,0,0]};Object.assign(fishE,{active:true,state:'ko',x:190.6,z:-1.6});pubOwner.room=null;}
  S.inside=null;S.mark=null;if(!past('alarm'))Object.assign(pubOwner,{room:'pub',x:135.15,z:.5,rot:PI/2});
  if(st==='town'){P.x=-28;P.z=-10;setObj(exploreObj());}
  else if(st==='pub'){P.x=-13.2;P.z=-11;setObj('Найдите паб «Дьяволов риф» — у поворота к мотелю — и поговорите с посетителями.');setMark(XD.pubF);}
  else if(st==='back'){P.x=-6.4;P.z=-20.5;setObj('Найдите чёрный ход паба и вскройте замок отмычками.');setMark(XD.pubB);XD.pubB.lock=true;}
  else if(st==='cellar'){S.inside='cellar';P.x=183.6;P.z=-2.3;setObj('Осмотрите подвал: 0 / 3');}
  else if(st==='alarm'){S.ev=3;EVID.forEach(e=>e.seen=1);S.inside='cellar';P.x=197;P.z=2.6;alarmSeq();}
  else if(st==='stalk'){P.x=-6.4;P.z=-20.5;startStalk();}
  else if(st==='doctor'){startStalk();S.carSeen=S.guardsMet=true;S.inside='doc';P.x=269;P.z=-30;P.rot=PI;S.inDoc=true;setObj(docObj());}
  else{startStalk();S.carSeen=S.guardsMet=S.inDoc=true;DOCEV.forEach(e=>e.seen=1);S.injected=true;stage2(true);S.inside='doc';P.x=271;P.z=-30;P.rot=PI;if(ACT2ST.includes(st))act2Skip(st);else if(ACT3ST.includes(st))act3Skip(st);}
  camSnap();}
