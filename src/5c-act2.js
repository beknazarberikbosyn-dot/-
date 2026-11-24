// ================= ACT 2: Father Paul, the disguise, the hallucinations, Father Matthew, the cave and R'lyeh =================
// After the doctor flees (stage 2, the curfew): the upstairs of his house (library, bedroom with a wall safe) → knocked out at the
// safe → wakes tied to a chair: Father Paul, the forgotten cult priest, wants the finished serum for himself; he gives Edward a cult
// robe and mask (the robed cult ignores him) and tells him the injection was a deadly poison → the new church of Father Matthew
// (locked, a stone through the window tears the robe: from then on the cult hunts him) → Matthew tells him about the cave →
// the cave: the doctor, the threats, the secret of the blood → the nightmare: the ruins of R'lyeh, a walk to the throne before
// the city collapses → the light of His eyes → the cave → credits.
// Hallucinations (4): the place stays the same, but it burns, and the Old One towers over the hero and whispers; each is worse.
Object.assign(VO,{paul:{pitch:70},matt:{pitch:104},wh:{pitch:40,vol:.3}});
CHF.paul=partSet('paul',()=>gVillager(3),{bodyName:'paul_body'});
CHF.matt=partSet('matt',()=>gVillager(3),{bodyName:'matt_body'});
const ACT2ST=['upstairs','paul','church','churchin','cave','rlyeh'];STAGES.push(...ACT2ST);
const say2=(who,t,vo)=>say(who,t,vo);
function lookAt(x,y,z){const h=P.lie?.35:S.seated?1.2:S.crouch?1.08:1.62;P.rot=atan2(x-P.x,z-P.z);CAM.yaw=P.rot;CAM.pitch=atan2(y-h,hypot(x-P.x,z-P.z));}
const NPC2=(o)=>Object.assign({show:false,x:0,z:0,rot:0,ph:0,mv:0,walk:null,sp:1.4},o);
const walkPath=(n,pts)=>{n.path=pts.slice(1);n.walk=pts[0];},walking=n=>!!n.walk;
const PAUL=NPC2({faceP:1}),MATT=NPC2({faceP:1}),AD=NPC2({sp:4});   // AD: the doctor in the cave and in R'lyeh
function npcStep(n,dt){n.mv=0;if(n.walk&&hypot(n.walk[0]-n.x,n.walk[1]-n.z)<=.2)n.walk=n.path&&n.path.length?n.path.shift():null;if(n.walk&&hypot(n.walk[0]-n.x,n.walk[1]-n.z)>.2){const dx=n.walk[0]-n.x,dz=n.walk[1]-n.z,d=hypot(dx,dz),s=min(d,n.sp*dt);n.x+=dx/d*s;n.z+=dz/d*s;n.rot=atan2(dx,dz);n.mv=1;n.ph+=dt*n.sp*2.3;}else if(n.faceP&&n.show)faceTo(n,atan2(P.x-n.x,P.z-n.z),dt,4);}

// ---------------------------------------------------------------- rooms
Object.assign(ROOMS,{
  doc2:{x0:258,z0:-24,x1:280,z1:-10,amb:[.4,.38,.36],fog:[.02,.024,.024],mist:.2},
  church:{x0:207,z0:-46,x1:221,z1:-26,gap:214,door:'church',amb:[.4,.37,.33],fog:[.035,.03,.026],mist:.12},
  cave:{x0:206,z0:-22,x1:228,z1:12,door:'cave',amb:[.34,.27,.21],fog:[.02,.014,.01],mist:.4},
  rlyeh:{x0:770,z0:-20,x1:830,z1:240,amb:[.22,.4,.34],fog:[.03,.09,.07]}});
Object.assign(XD,{church:{k:'church',x:-87,z:-12,n:[0,1],room:'church',in:[214,-27.4,PI]},cave:{k:'cave',x:50,z:-44,n:[0,1],room:'cave',in:[217,9.6,PI]}});
IG.bx(217,-.12,-13,40,.06,72,H('#030506'));   // more darkness around the new rooms

// the doctor's study: a staircase up along the front wall
{for(let i=0;i<12;i++)IG.bx(272.45+i*.48,0,-28.95,.5,.25*(i+1),.9,i%2?PAL.wood:PAL.woodD);IG.bx(275.2,3.05,-28.95,6,.06,.95,PAL.woodD);iCol(272.1,-29.45,278.2,-28.3,1);
 const y0=.25+.92,x0=272.3,x1=276.9,y1=y0+(x1-x0)/.48*.25,L=hypot(x1-x0,y1-y0);   // balusters and a sloped handrail along the open side
 for(let i=0;i<10;i++){const x=272.45+i*.48;if(x>x1)break;const top=y0+(x-x0)/.48*.25,bot=.25*(i+1);IG.bx(x,bot,-29.43,.05,top-bot,.05,PAL.woodD);}
 IG.bx(x0,0,-29.43,.12,y0+.06,.12,PAL.wood);IG.at(mM(mT((x0+x1)/2,(y0+y1)/2,-29.43),mRz(atan2(y1-y0,x1-x0))),()=>{IG.bx(0,-.03,0,L+.1,.07,.1,PAL.wood);IG.bx(0,-.07,0,L+.05,.04,.06,PAL.woodD);});}
iDoor(269,-28.06,PI);iDoor(214,-26.06,PI);   // the street doors seen from inside: the doctor's house, the church

// UPSTAIRS (x 258..280, z -24..-10): the library, the bedroom with the wall safe, the landing — and a chair in the middle
{const r=ROOMS.doc2,DW=H('#5a5650'),DW2=H('#4c4944');iPlanks(258,-24,280,-10,['#3e3024','#372a20','#45362a']);iShell(r,3,DW,DW2);
 for(const x of[262,270,276])IG.bx(x,1.2,-10.2,1.1,1.1,.06,H('#1a2a2e',.05));   // dark windows over the street
 // library: shelves along the west and back walls, a reading desk, a ladder, books everywhere
 const books=(x0,z0,x1,z1,y0,y1)=>{for(let y=y0;y<y1;y+=.5)for(let t=0;t<1;t+=.045){const x=lerp(x0,x1,t),z=lerp(z0,z1,t);IG.bx(x,y+.03,z,x0===x1?.26:.05,.34+((t*97)%3)*.03,x0===x1?.05:.26,H(['#5a2a24','#2a3a4a','#3a4a2a','#6a5a3a','#2a2a2a','#4a3a5a'][floor(t*137+y*7)%6]));}};
 IG.bx(258.35,0,-17,.5,2.8,13.4,PAL.woodD);books(258.6,-23.4,258.6,-10.6,.2,2.6);iCol(258,-23.8,258.75,-10.2,3);
 IG.bx(261.5,0,-23.65,6.4,2.8,.5,PAL.woodD);books(258.8,-23.4,264.6,-23.4,.2,2.6);iCol(258.3,-24,264.8,-23.3,3);
 IG.bx(265.2,0,-21,.4,2.2,6,PAL.woodD);books(265.05,-23.6,265.05,-18.2,.2,2);books(265.35,-23.6,265.35,-18.2,.2,2);iCol(265,-24,265.45,-18,2.2);
 IG.bx(261.6,0,-16.4,2.2,.78,1.1,PAL.wood);IG.bx(261.6,.78,-16.4,2.3,.05,1.2,PAL.woodD);for(const[x,ry]of[[261,.3],[261.8,-.25],[262.3,.1]])IG.at(mM(mT(x,.84,-16.4),mRy(ry)),()=>IG.bx(0,0,0,.42,.01,.3,PAPER2));
 ip('table_lamp',262.4,.82,-16.8,0,1,null,null);ip('chair',261.6,0,-15.3,PI,1,null,null);iCol(260.4,-17,262.8,-15.8,1);
 IG.at(mM(mT(259.4,0,-12.4),mRz(.22)),()=>{for(const z of[-.25,.25])IG.bx(0,0,z,.07,2.9,.07,PAL.wood);for(let y=.3;y<2.8;y+=.35)IG.bx(0,y,0,.05,.05,.5,PAL.wood);});
 for(let i=0;i<9;i++)IG.at(mM(mT(259.6+rr(0,4),.05+floor(i/3)*.08,-12+rr(-1.4,1.4)),mRy(rr(0,3))),()=>IG.bx(0,0,0,.3,.07,.22,H(['#5a2a24','#2a3a4a','#6a5a3a'][i%3])));
 ip('armchair',263.6,0,-11.6,2.6,1,null,()=>IG.bx(0,0,0,.9,.9,.9,H('#4a2b2b')));iCol(263,-12.2,264.2,-11,1);
 // bedroom: bed, nightstands, wardrobe — and the safe behind a portrait in the back wall
 ip('bed',269,0,-21.6,0,1,null,()=>IG.bx(0,0,0,2,.55,3.4,H('#5a6a6a')));iCol(267.9,-23.6,270.1,-19.8,1);
 for(const x of[267.4,270.6])ip('nightstand',x,0,-23.2,0,1,null,()=>IG.bx(0,0,0,.5,.6,.5,PAL.wood));iCol(266.9,-23.7,271.1,-22.7,.7);
 ip('candle',270.6,.62,-23.2,0,1,null,null);ip('wardrobe',272,0,-22.9,0,1,null,()=>IG.bx(0,0,0,1.4,2.2,.6,PAL.woodD));iCol(271.2,-23.6,272.8,-22.3,2.2);
 IG.bx(266.4,1.05,-23.92,.7,.7,.08,H('#2e3436'));IG.bx(266.4,1.3,-23.86,.3,.3,.04,H('#1a1e20'));IG.cyl(266.4,1.4,-23.82,.07,.07,.04,8,H('#b08d3c',.3));
 IG.at(mM(mT(265.85,.95,-23.85),mRy(-1.1)),()=>{IG.bx(.45,0,0,.9,1.1,.05,H('#5a4028'));IG.bx(.45,.1,.03,.72,.88,.02,H('#3a4a44'));IG.bx(.45,.5,.045,.22,.3,.01,H('#b89a7a'));});   // the portrait, swung aside
 ip('rug',269,.06,-17.4,0,1.3,{pal:{rug:H('#4a2a2a')}},null);
 // the chair in the middle, the lantern on the floor, the landing with the stair hole
 IG.bx(269,0,-16.9,.5,.45,.5,PAL.wood);IG.bx(269,.45,-16.9,.55,.05,.55,PAL.woodD);IG.bx(269,.5,-17.13,.5,.6,.06,PAL.woodD);
 IG.cyl(270.2,0,-15.4,.12,.1,.32,6,H('#2a2a2a'));
 IG.bx(275.2,0,-10.75,6,.06,.9,H('#0a0806'));for(let i=0;i<7;i++)IG.bx(272.3+i*1,.0,-11.3,.06,1,.06,PAL.woodD);IG.bx(275.2,1,-11.3,6,.06,.08,PAL.wood);iCol(272.1,-11.4,278.3,-10,1);
 iCrate(278.6,-22.4,1);iCrate(278.7,-21.3,.8,.3);ip('trap',277.5,0,-23,.4,1,null,null);
 LAMPS.push([262.4,1.4,-16.8,5,[1,.78,.45]],[269,2.5,-17,7,[1,.72,.42]],[270.2,.5,-15.4,4,[1,.7,.35]],[276,2.4,-17,6,[.8,.75,.6]]);}

