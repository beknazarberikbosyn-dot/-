// ================= WORLD =================
const cols=[];const LAMPS=[];
const W=new Geo(.09),GR=new Geo(.13),SEA=new Geo(.2);
const col=(x0,z0,x1,z1,h=3)=>{const c={x0,z0,x1,z1,h};cols.push(c);return c;};
const PAL={wall:['#8a8271','#7d8a86','#93856a','#75807a'],roof:['#4b3a36','#3a4450','#54463a','#3f4a48'],wood:H('#6b4f36'),woodD:H('#4a3626'),stone:H('#6f7775'),dark:H('#131c1e'),
  lit:H('#e2a94a',.95),unlit:H('#1b2b30'),pine:['#24493c','#1f4034','#2b5244'],trunk:H('#4a3a2c')};
function house(x0,z0,x1,z1,o={}){const h=o.h||3.2,wc=H(o.wall||PAL.wall[floor(rnd()*4)]),rc=H(o.roof||PAL.roof[floor(rnd()*4)]),cx=(x0+x1)/2,cz=(z0+z1)/2;
  W.bx(cx,0,cz,x1-x0,h,z1-z0,wc);W.bx(cx,0,cz,x1-x0+.15,.45,z1-z0+.15,PAL.stone);W.prism(x0,z0,x1,z1,h,o.rh||2.2,rc);
  const dx=o.door==null?cx:o.door;W.bx(dx,0,z1+.04,1,2,.1,PAL.woodD);W.bx(dx,2,z1+.05,1.25,.14,.14,PAL.wood);
  for(const wx of[x0+1.5,x1-1.5]){if(abs(wx-dx)<1.3)continue;W.bx(wx,1.3,z1+.03,1.05,1.05,.08,PAL.wood);W.bx(wx,1.38,z1+.06,.8,.85,.08,rnd()<(o.lit??.4)?PAL.lit:PAL.unlit);}
  if(!o.noCh)W.bx(x0+1.2,h+.6,cz-.5,.6,1.8,.6,PAL.stone);
  col(x0,z0,x1,z1,8);}
function tree(x,z,s=1,c=true){const pc=H(PAL.pine[floor(rnd()*3)]);W.cyl(x,0,z,.22*s,.16*s,1.4*s,5,PAL.trunk);for(let i=0;i<3;i++)W.cyl(x,(1.1+i*1.25)*s,z,(1.7-i*.42)*s,0,1.9*s,6,pc);if(c)col(x-.3,z-.3,x+.3,z+.3,6);}
function crate(x,z,s=1.1,ry=0){W.at(mM(mT(x,0,z),mRy(ry)),()=>{W.bx(0,0,0,s,s,s,PAL.wood);W.bx(0,s*.45,0,s+.06,.1,s+.06,PAL.woodD);});col(x-s/2,z-s/2,x+s/2,z+s/2,1.1);}
function barrel(x,z){W.cyl(x,0,z,.42,.42,1.1,7,H('#5d4630'));W.cyl(x,.35,z,.45,.45,.08,7,PAL.dark);W.cyl(x,.8,z,.45,.45,.08,7,PAL.dark);col(x-.4,z-.4,x+.4,z+.4,1.1);}
function boat(x,z,ry,cl='#5a4a3a'){W.at(mM(mT(x,0,z),mRy(ry)),()=>{W.bx(0,.1,0,1.5,.7,3.4,H(cl));W.bx(0,.55,0,1.15,.3,3,PAL.woodD);W.cyl(0,.1,1.7,.75,0,.7,4,H(cl));W.bx(0,.7,-.4,1.5,.08,.3,PAL.wood);});const r=abs(sin(ry))>.7;col(x-(r?2:.8),z-(r?.8:2),x+(r?2:.8),z+(r?.8:2),1.1);}
function fence(x0,z0,x1,z1){const n=max(1,Math.round(hypot(x1-x0,z1-z0)/2));for(let i=0;i<=n;i++){const x=lerp(x0,x1,i/n),z=lerp(z0,z1,i/n);W.bx(x,0,z,.14,1.3,.14,PAL.woodD);}
  const horiz=abs(x1-x0)>abs(z1-z0);for(const y of[.5,1])W.box((x0+x1)/2,y,(z0+z1)/2,horiz?abs(x1-x0):.07,.1,horiz?.07:abs(z1-z0),PAL.wood);col(min(x0,x1)-.1,min(z0,z1)-.1,max(x0,x1)+.1,max(z0,z1)+.1,1.2);}
