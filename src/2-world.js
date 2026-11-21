// ================= WORLD =================
const cols=[];const LAMPS=[];
const W=new Geo(.06),GR=new Geo(0),SEA=new Geo(0),VEG=new Geo(0),FAR=new Geo(.06);
const col=(x0,z0,x1,z1,h=3)=>{const c={x0,z0,x1,z1,h};cols.push(c);return c;};
const PAL={wall:['#8a8271','#7d8a86','#93856a','#75807a'],roof:['#4b3a36','#3a4450','#54463a','#3f4a48'],wood:H('#6b4f36'),woodD:H('#4a3626'),stone:H('#6f7775'),dark:H('#131c1e'),
  lit:H('#e2a94a',.95),unlit:H('#1b2b30'),pine:['#24493c','#1f4034','#2b5244'],trunk:H('#4a3a2c')};
// place a Blender model with a primitive fallback (used while a model is missing)
function prop(name,x,y,z,ry=0,s=1,opt,fb,G=W){G.at(mM(mT(x,y,z),mRy(ry),typeof s==='number'?mS(s,s,s):mS(s[0],s[1],s[2])),()=>{if(!G.model(name,opt)&&fb)fb();});}
// --- value noise for colour fields
const VN=(()=>{const P=256,L=new Float32Array(P*P);let s=91;for(let i=0;i<L.length;i++){s=(s*16807)%2147483647;L[i]=(s-1)/2147483646;}
  const g=(i,j)=>L[((j&255)*P)+(i&255)];return(x,y)=>{const xi=floor(x),yi=floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return lerp(lerp(g(xi,yi),g(xi+1,yi),u),lerp(g(xi,yi+1),g(xi+1,yi+1),u),v);};})();
const fbm=(x,y)=>VN(x,y)*.55+VN(x*2.1+17,y*2.1+5)*.3+VN(x*4.3+3,y*4.3+41)*.15;

// --- buildings data (shared with the Blender asset script)
// (must match HOUSES in tools/zov_lib.py: model 'house_i' is built from entry i; door = world x of the front door)
const HOUSES=[[-25.2,-27,-8,-12.6,{kind:'pub',wall:'#6b5f52',roof:'#3a3230',h:3.6,rh:2.6,lit:1,door:-13.2}],[-5,-23,6,-13,{wall:'#8f8468',roof:'#4b3a36',lit:1}],[-24,-3,-14,6,{}],[-8,-3,3,5,{}],[16,-3,27,5,{}],[-8,12,3,20,{}],[16,12,27,20,{}],[-24,12,-14,18,{}],
  [-24,24,-9,36,{wall:'#5d5346',roof:'#35302c',h:4,rh:2.6,lit:0,noCh:1}],[18,24,28,31,{}],[15,34,21,39,{wall:'#6f6a5a',roof:'#3a4450',h:2.8,rh:1.6,lit:0,noCh:1}],
  // the western district: market street, Holmovaya street (Dr Bernson, №9), the school, the church, the cannery and the boathouse on the quay
  [-134,-24,-123,-13,{kind:'bakery',wall:'#8a7a62',roof:'#54463a',lit:1}],[-122,-25,-113,-14,{}],
  [-118,-44,-102,-35,{kind:'doctor',wall:'#7a7f78',roof:'#2f3a3c',h:5.8,rh:2.6,lit:1,door:-110}],[-106.5,-26,-98,-14,{}],
  [-94,-32,-80,-12,{kind:'church',wall:'#c9c4b4',roof:'#3a4450',h:5,rh:3.4,lit:1,noCh:1,door:-87}],
  [-78,-22,-67,-12,{kind:'shop',wall:'#7d8a86',lit:1}],[-136,-3,-118,8,{kind:'school',wall:'#8a5a48',roof:'#3f4a48',lit:1,noCh:1,door:-127}],
  [-114,-3,-104,6,{}],[-60,-2,-48,7,{kind:'post',wall:'#75807a',lit:1}],[-62,12,-51,20,{}],[-45,12,-35,20,{}],
  [-128,22,-104,36,{kind:'cannery',wall:'#6a5248',roof:'#3a3a36',h:5.5,rh:2.2,lit:.6,noCh:1,door:-116}],
  [-96,26,-84,37,{kind:'boathouse',wall:'#5d5346',roof:'#35302c',h:4,rh:2.4,lit:0,noCh:1}],[-77,24,-67,33,{}],[-58,24,-47,32,{}],[-77,-3,-67,6,{}]];
function house(x0,z0,x1,z1,o={}){const h=o.h||3.2,wc=H(o.wall||PAL.wall[floor(rnd()*4)]),rc=H(o.roof||PAL.roof[floor(rnd()*4)]),cx=(x0+x1)/2,cz=(z0+z1)/2;
  W.bx(cx,0,cz,x1-x0,h,z1-z0,wc);W.bx(cx,0,cz,x1-x0+.15,.45,z1-z0+.15,PAL.stone);W.prism(x0,z0,x1,z1,h,o.rh||2.2,rc);
  const dx=o.door==null?cx:o.door;W.bx(dx,0,z1+.04,1,2,.1,PAL.woodD);W.bx(dx,2,z1+.05,1.25,.14,.14,PAL.wood);
  for(const wx of[x0+1.5,x1-1.5]){if(abs(wx-dx)<1.3)continue;W.bx(wx,1.3,z1+.03,1.05,1.05,.08,PAL.wood);W.bx(wx,1.38,z1+.06,.8,.85,.08,rnd()<(o.lit??.4)?PAL.lit:PAL.unlit);}
  if(!o.noCh)W.bx(x0+1.2,h+.6,cz-.5,.6,1.8,.6,PAL.stone);}
const BLD=[];
HOUSES.forEach((b,i)=>{const[x0,z0,x1,z1,o]=b;BLD.push([x0,z0,x1,z1]);const cx=(x0+x1)/2,cz=(z0+z1)/2;
  if(!W.at(mT(cx,0,cz),()=>W.model('house_'+i)))house(x0,z0,x1,z1,o);
  col(x0,z0,x1,z1,8);
  // lit windows glow a little into the mist
  if(o.lit)LAMPS.push([cx,1.6,z1+1.2,6,[.7,.45,.2]]);});