// THE NEW CHURCH, inside (x 207..221, z -46..-26 ↔ the white church at x -94..-80, z -32..-12): pews, candles, people hiding
const CH_IN=[214,-27.4];
{const r=ROOMS.church,WW=H('#cfc8b8'),WW2=H('#bdb6a6');iTiles(207,-46,221,-26,['#6a6458','#5e584e','#726c60']);iShell(r,5,WW,WW2);
 IG.bx(214,0,-36,1.6,.02,19,H('#5a1e1e'));   // the aisle runner
 for(let z=-30;z>=-40.5;z-=1.6)for(const[x0,x1]of[[207.8,212.9],[215.1,220.2]]){const cx=(x0+x1)/2,w=x1-x0;IG.bx(cx,0,z,w,.45,.45,PAL.woodD);IG.bx(cx,.45,z,w,.06,.5,PAL.wood);IG.bx(cx,.5,z+.25,w,.55,.07,PAL.woodD);iCol(x0,z-.3,x1,z+.32,.9);}
 IG.bx(214,0,-44.6,9,.35,2.8,H('#8a8070'));IG.bx(214,.35,-45,2.4,.95,.9,H('#d8d0bc'));IG.bx(214,1.3,-45,2.5,.06,1,H('#e8e0cc'));iCol(212.7,-45.5,215.3,-44.5,1.3);
 IG.bx(214,1.6,-45.85,.14,2.2,.1,H('#b08d3c',.25));IG.bx(214,2.9,-45.85,1.1,.14,.1,H('#b08d3c',.25));
 for(const x of[212.3,215.7])for(let i=0;i<3;i++)IG.cyl(x+(i-1)*.18,1.36,-45.1,.03,.03,.25+i*.06,5,H('#efe6c8'));
 for(const[x,c]of[[210.5,'#7a2a2a'],[214,'#2a4a7a'],[217.5,'#3a6a3a']])IG.bx(x,2.4,-45.95,1.3,2.2,.05,H(c,.55));   // stained glass, lit from outside
 for(const z of[-29,-32.2,-35.4,-38.6,-41.8])for(const x of[207.05,220.95])if(!(x<214&&abs(z+32.2)<.1))IG.bx(x,1.2,z,.06,2.6,1,H(['#c9a24a','#7a9ab8','#b85a4a'][floor(abs(z))%3],.5));
 IG.bx(207.08,1.2,-32.2,.05,2.6,1,H('#050608'));for(let i=0;i<7;i++)IG.at(mM(mT(207.6+rr(0,.8),.02,-32.2+rr(-.6,.6)),mRy(rr(0,3))),()=>IG.bx(0,0,0,.12,.01,.07,H('#cfe0e0',.2)));   // the broken window and the glass on the floor
 for(const[x,z]of[[208,-44.5],[220,-44.5],[208,-28],[220,-28]]){IG.cyl(x,0,z,.08,.08,1.4,6,H('#2a2622'));IG.cyl(x,1.4,z,.1,.1,.08,6,H('#efe6c8',.6));}
 LAMPS.push([214,3.4,-36,10,[1,.78,.5]],[214,1.9,-44.6,6,[1,.75,.4]],[208,1.7,-44.5,4,[1,.7,.35]],[220,1.7,-44.5,4,[1,.7,.35]],[208,1.7,-28,4,[1,.7,.35]],[220,1.7,-28,4,[1,.7,.35]]);}
// the people sheltering in the church: [kind, variant, x, z, rot, pose]
const CHU=[['w',0,209,-30,PI,'sit'],['k',1,210.2,-30,PI,'sit'],['w',2,211.6,-31.6,PI,'sit'],['m',FM[1],216.4,-30,PI,'sit'],['w',1,218.5,-31.6,PI,'sit'],['k',0,219.6,-31.6,PI,'sit'],
  ['m',FM[2],209.4,-33.2,PI,'sit'],['w',0,217,-34.8,PI,'sit'],['w',2,211,-36.4,PI,'pray'],['m',FM[0],219.2,-36.4,PI,'sit'],['w',1,220.2,-42,-PI/2,'stand'],['k',1,208.4,-41.6,PI*.7,'stand']].map(([k,v,x,z,rot,pose])=>({k,v,x,z,rot,pose,ph:rnd()*6}));

// THE CAVE (x 206..228, z -22..12; walkable x 209.5..224.5, z -18..9): rock walls open to the sky, torches, paintings on the rough rock, the altar stone
const CAVE_T=[[210.4,-12],[210.4,2],[223.6,-12],[223.6,2],[211.4,-16.6],[222.6,-16.6]];
const ROCKR={rock_a:.45,rock_b:.7,rock_c:.3};
const rockN=(x,z,rad,sy,ry,k=.64)=>{const n=['rock_a','rock_b','rock_c'][floor(abs(x*7+z*3))%3],s=rad/ROCKR[n];ip(n,x,-.4,z,ry,[s,s*sy,s],{k:k+((x+z)%5)*.03},()=>IG.bx(0,0,0,rad*1.6,rad*1.6*sy,rad*1.6,H('#3a3632')));};
{IG.bx(217,-.05,-5,23,.06,35,H('#2a2622'));
 for(let z=-19;z<=10;z+=2.4){rockN(208,z,2.3+abs(sin(z))*.6,3.2,z);rockN(226,z,2.3+abs(cos(z))*.6,3.2,z*1.3);}
 for(let x=209;x<=225;x+=2.4){rockN(x,-20.2,2.4+abs(sin(x))*.5,3,x);if(x<213.6||x>220.4)rockN(x,11,2.3+abs(cos(x))*.5,2.8,x*.7);}
 for(const[x,z]of[[213.4,14],[220.6,14],[213.6,17],[220.4,17],[217,19.4]])rockN(x,z,1.9,2.4,x);
 iCol(204,-24,209.5,14,7);iCol(224.5,-24,230,14,7);iCol(204,-25,230,-18,7);iCol(204,9,215.3,14,7);iCol(218.7,9,230,14,7);iCol(213,13.5,215.4,21,7);iCol(218.6,13.5,221,21,7);iCol(213,18.6,221,21,7);
 for(let i=0;i<12;i++)rockN(rr(211,223),rr(-14,6),rr(.25,.55),.8,rr(0,6),.7);
 IG.bx(217,0,-13.2,2.6,.9,1.3,H('#4a4440'));IG.bx(217,.9,-13.2,2.8,.08,1.4,H('#3a3430'));iCol(215.7,-13.9,218.3,-12.5,.9);
 for(let i=0;i<7;i++)IG.cyl(216.1+i*.3,.98,-13.1+((i*3)%2)*.25,.035,.035,.14+((i*5)%3)*.08,5,H('#efe6c8'));
 for(const[x,z]of CAVE_T){IG.at(mM(mT(x,1.6,z),mRz(x<217?-.5:x>217?.5:0),mRx(z<-16?.5:0)),()=>{IG.cyl(0,0,0,.05,.04,.8,5,H('#3a2a1a'));IG.cyl(0,.8,0,.08,.07,.18,6,H('#2a2018'));});}
 // the painted rock face: an uneven surface (bulges, ledges), and ochre / red / chalk strokes laid on it in short worn dabs
 const WZ=-17.7,wd=(x,y)=>WZ+.22*sin(x*1.7+y*.9)+.16*sin(x*3.1-y*2.3)+.08*sin(x*5.3+y*4.1)-.5*((x-217)/6.5)**2-.18*max(0,y-4)**1.3+.06*sin(y*7.7);
 for(let x=210.5;x<223.5;x+=.5)for(let y=0;y<5.6;y+=.5){const p=(a,b)=>[a,b,wd(a,b)],c=H(['#4a4238','#433b32','#514839','#3e372f'][floor(abs(x*3.7+y*5.3))%4]);
   IG.quad(p(x,y),p(x+.5,y),p(x+.5,y+.5),p(x,y+.5),c);IG.quad(p(x,y),p(x,y+.5),p(x+.5,y+.5),p(x+.5,y),c);}
 iCol(210,-18.4,224,-17.4,3);
 const dab=(x,y,a,L,w,c)=>{if(rnd()<.07)return;const z=wd(x,y)+.035,gx=(wd(x+.05,y)-wd(x-.05,y))/.1,gy=(wd(x,y+.05)-wd(x,y-.05))/.1,k=.75+rnd()*.5,base=H(c);
   const col=[base[0]*k,base[1]*k,base[2]*k,0];IG.at(mM(mT(x,y,z),mRy(-Math.atan(gx)),mRx(Math.atan(gy)),mRz(a+rr(-.12,.12))),()=>IG.bx(0,-w*k/2,0,L,w*k,.014,col));};
 const st=(x0,y0,x1,y1,c,w=.08)=>{const L=hypot(x1-x0,y1-y0),n=max(1,Math.ceil(L/.11)),a=atan2(y1-y0,x1-x0);for(let i=0;i<n;i++){const t=(i+.5)/n;dab(x0+(x1-x0)*t+rr(-.012,.012),y0+(y1-y0)*t+rr(-.012,.012),a,L/n*1.25,w,c);}};
 const poly=(cx,cy,rx,ry,n,c,w)=>{for(let i=0;i<n;i++){const a0=i/n*2*PI,a1=(i+1)/n*2*PI,j0=1+rr(-.08,.08),j1=1+rr(-.08,.08);st(cx+cos(a0)*rx*j0,cy+sin(a0)*ry*j0,cx+cos(a1)*rx*j1,cy+sin(a1)*ry*j1,c,w);}};
 const blob=(cx,cy,r,c)=>{for(let i=0;i<5;i++)dab(cx+rr(-r,r)*.5,cy+rr(-r,r)*.5,rr(0,3),r*1.2,r*.9,c);};
 const OC='#b07a3a',RD='#8a2a1e',CK='#bab2a2';
 poly(217,3.5,1.45,1.25,14,OC,.11);for(const s of[-1,1]){blob(217+s*.5,3.8,.13,RD);st(217+s*1.4,4.1,217+s*3.4,5.0,OC);st(217+s*3.4,5.0,217+s*3.1,3.2,OC);st(217+s*3.1,3.2,217+s*1.5,3.35,OC);st(217+s*3.3,4.6,217+s*2.2,3.5,OC,.05);}
 for(let i=0;i<6;i++){let x=215.9+i*.45,y=2.4;for(let k=0;k<4;k++){const nx=x+sin(i+k*1.7)*.25,ny=y-.42;st(x,y,nx,ny,OC,.075);x=nx;y=ny;}}
 const man=(x,y,fish,c)=>{poly(x,y+.62,.1,.1,6,c,.045);st(x,y+.52,x,y+.2,c,.055);st(x,y+.2,x-.13,y,c,.05);st(x,y+.2,x+.12,y,c,.05);st(x-.17,y+.32,x+.16,y+.47,c,.05);if(fish)st(x-.1,y+.66,x+.2,y+.6,RD,.065);};
 for(let i=0;i<7;i++)man(211.4+i*.55+rr(-.05,.05),.45+rr(-.05,.05),i>3,i>3?RD:CK);for(let i=0;i<5;i++)man(219.6+i*.55+rr(-.05,.05),.45+rr(-.05,.05),i<3,i<3?RD:CK);
 for(let i=0;i<3;i++){let x=210.9;const y=2.25-i*.14;for(let k=0;k<7;k++){st(x,y,x+.4,y+.12*(k%2?-1:1),'#5a7a8a',.055);x+=.4;}}
 for(let i=0;i<7;i++){const hx=211.6+(i%3)*.32+rr(-.06,.06),hy=4.2+floor(i/3)*.34;blob(hx,hy,.09,RD);for(let f=0;f<4;f++)st(hx-.06+f*.04,hy+.06,hx-.08+f*.05,hy+.18,RD,.025);}
 for(let k=0;k<22;k++){const a=k*.55,r=.08+k*.035;st(222.2+cos(a)*r,4.1+sin(a)*r,222.2+cos(a+.55)*(r+.035),4.1+sin(a+.55)*(r+.035),OC,.055);}
 LAMPS.push(...CAVE_T.map(([x,z])=>[x+(x<217?.6:x>217?-.6:0),2.6,z+(z<-16?.6:0),6.5,[1,.6,.28]]),[217,1.4,-12.6,4,[1,.75,.4]]);}