function lamp(x,z){W.cyl(x,0,z,.09,.07,3.1,5,PAL.dark);W.bx(x,3.05,z,.46,.5,.46,H('#f6cf70',1));W.bx(x,3.56,z,.56,.07,.56,PAL.dark);LAMPS.push([x,3,z,12,[1,.72,.36]]);col(x-.12,z-.12,x+.12,z+.12,1);}
function grave(x,z){if(rnd()<.6){W.bx(x,0,z,.62,.95,.16,PAL.stone);}else{W.bx(x,0,z,.14,1.2,.14,PAL.stone);W.bx(x,.75,z,.6,.14,.14,PAL.stone);}W.bx(x,0,z+.8,.7,.12,1.3,H('#2a3a30'));col(x-.3,z-.1,x+.3,z+.1,.9);}

// --- ground
function gcol(x,z){
  if(abs(x+28)<2.6&&z<-6)return'#544c44';if(abs(z+8)<2.6&&x>-30.6&&x<61)return'#544c44';if(abs(x-10)<2.6&&z>-8&&z<47)return'#544c44';if(abs(z-42)<2.6&&x>-30&&x<42)return'#5b554e';
  if(x>-50&&x<-30.5&&z>-24&&z<-12)return'#4a4744';if(z>44.5)return'#7d7458';if(x>38&&x<58&&z>-3&&z<14)return'#33402f';
  return z<-48?'#26402f':'#2d4a37';}
for(let x=-100;x<92;x+=2)for(let z=-48;z<47;z+=2){const c=H(gcol(x+1,z+1));GR.quad([x,0,z],[x,0,z+2],[x+2,0,z+2],[x+2,0,z],c);}
for(let x=-100;x<44;x+=4)for(let z=-320;z<-48;z+=4){const c=H(abs(x+2+28)<2.6?'#544c44':'#26402f');GR.quad([x,0,z],[x,0,z+4],[x+4,0,z+4],[x+4,0,z],c);}
for(let x=-260;x<280;x+=14)for(let z=47;z<380;z+=14){SEA.quad([x,0,z],[x,0,z+14],[x+14,0,z+14],[x+14,0,z],H('#14353a'));}
W.bx(0,-.7,47.2,190,.75,.5,H('#3a3a34'));

