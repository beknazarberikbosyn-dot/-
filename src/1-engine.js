'use strict';
// ================= ENGINE: math, geometry, WebGL, audio =================
const $=id=>document.getElementById(id);
const {sin,cos,abs,min,max,PI,hypot,atan2,floor,sqrt,exp}=Math;
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
let seed=11;function rnd(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}
const rr=(a,b)=>a+rnd()*(b-a);
// --- matrices (column-major)
const mT=(x,y,z)=>[1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1];
const mS=(x,y,z)=>[x,0,0,0,0,y,0,0,0,0,z,0,0,0,0,1];
const mRy=a=>{const c=cos(a),s=sin(a);return[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1];};
const mRx=a=>{const c=cos(a),s=sin(a);return[1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1];};
const mRz=a=>{const c=cos(a),s=sin(a);return[c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1];};
function mMul(a,b){const o=new Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o;}
const mM=(...m)=>m.reduce(mMul);
const mP=(m,p)=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
function mPersp(fov,asp,n,f){const t=1/Math.tan(fov/2);return[t/asp,0,0,0,0,t,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0];}
function vNorm(v){const l=hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];}
function vCross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function mLook(e,t,u){const f=vNorm([t[0]-e[0],t[1]-e[1],t[2]-e[2]]),s=vNorm(vCross(f,u)),v=vCross(s,f);
  return[s[0],v[0],-f[0],0,s[1],v[1],-f[1],0,s[2],v[2],-f[2],0,-(s[0]*e[0]+s[1]*e[1]+s[2]*e[2]),-(v[0]*e[0]+v[1]*e[1]+v[2]*e[2]),f[0]*e[0]+f[1]*e[1]+f[2]*e[2],1];}
// matrix that maps +Y to direction d
function mAlignY(d){d=vNorm(d);let a=abs(d[1])>.95?[1,0,0]:[0,1,0];const x=vNorm(vCross(a,d)),z=vCross(x,d);return[x[0],x[1],x[2],0,d[0],d[1],d[2],0,z[0],z[1],z[2],0,0,0,0,1];}
function H(hex,e=0){const n=parseInt(hex.slice(1),16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255,e];}