// the cave mouth in the hills north-east of the village (an old quarry): rocks around a black opening, a stone lintel above
{const lime=['#8a8a80','#7c7d74','#9a988c','#6e7068'],gr=['#4f6b34','#5d7a3c','#46602e'];
 // the hillside: tilted limestone slabs stacked back into the slope, grass on the brow
 for(let i=0;i<14;i++){const x=37+i*1.95+rr(-.3,.3),cx=abs(x-50),h=cx<3?0:4.2+rr(-.6,.9)-cx*.04,z=-47.4-rr(0,.6);
   if(cx>=2.6)IG.at(mM(mT(x,0,z),mRx(-.16+rr(-.05,.05)),mRz(rr(-.08,.08)),mRy(rr(-.15,.15))),()=>IG.bx(0,0,0,2.3,h,1.8+rr(0,.6),H(lime[i%4])));}
 for(let i=0;i<7;i++){const x=40+i*3.4+rr(-.4,.4);IG.at(mM(mT(x,4.1+rr(0,.5),-48.6),mRx(-.3),mRz(rr(-.12,.12))),()=>IG.bx(0,0,0,3.6,1.4,3.2,H(lime[(i+1)%4])));
   IG.at(mM(mT(x,5.3+rr(0,.4),-49.4),mRx(-.22),mRz(rr(-.1,.1))),()=>IG.bx(0,0,0,3.9,.45,3.6,H(gr[i%3])));}
 IG.at(mM(mT(50,6,-52),mRx(-.15)),()=>IG.bx(0,0,0,30,1.2,6,H(gr[0])));
 // the mouth: a rough arch of angled blocks (no curves) round a dark passage that fades into black
 for(let i=0;i<=8;i++){const a=PI*i/8,x=50+cos(a)*2.15,y=1.7+sin(a)*1.9;IG.at(mM(mT(x,y-.5,-46.6),mRz(a-PI/2),mRx(rr(-.08,.08))),()=>IG.bx(0,0,0,1.25,1,1.6,H(lime[i%4])));}
 for(const sx of[-1,1])IG.at(mM(mT(50+sx*2.35,0,-46.6),mRz(sx*.05)),()=>IG.bx(0,0,0,1.1,1.8,1.6,H(lime[sx>0?2:1])));
 for(let k=0;k<5;k++){const z=-47.6-k*.9,c=['#2c2c28','#211f1c','#171614','#0e0d0c','#070606'][k],w=3.6-k*.25,hh=3.3-k*.22;
   IG.bx(50-w/2-.2,0,z,.4,hh,.95,H(c));IG.bx(50+w/2+.2,0,z,.4,hh,.95,H(c));IG.bx(50,hh,z,w+.8,.4,.95,H(c));IG.bx(50,0,z,w+.4,.04,.95,H(c));}
 IG.bx(50,0,-52.2,4,3.6,.2,H('#030303'));
 // a worn sandy path up to it, a few fallen stones and grass at the foot of the slope
 for(let i=0;i<6;i++)IG.at(mM(mT(50+sin(i*.7)*.4,.015,-45.4+i*1.3),mRy(rr(-.15,.15))),()=>IG.bx(0,0,0,2.4-i*.08,.03,1.4,H(['#b8ad94','#a89e86'][i%2])));
 for(let i=0;i<10;i++){const x=40+rr(0,20);if(abs(x-50)<2.8)continue;IG.at(mM(mT(x,0,-45.8+rr(-.4,.6)),mRy(rr(0,3)),mRz(rr(-.3,.3))),()=>IG.bx(0,0,0,rr(.3,.7),rr(.25,.5),rr(.3,.6),H(lime[i%4])));}
 for(let i=0;i<16;i++){const x=38+rr(0,24);if(abs(x-50)<1.8)continue;IG.at(mM(mT(x,0,-45.6+rr(-.6,1)),mRy(rr(0,3)),mRz(rr(-.25,.25))),()=>IG.bx(0,0,0,.08,rr(.3,.6),.5,H(gr[i%3])));}
 for(const[x,z,ry]of[[44.4,-40.6,.3],[55.8,-39.8,1.1],[57.4,-41.8,.5]]){IG.at(mM(mT(x,0,z),mRy(ry)),()=>{IG.bx(0,0,0,1.6,.8,1,H('#6f7775'));IG.bx(.2,.8,0,1.2,.6,.9,H('#666e6c'));});iCol(x-.9,z-.6,x+.9,z+.6,1.4);}
 col(36,-49,48.3,-45.2,5);col(51.7,-49,64,-45.2,5);col(48.4,-47.2,51.6,-46.2,3);}

// ---------------------------------------------------------------- the upstairs: documents, the safe, Father Paul
const DOC2=[
 {x:261.6,z:-15.4,label:'Прочесть бумаги на столе',t:'Записи о «М-8»',b:'<i>«М-7 открывает окно, но не держит его. Чужая кровь отторгает перемену: объекты 30–32 — остановка сердца.<br><br>Нужен второй компонент. Не из аптеки. Кровь, что смотрела в Его глаза. Моя кровь.<br><br>Он говорит: „Двое“. Я не понимаю. Двое — чего?»</i>',
  note:'Записи Бернсона о «М-8»: сыворотке не хватает второго компонента — «крови, что смотрела в Его глаза». Его собственной.'},
 {x:259.4,z:-20,label:'Прочесть письмо, заложенное в книгу',t:'Письмо от отца Мэттью',b:'<i>«Эд,<br>двери моей церкви открыты для тебя в любой час — ты знаешь, ключ от засова только у меня. Приходи, когда голоса снова станут невыносимы. Здесь тихо. Здесь Он говорит с тобой тише — ты сам так сказал.<br><br>И держись подальше от Пола. Он улыбается тебе на улице, но я видел, как он смотрит тебе в спину.<br>— М.»</i>',
  note:'Письмо отца Мэттью: доктор прячется в новой церкви, засов открывает только Мэттью. Отец Пол ненавидит Бернсона.'},
 {x:262.6,z:-23.1,label:'Осмотреть газетную вырезку в рамке',t:'«Вестник Грейхейвена», август 1898',b:'<b>ЧУДЕСНОЕ СПАСЕНИЕ</b><br><i>«Двенадцатилетний Эдмунд Бернсон, сын рыбака, упал за борт в открытом море и пробыл под водой не менее четверти часа. Вытащенный сетью, мальчик открыл глаза и заговорил на языке, которого никто из рыбаков не знал. Отец Пол, отслуживший благодарственную службу, назвал случившееся „знаком“».</i><br><br>Поверх заметки чернилами, рукой доктора: <i>«Пол так и не простил мне, что знак был дан не ему».</i>',
  note:'Вырезка 1898 года: спасение маленького Эдмунда. «Пол так и не простил мне, что знак был дан не ему».'}];