// --- forest along the road (cutscene) and around the map
for(let z=-318;z<-50;z+=3.2){for(const s of[-1,1]){for(let k=0;k<3;k++){const x=-28+s*(5+k*5.5+rr(0,3.5));tree(x,z+rr(-1.2,1.2),rr(.9,1.6),false);}}}
const NOTREE=[[-74,-47,-29,-9],[-33,-60,-23,0],[-34,-12,64,-4],[6,-12,14,48],[-32,38,44,48],[36,-5,60,16],[42,28,58,40],[-10,-27,8,-10],[18,-30,34,-10],[10,-20,16,-12]];
const BLD=[];
function B(x0,z0,x1,z1,o){BLD.push([x0,z0,x1,z1]);house(x0,z0,x1,z1,o);}
// --- village houses
B(-22,-22,-12,-13,{});B(-5,-23,6,-13,{wall:'#8f8468',roof:'#4b3a36',lit:1});
B(-24,-3,-14,6,{});B(-8,-3,3,5,{});B(16,-3,27,5,{});B(-8,12,3,20,{});B(16,12,27,20,{});B(-24,12,-14,18,{});
B(-24,24,-9,36,{wall:'#5d5346',roof:'#35302c',h:4,rh:2.6,lit:0,noCh:1});B(18,24,28,31,{});
B(15,34,21,39,{wall:'#6f6a5a',roof:'#3a4450',h:2.8,rh:1.6,lit:0,noCh:1});
// chapel
BLD.push([20,-28,32,-13]);house(20,-28,32,-13,{wall:'#6c7472',roof:'#2f3a3c',h:4.6,rh:3.6,lit:0,noCh:1,door:26});
W.bx(22,0,-15,3.4,8.5,3.4,H('#667070'));W.cyl(22,8.5,-15,2.4,0,4.2,4,H('#2f3a3c'));W.bx(22,6.3,-13.25,1,1.5,.1,H('#6fe0b0',.9));
W.bx(29.5,1.5,-12.95,1,1.9,.1,H('#57c79a',.8));LAMPS.push([26,2.5,-11,9,[.3,.75,.55]]);
// lighthouse
W.cyl(50,0,34,3,2.5,5,10,H('#b9b4a4'));W.cyl(50,5,34,2.5,2.2,4,10,H('#8c3a32'));W.cyl(50,9,34,2.2,1.9,4,10,H('#b9b4a4'));W.cyl(50,13,34,2.7,2.7,.3,10,PAL.dark);W.cyl(50,13.3,34,1.4,1.4,1.7,8,H('#f3e6a0',1));W.cyl(50,15,34,2,0,1.6,8,H('#8c3a32'));
W.bx(46.95,0,34,.12,2,1,PAL.woodD);col(47,31,53,37,16);BLD.push([47,31,53,37]);LAMPS.push([50,14,34,30,[.75,.72,.5]]);
// cemetery
fence(38,-3,58,-3);fence(58,-3,58,14);fence(38,14,58,14);fence(38,-3,38,3.6);fence(38,6.6,38,14);
for(let gx=41;gx<57;gx+=3.2)for(let gz=-.5;gz<12;gz+=4){if(abs(gx-48)<2.4&&abs(gz-5)<3.2)continue;grave(gx+rr(-.3,.3),gz+rr(-.3,.3));}
W.bx(48,0,5,1.6,.5,1.6,PAL.stone);W.cyl(48,.5,5,.55,.3,3.4,4,H('#59625f'));W.cyl(48,3.9,5,.3,0,.6,4,H('#59625f'));col(47.2,4.2,48.8,5.8,4);
// well, market, props
W.cyl(13,0,-16,1.1,1.1,.85,8,PAL.stone);W.cyl(13,.5,-16,.8,.8,.3,8,H('#0c1a1e'));W.bx(12,0,-16,.14,2.3,.14,PAL.woodD);W.bx(14,0,-16,.14,2.3,.14,PAL.woodD);W.prism(11.9,-16.6,14.1,-15.4,2.3,.7,H('#4b3a36'),.2);col(12,-17,14,-15,2);
[[-16,-10.9],[-9.5,-11.5,1.3],[15.5,-5.2],[4.6,-5.3],[-12,-5.1,1.2],[33.5,-10.8],[36,-5.2],[7,8],[13.2,14,1.2],[6.8,24],[13.3,30],[-3,9],[30,10],[33,18,1.3],[-28,10],[-30,26],[-6,38.6],[-4.8,38.6,.9],[2,39],[24,39.2],[32,38.7,1.2],[40,24],[36,30],[-18,20.5],[-36,-9],[-44,-10.5,1.2],[-66,-24],[-33,-36]].forEach(c=>crate(c[0],c[1],c[2]||1.1,rr(-.2,.2)));
[[-15,-10.9],[14.6,-5.3],[5.5,-11.2],[34.5,-11],[6.9,9.2],[13.3,15.3],[6.8,25.2],[13.2,31.2],[-2,9.2],[31.2,10],[-28,11.2],[-30,27.2],[3.2,39],[25.2,39.3],[41,25],[-8,-11],[22,9],[-12,21],[-45.3,-10.6],[-66,-25.2],[-52,-42],[-33,-37.2],[44,20],[28,-5]].forEach(c=>barrel(c[0],c[1]));
boat(-14,45.4,PI/2);boat(-3,45.6,PI/2+.1,'#4f5a56');boat(25,45.5,PI/2);boat(34,45.3,PI/2-.15,'#3d3a36');boat(-24,45.5,.1,'#5a4033');
// net racks on the quay
for(const nx of[-20,-12,27.5,36]){W.bx(nx-1.6,0,39,.12,2,.12,PAL.woodD);W.bx(nx+1.6,0,39,.12,2,.12,PAL.woodD);W.bx(nx,1.2,39,3.2,1.5,.05,H('#48564e'));col(nx-1.7,38.9,nx+1.7,39.1,2);}
fence(-30,-3.5,-26,-3.5);fence(-8,7,-8,11);fence(27,8,34,8);fence(-24,20.5,-20,20.5);fence(3.2,22,6,22);fence(14,22,16,22);fence(30,34,40,34);
[[-25.6,-11],[7,-11.2],[13.2,22],[13.4,40.2],[35,-5],[-4,39.3],[40,39.5]].forEach(l=>lamp(l[0],l[1]));
// --- puzzle & easter-egg props
W.bx(3,0,-12.4,1.7,.9,.7,PAL.wood);W.at(mM(mT(3,1.2,-12.55),mRx(-.35)),()=>W.box(0,0,0,.75,.62,.08,H('#9a8a68')));col(2.1,-12.8,3.9,-12,1);
W.cyl(26,1.05,-12.86,.34,.34,.5,8,H('#b08d3c',.25));
W.bx(46.2,0,35.4,.5,1.05,.5,PAL.woodD);W.bx(46.2,1.05,35.4,.6,.08,.5,H('#d9cdb0',.3));col(45.95,35.15,46.45,35.65,1);
for(let i=0;i<5;i++){const a=i/5*2*PI;W.bx(48+cos(a)*.62,1.3+i%2*.5,5+sin(a)*.62,.14,.14,.14,H('#7fffe0',.9));}
W.bx(-8.6,0,30,.6,1,2.8,PAL.stone);for(let i=0;i<4;i++){W.cyl(-8.6,1,29+i*.66,.16,.1,.42,5,H('#5c8a6a',.25));W.sph(-8.6,1.5,29+i*.66,.13,.13,.13,H('#5c8a6a',.25),5,3);}col(-8.9,28.6,-8.3,31.4,1.1);
W.bx(14.95,0,36.5,.1,1.9,.9,PAL.woodD);W.bx(14.7,0,35.2,.55,.8,.55,H('#3a4448'));W.cyl(14.42,.4,35.2,.1,.1,.06,6,H('#b08d3c',.3));col(14.4,34.9,15,35.5,1);
W.bx(-6.6,0,-11.8,.1,1.1,.1,PAL.dark);W.bx(-6.6,1.1,-11.8,.3,.24,.46,H('#7a3a30'));
W.bx(14.8,0,-14.4,.1,1.9,.1,PAL.woodD);W.bx(16.4,0,-14.4,.1,1.9,.1,PAL.woodD);W.bx(15.6,1,-14.4,1.7,.9,.07,PAL.wood);W.bx(15.4,1.3,-14.34,.4,.5,.03,H('#e8dfc4',.35));W.bx(16,1.4,-14.34,.3,.3,.03,H('#d8cfa4',.3));col(14.7,-14.5,16.5,-14.3,1.9);
W.cyl(17.5,1.2,5.14,.1,.07,.3,5,H('#5c9a72',.5));W.sph(17.5,1.58,5.14,.09,.09,.09,H('#5c9a72',.5),5,3);
W.at(mM(mT(34,0,43.6),mRy(.5),mRz(.5)),()=>{W.bx(0,.2,0,.12,2.6,.12,PAL.woodD);});
// --- pier & ritual platform
W.bx(10,-.25,57.5,6,.3,21,H('#5c4a38'));W.bx(10,-.25,75,16,.3,14,H('#5c4a38'));
for(let z=49;z<82;z+=4)for(const x of z<68?[7.3,12.7]:[2.4,17.6]){W.cyl(x,-2,z,.22,.22,2.6,5,PAL.woodD);}
for(let z=48;z<68;z+=1.5)W.bx(10,.05,z,6,.03,.08,PAL.woodD);
W.bx(10,0,76,1.4,1,2.8,H('#555e5c'));W.bx(10,1,76,1.7,.16,3.1,H('#3c4543'));
for(const[bx,bz]of[[3.2,69.2],[16.8,69.2],[3.2,80.8],[16.8,80.8]]){W.cyl(bx,0,bz,.25,.2,1.6,5,PAL.stone);W.cyl(bx,1.6,bz,.4,.3,.3,5,PAL.dark);W.cyl(bx,1.9,bz,.25,0,.6,5,H('#ff8a2a',1));}
W.bx(10,0,48.6,6,2,.15,PAL.woodD);W.bx(10,.9,48.7,5.6,.12,.1,PAL.dark);const pierGate=col(7,48.3,13,48.9,2.2);
for(const r of[[-300,47,7,400],[13,47,300,68],[-300,68,2,400],[18,68,300,400],[2,82,18,400]])col(r[0],r[1],r[2],r[3],0);
// world bounds
col(-300,-400,-71.5,400,0);col(63.5,-400,300,400,0);col(-300,-400,300,-47.5,0);