// --- geometry builder: pos3 nrm3 col4 outlineDir3
class Geo{
  constructor(j=.08){this.v=[];this.m=null;this.j=j;}
  X(p){return this.m?mP(this.m,p):p;}
  tri(a,b,c,col,ctr,k){
    let n=vCross([b[0]-a[0],b[1]-a[1],b[2]-a[2]],[c[0]-a[0],c[1]-a[1],c[2]-a[2]]);const l=hypot(n[0],n[1],n[2]);if(l<1e-9)return;n=[n[0]/l,n[1]/l,n[2]/l];
    if(ctr){const d=[(a[0]+b[0]+c[0])/3-ctr[0],(a[1]+b[1]+c[1])/3-ctr[1],(a[2]+b[2]+c[2])/3-ctr[2]];if(n[0]*d[0]+n[1]*d[1]+n[2]*d[2]<0){const t=b;b=c;c=t;n=[-n[0],-n[1],-n[2]];}}
    if(k==null)k=1+(rnd()-.5)*2*this.j;
    for(const p of[a,b,c]){const o=ctr?vNorm([p[0]-ctr[0],p[1]-ctr[1],p[2]-ctr[2]]):n;this.v.push(p[0],p[1],p[2],n[0],n[1],n[2],col[0]*k,col[1]*k,col[2]*k,col[3]||0,o[0],o[1],o[2]);}
  }
  quad(a,b,c,d,col,ctr){const k=1+(rnd()-.5)*2*this.j;this.tri(a,b,c,col,ctr,k);this.tri(a,c,d,col,ctr,k);}
  box(x,y,z,sx,sy,sz,col){const hx=sx/2,hy=sy/2,hz=sz/2,p=[];for(let i=0;i<8;i++)p.push(this.X([x+(i&1?hx:-hx),y+(i&2?hy:-hy),z+(i&4?hz:-hz)]));const c=this.X([x,y,z]);
    for(const f of[[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]])this.quad(p[f[0]],p[f[1]],p[f[2]],p[f[3]],col,c);}
  bx(x,y0,z,sx,sy,sz,col){this.box(x,y0+sy/2,z,sx,sy,sz,col);} // base at y0
  cyl(x,y,z,rb,rt,h,n,col){const c=this.X([x,y+h/2,z]),cb=this.X([x,y,z]),ct=this.X([x,y+h,z]);
    for(let i=0;i<n;i++){const a0=i/n*2*PI,a1=(i+1)/n*2*PI;
      const b0=this.X([x+cos(a0)*rb,y,z+sin(a0)*rb]),b1=this.X([x+cos(a1)*rb,y,z+sin(a1)*rb]),t0=this.X([x+cos(a0)*rt,y+h,z+sin(a0)*rt]),t1=this.X([x+cos(a1)*rt,y+h,z+sin(a1)*rt]);
      this.quad(b0,b1,t1,t0,col,c);if(rb>0)this.tri(cb,b0,b1,col,c);if(rt>0)this.tri(ct,t0,t1,col,c);}}
  sph(x,y,z,rx,ry,rz,col,n=7,r=5){const c=this.X([x,y,z]);const pt=(i,j)=>{const th=i/r*PI,ph=j/n*2*PI;return this.X([x+sin(th)*cos(ph)*rx,y+cos(th)*ry,z+sin(th)*sin(ph)*rz]);};
    for(let i=0;i<r;i++)for(let j=0;j<n;j++)this.quad(pt(i,j),pt(i+1,j),pt(i+1,j+1),pt(i,j+1),col,c);}
  prism(x0,z0,x1,z1,y,rh,col,ov=.45){x0-=ov;x1+=ov;z0-=ov;z1+=ov;const X=p=>this.X(p),c=X([(x0+x1)/2,y+rh/3,(z0+z1)/2]);
    if(x1-x0>=z1-z0){const zm=(z0+z1)/2,a=X([x0,y,z0]),b=X([x1,y,z0]),d=X([x0,y,z1]),e=X([x1,y,z1]),r0=X([x0+.3,y+rh,zm]),r1=X([x1-.3,y+rh,zm]);
      this.quad(a,b,r1,r0,col,c);this.quad(d,e,r1,r0,col,c);this.tri(a,d,r0,col,c);this.tri(b,e,r1,col,c);this.quad(a,b,e,d,col,c);}
    else{const xm=(x0+x1)/2,a=X([x0,y,z0]),b=X([x0,y,z1]),d=X([x1,y,z0]),e=X([x1,y,z1]),r0=X([xm,y+rh,z0+.3]),r1=X([xm,y+rh,z1-.3]);
      this.quad(a,b,r1,r0,col,c);this.quad(d,e,r1,r0,col,c);this.tri(a,d,r0,col,c);this.tri(b,e,r1,col,c);this.quad(a,b,e,d,col,c);}}
  at(m,fn){const o=this.m;this.m=o?mMul(o,m):m;fn();this.m=o;}
}

// --- WebGL
const cv=$('gl');const gl=cv.getContext('webgl',{antialias:true,alpha:false});
if(!gl){$('err').style.display='flex';throw new Error('no webgl');}
const VS=`attribute vec3 aP,aN,aO;attribute vec4 aC;uniform mat4 uVP,uM;uniform float uOut;varying vec3 vW,vN;varying vec4 vC;
void main(){vec4 w=uM*vec4(aP,1.);vec3 o=mat3(uM)*aO;w.xyz+=normalize(o+vec3(1e-5))*uOut;vW=w.xyz;vN=mat3(uM)*aN;vC=aC;gl_Position=uVP*w;}`;
const FS=`precision highp float;varying vec3 vW,vN;varying vec4 vC;
uniform vec3 uFog,uAmb,uSunD,uSunC,uFocus;uniform float uFogD,uOut,uHatch,uAlpha,uFogMin;uniform vec4 uL[8];uniform vec3 uLC[8];
void main(){vec3 col;float em=vC.a;
 if(uOut>0.){col=vec3(.02,.045,.05);em=0.;}
 else{vec3 n=normalize(vN);vec3 l=uAmb+uSunC*max(dot(n,uSunD),0.);
  for(int i=0;i<8;i++){vec3 d=uL[i].xyz-vW;float ds=length(d);float a=max(0.,1.-ds/uL[i].w);a*=a;l+=uLC[i]*a*(.45+.55*max(dot(n,d/max(ds,.001)),0.));}
  float ll=max(dot(l,vec3(.33)),.001);l*=mix(1.,(floor(ll*6.+.5)/6.)/ll,.6);
  col=vC.rgb*l;float lum=dot(col,vec3(.3,.6,.1));
  float h=step(.55,fract((gl_FragCoord.x+gl_FragCoord.y)/7.));float h2=step(.6,fract((gl_FragCoord.x-gl_FragCoord.y)/9.));
  col*=1.-uHatch*(1.-em)*(.34*h*(1.-smoothstep(.05,.2,lum))+.3*h2*(1.-smoothstep(.02,.09,lum)));
  col=mix(col,vC.rgb,em);}
 float d=distance(vW,uFocus)*uFogD;float f=1.-exp(-d*d);f=max(f,uFogMin)*(1.-em*.75);
 gl_FragColor=vec4(mix(col,uFog,clamp(f,0.,1.)),uAlpha);}`;