for(const e of DOC2)addInter(e.x,e.z,1.5,e.label,()=>{if(!e.seen){e.seen=1;S.noteCb=()=>{addNote(e.note);upObj();};}openNote(e.t,e.b);},()=>S.inside==='doc2'&&!S.paul);
const upObj=()=>{const n=DOC2.filter(e=>e.seen).length;setObj('Осмотрите второй этаж дома доктора: бумаги — '+n+' / 3, спальня.'+(n>=2?'<br><span style="font-size:15px">В спальне, за портретом, — сейф в стене.</span>':''));if(n>=2)S.mark=[266.4,-23.2,'doc2'];};
addInter(271.4,-29.4,1.4,'Подняться на второй этаж',()=>stairs(true),()=>S.inside==='doc'&&S.escaped&&!A3.ph);
addInter(277.8,-12.2,1.3,'Спуститься по лестнице',()=>stairs(false),()=>S.inside==='doc2'&&(S.paul||!S.paulScene));
async function stairs(up){S.mode='talk';SFX.creak();await fade(1,320);S.inside=up?'doc2':'doc';if(up){P.x=276.4;P.z=-12.4;P.rot=-PI/2;}else{P.x=271;P.z=-30;P.rot=PI;}CAM.pitch=0;camSnap();await fade(0,420);S.mode='play';
  if(up&&!S.up){S.up=true;S.mode='talk';await say(HERO,'(шёпотом) Библиотека… Полки до потолка. И спальня — дверь нараспашку. Он и правда жил одной работой.',VO.hero);upObj();S.mode='play';}}
addInter(266.4,-23.1,1.5,'Осмотреть сейф в стене',()=>safeKO(),()=>S.inside==='doc2'&&!S.paulScene);
async function safeKO(){S.paulScene=true;S.mode='talk';S.mark=null;lookAt(266.4,1.35,-23.9);
  await say(HERO,'Сейф — прямо в стене, за его портретом. Заперт, конечно. Что ты здесь прячешь, Эдмунд? Вторую порцию своей отравы?',VO.hero);
  SFX.creak();await wait(.6);await say(HERO,'…Кто здесь?!',VO.hero);P.rot+=2.4;CAM.pitch=-.1;await wait(.45);
  SFX.swing();await wait(.3);SFX.thud();S.shake=1;$('flash').style.opacity=1;await wait(.3);lids(false,250);await wait(.5);
  $('fade').style.transitionDuration='300ms';$('fade').style.opacity=1;$('flash').style.opacity=0;noise(2.5,{f:200,vol:.25,att:1,delay:.4});await wait(3);
  // wakes tied to the chair in the middle of the room; Father Paul in front of him
  P.x=269;P.z=-16.95;P.rot=0;S.seated=true;Object.assign(PAUL,{show:true,x:269.3,z:-14.6,rot:PI,walk:null});lookAt(PAUL.x,1.6,PAUL.z);camSnap();
  $('fade').style.transitionDuration='1600ms';$('fade').style.opacity=0;lids(true,1400);cv.style.filter='blur(4px)';await wait(1.6);cv.style.transition='filter 2.5s';cv.style.filter='';
  const p=VO.paul,h=VO.hero;
  await say('Отец Пол','Очнулся? Не дёргайся. Морские узлы — единственное, чему меня научил этот город.',p);
  await say(HERO,'Кто вы такой?.. Голова… Что вам от меня нужно?',h);
  await say('Отец Пол','Отец Пол. Когда-то — просто «отец Пол», и по воскресеньям в моей часовне не хватало скамеек. Теперь я тот, о ком все забыли.',p);
  await say('Отец Пол','Тридцать лет назад мальчишка Бернсон четверть часа пролежал на дне — и вышел оттуда избранным. Самим Ктулху избранным, как они шепчут.',p);
  await say('Отец Пол','Я служу Спящему дольше, чем ты живёшь на свете. Я вёл обряды. Я разжигал костры на пирсе. Но избранный — он. Не я.',p);
  await say('Отец Пол','А потом у рынка выстроили новую церковь — белую, с витражами. Добрый отец Мэттью… И город забыл старую часовню. Обо мне помнят только братья в робах.',p);
  await say(HERO,'Мне нет дела до ваших обид. Развяжите меня.',h);
  await say('Отец Пол','Есть дело, мистер Крейн. Бернсон прав в одном: Грейхейвен должен стать народом Спящего. Рыбьим народом. Это главное дело культа.',p);
  await say('Отец Пол','Но заслугу получит не он. Я. И я не стану одним из них — останусь человеком. С иммунитетом. Тем, кому послушны все… изменённые.',p);
  await say('Отец Пол','Для этого мне нужна его сыворотка — законченная. Ты найдёшь Бернсона и вытащишь её из него.',p);
  await say(HERO,'Вы шутите? Ваш культ прочёсывает улицы. Меня схватят, стоит мне высунуть нос за дверь.',h);
  await say('Отец Пол','Бернсон дружит со вторым священником города — отцом Мэттью. Когда видения становятся невыносимы, Эд прячется в его новой церкви. Туда не входит никто, кроме самого Мэттью.',p);
  await say('Отец Пол','А чтобы братья тебя не тронули — вот. *бросает к ногам свёрток* Роба и маска. В них ты один из нас. Никто и не посмотрит.',p);SFX.thud();
  await say(HERO,'А сами? Сходили бы к своему Мэттью и спросили.',h);
  await say('Отец Пол','*кашляет* Я старик, мистер Крейн. Колени не держат, руки трясутся. И… скажем так, я не люблю рисковать. Для этого теперь есть ты.',p);
  await say(HERO,'А если я просто уйду? Пешком через лес — и поминай как звали.',h);
  await say('Отец Пол','*тихо смеётся* Не уйдёшь. Знаешь, что вколол тебе Бернсон? Не «окно». Яд. Смертельный. Неделя, может, меньше — и ты захлебнёшься собственной кровью.',p);
  S.shake=.3;await say('Отец Пол','Противоядие знает только он. Так что найти доктора — теперь и твоя забота, не только моя.',p);
  await say(HERO,'(про себя) Яд… Руки дрожат, в висках стучит… Похоже, старик не врёт.',h);
  PAUL.walk=[269.1,-16.2];await wait(1.1);SFX.swing();await say('Отец Пол','*перерезает верёвки* Ступай. И да хранит тебя Спящий… пока ты мне нужен.',p);
  PAUL.walk=[277.6,-11.6];S.seated=false;S.paul=true;await wait(.6);lookAt(277.6,1.4,-11.6);await wait(2.6);SFX.creak();PAUL.show=false;await wait(.6);
  await say(HERO,'Ушёл. Роба, маска… Пахнут морем и воском. Отвратительно — но если это мой пропуск…',h);
  wearRobe();S.cp=[-110,-33.2];S.cpRoom=null;
  setObj('Доберитесь до новой церкви отца Мэттью — белое здание напротив рыночной улицы.<br><span style="font-size:15px">В робе и маске культисты принимают вас за своего.</span>');S.mark=[-87,-11,null];S.mode='play';
  toast('<b>Вы в робе культиста.</b> Братья в робах не обращают на вас внимания.',6);}
function wearRobe(){S.robe=true;S.disguise=true;SFX.page();$('mask').style.display='block';}
function tearRobe(){S.disguise=false;S.robeTorn=true;$('mask').style.display='none';}
// FP arms in the robe
let HROBE=null;function heroRobe(){if(!HROBE){const h=CH.hero,pal={cloth:H('#4d1d22'),cuff:H('#32131a'),skin:H('#c9a183')};HROBE=Object.assign({},h,{arm:{up:segM('robe_up',pal),lo:segM('robe_lo',pal)}});}return HROBE;}

// ---------------------------------------------------------------- hallucinations
const HL={on:false,t:0,lvl:0,pos:[0,0,0],yaw:0,fires:[],M:null};
const HLINES=[null,
 [['Шёпот','…ты… видишь… это… грядёт…'],[HERO,'(задыхаясь) Опять… Огонь. Всё горит — прямо здесь, вокруг меня…'],['Шёпот','…кровь… что я дал… ему… теперь… в тебе…'],[HERO,'Это не по-настоящему. Не по-настоящему…']],
 [['Шёпот','…он… больше… не слышит… меня…'],[HERO,'Снова Ты?! Убирайся из моей головы!'],['Шёпот','…ты… услышишь… ты… придёшь…']],
 [['Шёпот','…ближе… ещё… ближе…'],[HERO,'(хватается за камень) Земля уходит из-под ног… Он там, внутри. Он ждёт.'],['Шёпот','…двое… одна… кровь… разбудите… меня…']],
 [['Шёпот','…не… убивай… его…'],['Шёпот','…он… нужен… мне… приведи… его… ко мне…'],[HERO,'Хватит… ХВАТИТ!']]];