// --- MOTEL (roofless, Sims-style cutaway)
const MW=H('#8b7f6a'),MW2=H('#7b705e');
function wall(x0,z0,x1,z1,h=2.7,c=MW){W.bx((x0+x1)/2,0,(z0+z1)/2,max(.3,x1-x0),h,max(.3,z1-z0),c);W.bx((x0+x1)/2,h,(z0+z1)/2,max(.36,x1-x0+.06),.08,max(.36,z1-z0+.06),PAL.woodD);col(min(x0,x1)-.15,min(z0,z1)-.15,max(x0,x1)+.15,max(z0,z1)+.15,3);}
W.bx(-51,0,-32,22,.04,12,H('#6a553c'));
for(let x=-61;x<-40;x+=2)W.bx(x,.045,-32,.05,.01,12,PAL.woodD);
wall(-62,-38,-59.2,-38);wall(-57.8,-38,-40,-38);W.bx(-58.5,0,-38,1.4,.9,.3,MW);W.bx(-58.5,2.1,-38,1.4,.6,.3,MW);W.bx(-58.5,1.5,-38,1.3,1.1,.06,H('#243a40',.25));col(-59.3,-38.15,-57.7,-37.85,3);
wall(-62,-38,-62,-26);wall(-40,-38,-40,-26);
wall(-62,-26,-44.7,-26,1,MW2);wall(-43.3,-26,-40,-26,1,MW2);
wall(-62,-29,-59.1,-29,1,MW2);wall(-57.9,-29,-52.1,-29,1,MW2);wall(-50.9,-29,-48,-29,1,MW2);
W.bx(-51.5,0,-29,1.2,1.9,.12,PAL.woodD);col(-52.1,-29.15,-50.9,-28.85,3);
wall(-55,-38,-55,-29);wall(-48,-38,-48,-29);
W.bx(-54.83,1.35,-34,.06,.22,.22,H('#05090a'));W.bx(-55.17,1.35,-34,.06,.22,.22,H('#05090a'));
// furniture
W.bx(-43.5,0,-33,5,1.05,.9,PAL.wood);W.bx(-43.5,1.05,-33,5.2,.08,1.1,PAL.woodD);col(-46,-33.5,-41,-32.5,1.1);
W.bx(-41,0,-37.3,1.4,2.2,.5,PAL.woodD);for(let i=0;i<6;i++)W.bx(-41.5+(i%3)*.5,1+floor(i/3)*.5,-37,.12,.25,.05,H('#c9a23a',.5));
W.bx(-60.4,0,-35.6,2,.55,3.6,H('#5a6a6a'));W.bx(-60.4,.55,-36.9,1.6,.2,.8,H('#b9b4a4'));W.bx(-60.4,0,-37.5,2.1,1.1,.14,PAL.woodD);col(-61.5,-37.5,-59.3,-33.8,1);
W.bx(-56.2,0,-30.2,1.2,.8,1,PAL.wood);col(-56.8,-30.7,-55.6,-29.7,1);W.bx(-56.2,.8,-30.2,.5,.1,.36,H('#3a1f1f'));
W.bx(-49.5,0,-36,2,.55,3.4,H('#6a5a5a'));col(-50.6,-37.7,-48.4,-34.3,1);W.bx(-53.8,0,-37,1,.8,1,PAL.wood);col(-54.3,-37.5,-53.3,-36.5,1);
LAMPS.push([-44,2.4,-31,10,[1,.7,.4]],[-58.5,2.4,-33,7.5,[.9,.62,.36]],[-51.5,2.4,-34,6,[.8,.5,.3]]);
// motel sign
W.cyl(-36,0,-25.5,.1,.1,3.6,5,PAL.dark);W.bx(-36,3.1,-25.5,2.6,1,.16,H('#263238'));W.bx(-36,3.1,-25.4,2.3,.7,.06,H('#e0503a',.9));LAMPS.push([-36,3,-24.6,9,[.9,.3,.22]]);col(-36.15,-25.65,-35.85,-25.35,1);
BLD.push([-63,-39,-39,-25]);