function sh(t,s){const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o;}
const prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);gl.useProgram(prog);
const U={};for(const n of['uVP','uM','uOut','uFog','uAmb','uSunD','uSunC','uFocus','uFogD','uHatch','uAlpha','uFogMin','uL','uLC'])U[n]=gl.getUniformLocation(prog,n);
const A={aP:gl.getAttribLocation(prog,'aP'),aN:gl.getAttribLocation(prog,'aN'),aC:gl.getAttribLocation(prog,'aC'),aO:gl.getAttribLocation(prog,'aO')};
for(const k in A)gl.enableVertexAttribArray(A[k]);
function mesh(g){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(g.v),gl.STATIC_DRAW);return{b,n:g.v.length/13};}
const R={items:[],lights:[],fog:[.075,.15,.165],fogD:1/30,fogMin:0,focus:[0,0,0],amb:[.36,.47,.5],sunC:[.34,.42,.46],scale:1,outline:true,hatch:true,vp:null,w:1,h:1};
const I4=mT(0,0,0);
function draw(m,mat,out=.035,alpha=1){R.items.push({m,mat:mat||I4,out,alpha});}
function light(x,y,z,r,c){R.lights.push([x,y,z,r,c[0],c[1],c[2]]);}
function bindMesh(m){gl.bindBuffer(gl.ARRAY_BUFFER,m.b);gl.vertexAttribPointer(A.aP,3,gl.FLOAT,false,52,0);gl.vertexAttribPointer(A.aN,3,gl.FLOAT,false,52,12);gl.vertexAttribPointer(A.aC,4,gl.FLOAT,false,52,24);gl.vertexAttribPointer(A.aO,3,gl.FLOAT,false,52,40);}
function resize(){const w=floor(innerWidth*R.scale),h=floor(innerHeight*R.scale);if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}R.w=w;R.h=h;const hc=$('hud2d');if(hc.width!==innerWidth||hc.height!==innerHeight){hc.width=innerWidth;hc.height=innerHeight;}}
function render(eye,tgt,fov){
  resize();gl.viewport(0,0,R.w,R.h);gl.clearColor(R.fog[0],R.fog[1],R.fog[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);
  R.vp=mMul(mPersp(fov,R.w/R.h,.3,900),mLook(eye,tgt,[0,1,0]));
  gl.uniformMatrix4fv(U.uVP,false,R.vp);gl.uniform3fv(U.uFog,R.fog);gl.uniform3fv(U.uAmb,R.amb);gl.uniform3fv(U.uSunD,vNorm([-.4,.8,.45]));gl.uniform3fv(U.uSunC,R.sunC);
  gl.uniform3fv(U.uFocus,R.focus);gl.uniform1f(U.uFogD,R.fogD);gl.uniform1f(U.uFogMin,R.fogMin);gl.uniform1f(U.uHatch,R.hatch?1:0);
  const f=R.focus;R.lights.sort((a,b)=>(hypot(a[0]-f[0],a[2]-f[2])-a[3])-(hypot(b[0]-f[0],b[2]-f[2])-b[3]));
  const L=new Float32Array(32),LC=new Float32Array(24);for(let i=0;i<8&&i<R.lights.length;i++){const l=R.lights[i];L.set(l.slice(0,4),i*4);LC.set(l.slice(4),i*3);}
  for(let i=R.lights.length;i<8;i++)L[i*4+3]=1;
  gl.uniform4fv(U.uL,L);gl.uniform3fv(U.uLC,LC);
  gl.disable(gl.BLEND);gl.depthMask(true);gl.cullFace(gl.BACK);gl.uniform1f(U.uOut,0);gl.uniform1f(U.uAlpha,1);
  for(const it of R.items)if(it.alpha>=1){bindMesh(it.m);gl.uniformMatrix4fv(U.uM,false,it.mat);gl.drawArrays(gl.TRIANGLES,0,it.m.n);}
  if(R.outline){gl.cullFace(gl.FRONT);for(const it of R.items)if(it.alpha>=1&&it.out>0){bindMesh(it.m);gl.uniformMatrix4fv(U.uM,false,it.mat);gl.uniform1f(U.uOut,it.out);gl.drawArrays(gl.TRIANGLES,0,it.m.n);}gl.cullFace(gl.BACK);}
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.uniform1f(U.uOut,0);
  for(const it of R.items)if(it.alpha<1){bindMesh(it.m);gl.uniformMatrix4fv(U.uM,false,it.mat);gl.uniform1f(U.uAlpha,it.alpha);gl.drawArrays(gl.TRIANGLES,0,it.m.n);}
  gl.depthMask(true);R.items.length=0;R.lights.length=0;
}
function proj(x,y,z){const m=R.vp,w=m[3]*x+m[7]*y+m[11]*z+m[15];return{x:(m[0]*x+m[4]*y+m[8]*z+m[12])/w*.5+.5,y:.5-(m[1]*x+m[5]*y+m[9]*z+m[13])/w*.5,w};}

// --- Audio (all synthesized)
const AU={ctx:null,vol:.8,ambVol:.7};
function auInit(){if(AU.ctx)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;try{
  const c=AU.ctx=new C();AU.master=c.createGain();AU.master.connect(c.destination);AU.amb=c.createGain();AU.amb.connect(AU.master);AU.sfx=c.createGain();AU.sfx.connect(AU.master);
  const b=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.nb=b;
  const loop=(type,f,q,vol,hz)=>{const s=c.createBufferSource();s.buffer=b;s.loop=true;const fl=c.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=c.createGain();g.gain.value=vol;
    const lf=c.createOscillator();lf.frequency.value=hz;const lg=c.createGain();lg.gain.value=vol*.7;lf.connect(lg);lg.connect(g.gain);lf.start();s.connect(fl);fl.connect(g);g.connect(AU.amb);s.start();return g;};
  loop('bandpass',480,.7,.07,.11);AU.sea=loop('lowpass',380,.4,.09,.085);
  for(const f of[49,49.7,73.6]){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=f;const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=170;const g=c.createGain();g.gain.value=.045;o.connect(fl);fl.connect(g);g.connect(AU.amb);o.start();}
  auVol();}catch(e){AU.ctx=null;}}
function auVol(){if(!AU.ctx)return;AU.master.gain.value=AU.vol;AU.amb.gain.value=AU.ambVol;}
function tone(f,d,o={}){if(!AU.ctx)return;const c=AU.ctx,t=c.currentTime+(o.delay||0),os=c.createOscillator(),g=c.createGain();os.type=o.type||'sine';os.frequency.setValueAtTime(f,t);if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t+d);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(o.vol||.2,t+min(.02,d/3));g.gain.exponentialRampToValueAtTime(.001,t+d);os.connect(g);let out=g;
  if(o.lp){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp;g.connect(fl);out=fl;}out.connect(o.dest||AU.sfx);os.start(t);os.stop(t+d+.05);}