async function halluc(lvl){if(HL.on)return;const wasPlay=S.mode==='play';S.mode='talk';HL.on=true;HL.t=0;HL.lvl=lvl;S.halluc=lvl;S.hallN=(S.hallN||0)+1;
  const fx=sin(P.rot),fz=cos(P.rot);
  if(S.inside==='cave'){HL.pos=[217,-22,-58];HL.yaw=0;}else{const D=60-lvl*6;HL.pos=[P.x+fx*D,-17+lvl*1.5,P.z+fz*D];HL.yaw=P.rot;}
  HL.fires=[];for(let i=0;i<12+lvl*5;i++){const a=rnd()*6.28,r=2.6+rnd()*(S.inside?7:15);HL.fires.push([P.x+cos(a)*r,P.z+sin(a)*r,.7+rnd()*1.2+lvl*.15,rnd()*6]);}
  const eye=[P.x,S.crouch?1.08:1.62,P.z],fwd=[P.x+fx*10,1.7,P.z+fz*10];
  S.camFn=()=>{const k=kf(HL.t,.5,2.6),face=HL.M?mP(HL.M.head,[0,7.7,-9]):fwd;CAM.ge=eye;CAM.gt=vLerp(fwd,face,k*(1-kf(HL.t,HL.end-.6,HL.end)));CAM.fov=1.05+sin(HL.t*2.3)*.05*lvl;};CAM.rate=2.6;
  $('flash').style.opacity=.7;SFX.roar(4+lvl,1.3-lvl*.08);noise(2.5,{f:500,vol:.25+lvl*.06,to:150});S.shake=.4+lvl*.15;HL.end=99;
  await wait(1.6);$('flash').style.opacity=0;whisper();
  for(const[w,t]of HLINES[lvl]){if(w==='Шёпот')whisper();await say(w,t,w===HERO?VO.hero:VO.wh);}
  await wait(.8+lvl*.3);HL.end=HL.t+1.4;SFX.roar(2.5,1.6);await wait(1.4);
  $('fade').style.transitionDuration='120ms';$('fade').style.opacity=1;await wait(.25);
  HL.on=false;S.halluc=0;S.camFn=null;S.dizzy=5+lvl*2.5;S.dizzyLvl=lvl;camSnap();$('fade').style.transitionDuration='700ms';$('fade').style.opacity=0;
  if(wasPlay)S.mode='play';}
function hallTick(dt){if(HL.on){HL.t+=dt;const l=HL.lvl,t=HL.t;S.shake=max(S.shake,.1+l*.06);
    CAM.roll=sin(t*1.7)*.05*l+sin(t*4.3)*.012*l;
    let f='blur('+(l*.5+.4*sin(t*3)).toFixed(2)+'px) saturate('+(1.05+l*.05)+') contrast('+(1+l*.04)+') hue-rotate('+(sin(t*.9)*l*4).toFixed(1)+'deg)';
    if(l>=3&&Math.random()<.02*l)f+=' invert(1)';cv.style.filter=f;
    if(Math.random()<.25)PT.add(5,P.x+rr(-6,6),rr(.2,2),P.z+rr(-6,6),rr(-1,1),1.5+Math.random()*2,rr(-1,1),.08+Math.random()*.08,1.6,[1,.5+Math.random()*.3,.15,.9],-.5);
    if(Math.random()<.04)tone(400+Math.random()*500,.6,{type:'sawtooth',vol:.04,to:250,lp:1800});return;}
  if(S.dizzy>0){S.dizzy-=dt;const k=min(1,S.dizzy/4),l=S.dizzyLvl||1;CAM.roll=sin(S.t*1.3)*.04*l*k;cv.style.filter=S.dizzy>0?'blur('+(k*l*.35).toFixed(2)+'px) saturate('+(1+k*.3)+')':'';if(S.dizzy<=0)CAM.roll=0;}
  else if(!S.drug&&!SAC.on&&!RL.on&&CAM.roll){CAM.roll=0;}}
function drawHalluc(){if(!HL.on)return;const t=S.t,l=HL.lvl;
  const sp=FIN.pose,sm=FIN.M,hl=FIN.headLook;const pose=cthPose(24);Object.assign(pose,{x:HL.pos[0],y:HL.pos[1]+(1-kf(HL.t,0,2.5))*-14,z:HL.pos[2],sc:1.5+l*.12,yaw:HL.yaw,track:1,eyes:1});
  FIN.headLook=[P.x,1.6,P.z];FIN.pose=pose;FIN.M=cthMats(pose);HL.M=FIN.M;drawCthulhu();FIN.pose=sp;FIN.M=sm;FIN.headLook=hl;
  const near=HL.fires.map(f=>[hypot(f[0]-P.x,f[1]-P.z),f]).sort((a,b)=>a[0]-b[0]);
  for(const[d,[x,z,s,ph]]of near)bigFire(x,0,z,s,ph,t,false);
  for(let i=0;i<2&&i<near.length;i++){const f=near[i][1];fireLight(f[0],1.6,f[1],10+f[2]*2,f[3],t);}
  if(Math.random()<.12*l)SFX.crackle(.6+l*.2);
  if(!S.inside)HOUSES.forEach((b,i)=>{const cx=(b[0]+b[2])/2,cz=(b[1]+b[3])/2,d=hypot(cx-P.x,cz-P.z);if(d>70)return;const o=b[4],y=(o.h||3.2)+(o.rh||2.2)*.6;
    bigFire(cx,y-1,cz,2.2,i*1.7,t,d>25&&d<60);});}

// ---------------------------------------------------------------- the new church
async function churchDoor(){S.mode='talk';lookAt(-87,1.4,-12);
  if(!S.knock){S.knock=true;SFX.door();await wait(.4);await say(HERO,'Заперто. Попробую отмычки…',VO.hero);SFX.click();await wait(.5);SFX.click();await wait(.5);
    await say(HERO,'Бесполезно. Изнутри задвинут засов — отмычкой его не поднять.',VO.hero);SFX.door();await wait(.6);
    await say('Голос за дверью','*глухо* Церковь закрыта. Для всех. До конца комендантского часа я никого не впускаю. Ступайте с Богом.',{pitch:104,vol:.24,dur:4});
    await say(HERO,'(про себя) Засов… Значит, через окно. Сбоку, в проулке со стороны дома доктора — там темно. Нужен камень. И чтобы рядом никого не было.',VO.hero);
    setObj('Найдите камень и разбейте окно церкви в тёмном проулке слева от неё — когда рядом не будет культистов.<br><span style="font-size:15px">Куча гравия — у рыночной улицы, к западу от церкви.</span>');S.mark=[-116.2,-11.2,null];}
  else await say(HERO,'Засов. Только окно.',VO.hero);S.mode='play';}
addInter(-87,-11.05,1.5,'Войти в церковь',()=>churchDoor(),()=>!S.inside&&S.robe&&!S.winBroken);
addInter(-116.2,-11.2,1.6,'Подобрать камень из кучи гравия',()=>{S.rock=true;SFX.pick();S.mark=[-96.4,-18.2,null];toast('Камень в кармане. Окно — в тёмном проулке слева от церкви.',4);},()=>S.knock&&!S.rock&&!S.inside&&!S.winBroken);
addInter(-96.4,-18.2,1.7,'Бросить камень в окно церкви',()=>throwRock(),()=>S.rock&&!S.winBroken&&!S.inside);
async function throwRock(){const near=EN.find(e=>e.active&&e.kind!=='f'&&e.state!=='ko'&&hypot(e.x-P.x,e.z-P.z)<15&&los(e.x,e.z,P.x,P.z,false));
  if(near){toast('Рядом культист — увидит или услышит. <b>Дождитесь, пока он отойдёт.</b>',3);return;}
  S.mode='talk';S.mark=null;lookAt(-94,2.2,-18.2);await wait(.3);SFX.swing();await wait(.35);glassBreak();debris(-94.3,1.9,-18.2,14,'glass',{vx:-.7,sp:1.4,vy:1,sz:.14});S.winBroken=true;S.shake=.2;await wait(.8);
  await say(HERO,'(шёпотом) Тихо… Никто не видел. Теперь — внутрь.',VO.hero);
  await fade(1,500);noise(.5,{f:2600,type:'highpass',vol:.12});await wait(.3);noise(.3,{f:900,vol:.2});tearRobe();S.inside='church';P.x=208.4;P.z=-32.2;P.rot=PI/2;CAM.pitch=0;camSnap();await fade(0,600);
  setObj('Поговорите с отцом Мэттью.');S.cp=[-96.4,-18.2];
  await say(HERO,'Чёрт! Роба зацепилась за осколки и разошлась по швам. Маска — вдребезги. Теперь я снова просто чужак с камерой.',VO.hero);
  toast('<b>Маскировки больше нет.</b> На улице культисты снова узнают вас — бегите и прячьтесь.',6);
  churchScene();}
async function churchScene(){S.mode='talk';Object.assign(MATT,{show:true,x:214,z:-43.6,rot:0});walkPath(MATT,[[214,-32.4],[210.6,-32.4]]);MATT.sp=1.9;   // down the aisle, then between the pews
  murmur();await wait(.6);lookAt(214,1.5,-38);await wait(1.2);
  const m=VO.matt,h=VO.hero;
  await say('Отец Мэттью','Кто здесь?! Через окно?! Это дом Божий! Вам сюда нельзя — никому нельзя, слышите?!',m);lookAt(MATT.x,1.6,MATT.z);
  while(walking(MATT))await wait(.1);MATT.rot=atan2(P.x-MATT.x,P.z-MATT.z);lookAt(MATT.x,1.6,MATT.z);
  await say('Отец Мэттью','Роба… Вы из них?! Убирайтесь! Здесь женщины и дети!',m);
  await say(HERO,'Нет! Роба — маскировка. Я Эдвард Крейн, журналист. Отец Мэттью, прошу, выслушайте меня.',h);
  await say('Отец Мэттью','Мне нечего вам сказать. Уходите тем же путём, каким пришли.',m);
  await say(HERO,'Доктору Бернсону грозит беда. Отец Пол хочет до него добраться — его люди уже ищут доктора по всему городу.',h);
  await say('Отец Мэттью','*бледнеет* Пол… Этот старый стервятник так и не простил Эду… Откуда вы знаете?',m);
  await say(HERO,'Пол сам мне сказал. Он думает, что я на его стороне. Если я найду доктора раньше — успею его предупредить. Где он?',h);
  await say('Отец Мэттью','*долгая пауза* …Сегодня он не приходил. Значит, он в пещере — у северного обрыва, за старой каменоломней. Он ходит туда говорить с Ним.',m);
  await say('Отец Мэттью','Когда видения становятся совсем невыносимы. Или когда ему нужен совет — как довести до конца эту проклятую сыворотку.',m);
  await say('Отец Мэттью','А сегодня он прибегал сюда — белый как полотно. Твердил, что видения какого-то приезжего «не сходятся». Что Он показал не то, что обещал. Ушёл спросить Его — почему.',m);
  await say('Отец Мэттью','*оглядывается на прихожан и отводит вас к стене* Мистер Крейн. Одно слово — наедине.',m);walkPath(MATT,[[213.9,-32.4],[213.9,-35.6],[208.6,-35.6]]);await wait(.6);P.x=208.6;P.z=-34;lookAt(MATT.x,1.6,MATT.z);while(walking(MATT)){lookAt(MATT.x,1.6,MATT.z);await wait(.1);}lookAt(MATT.x,1.6,MATT.z);
  await say('Отец Мэттью','Не причиняйте ему зла. Эдмунд делает эту сыворотку не по своей воле. Каждый раз, когда он противится приказу, видений становится больше, а боль — невыносимей.',m);
  await say('Отец Мэттью','Он не безумный доктор. Он пытается спасти своих людей единственным способом, который ему оставили. Он бедный человек, которого пытает древний бог.',m);
  await say(HERO,'Этот «бедный человек» вколол мне яд, святой отец. Смертельный.',h);
  S.shake=.15;await say('Отец Мэттью','*отшатывается и смотрит на вас широко раскрытыми глазами* Что?.. Нет… Эд не мог… *крестится* Господи, помилуй.',m);
  await say('Отец Мэттью','…И всё же. Я вас прошу. Пощадите его.',m);
  await say('Отец Мэттью','Выходите через дверь — я задвину засов за вами. И да хранит вас Господь… если Он ещё слышит этот город.',m);
  walkPath(MATT,[[213.9,-35.6],[213.9,-28]]);S.church=true;S.toCave=true;S.cp=[-87,-9.4];S.cpRoom=null;
  setObj('Доберитесь до пещеры у северного обрыва — за старой каменоломней, на северо-востоке.<br><span style="font-size:15px">Маскировки больше нет: культисты узнают вас. Бегите и прячьтесь.</span>');S.mark=[214,-26.6,'church'];S.mode='play';}