// scattered trees (avoid roads, buildings)
{let n=0,tries=0;while(n<95&&tries<3000){tries++;const x=rr(-70,62),z=rr(-46,45);let ok=true;for(const r of NOTREE)if(x>r[0]&&x<r[2]&&z>r[1]&&z<r[3])ok=false;for(const b of BLD)if(x>b[0]-2.2&&x<b[2]+2.2&&z>b[1]-2.2&&z<b[3]+3)ok=false;
  if(abs(z-42)<4||abs(x-10)<4.2||(abs(z+8)<4.2&&x>-32))ok=false;for(const c of cols)if(c.h>0&&x>c.x0-1.2&&x<c.x1+1.2&&z>c.z0-1.2&&z<c.z1+1.2)ok=false;if(!ok)continue;tree(x,z,rr(.9,1.5));n++;}}
// thick tree wall at the edges
for(let x=-72;x<66;x+=2.6){tree(x+rr(-.5,.5),-49.5+rr(-1,1),rr(1.2,1.8),false);if(abs(x+28)>4)tree(x+rr(-.5,.5),-52.5,rr(1.2,1.8),false);}
for(let z=-46;z<44;z+=2.8){tree(-73.5+rr(-.6,.6),z,rr(1.2,1.8),false);tree(65.5+rr(-.6,.6),z,rr(1.2,1.8),false);}