// --- trees
const TREES=[];
function tree(x,z,s=1,c=true,G=W){const v=floor(abs(sin(x*12.9898+z*78.233))*43758)%7;TREES.push([x,z,s]);
  const name=G===FAR?(v===6?'pine_dead':'pine_lo'):v<3?'pine_'+'abc'[v]:v<5?'pine_'+'ab'[v-3]:v===5?'pine_c':'pine_dead';
  prop(name,x,0,z,(x*7.3+z*3.1)%6.28,s,{k:.92+((x*13+z*7)%10)/60},()=>{const pc=H(PAL.pine[floor(rnd()*3)]);G.cyl(0,0,0,.22,.16,1.4,5,PAL.trunk);for(let i=0;i<3;i++)G.cyl(0,(1.1+i*1.25),0,(1.7-i*.42),0,1.9,6,pc);},G);
  if(c)col(x-.3,z-.3,x+.3,z+.3,6);}
function crate(x,z,s=1.1,ry=0){prop(rnd()<.5?'crate_a':'crate_b',x,0,z,ry,s/1.1,null,()=>{W.bx(0,0,0,1.1,1.1,1.1,PAL.wood);W.bx(0,1.1*.45,0,1.16,.1,1.16,PAL.woodD);});col(x-s/2,z-s/2,x+s/2,z+s/2,1.1);}
function barrel(x,z){prop('barrel',x,0,z,rnd()*6.28,1,null,()=>{W.cyl(0,0,0,.42,.42,1.1,7,H('#5d4630'));W.cyl(0,.35,0,.45,.45,.08,7,PAL.dark);W.cyl(0,.8,0,.45,.45,.08,7,PAL.dark);});col(x-.4,z-.4,x+.4,z+.4,1.1);}
function boat(x,z,ry,cl='#5a4a3a',v=0){prop(v?'boat_b':'boat_a',x,0,z,ry,1,{pal:{hull:H(cl)}},()=>{W.bx(0,.1,0,1.5,.7,3.4,H(cl));W.bx(0,.55,0,1.15,.3,3,PAL.woodD);W.cyl(0,.1,1.7,.75,0,.7,4,H(cl));W.bx(0,.7,-.4,1.5,.08,.3,PAL.wood);});
  const r=abs(sin(ry))>.7;col(x-(r?2:.8),z-(r?.8:2),x+(r?2:.8),z+(r?.8:2),1.1);}
function fence(x0,z0,x1,z1){const L=hypot(x1-x0,z1-z0),n=max(1,Math.round(L/2)),a=atan2(-(z1-z0),x1-x0);
  if(hasModel('fence'))for(let i=0;i<n;i++){const t=(i+.5)/n;prop('fence',lerp(x0,x1,t),0,lerp(z0,z1,t),a+(rnd()-.5)*.05,[L/n/2,1+(rnd()-.5)*.12,1],{k:.85+rnd()*.25});}
  else{for(let i=0;i<=n;i++)W.bx(lerp(x0,x1,i/n),0,lerp(z0,z1,i/n),.14,1.3,.14,PAL.woodD);const horiz=abs(x1-x0)>abs(z1-z0);for(const y of[.5,1])W.box((x0+x1)/2,y,(z0+z1)/2,horiz?abs(x1-x0):.07,.1,horiz?.07:abs(z1-z0),PAL.wood);}
  col(min(x0,x1)-.1,min(z0,z1)-.1,max(x0,x1)+.1,max(z0,z1)+.1,1.2);}
function lamp(x,z){prop('lamp',x,0,z,rnd()*6.28,1,null,()=>{W.cyl(0,0,0,.09,.07,3.1,5,PAL.dark);W.bx(0,3.05,0,.46,.5,.46,H('#f6cf70',1));W.bx(0,3.56,0,.56,.07,.56,PAL.dark);});LAMPS.push([x,3,z,12,[1,.72,.36]]);col(x-.12,z-.12,x+.12,z+.12,1);}
function grave(x,z){const v='abcd'[floor(rnd()*4)];prop('grave_'+v,x,0,z,(rnd()-.5)*.25,.95+rnd()*.15,{k:.85+rnd()*.25},()=>{if(v<'c'){W.bx(0,0,0,.62,.95,.16,PAL.stone);}else{W.bx(0,0,0,.14,1.2,.14,PAL.stone);W.bx(0,.75,0,.6,.14,.14,PAL.stone);}W.bx(0,0,.8,.7,.12,1.3,H('#2a3a30'));});col(x-.3,z-.1,x+.3,z+.1,.9);}

// --- ground: smooth colour field + shader detail (mode 1)
const ROADS=[[-28,-330,-28,-6,2.4],[-138,-8,61,-8,2.4],[10,-8,10,47,2.4],[-138,42,42,42,2.6],[-110,-8,-110,-33,2],[-100,-8,-100,42,2],[-64,-8,-64,42,1.6],[10,5,38.5,5,1.1],[42,42,47.5,36.5,1.2],[-28,-6,-28,10,1],[-40,-22,-30,-16,2.2]];
function segD(x,z,s){const dx=s[2]-s[0],dz=s[3]-s[1],t=clamp(((x-s[0])*dx+(z-s[1])*dz)/(dx*dx+dz*dz),0,1);return hypot(x-s[0]-dx*t,z-s[1]-dz*t);}
function roadW(x,z){let w=0;const n=(fbm(x*.35,z*.35)-.5)*1.4;for(const s of ROADS){const d=segD(x,z,s)+n;w=max(w,1-sstep(s[4]-.7,s[4]+.8,d));}
  if(x>-50&&x<-30.5&&z>-24.5&&z<-11.5)w=max(w,1-sstep(-.5,1.2,max(-50-x,x+30.5,-24.5-z,z+11.5)+n*.6));return w;}