function murmur(){for(let i=0;i<5;i++)mumble(1.4,150+i*30,false,.06,true);}
addInter(214,-26.7,1.3,'Выйти через дверь',async()=>{MATT.show=false;S.mark=[50,-43,null];await leaveRoom(XD.church);SFX.door();toast('За спиной лязгнул засов.',2.5);},()=>S.inside==='church'&&S.church);

// ---------------------------------------------------------------- the cave
addInter(50,-43.05,1.8,'Войти в пещеру',()=>enterCave(),()=>!S.inside&&S.toCave&&!S.inCave);
async function enterCave(){if(chased()){toast('Не сейчас — за вами гонятся!',2);return;}S.inCave=true;S.mark=null;S.cp=[50,-41.6];S.cpRoom=null;
  S.mode='talk';SFX.door();await fade(1,600);S.inside='cave';P.x=217;P.z=9.6;P.rot=PI;CAM.pitch=0;Object.assign(AD,{show:true,x:217,z:-10.8,rot:PI,walk:null,pose:'pray'});camSnap();await fade(0,900);
  chantLoop(true);await say(HERO,'(шёпотом) Факелы… рисунки на стенах… И он. На коленях, посреди пещеры.',VO.hero);
  setObj('Поговорите с доктором Бернсоном.');S.mark=[217,-9.4,'cave'];S.mode='play';}
let CHANT=0;function chantLoop(on){CHANT=on?1:0;}
addInter(217,-9.2,1.8,'Подойти к доктору',()=>caveTalk(),()=>S.inside==='cave'&&!S.caveTalk);
async function caveTalk(){S.caveTalk=true;S.mode='talk';S.mark=null;chantLoop(false);P.x=217;P.z=-8.4;lookAt(217,1,-10.8);const d=VO.doc,h=VO.hero;
  await say(HERO,'Доктор Бернсон.',h);
  await say('Доктор Бернсон','*не оборачиваясь* …Вы. Опять вы. Он молчит, мистер Крейн. Впервые за тридцать лет — молчит.',d);
  AD.pose='stand';AD.rot=0;await wait(.8);lookAt(AD.x,1.62,AD.z);
  await say(HERO,'Доктор, послушайте. Я вам не враг. Мне нужна ваша помощь — а вам, похоже, моя. Закончите сыворотку.',h);
  await say(HERO,'То, что вы мне показали… город горел, Эдмунд. Может быть, Он показал, что будет. Может быть, ещё не поздно всё изменить.',h);
  await say('Доктор Бернсон','Вы лжец, мистер Крейн. Обманщик. Всё, что вы говорите, — клевета!',d);S.shake=.2;
  await say('Доктор Бернсон','Он не мог… Тридцать лет! Тридцать лет я делал эту сыворотку не впустую. НЕ ВПУСТУЮ!',{pitch:110,vol:.3,dur:3});
  await say(HERO,'(сквозь зубы) Хватит. Пол говорит, ваша отрава убьёт меня через неделю. Может, через день. У меня нет времени на ваши истерики.',h);
  await halluc(4);S.mode='talk';lookAt(AD.x,1.62,AD.z);
  await say(HERO,'(хрипло) Слушайте меня внимательно. Либо вы идёте со мной в лабораторию и заканчиваете то, что начали…',h);
  await say(HERO,'…либо я сделаю так, что этот город похоронит вас раньше, чем проснётся ваш бог. Клянусь.',{pitch:118,dur:4});
  await say('Доктор Бернсон','*долгая пауза* …Хорошо. ХОРОШО! Я пойду с вами. Только уберите руки.',d);
  await say('Доктор Бернсон','*шёпотом, оглядываясь на вход* Но Пол не должен узнать. Главный компонент сыворотки — моя кровь. Он наделил её чем-то… чего нет ни у кого.',d);
  await say('Доктор Бернсон','Ни у кого — кроме вас. Тогда, в кабинете, я вколол вам не сыворотку. Чистую вытяжку — ту самую силу, в предельной концентрации. Теперь она течёт в ваших жилах.',d);
  await say('Доктор Бернсон','Чтобы довести сыворотку, нужно погрузиться в мир кошмаров. В руины Р\'льеха. В самом их конце — Он, на троне. Его нужно пробудить, дойдя до Него.',d);
  await say('Доктор Бернсон','Один я ни разу не дошёл: город рушится и выбрасывает меня обратно. Но двое, связанные одной кровью… Двое продержатся достаточно долго.',d);
  await say(HERO,'Вы хотите, чтобы я пошёл туда? В ваш кошмар?',h);
  await say('Доктор Бернсон','В наш, мистер Крейн. Теперь — в наш. Дайте руку.',d);
  // the cut palms, the handshake, the spell
  await cutPalms();
  await say('Доктор Бернсон','*сжимает вашу окровавленную ладонь своей* Закройте глаза. И что бы вы ни увидели — идите к Нему. Не останавливайтесь.',d);
  lids(false,1400);await wait(1.6);S.fpPose=null;Object.assign(AD,{aR:null,aRz:0,cR:null,cL:null,eR:null});for(const p of[58,66,74])mumble(3.2,p,false,.1,true);
  await say('Доктор Бернсон','Пх\'нглуи мглв\'нафх Ктулху Р\'льех вгах\'нагл фхтагн… Пх\'нглуи мглв\'нафх Ктулху Р\'льех…',{pitch:84,vol:.26,dur:5});
  SFX.roar(5,.8);await wait(1.4);rlStart(true);}

// the knife: he cuts the hero's palm, then his own, and they shake the bleeding hands — all seen from the hero's eyes
const M_knife=(()=>{const g=new Geo(.01);g.bx(0,-.013,-.02,.02,.026,.1,H('#3a2a1a'));g.bx(0,-.004,.035,.024,.014,.012,H('#8a8478',.1));g.bx(0,-.009,.1,.005,.018,.13,H('#c8ccce',.25));return mesh(g);})();
const bleed=(p,n=6)=>{for(let i=0;i<n;i++)PT.add(1,p[0]+rr(-.03,.03),p[1],p[2]+rr(-.03,.03),rr(-.3,.3),rr(-.2,.4),rr(-.3,.3),.025+Math.random()*.02,.9,[.45,.03,.02,.95],1);};
async function tween(o,key,to,t){const a=o[key]??0,n=max(1,Math.round(t/.035));for(let i=1;i<=n;i++){o[key]=lerp(a,to,eas(i/n));await wait(.035);}}
async function cutPalms(){const h=VO.hero;AD.walk=[217,-9.45];await wait(.9);AD.walk=null;AD.rot=0;P.x=217;P.z=-8.4;lookAt(217,1.12,-9.45);
  S.fpPose='palm';AD.knife=true;await tween(AD,'aR',-1.15,.6);await wait(.5);
  // across the hero's palm
  AD.aRz=-.45;await tween(AD,'aRz',.4,.28);SFX.swing();noise(.18,{f:3200,type:'highpass',vol:.18});S.shake=.12;$('flash').style.opacity=.35;bleed(S.fpHand||[P.x,1.2,P.z-.5],10);
  await wait(.25);$('flash').style.opacity=0;await say(HERO,'Ш-ш… Аккуратно, чёрт возьми.',h);
  // across his own left palm
  await tween(AD,'aL',-1.2,.4);AD.cL=.05;await wait(.3);AD.aR=-1.05;AD.aRz=.5;await tween(AD,'aRz',-.35,.3);SFX.swing();noise(.15,{f:3000,type:'highpass',vol:.12});
  {const fx=sin(AD.rot),fz=cos(AD.rot);bleed([AD.x+fx*.45+fz*.12,1.05,AD.z+fz*.45-fx*.12],10);}await wait(.6);
  // the knife away, the handshake
  AD.knife=false;await Promise.all([tween(AD,'aL',0,.4),tween(AD,'aRz',.1,.4),tween(AD,'aR',-1.3,.6)]);AD.eR=.12;AD.cR=.95;AD.walk=[217.1,-9.32];S.fpPose='shake';await wait(.8);AD.walk=null;S.shake=.08;bleed(S.fpHand||[P.x,1.2,P.z-.5],8);}