// --- nav grid
const GX0=-72,GZ0=-48,GW=136,GH=132;const blocked=new Uint8Array(GW*GH);
function blockRect(c){const i0=max(0,floor(c.x0-.42-GX0)),i1=min(GW-1,floor(c.x1+.42-GX0)),j0=max(0,floor(c.z0-.42-GZ0)),j1=min(GH-1,floor(c.z1+.42-GZ0));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const cx=GX0+i+.5,cz=GZ0+j+.5;if(cx>c.x0-.42&&cx<c.x1+.42&&cz>c.z0-.42&&cz<c.z1+.42)blocked[j*GW+i]=1;}}
cols.forEach(blockRect);
const cellI=x=>clamp(floor(x-GX0),0,GW-1),cellJ=z=>clamp(floor(z-GZ0),0,GH-1);
const fieldCache=new Map();
function field(tx,tz,cache){let ti=cellI(tx),tj=cellJ(tz);
  if(blocked[tj*GW+ti]){let best=1e9,bi=ti,bj=tj;for(let dj=-3;dj<=3;dj++)for(let di=-3;di<=3;di++){const i=ti+di,j=tj+dj;if(i<0||j<0||i>=GW||j>=GH||blocked[j*GW+i])continue;const d=hypot(GX0+i+.5-tx,GZ0+j+.5-tz);if(d<best){best=d;bi=i;bj=j;}}ti=bi;tj=bj;}
  const key=tj*GW+ti;if(cache&&fieldCache.has(key))return fieldCache.get(key);
  const F=new Int16Array(GW*GH).fill(-1),q=new Int32Array(GW*GH);let qh=0,qt=0;F[key]=0;q[qt++]=key;
  while(qh<qt){const k=q[qh++],i=k%GW,j=(k-i)/GW,d=F[k]+1;
    if(i>0&&!blocked[k-1]&&F[k-1]<0){F[k-1]=d;q[qt++]=k-1;}if(i<GW-1&&!blocked[k+1]&&F[k+1]<0){F[k+1]=d;q[qt++]=k+1;}
    if(j>0&&!blocked[k-GW]&&F[k-GW]<0){F[k-GW]=d;q[qt++]=k-GW;}if(j<GH-1&&!blocked[k+GW]&&F[k+GW]<0){F[k+GW]=d;q[qt++]=k+GW;}}
  if(cache)fieldCache.set(key,F);return F;}
// --- collision helpers
function hitAt(x,z,r){for(let i=0;i<cols.length;i++){const c=cols[i];if(c.off)continue;const nx=clamp(x,c.x0,c.x1),nz=clamp(z,c.z0,c.z1),dx=x-nx,dz=z-nz;if(dx*dx+dz*dz<r*r)return true;}return false;}
function moveC(o,dx,dz,r=.36){let m=false;if(dx&&!hitAt(o.x+dx,o.z,r)){o.x+=dx;m=true;}if(dz&&!hitAt(o.x,o.z+dz,r)){o.z+=dz;m=true;}return m;}
function los(x0,z0,x1,z1,low){const dx=x1-x0,dz=z1-z0;for(let i=0;i<cols.length;i++){const c=cols[i];if(c.off||c.h<(low?.8:1.5))continue;let t0=0,t1=1;
    if(abs(dx)<1e-6){if(x0<c.x0||x0>c.x1)continue;}else{let a=(c.x0-x0)/dx,b=(c.x1-x0)/dx;if(a>b){const t=a;a=b;b=t;}t0=max(t0,a);t1=min(t1,b);if(t0>t1)continue;}
    if(abs(dz)<1e-6){if(z0<c.z0||z0>c.z1)continue;}else{let a=(c.z0-z0)/dz,b=(c.z1-z0)/dz;if(a>b){const t=a;a=b;b=t;}t0=max(t0,a);t1=min(t1,b);if(t0>t1)continue;}
    return false;}return true;}
const M_world=mesh(W),M_ground=mesh(GR),M_sea=mesh(SEA);