const GC={g1:H('#2c4a35'),g2:H('#3e5c3b'),dry:H('#55603e'),moss:H('#263d2e'),road:H('#544a3e'),rut:H('#3d362e'),sand:H('#7b7056'),wet:H('#4f4b3e'),lot:H('#4a4743'),forest:H('#2a3828'),needle:H('#463b2c')};
function groundCol(x,z){const n1=fbm(x*.06,z*.06),n2=fbm(x*.21+50,z*.21),n3=VN(x*.9,z*.9);
  let c=vLerp(GC.g1,GC.g2,sstep(.35,.7,n1));c=vLerp(c,GC.dry,sstep(.55,.85,n2)*.7);c=vLerp(c,GC.moss,sstep(.6,.9,1-n1)*.5);
  const forest=sstep(-41,-48,z)+sstep(58,64,x)+sstep(-134,-140,x);c=vLerp(c,vLerp(GC.forest,GC.needle,n3*.6),clamp(forest,0,1)*.85);
  if(x>38&&x<58&&z>-3&&z<14)c=vLerp(c,GC.moss,.55);
  if(x>-100&&x<-80&&z>-4.5&&z<14)c=vLerp(c,GC.lot,.75*(1-sstep(.4,1,fbm(x*.5,z*.5))*.4));   // the cobbled market square
  if(x>-136&&x<-118&&z>8&&z<18)c=vLerp(c,GC.dry,.6);   // the trodden schoolyard
  const r=roadW(x,z);if(r>0){let rc=vLerp(GC.road,GC.rut,sstep(.3,.8,n3)*.5);if(x>-50&&x<-30&&z>-24&&z<-12)rc=GC.lot;c=vLerp(c,rc,r);}
  const sd=sstep(43.2,45.2,z+(n2-.5)*1.5);if(sd>0)c=vLerp(c,vLerp(GC.sand,GC.wet,sstep(45.6,47,z)),sd);
  return[c[0],c[1],c[2],0];}
function groundH(x,z){return(fbm(x*.18,z*.18)-.5)*.12*(1-roadW(x,z)*.7)-(z>45.8?(z-45.8)*.12:0);}
function groundGrid(x0,x1,z0,z1,st){const nx=Math.round((x1-x0)/st),nz=Math.round((z1-z0)/st),Pp=[],Cc=[];
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=x0+i*st,z=z0+j*st;Pp.push([x,groundH(x,z),z]);Cc.push(groundCol(x,z));}
  const id=(i,j)=>j*(nx+1)+i,nrm=(i,j)=>{const a=Pp[id(max(i-1,0),j)],b=Pp[id(min(i+1,nx),j)],c=Pp[id(i,max(j-1,0))],d=Pp[id(i,min(j+1,nz))];return vNorm([a[1]-b[1],b[0]-a[0],c[1]-d[1]]);};
  const N=Pp.map((_,k)=>nrm(k%(nx+1),floor(k/(nx+1))));
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const q=[id(i,j),id(i,j+1),id(i+1,j+1),id(i+1,j)];for(const t of[[0,1,2],[0,2,3]])for(const k of t){const v=q[k];GR.vert(Pp[v],N[v],Cc[v],N[v]);}}}
groundGrid(-150,96,-48,48,1);groundGrid(-104,48,-332,-48,2);
// sea: fine grid where the camera can see it, coarse beyond; waves are done in the vertex shader (mode 2)
function seaGrid(x0,x1,z0,z1,st){const c=H('#14353a');for(let x=x0;x<x1;x+=st)for(let z=z0;z<z1;z+=st){for(const t of[[[x,0,z],[x,0,z+st],[x+st,0,z+st]],[[x,0,z],[x+st,0,z+st],[x+st,0,z]]])for(const p of t)SEA.vert(p,[0,1,0],c,[0,1,0]);}}
seaGrid(-150,110,46,120,2);seaGrid(-90,110,120,300,2);seaGrid(-290,-150,46,420,10);seaGrid(-150,-90,120,420,10);seaGrid(110,310,46,420,10);seaGrid(-90,110,300,420,10);
prop('seawall',0,0,47.2,0,1,null,()=>W.bx(0,-.7,0,190,.75,.5,H('#3a3a34')));prop('seawall',-190,0,47.2,0,1,null,()=>W.bx(0,-.7,0,190,.75,.5,H('#3a3a34')));

// --- forest along the road (cutscene) and around the map
for(let z=-318;z<-50;z+=3.4){for(const s of[-1,1]){for(let k=0;k<3;k++){const x=-28+s*(5+k*5.8+rr(0,3.5));tree(x,z+rr(-1.2,1.2),rr(.9,1.6),false,k>0||z<-120?FAR:W);}}}
const NOTREE=[[-140,-3,-62,46],[-140,-34,-64,-9],[-121,-47,-99,-30],[-74,-47,-29,-9],[-33,-60,-23,0],[-34,-12,64,-4],[6,-12,14,48],[-32,38,44,48],[36,-5,60,16],[36,-48,62,-24],[42,28,58,40],[-10,-27,8,-10],[18,-30,34,-10],[10,-20,16,-12]];
// chapel
BLD.push([20,-28,32,-13]);if(!W.at(mT(26,0,-20.5),()=>W.model('chapel'))){house(20,-28,32,-13,{wall:'#6c7472',roof:'#2f3a3c',h:4.6,rh:3.6,lit:0,noCh:1,door:26});
  W.bx(22,0,-15,3.4,8.5,3.4,H('#667070'));W.cyl(22,8.5,-15,2.4,0,4.2,4,H('#2f3a3c'));W.bx(22,6.3,-13.25,1,1.5,.1,H('#6fe0b0',.9));W.bx(29.5,1.5,-12.95,1,1.9,.1,H('#57c79a',.8));}