// ---------------------------------------------------------------- R'lyeh: the dream walk to the throne
const RL={on:false,t:0,max:100,fall:[],lp:[800,0],M:null,fly:0,eyes:1,said:0};
const RRECT=[[797,-6,803,46],[797,40,815,48],[809,42,815,92],[795,86,815,94],[795,88,801,142],[795,136,807,144],[801,138,807,172],[782,166,818,200]];
const inRL=(x,z)=>RRECT.some(r=>x>r[0]+.4&&x<r[2]-.4&&z>r[1]+.4&&z<r[3]-.4);
const RG=new Geo(.05);let M_rl=null,M_rblk=null;
function buildRlyeh(){if(M_rl)return;const rv=a=>rr(-a,a),ST=['#1c2e28','#223630','#18282a','#26392f'],GL='#5fd6a0';
  RG.bx(800,-1,100,160,1,280,H('#0e1a18'));
  for(const r of RRECT){const cx=(r[0]+r[2])/2,cz=(r[1]+r[3])/2;RG.bx(cx,-.02,cz,r[2]-r[0],.08,r[3]-r[1],H('#2c3f38'));
    for(let x=r[0]+1;x<r[2];x+=2.2)for(let z=r[1]+1;z<r[3];z+=2.2)if((x*7+z*3)%5<1.2)RG.bx(x,.04,z,.9,.02,.12,H(GL,.6));}
  const ok=(x,z,m)=>!RRECT.some(r=>x>r[0]-m&&x<r[2]+m&&z>r[1]-m&&z<r[3]+m);
  let n=0,tries=0;while(n<90&&tries<3000){tries++;const x=rr(765,835),z=rr(-10,215),w=rr(3,9),d=rr(3,8),h=rr(10,42);if(!ok(x,z,max(w,d)*.7+1))continue;n++;
    RG.at(mM(mT(x,0,z),mRy(rr(0,6.28)),mRz(rv(.35)),mRx(rv(.3))),()=>{RG.bx(0,-2,0,w,h,d,H(ST[n%4]));if(n%2)RG.bx(0,h-2,0,w*1.3,1.2,d*1.3,H(ST[(n+1)%4]));
      for(let k=0;k<5;k++)RG.bx(rv(w/2)*.8,rr(1,h-3),d/2+.03,rr(.3,1.2),rr(.3,1.8),.05,H(GL,.75));});}
  // arches straddling the causeway, tilted
  for(const[x,z,ry]of[[800,18,0],[812,66,0],[798,112,0],[804,156,0],[805,90,PI/2]])RG.at(mM(mT(x,0,z),mRy(ry),mRz(.12),mRx(-.08)),()=>{for(const s of[-1,1])RG.bx(s*5.2,0,0,1.6,13,1.8,H('#20332c'));RG.bx(0,12,0,13,2.2,2.2,H('#1a2c26'));for(let k=0;k<6;k++)RG.bx(-4+k*1.6,12.6,1.12,.5,.9,.05,H(GL,.8));});
  // the throne: a stepped dais, the seat block, a back rising into the dark
  RG.bx(800,0,214,44,4,30,H('#1a2a26'));RG.bx(800,4,216,34,6,24,H('#203430'));RG.bx(800,10,218,26,3,18,H('#24382f'));RG.bx(800,13,228,28,60,8,H('#162420'));for(const sx of[-1,1])RG.bx(800+sx*25.5,10,206,7,12,22,H('#1e302a'));
  for(let k=0;k<14;k++)RG.bx(788+k*1.8,rr(16,60),223.9,.8,rr(2,6),.05,H(GL,.8));
  for(let i=0;i<6;i++)RG.bx(784+i*6.4,0,196.6+((i%2)*1.2),4.4,.5+i%3*.3,1.4,H('#2a3c36'));
  M_rl=mesh(RG);const g=new Geo(.06);g.bx(0,-.5,0,1,1,1,H('#22362e'));g.bx(0,.2,.51,.4,.3,.02,H(GL,.7));M_rblk=mesh(g);}
async function rlStart(first){buildRlyeh();$('fade').style.transitionDuration='200ms';$('fade').style.opacity=1;await wait(.3);lids(true,1200);
  Object.assign(RL,{on:true,t:0,fall:[],lp:[800,0],fly:0,eyes:1,said:0});S.inside='rlyeh';P.x=800;P.z=0;P.rot=0;CAM.pitch=.08;S.crouch=false;S.hp=100;
  Object.assign(AD,{show:true,x:801.6,z:-1.6,rot:0,walk:null,pose:'walk'});AD.sp=4.4;camSnap();
  $('fade').style.transitionDuration='1600ms';$('fade').style.opacity=0;SFX.rumble(4);await wait(1.2);
  if(first){await say(HERO,'Где… Это не пещера. Камень… зелёный, мокрый. Углы — все неправильные. Смотреть больно.',VO.hero);
    await say('Доктор Бернсон','Р\'льех. Его город. Видите свет впереди? Там — трон. Идите к нему и не останавливайтесь: город чувствует чужих и выталкивает их.',VO.doc);}
  else await say('Доктор Бернсон','Ещё раз! Мы были ближе, чем я когда-либо. Бегите — я за вами!',VO.doc);
  setObj('Дойдите до трона Спящего, пока город не рухнул.');S.mode='play';}
function rlPlay(dt){if(!RL.on)return;RL.t+=dt;const k=RL.t/RL.max;
  if(!inRL(P.x,P.z)){P.x=RL.lp[0];P.z=RL.lp[1];}RL.lp=[P.x,P.z];
  S.shake=max(S.shake,k*k*.45);if(Math.random()<dt*(.4+k*5)){const a=rnd()*6.28;RL.fall.push({x:P.x+rr(-16,16),y:30+rnd()*20,z:P.z+rr(-4,34),vy:0,s:1.2+rnd()*3*(.5+k),rx:rnd()*3,rz:rnd()*3,land:0});if(RL.fall.length>60)RL.fall.shift();}
  // falling blocks tumble, bounce once or twice, break off chips and dust, then sink into the shifting city
  for(const f of RL.fall){if(f.land>1){f.y-=dt*.25;continue;}if(f.wx==null){f.wx=rr(-1.2,1.2);f.wz=rr(-1.2,1.2);f.vx=rr(-1.5,1.5);f.vz=rr(-1.5,1.5);}
    f.vy-=20*dt;f.y+=f.vy*dt;f.x+=f.vx*dt;f.z+=f.vz*dt;f.rx+=f.wx*dt;f.rz+=f.wz*dt;
    if(f.y<=f.s/2&&f.vy<0){f.y=f.s/2;const d=hypot(f.x-P.x,f.z-P.z),v=-f.vy;f.land++;
      if(d<30){S.shake=max(S.shake,.6*(1-d/30)*(f.land===1?1:.4)+.05);SFX.stone(clamp((1-d/30)*(f.land===1?1:.45),.05,1));}
      debris(f.x,.3,f.z,f.land===1?5+floor(f.s*2):2,'stone',{sp:1.8+f.s*.5,vy:3+f.s,sz:.16+f.s*.05});dust(f.x,0,f.z,f.land===1?8:3,.6+f.s*.3,[.1,.2,.16,.35]);
      if(f.land===1){f.vy=v*.28;f.vx*=.5;f.vz*=.5;f.wx*=-.6;f.wz*=-.6;}else{f.vy=0;f.vx=f.vz=0;f.rx=Math.round(f.rx/(PI/2))*PI/2;f.rz=Math.round(f.rz/(PI/2))*PI/2;f.land=2;}}}
  if(Math.random()<dt*.25)whisper();
  const lines=[[4,'Доктор Бернсон','Не оглядывайтесь! Позади город уже исчезает.'],[28,'Доктор Бернсон','Слышите? Он дышит. Мы близко.'],[55,'Доктор Бернсон','Быстрее, Крейн! Нас выталкивает!'],[80,'Доктор Бернсон','Держитесь! Ещё немного!']];
  if(RL.said<lines.length&&RL.t>lines[RL.said][0]&&!sub){const l=lines[RL.said++];say(l[1],l[2],VO.doc);}
  if(P.z>176)rlWin();else if(RL.t>=RL.max)rlFail();}
function rlTick(dt){if(!RL.on)return;
  if(AD.show){const d=hypot(P.x-AD.x,P.z-AD.z);if(S.mode==='play'&&d>2.6){AD.walk=[P.x-sin(P.rot)*1.4+cos(P.rot)*1.2,P.z-cos(P.rot)*1.4-sin(P.rot)*1.2];AD.sp=max(4,d*1.6);}else if(S.mode==='play')AD.walk=null;npcStep(AD,dt);if(!AD.mv)AD.rot=atan2(P.x-AD.x,P.z-AD.z);}
  if(RL.fly>0)RL.fly+=dt;
  const k=RL.t/RL.max;if(!S.halluc&&!S.dizzy&&!SAC.on){CAM.roll=sin(S.t*.7)*.02*(1+k*3);cv.style.filter=k>.05?'saturate('+(1-k*.5).toFixed(2)+') contrast('+(1+k*.25).toFixed(2)+') blur('+(k*k*1.2).toFixed(2)+'px)':'';}}
function rlAtmo(M){const k=RL.on?RL.t/RL.max:0,br=.5+.5*sin(S.t*1.1);R.fog=[.012+k*.04,.045-k*.01+br*.008,.04-k*.01+br*.006];R.fogD=1/lerp(190,80,k);R.fogMin=0;R.fogH=.05;R.amb=[.3,.46,.4];R.sunC=[.16,.38,.3];M.den=.22+k*.5;M.top=4.2;M.col=[.07+k*.05,.2+br*.05,.16+br*.04];M.maxD=90;}
async function rlFail(){if(!RL.on)return;RL.on=false;S.mode='talk';S.shake=1.2;SFX.roar(3,1.5);$('white').style.transitionDuration='900ms';$('white').style.opacity=1;await wait(1.1);
  await say(HERO,'Нет… Всё рушится… меня выбрасывает!',VO.hero);
  S.inside='cave';P.x=217;P.z=-8.4;Object.assign(AD,{x:217,z:-10.6,rot:0,pose:'stand'});lookAt(217,1.62,-10.6);camSnap();cv.style.filter='';CAM.roll=0;
  $('white').style.transitionDuration='1400ms';$('white').style.opacity=0;await wait(1.4);
  await say('Доктор Бернсон','*задыхаясь* Выбросило… Как всегда. Но вы видели — мы прошли дальше, чем я один! Снова, Крейн. Закрывайте глаза.',VO.doc);
  lids(false,900);await wait(1.2);rlStart(false);}