function noise(d,o={}){if(!AU.ctx)return;const c=AU.ctx,t=c.currentTime+(o.delay||0),s=c.createBufferSource();s.buffer=AU.nb;s.loop=true;const fl=c.createBiquadFilter();fl.type=o.type||'lowpass';fl.frequency.setValueAtTime(o.f||800,t);if(o.to)fl.frequency.exponentialRampToValueAtTime(o.to,t+d);fl.Q.value=o.q||.7;
  const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(o.vol||.2,t+(o.att||.01));g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(fl);fl.connect(g);g.connect(AU.sfx);s.start(t,Math.random());s.stop(t+d+.05);}
let mumG=null;
function mumbleStop(){if(mumG&&AU.ctx){mumG.gain.setTargetAtTime(0,AU.ctx.currentTime,.03);mumG=null;}}
function mumble(dur,pitch,phone,vol=.16,keep){if(!AU.ctx)return;const c=AU.ctx;if(!keep)mumbleStop();const mg=c.createGain();mg.gain.value=phone?vol*.55:vol;let out=mg;
  if(phone){const hp=c.createBiquadFilter();hp.type='bandpass';hp.frequency.value=1700;hp.Q.value=1.6;mg.connect(hp);out=hp;}out.connect(AU.sfx);if(!keep)mumG=mg;
  let t=c.currentTime+.03;const end=t+dur;while(t<end){const len=.06+Math.random()*.08,os=c.createOscillator(),fl=c.createBiquadFilter(),g=c.createGain();os.type='sawtooth';const p=pitch*(.86+Math.random()*.34);
    os.frequency.setValueAtTime(p,t);os.frequency.linearRampToValueAtTime(p*(.92+Math.random()*.16),t+len);fl.type='bandpass';fl.frequency.value=420+Math.random()*900;fl.Q.value=4;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1,t+.02);g.gain.setValueAtTime(1,t+len);g.gain.linearRampToValueAtTime(0,t+len+.03);os.connect(fl);fl.connect(g);g.connect(mg);os.start(t);os.stop(t+len+.05);
    t+=len+.03+(Math.random()<.14?.16:Math.random()*.04);}}