col(20,-28,32,-13,8);LAMPS.push([26,2.5,-11,9,[.3,.75,.55]],[22,6.5,-12.6,7,[.25,.7,.5]]);
// lighthouse
if(!W.at(mT(50,0,34),()=>W.model('lighthouse'))){W.cyl(50,0,34,3,2.5,5,10,H('#b9b4a4'));W.cyl(50,5,34,2.5,2.2,4,10,H('#8c3a32'));W.cyl(50,9,34,2.2,1.9,4,10,H('#b9b4a4'));W.cyl(50,13,34,2.7,2.7,.3,10,PAL.dark);W.cyl(50,13.3,34,1.4,1.4,1.7,8,H('#f3e6a0',1));W.cyl(50,15,34,2,0,1.6,8,H('#8c3a32'));W.bx(46.95,0,34,.12,2,1,PAL.woodD);}
col(47,31,53,37,16);BLD.push([47,31,53,37]);LAMPS.push([50,14,34,30,[.75,.72,.5]]);
// cemetery
fence(38,-3,58,-3);fence(58,-3,58,14);fence(38,14,58,14);fence(38,-3,38,3.6);fence(38,6.6,38,14);
for(let gx=41;gx<57;gx+=3.2)for(let gz=-.5;gz<12;gz+=4){if(abs(gx-48)<2.4&&abs(gz-5)<3.2)continue;grave(gx+rr(-.3,.3),gz+rr(-.3,.3));}
prop('obelisk',48,0,5,0,1,null,()=>{W.bx(0,0,0,1.6,.5,1.6,PAL.stone);W.cyl(0,.5,0,.55,.3,3.4,4,H('#59625f'));W.cyl(0,3.9,0,.3,0,.6,4,H('#59625f'));});col(47.2,4.2,48.8,5.8,4);
// well, market, props
prop('well',13,0,-16,0,1,null,()=>{W.cyl(0,0,0,1.1,1.1,.85,8,PAL.stone);W.cyl(0,.5,0,.8,.8,.3,8,H('#0c1a1e'));W.bx(-1,0,0,.14,2.3,.14,PAL.woodD);W.bx(1,0,0,.14,2.3,.14,PAL.woodD);W.prism(-1.1,-.6,1.1,.6,2.3,.7,H('#4b3a36'),.2);});col(12,-17,14,-15,2);
[[-16,-10.9],[-9.5,-11.5,1.3],[15.5,-5.2],[4.6,-5.3],[-12,-5.1,1.2],[33.5,-10.8],[36,-5.2],[7,8],[13.2,14,1.2],[6.8,24],[13.3,30],[-3,9],[30,10],[33,18,1.3],[-28,10],[-30,26],[-6,38.6],[-4.8,38.6,.9],[2,39],[24,39.2],[32,38.7,1.2],[40,24],[36,30],[-18,20.5],[-36,-9],[-44,-10.5,1.2],[-66,-24],[-33,-36]].forEach(c=>crate(c[0],c[1],c[2]||1.1,rr(-.2,.2)));
[[-15,-10.9],[14.6,-5.3],[5.5,-11.2],[34.5,-11],[6.9,9.2],[13.3,15.3],[6.8,25.2],[13.2,31.2],[-2,9.2],[31.2,10],[-28,11.2],[-30,27.2],[3.2,39],[25.2,39.3],[41,25],[-8,-11],[22,9],[-12,21],[-45.3,-10.6],[-66,-25.2],[-52,-42],[-33,-37.2],[44,20],[28,-5]].forEach(c=>barrel(c[0],c[1]));
boat(-14,45.4,PI/2);boat(-3,45.6,PI/2+.1,'#4f5a56',1);boat(25,45.5,PI/2);boat(34,45.3,PI/2-.15,'#3d3a36',1);boat(-24,45.5,.1,'#5a4033');
// net racks on the quay
for(const nx of[-20,-12,27.5,36]){prop('netrack',nx,0,39,0,1,null,()=>{W.bx(-1.6,0,0,.12,2,.12,PAL.woodD);W.bx(1.6,0,0,.12,2,.12,PAL.woodD);W.bx(0,1.2,0,3.2,1.5,.05,H('#48564e'));});col(nx-1.7,38.9,nx+1.7,39.1,2);}
fence(-30,-3.5,-26,-3.5);fence(-8,7,-8,11);fence(27,8,34,8);fence(-24,20.5,-20,20.5);fence(3.2,22,6,22);fence(14,22,16,22);fence(30,34,40,34);
[[-25.6,-11],[7,-11.2],[13.2,22],[13.4,40.2],[35,-5],[-4,39.3],[40,39.5]].forEach(l=>lamp(l[0],l[1]));
// quay clutter (no collision: small)
[[-17,43.4,0],[-6.5,43.6,1],[22,43.2,2],[29,43.5,0],[4,43.8,1],[-27,43,2]].forEach(([x,z,v])=>prop(['ropecoil','trap','buoy'][v],x,0,z,rnd()*6.28,1,null,null));
prop('anchor',16.5,0,43.6,.4,1,null,null);prop('cart',-20.5,0,-10.2,.3,1,null,null);col(-21.6,-11,-19.4,-9.4,1);prop('bench',-1.5,0,-6.2,0,1,null,null);
// --- the western district: market square, schoolyard, laundry, the doctor's garden, the west quay (jetties, schooner, crane, gear)
{const cr=(x,z,r,w,d,h)=>{const sw=abs(sin(r))>.7;col(x-(sw?d:w)/2,z-(sw?w:d)/2,x+(sw?d:w)/2,z+(sw?w:d)/2,h);};
 // market square
 for(const[x,z,r]of[[-96,-1.6,0],[-90.5,-1.6,0],[-85,-1.6,0],[-96,10.6,PI],[-89,10.6,PI],[-82.4,4.4,-PI/2]]){prop('stall',x,0,z,r,1,null,()=>{W.bx(0,0,0,2.6,.9,1.1,PAL.wood);W.bx(0,2.2,0,2.8,.06,1.5,H('#7a3a2a'));});cr(x,z,r,2.7,1.2,1);}
 prop('well',-90,0,4.4,0,1,null,()=>{W.cyl(0,0,0,1.1,1.1,.85,8,PAL.stone);W.cyl(0,.5,0,.8,.8,.3,8,H('#0c1a1e'));});col(-91,3.4,-89,5.4,2);
 for(const[x,z,r]of[[-94.5,4.4,PI/2],[-85.5,4.4,-PI/2],[-108,-5.6,0],[-71,-5.6,0],[-123,-29.6,0]])prop('bench',x,0,z,r,1,null,()=>{W.bx(0,0,0,1.6,.45,.5,PAL.wood);W.bx(0,.45,-.22,1.6,.5,.08,PAL.woodD);});
 // schoolyard: fence with a gate, swings, a see-saw, a ball
 fence(-136,8.6,-136,18);fence(-136,18,-118,18);fence(-118,8.6,-118,18);
 {const sx=-131,sz=13.5,f=PAL.woodD;for(const s of[-1.6,1.6])for(const t of[-.5,.5])W.at(mM(mT(sx+s,0,sz+t*.9),mRx(t*-.38)),()=>W.bx(0,0,0,.12,2.4,.12,f));W.bx(sx,2.25,sz,3.4,.12,.12,f);
  for(const s of[-.8,.8]){W.bx(sx+s-.25,0,sz,.03,2.25,.03,H('#7a6a50'));W.bx(sx+s+.25,0,sz,.03,2.25,.03,H('#7a6a50'));W.bx(sx+s,.5,sz,.62,.05,.28,PAL.wood);}col(sx-1.8,sz-.6,sx+1.8,sz+.6,1.2);}
 W.at(mM(mT(-123,.3,14),mRz(.18)),()=>{W.bx(0,0,0,3.4,.08,.3,PAL.wood);});W.bx(-123,0,14,.3,.32,.3,PAL.woodD);W.sph(-120.4,.15,11.2,.15,.15,.15,H('#8a2a24'),6,4);
 // laundry lines between posts
 for(const[x0,x1,z,c]of[[-113,-105,8.4,0],[-76,-68,8.2,1],[-61.5,-52,22,2],[-57,-48,34,0],[-44,-36,22,1]]){const cl=[['#d8d2c2','#5a6a7a','#b9b4a4','#7a4a44'],['#cfc8b4','#4a5a4a','#d8d2c2'],['#8a7a62','#d8d2c2','#4a4a56','#b9b4a4']][c];
   for(const x of[x0,x1])W.bx(x,0,z,.1,2.1,.1,PAL.woodD);W.bx((x0+x1)/2,2.02,z,x1-x0,.02,.02,H('#9a9078'));
   for(let k=0,x=x0+.8;x<x1-.6;k++,x+=1.1){const h=.5+(k%3)*.18;W.at(mM(mT(x,2-h,z),mRy(rr(-.15,.15))),()=>W.bx(0,0,0,.7,h,.02,H(cl[k%cl.length])));}}
 // the doctor's garden: iron-topped fence, gate on Holmovaya street, the woodpile and the gravel heap (distractions)
 fence(-120,-46,-120,-31);fence(-100,-46,-100,-31);fence(-120,-31,-111.4,-31);fence(-108.6,-31,-100,-31);
 for(const x of[-111.4,-108.6])W.bx(x,0,-31,.3,1.7,.3,PAL.stone);
 {const x=-97.6,z=-33.4;W.bx(x,0,z+1.1,1.9,.08,.4,PAL.woodD);for(let k=0;k<5;k++)for(let j=0;j<4-k%2;j++)W.at(mM(mT(x-.7+j*.46+(k%2)*.23,.18+k*.34,z),mRx(PI/2)),()=>W.cyl(0,-.9,0,.17,.17,1.8,6,H(['#6a5236','#5a4430','#7a6044'][(j+k)%3])));
  W.bx(x+1.05,0,z,.12,1.9,.12,PAL.woodD);W.bx(x-1.05,0,z,.12,1.9,.12,PAL.woodD);col(x-1.1,z-1,x+1.1,z+1,1.8);}
 for(let i=0;i<9;i++)W.sph(-116.2+rr(-.6,.6),.12,-11.2+rr(-.5,.5),rr(.18,.3),rr(.12,.2),rr(.18,.3),H(['#6f7775','#5a6260','#7a807c'][i%3]),5,3);
 // west quay: jetties, moored boats, a schooner, a cargo crane, net racks, drying racks, crates and barrels
 for(const jx of[-60,-88,-126]){W.bx(jx,-.25,54,3,.3,15,H('#5c4a38'));for(let z=47;z<62;z+=1.2)W.bx(jx,.04,z,3,.03,.07,PAL.woodD);for(let z=49;z<62;z+=3.5)for(const s of[-1.4,1.4])W.cyl(jx+s,-2.2,z,.18,.18,3.1,5,PAL.woodD);
   boat(jx+3.2,53,0,'#5a4a3a',0);boat(jx-3.1,57,.08,'#4f5a56',1);}
 prop('schooner',-106,-1.25,57,0,1,null,()=>{W.bx(0,.5,0,4,2.2,15,H('#3e3a34'));W.cyl(0,2,-2.6,.14,.08,10,6,PAL.woodD);W.cyl(0,2,2,.14,.08,8.5,6,PAL.woodD);});
 LAMPS.push([-106,2.4,59.8,6,[1,.72,.4]]);
 {const cx=-116,cz=44.4;W.cyl(cx,0,cz,.4,.3,6.5,6,PAL.woodD);W.at(mM(mT(cx,5.6,cz),mRy(.5),mRx(-1.1)),()=>W.cyl(0,0,0,.18,.12,7,6,PAL.wood));const tip=[cx+sin(.5)*6.3,5.6+cos(1.1)*7*.42+.4,cz+cos(.5)*6.3*.92];
  W.bx(tip[0],2.1,tip[2],.03,tip[1]-2.1,.03,H('#7a6a50'));W.bx(tip[0],1.3,tip[2],1,.8,.8,PAL.wood);W.bx(cx,0,cz,1.6,.3,1.6,PAL.stone);col(cx-.8,cz-.8,cx+.8,cz+.8,2);}
 for(const nx of[-132,-80,-70,-50])prop('netrack',nx,0,39,0,1,null,()=>{W.bx(-1.6,0,0,.12,2,.12,PAL.woodD);W.bx(1.6,0,0,.12,2,.12,PAL.woodD);W.bx(0,1.2,0,3.2,1.5,.05,H('#48564e'));}),col(nx-1.7,38.9,nx+1.7,39.1,2);
 for(const[x,z]of[[-96,40.4],[-139,30]]){for(const s of[-1.5,1.5])W.bx(x+s,0,z,.1,1.9,.1,PAL.woodD);for(const y of[1.25,1.75]){W.bx(x,y,z,3.1,.04,.04,PAL.woodD);for(let k=0;k<9;k++)W.sph(x-1.3+k*.32,y-.22,z,.05,.2,.03,H(k%2?'#8a9a94':'#a89a7a'),5,3);}col(x-1.6,z-.1,x+1.6,z+.1,1.8);}
 [[-120,40.6],[-118.8,40.8,.9],[-102,40.4],[-101,39.4,.9],[-84,40.6],[-74,40.8],[-73,39.8,.9],[-54,40.6],[-130,24],[-131,25.2,.9],[-104.4,37.8],[-79,-11.2],[-79.6,-10.2,.9],[-135,-11.6],[-66.2,-1]].forEach(c=>crate(c[0],c[1],c[2]||1.1,rr(-.2,.2)));
 [[-121.6,40.4],[-108,40.6],[-99,40.8],[-86,40.3],[-68,40.6],[-56,40.8],[-130,26],[-102.6,37.8],[-133,-12.2],[-81,-11],[-48,8.6],[-103.2,-12.4],[-62,21.6]].forEach(c=>barrel(c[0],c[1]));
 [[-124,43.6,0],[-110,43.4,1],[-93,43.8,2],[-78,43.4,0],[-62,43.6,1],[-46,43.4,2],[-136,43.2,1]].forEach(([x,z,v])=>prop(['ropecoil','trap','buoy'][v],x,0,z,rnd()*6.28,1,null,null));
 boat(-138,45.4,PI/2-.1,'#5a4033');boat(-72,45.5,PI/2+.05,'#4f5a56',1);boat(-44,45.4,PI/2);
 [[-100.8,-11.2],[-79.6,-5.6],[-110.8,-28],[-64.8,19],[-100.8,26],[-119,39.6],[-90,39.6],[-62,39.6],[-130,-5.6],[-135,20]].forEach(l=>lamp(l[0],l[1]));
 prop('noticeboard',-98.4,0,-10.6,0,1,null,()=>{W.bx(-.8,0,0,.1,1.9,.1,PAL.woodD);W.bx(.8,0,0,.1,1.9,.1,PAL.woodD);W.bx(0,1,0,1.7,.9,.07,PAL.wood);});col(-99.3,-10.7,-97.5,-10.5,1.9);
 prop('cart',-74,0,-10.2,-.4,1,null,null);col(-75.1,-11,-72.9,-9.4,1);prop('mailbox',-52,0,8.2,0,1,null,null);}