async function rlWin(){if(!RL.on||RL.fly)return;S.mode='talk';RL.fly=.001;const eye0=[P.x,1.62,P.z];AD.walk=null;
  const eyes=()=>RL.M?mP(RL.M.head,[0,7.7,-8.4]):[800,44,212],front=()=>RL.M?mP(RL.M.head,[0,7.7,-21]):[800,44,196];
  S.camFn=()=>{const k=eas(min(1,RL.fly/7));CAM.ge=vLerp(eye0,front(),k);CAM.gt=vLerp([eye0[0],eye0[1]+6,eye0[2]+20],eyes(),min(1,RL.fly/2));CAM.fov=lerp(1.05,.8,k);};CAM.rate=4;
  await say('Доктор Бернсон','Вот Он… Не останавливайтесь! К Нему — к Его лицу!',VO.doc);SFX.rumble(9);SFX.roar(6,.7);
  await wait(2.2);whisper();await say('Шёпот','…наконец… вы… пришли… оба…',VO.wh);
  $('white').style.transitionDuration='5000ms';$('white').style.opacity=1;S.shake=.6;await wait(5.2);SFX.roar(3,1.8);await wait(1);
  // back in the cave
  RL.on=false;S.camFn=null;S.inside='cave';P.x=217;P.z=-8.4;CAM.fov=.72;Object.assign(AD,{x:217.9,z:-9.6,rot:-.8,pose:'lie'});lookAt(217,.6,-10.4);P.lie=true;camSnap();cv.style.filter='';CAM.roll=0;
  lids(false,10);$('white').style.transitionDuration='1500ms';$('white').style.opacity=0;await wait(1.6);lids(true,1300);await wait(1.4);
  await say(HERO,'(хрипло) Пещера… Холодный пол. Ладонь вся в крови.',VO.hero);
  AD.pose='stand';await wait(.6);
  await say('Доктор Бернсон','Вы видели?.. Он открыл глаза. Он… посмотрел на нас.',VO.doc);
  await say(HERO,'Я видел только свет. Один только свет.',VO.hero);
  await say('Доктор Бернсон','Значит — получилось. Да поможет нам Бог, мистер Крейн… Получилось.',VO.doc);
  await wait(.6);act3Start();}
function drawRlyeh(){if(S.inside!=='rlyeh'||!M_rl)return;draw(M_rl,null,.05);const k=RL.t/RL.max;
  const sp=FIN.pose,sm=FIN.M,hl=FIN.headLook;const pose=cthPose(26);Object.assign(pose,{x:800,y:15,z:214,sc:.95,yaw:0,sit:1,track:RL.fly?1:.6,eyes:RL.fly?1+kf(RL.fly,1.5,8)*7:1,hand:[[-27,1+sin(S.t*.6)*.6,-15],[27,1+sin(S.t*.6+1)*.6,-15]],curl:[.55,.6]});   // hands on the armrests
  FIN.headLook=RL.fly?CAM.eye.slice():[P.x,1.6,P.z];FIN.pose=pose;FIN.M=cthMats(pose);RL.M=FIN.M;drawCthulhu();FIN.pose=sp;FIN.M=sm;FIN.headLook=hl;
  for(const f of RL.fall)draw(M_rblk,mM(mT(f.x,f.y,f.z),mRx(f.rx),mRz(f.rz),mS(f.s,f.s,f.s)),.04);
  rlGlow(k,S.t);light(800,6,P.z+12,22,[.3,.9,.6]);if(RL.fly)light(800,40,205,60*(1+RL.fly),[1,.9,.8]);
  if(Math.random()<.02+k*.06){R.flash=max(R.flash,.25+k*.3);}}

// ---------------------------------------------------------------- per-frame hooks, drawing, HUD, debug
function act2Tick(dt){npcStep(PAUL,dt);npcStep(MATT,dt);if(!RL.on&&S.inside==='cave')npcStep(AD,dt);hallTick(dt);rlTick(dt);
  if(CHANT&&Math.random()<dt*.5)for(const p of[66,74])mumble(1.8,p,false,.05,true);
  $('mask').style.display=S.disguise&&S.fpPlay&&!HL.on?'block':'none';}
function act2Play(dt){rlPlay(dt);if(S.inside||HL.on)return;
  if(S.robe&&!S.h1&&S.disguise&&hypot(P.x+87,P.z+12)<19&&hypot(P.x+110,P.z+35)>9){S.h1=true;halluc(1);}
  else if(S.church&&!S.h2&&P.x>-34){S.h2=true;halluc(2);}
  else if(S.toCave&&!S.h3&&hypot(P.x-50,P.z+44)<11){S.h3=true;halluc(3);}}
function drawAct2(){const t=S.t;
  if(S.inside==='doc2'&&PAUL.show)drawChar(CHF.paul,PAUL.x,0,PAUL.z,PAUL.rot,{ph:PAUL.ph,mv:PAUL.mv,aL:-.35,aR:PAUL.mv?null:-.6+sin(t*1.1)*.1});
  if(S.inside==='church'){for(const c of CHU){const ch=c.k==='w'?CHF.wom[c.v]:c.k==='k'?CHF.kid[c.v]:CH.v[c.v];if(!ch)continue;const o={ph:c.ph};
      if(c.pose==='sit'){o.sit=1;o.aR=-.7;o.aL=-.75;}else if(c.pose==='pray'){o.crouch=1;o.aR=o.aL=-1.6;o.cR=o.cL=.9;o.look=-.4;}drawChar(ch,c.x,0,c.z,c.rot,o);}
    if(MATT.show)drawChar(CHF.matt,MATT.x,0,MATT.z,MATT.rot,{ph:MATT.ph,mv:MATT.mv});}
  if(S.inside==='cave'||S.inside==='rlyeh'){if(AD.show){const o={ph:AD.ph,mv:AD.mv,aR:AD.aR,eR:AD.eR,aL:AD.aL,aRz:AD.aRz,aLz:AD.aLz,cL:AD.cL,cR:AD.cR,armed:!!AD.knife,wpn:M_knife};if(AD.pose==='pray'){o.crouch=1;o.aR=-2.2+sin(t*1.3)*.15;o.aL=-2.25+sin(t*1.3+.4)*.15;o.cR=o.cL=.1;o.look=-.5;}else if(AD.pose==='lie')o.lie=true;
      drawChar(CHF.doc,AD.x,0,AD.z,AD.rot,o);}}
  if(S.inside==='cave')for(const[x,z]of CAVE_T){const tx=x+(x<217?.42:x>217?-.42:0),tz=z+(z<-20?.42:0),k=1+sin(t*15+x)*.12;draw(M_flame,mM(mT(tx,2.38,tz),mRy(t*3+z),mS(.7*k,.9*k,.7*k)),0);if(Math.random()<.15)PT.add(5,tx,2.6,tz,rr(-.3,.3),1.2,rr(-.3,.3),.04,1,[1,.6,.2,.9],-.3);}
  if(!S.inside&&S.winBroken)draw(M_brk,null,0);
  drawHalluc();drawRlyeh();}
const M_brk=(()=>{const g=new Geo(0);g.bx(-94.12,1.2,-18.2,.05,2.6,1,H('#040506'));for(let i=0;i<6;i++){const y=1.25+i*.42,s=i%2?-1:1;g.quad([-94.2,y,-18.7],[-94.2,y+.25,-18.7],[-94.2,y+.12,-18.7+.18+(i%3)*.08],[-94.2,y,-18.7],H('#a8c0c4',.15));g.quad([-94.2,y+.1,-17.7],[-94.2,y+.35,-17.7],[-94.2,y+.2,-17.7-.2-(i%2)*.08],[-94.2,y+.1,-17.7],H('#a8c0c4',.15));}return mesh(g);})();
function act2Hud(c,w,h){if(!RL.on||RL.fly||S.mode!=='play')return;const k=1-RL.t/RL.max,bw=min(320,w*.5),x=w/2-bw/2,y=58;
  c.fillStyle='rgba(8,16,14,.75)';c.fillRect(x-4,y-4,bw+8,22);c.fillStyle=k>.35?'#5fd6a0':'#ff6a4a';c.fillRect(x,y,bw*k,14);c.font='15px Georgia';c.fillStyle='#d9cdb0';c.textAlign='center';c.fillText('Р\'льех держится',w/2,y+34);}
function act2Skip(st){S.inside=null;S.mark=null;
  if(st==='upstairs'){S.inside='doc2';P.x=276.4;P.z=-12.4;P.rot=-PI/2;S.up=true;upObj();}
  else{S.up=true;S.paulScene=S.paul=true;DOC2.forEach(e=>e.seen=1);wearRobe();
    if(st==='paul'){P.x=-110;P.z=-33;P.rot=0;setObj('Доберитесь до новой церкви отца Мэттью — белое здание напротив рыночной улицы.');S.mark=[-87,-11,null];}
    else if(st==='church'){S.h1=true;P.x=-89;P.z=-8;P.rot=PI;S.knock=false;setObj('Войдите в новую церковь.');}
    else{S.h1=S.knock=S.rock=S.winBroken=true;tearRobe();
      if(st==='churchin'){S.inside='church';P.x=208.4;P.z=-32.2;P.rot=PI/2;churchScene();}
      else{S.church=S.toCave=true;S.h2=true;S.cp=[-87,-9.4];
        if(st==='cave'){P.x=47;P.z=-36;P.rot=PI;setObj('Доберитесь до пещеры у северного обрыва.');S.mark=[50,-43,null];}
        else{S.h3=S.inCave=S.caveTalk=true;S.inside='cave';P.x=217;P.z=-8.4;Object.assign(AD,{show:true,x:217,z:-10.6});rlStart(false);}}}}}