const SFX={
  step(){noise(.06,{f:300+Math.random()*200,vol:.05});},
  hit(){noise(.12,{f:900,to:200,vol:.3});tone(110,.12,{type:'square',vol:.12,to:60});},
  hurt(){noise(.2,{f:500,to:120,vol:.4});tone(70,.25,{vol:.35,to:40});},
  parry(){tone(880,.1,{type:'triangle',vol:.18});noise(.08,{f:3000,type:'highpass',vol:.12});},
  swing(){noise(.14,{f:1200,type:'bandpass',q:2,vol:.09,to:500});},
  alert(){tone(220,.5,{type:'sawtooth',vol:.11,to:330,lp:1200});tone(233,.5,{type:'sawtooth',vol:.09,to:349,lp:1200});},
  pick(){tone(520,.1,{type:'triangle',vol:.15});tone(780,.14,{type:'triangle',vol:.14,delay:.08});},
  click(){tone(300,.05,{type:'square',vol:.07});},
  solve(){[262,311,392,523].forEach((f,i)=>tone(f,.9,{type:'triangle',vol:.12,delay:i*.12}));tone(65,1.6,{type:'sawtooth',vol:.14,lp:300});},
  page(){noise(.25,{f:2500,type:'bandpass',q:1,vol:.06,to:900});},
  thud(){tone(90,.5,{vol:.7,to:30});noise(.3,{f:400,to:80,vol:.6});},
  heart(){tone(58,.14,{vol:.35});tone(52,.16,{vol:.28,delay:.2});},
  door(){noise(.3,{f:300,vol:.3,to:100});tone(80,.2,{vol:.3,to:50});},
  splash(){noise(2.2,{f:2500,to:200,vol:.5,att:.05});},
  rumble(d){noise(d,{f:90,vol:.9,att:1.5,to:60});tone(31,d,{type:'sawtooth',vol:.5,lp:120});},
  roar(){if(!AU.ctx)return;for(const[f,v]of[[62,.5],[93,.35],[47,.5],[140,.16]]){tone(f*1.5,5.5,{type:'sawtooth',vol:v,to:f*.55,lp:700});}noise(5.5,{f:1400,to:150,vol:.6,att:.5,type:'bandpass',q:1.2});noise(5.5,{f:300,to:70,vol:.9,att:.3});},
};