// --- puzzle & easter-egg props (the table, lectern, idol shelf and safe now stand inside the buildings: src/5-story.js)
if(!hasModel('chapel'))W.cyl(26,1.05,-12.86,.34,.34,.5,8,H('#b08d3c',.25));
for(let i=0;i<5;i++){const a=i/5*2*PI;W.bx(48+cos(a)*.62,1.3+i%2*.5,5+sin(a)*.62,.14,.14,.14,H('#7fffe0',.9));}
prop('mailbox',-6.6,0,-11.8,0,1,null,()=>{W.bx(0,0,0,.1,1.1,.1,PAL.dark);W.bx(0,1.1,0,.3,.24,.46,H('#7a3a30'));});
prop('noticeboard',15.6,0,-14.4,0,1,null,()=>{W.bx(-.8,0,0,.1,1.9,.1,PAL.woodD);W.bx(.8,0,0,.1,1.9,.1,PAL.woodD);W.bx(0,1,0,1.7,.9,.07,PAL.wood);W.bx(-.2,1.3,.06,.4,.5,.03,H('#e8dfc4',.35));W.bx(.4,1.4,.06,.3,.3,.03,H('#d8cfa4',.3));});col(14.7,-14.5,16.5,-14.3,1.9);
prop('idol',17.5,1.2,5.14,PI,1,null,()=>{W.cyl(0,0,0,.1,.07,.3,5,H('#5c9a72',.5));W.sph(0,.38,0,.09,.09,.09,H('#5c9a72',.5),5,3);});
prop('wreck',34,0,44,.5,1,null,()=>W.at(mM(mRy(.5),mRz(.5)),()=>W.bx(0,.2,0,.12,2.6,.12,PAL.woodD)));
// --- pier & ritual platform
if(!W.at(mT(10,0,65),()=>W.model('pier'))){W.bx(10,-.25,57.5,6,.3,21,H('#5c4a38'));W.bx(10,-.25,75,16,.3,14,H('#5c4a38'));
  for(let z=49;z<82;z+=4)for(const x of z<68?[7.3,12.7]:[2.4,17.6]){W.cyl(x,-2,z,.22,.22,2.6,5,PAL.woodD);}for(let z=48;z<68;z+=1.5)W.bx(10,.05,z,6,.03,.08,PAL.woodD);
  W.bx(10,0,48.6,6,2,.15,PAL.woodD);W.bx(10,.9,48.7,5.6,.12,.1,PAL.dark);}
prop('altar',10,0,76,0,1,{pal:{blood:H('#2a0e0c'),rune:H('#7a2a1a',.25)}},()=>{W.bx(0,0,0,1.4,1,2.8,H('#555e5c'));W.bx(0,1,0,1.7,.16,3.1,H('#3c4543'));});
for(const[bx,bz]of[[3.2,69.2],[16.8,69.2],[3.2,80.8],[16.8,80.8]])prop('brazier',bx,0,bz,0,1,null,()=>{W.cyl(0,0,0,.25,.2,1.6,5,PAL.stone);W.cyl(0,1.6,0,.4,.3,.3,5,PAL.dark);W.cyl(0,1.9,0,.25,0,.6,5,H('#ff8a2a',1));});
const BRAZ=[[3.2,69.2],[16.8,69.2],[3.2,80.8],[16.8,80.8]];
const pierGate=col(7,48.3,13,48.9,2.2);
for(const r of[[-300,47,7,400],[13,47,300,68],[-300,68,2,400],[18,68,300,400],[2,82,18,400]])col(r[0],r[1],r[2],r[3],0);
// world bounds
col(-300,-400,-141.5,400,0);col(63.5,-400,112,400,0);col(112,18,300,400,0);col(-300,-400,300,-47.5,0);// x 112..300, z -47.5..18 is left for the interiors (src/5-story.js)

// --- MOTEL (roofless, Sims-style cutaway)
const MW=H('#7f7462'),MW2=H('#71675a'),WAIN=H('#4f3d2c'),PAPER=H('#6d6a55');
function wall(x0,z0,x1,z1,h=2.7,c=MW){const sx=max(.3,x1-x0),sz=max(.3,z1-z0),cx=(x0+x1)/2,cz=(z0+z1)/2;W.bx(cx,0,cz,sx,h,sz,c);
  if(h>2){W.bx(cx,0,cz,sx+.06,1,sz+.06,WAIN);W.bx(cx,1,cz,sx+.08,.07,sz+.08,PAL.woodD);}W.bx(cx,0,cz,sx+.1,.14,sz+.1,PAL.woodD);
  W.bx(cx,h,cz,max(.36,x1-x0+.06),.08,max(.36,z1-z0+.06),PAL.woodD);col(min(x0,x1)-.15,min(z0,z1)-.15,max(x0,x1)+.15,max(z0,z1)+.15,3);}
// plank floor
for(let x=-61.8;x<-40.2;x+=.42)W.bx(x+.2,0,-32,.4,.05,12,H(['#6a553c','#5f4b35','#735c41'][floor(rnd()*3)]));
prop('rug',-44,.06,-30.4,0,1,null,null);prop('rug',-58.4,.06,-33.6,PI/2,.8,{pal:{rug:H('#4a2b2b')}},null);
wall(-62,-38,-59.2,-38);wall(-57.8,-38,-40,-38);W.bx(-58.5,0,-38,1.4,.9,.3,MW);W.bx(-58.5,2.1,-38,1.4,.6,.3,MW);W.bx(-58.5,1.5,-38,1.3,1.1,.06,H('#243a40',.25));W.bx(-58.5,.9,-37.82,1.5,.08,.2,PAL.woodD);col(-59.3,-38.15,-57.7,-37.85,3);
wall(-62,-38,-62,-26);wall(-40,-38,-40,-26);
wall(-62,-26,-44.7,-26,2.7,MW2);wall(-43.3,-26,-40,-26,2.7,MW2);W.bx(-44,2.05,-26,1.4,.65,.3,MW2);
wall(-62,-29,-59.1,-29,2.7,MW2);wall(-57.9,-29,-52.1,-29,2.7,MW2);wall(-50.9,-29,-48,-29,2.7,MW2);W.bx(-58.5,2.05,-29,1.2,.65,.3,MW2);W.bx(-51.5,2.05,-29,1.2,.65,.3,MW2);
// motel ceiling with beams (first person)
W.bx(-51,2.7,-32,22.4,.12,12.4,H('#3a332c'));for(let x=-60;x<-40;x+=3)W.bx(x,2.5,-32,.2,.2,12,PAL.woodD);
W.bx(-51.5,0,-29,1.2,1.9,.12,PAL.woodD);col(-52.1,-29.15,-50.9,-28.85,3);
wall(-55,-38,-55,-29);wall(-48,-38,-48,-29);
W.bx(-54.83,1.35,-34,.06,.22,.22,H('#05090a'));W.bx(-55.17,1.35,-34,.06,.22,.22,H('#05090a'));
// furniture
prop('counter',-43.5,0,-33,0,1,null,()=>{W.bx(0,0,0,5,1.05,.9,PAL.wood);W.bx(0,1.05,0,5.2,.08,1.1,PAL.woodD);});col(-46,-33.5,-41,-32.5,1.1);
prop('keyboard',-41,0,-37.3,0,1,null,()=>{W.bx(0,0,0,1.4,2.2,.5,PAL.woodD);for(let i=0;i<6;i++)W.bx(-.5+(i%3)*.5,1+floor(i/3)*.5,.3,.12,.25,.05,H('#c9a23a',.5));});
prop('bell',-42.2,1.13,-33,0,1,null,null);prop('ledger',-44.6,1.13,-33,.2,1,null,null);prop('table_lamp',-45.6,1.13,-33.1,0,1,null,null);
prop('bed',-60.4,0,-35.6,0,1,null,()=>{W.bx(0,0,0,2,.55,3.6,H('#5a6a6a'));W.bx(0,.55,-1.3,1.6,.2,.8,H('#b9b4a4'));W.bx(0,0,-1.9,2.1,1.1,.14,PAL.woodD);});col(-61.5,-37.5,-59.3,-33.8,1);
prop('nightstand',-56.2,0,-30.2,0,1,null,()=>{W.bx(0,0,0,1.2,.8,1,PAL.wood);});col(-56.8,-30.7,-55.6,-29.7,1);
prop('book',-56.2,.8,-30.2,.3,1,null,()=>W.bx(0,0,0,.5,.1,.36,H('#3a1f1f')));prop('candle',-56.55,.8,-29.95,0,1,null,null);
prop('bed',-49.5,0,-36,0,.95,{pal:{blanket:H('#6a5a5a')}},()=>{W.bx(0,0,0,2,.55,3.4,H('#6a5a5a'));});col(-50.6,-37.7,-48.4,-34.3,1);prop('nightstand',-53.8,0,-37,0,.85,null,()=>W.bx(0,0,0,1,.8,1,PAL.wood));col(-54.3,-37.5,-53.3,-36.5,1);
prop('wardrobe',-61.4,0,-30.4,PI/2,1,null,null);col(-61.9,-31.2,-60.9,-29.6,2);prop('armchair',-41.2,0,-28.2,-2.4,1,null,null);col(-41.8,-28.8,-40.6,-27.6,1);
prop('chair',-50.4,0,-30,2.2,1,null,null);
LAMPS.push([-44,2.4,-31,10,[1,.7,.4]],[-58.5,2.4,-33,7.5,[.9,.62,.36]],[-51.5,2.4,-34,6,[.8,.5,.3]]);
// motel sign
prop('motel_sign',-36,0,-25.5,0,1,null,()=>{W.cyl(0,0,0,.1,.1,3.6,5,PAL.dark);W.bx(0,3.1,0,2.6,1,.16,H('#263238'));W.bx(0,3.1,.1,2.3,.7,.06,H('#e0503a',.9));});LAMPS.push([-36,3,-24.6,9,[.9,.3,.22]]);col(-36.15,-25.65,-35.85,-25.35,1);
BLD.push([-63,-39,-39,-25]);

// scattered trees (avoid roads, buildings)
{let n=0,tries=0;while(n<125&&tries<4000){tries++;const x=rr(-138,62),z=rr(-46,45);let ok=true;for(const r of NOTREE)if(x>r[0]&&x<r[2]&&z>r[1]&&z<r[3])ok=false;for(const b of BLD)if(x>b[0]-2.2&&x<b[2]+2.2&&z>b[1]-2.2&&z<b[3]+3)ok=false;
  if(abs(z-42)<4||abs(x-10)<4.2||abs(z+8)<4.2||roadW(x,z)>.15)ok=false;for(const c of cols)if(c.h>0&&x>c.x0-1.2&&x<c.x1+1.2&&z>c.z0-1.2&&z<c.z1+1.2)ok=false;if(!ok)continue;tree(x,z,rr(.9,1.5));n++;}}
// thick tree wall at the edges
for(let x=-140;x<66;x+=2.6){tree(x+rr(-.5,.5),-49.5+rr(-1,1),rr(1.2,1.8),false);if(abs(x+28)>4)tree(x+rr(-.5,.5),-52.5,rr(1.2,1.8),false,FAR);}
for(let z=-46;z<44;z+=2.8){tree(-143.5+rr(-.6,.6),z,rr(1.2,1.8),false);tree(65.5+rr(-.6,.6),z,rr(1.2,1.8),false);}
// rocks along the shore and edges
for(let i=0;i<64;i++){const x=rr(-138,62),z=i<36?rr(44.6,46.6):rr(-46,40);if(i>=26&&roadW(x,z)>.1)continue;let ok=true;for(const b of BLD)if(x>b[0]-1&&x<b[2]+1&&z>b[1]-1&&z<b[3]+1)ok=false;for(const c of cols)if(c.h>0&&c.h<20&&x>c.x0-.8&&x<c.x1+.8&&z>c.z0-.8&&z<c.z1+.8)ok=false;if(ok)prop('rock_'+'abc'[i%3],x,-.05,z,rnd()*6.28,rr(.5,1.2),null,null);}

// --- vegetation: grass tufts, ferns, bushes, flowers, reeds (mode 3: sways in the wind)
function bladeTuft(x,z,s,hue){const n=5+floor(rnd()*4),gy=groundH(x,z);for(let i=0;i<n;i++){const a=rnd()*6.28,r=.05+rnd()*.14,h=(.28+rnd()*.38)*s,lean=.12+rnd()*.25,w=.035*s;
    const bx=x+cos(a)*r*s,bz=z+sin(a)*r*s,tx=bx+cos(a)*lean*s,tz=bz+sin(a)*lean*s,px=-sin(a)*w,pz=cos(a)*w;
    const c0=[hue[0]*.55,hue[1]*.55,hue[2]*.55,0],c1=[hue[0]*(1+rnd()*.3),hue[1]*(1+rnd()*.25),hue[2],1];const n0=[0,1,0];
    VEG.vert([bx-px,gy,bz-pz],n0,c0,n0);VEG.vert([bx+px,gy,bz+pz],n0,c0,n0);VEG.vert([tx,gy+h,tz],n0,c1,n0);}}
{const HUES=[H('#4f6e46'),H('#5d7a4a'),H('#6b7448'),H('#49663f'),H('#7a7a52')];let n=0,tries=0;
 while(n<9800&&tries<56000){tries++;const x=rr(-142,64),z=rr(-47,45.5);if(roadW(x,z)>.35)continue;let ok=true;for(const b of BLD)if(x>b[0]-.3&&x<b[2]+.3&&z>b[1]-.3&&z<b[3]+.3){ok=false;break;}
   if(!ok)continue;for(const c of cols)if(c.h>.5&&c.h<20&&x>c.x0-.15&&x<c.x1+.15&&z>c.z0-.15&&z<c.z1+.15){ok=false;break;}if(!ok)continue;
   if(x>-101&&x<-79&&z>-5&&z<14||x>-136&&x<-118&&z>8&&z<18)continue;   // market square, schoolyard
   const sand=z>44.2,dense=fbm(x*.12,z*.12);if(rnd()>dense*1.3)continue;
   const v=rnd(),s=rr(.8,1.35)*(sand?.8:1);
   if(sand){if(!VEG.at(mM(mT(x,groundH(x,z),z),mRy(rnd()*6.28),mS(s,s,s)),()=>VEG.model('reeds',{sway:1})))bladeTuft(x,z,s*1.4,H('#7c7650'));}
   else if(v<.04){prop('bush_'+'ab'[floor(rnd()*2)],x,groundH(x,z),z,rnd()*6.28,s,{sway:.35},()=>bladeTuft(x,z,s*1.6,HUES[3]),VEG);}
   else if(v<.09){prop('fern',x,groundH(x,z),z,rnd()*6.28,s,{sway:.8},()=>bladeTuft(x,z,s*1.2,HUES[0]),VEG);}
   else if(v<.11){prop('flower',x,groundH(x,z),z,rnd()*6.28,s,{sway:1},()=>bladeTuft(x,z,s,H('#8c8a6a')),VEG);}
   else if(v<.13){prop('mushroom',x,groundH(x,z),z,rnd()*6.28,s,null,null,VEG);}
   else{const nm='grass_'+'abc'[floor(rnd()*3)];if(!VEG.at(mM(mT(x,groundH(x,z),z),mRy(rnd()*6.28),mS(s,s,s)),()=>VEG.model(nm,{sway:1,k:.85+rnd()*.35})))bladeTuft(x,z,s,HUES[floor(rnd()*HUES.length)]);}
   n++;}}

// --- nav grid
const GX0=-142,GZ0=-48,GW=206,GH=132;const blocked=new Uint8Array(GW*GH);
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
const M_world=mesh(W),M_far=mesh(FAR),M_ground=mesh(GR),M_sea=mesh(SEA),M_veg=mesh(VEG);
