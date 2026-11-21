'use strict';
// ================= ENGINE: math, geometry, models, WebGL pipeline, particles, audio =================
const $=id=>document.getElementById(id);
const {sin,cos,abs,min,max,PI,hypot,atan2,floor,sqrt,exp,acos,pow}=Math;
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t, sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
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
const mD=(m,p)=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2],m[1]*p[0]+m[5]*p[1]+m[9]*p[2],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]];
function mPersp(fov,asp,n,f){const t=1/Math.tan(fov/2);return[t/asp,0,0,0,0,t,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0];}
function vNorm(v){const l=hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];}
function vCross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
const vSub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],vAdd=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],vSc=(a,s)=>[a[0]*s,a[1]*s,a[2]*s],vDot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],vLen=a=>hypot(a[0],a[1],a[2]),vLerp=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
function mLook(e,t,u){const f=vNorm([t[0]-e[0],t[1]-e[1],t[2]-e[2]]),s=vNorm(vCross(f,u)),v=vCross(s,f);
  return[s[0],v[0],-f[0],0,s[1],v[1],-f[1],0,s[2],v[2],-f[2],0,-(s[0]*e[0]+s[1]*e[1]+s[2]*e[2]),-(v[0]*e[0]+v[1]*e[1]+v[2]*e[2]),f[0]*e[0]+f[1]*e[1]+f[2]*e[2],1];}
// matrix that maps +Y to direction d
function mAlignY(d){d=vNorm(d);let a=abs(d[1])>.95?[1,0,0]:[0,1,0];const x=vNorm(vCross(a,d)),z=vCross(x,d);return[x[0],x[1],x[2],0,d[0],d[1],d[2],0,z[0],z[1],z[2],0,0,0,0,1];}
// basis from a "down" axis (local -Y) and a hint for local +Z
function mBasis(o,down,fwd){const y=vNorm(vSc(down,-1));let z=vSub(fwd,vSc(y,vDot(fwd,y)));z=vLen(z)<1e-4?vNorm(vCross([1,0,0],y)):vNorm(z);const x=vCross(y,z);return[x[0],x[1],x[2],0,y[0],y[1],y[2],0,z[0],z[1],z[2],0,o[0],o[1],o[2],1];}
function mInv(m){const a=m,o=new Array(16);const b00=a[0]*a[5]-a[1]*a[4],b01=a[0]*a[6]-a[2]*a[4],b02=a[0]*a[7]-a[3]*a[4],b03=a[1]*a[6]-a[2]*a[5],b04=a[1]*a[7]-a[3]*a[5],b05=a[2]*a[7]-a[3]*a[6],
  b06=a[8]*a[13]-a[9]*a[12],b07=a[8]*a[14]-a[10]*a[12],b08=a[8]*a[15]-a[11]*a[12],b09=a[9]*a[14]-a[10]*a[13],b10=a[9]*a[15]-a[11]*a[13],b11=a[10]*a[15]-a[11]*a[14];
  const d=1/(b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06);
  o[0]=(a[5]*b11-a[6]*b10+a[7]*b09)*d;o[1]=(a[2]*b10-a[1]*b11-a[3]*b09)*d;o[2]=(a[13]*b05-a[14]*b04+a[15]*b03)*d;o[3]=(a[10]*b04-a[9]*b05-a[11]*b03)*d;
  o[4]=(a[6]*b08-a[4]*b11-a[7]*b07)*d;o[5]=(a[0]*b11-a[2]*b08+a[3]*b07)*d;o[6]=(a[14]*b02-a[12]*b05-a[15]*b01)*d;o[7]=(a[8]*b05-a[10]*b02+a[11]*b01)*d;
  o[8]=(a[4]*b10-a[5]*b08+a[7]*b06)*d;o[9]=(a[1]*b08-a[0]*b10-a[3]*b06)*d;o[10]=(a[12]*b04-a[13]*b02+a[15]*b00)*d;o[11]=(a[9]*b02-a[8]*b04-a[11]*b00)*d;
  o[12]=(a[5]*b07-a[4]*b09-a[6]*b06)*d;o[13]=(a[0]*b09-a[1]*b07+a[2]*b06)*d;o[14]=(a[13]*b01-a[12]*b03-a[14]*b00)*d;o[15]=(a[8]*b03-a[9]*b01+a[10]*b00)*d;return o;}
function H(hex,e=0){const n=parseInt(hex.slice(1),16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255,e];}
// 2-bone IK: shoulder s, target t, bone lengths, pole hint -> elbow position
function ik2(s,t,l1,l2,pole){let d=vSub(t,s),L=vLen(d);const Lc=clamp(L,abs(l1-l2)+.01,l1+l2-.01);const u=vSc(d,1/(L||1));
  const a=acos(clamp((l1*l1+Lc*Lc-l2*l2)/(2*l1*Lc),-1,1));let p=vSub(pole,s);p=vSub(p,vSc(u,vDot(p,u)));p=vNorm(p);
  return{e:vAdd(s,vAdd(vSc(u,l1*cos(a)),vSc(p,l1*sin(a)))),t:vAdd(s,vSc(u,Lc))};}

// --- geometry builder: pos3 nrm3 col4 outlineDir3 (13 floats / vertex), backed by a growable Float32Array
class Geo{
  constructor(j=.08){this.v=new Float32Array(1<<14);this.n=0;this.m=null;this.j=j;}
  X(p){return this.m?mP(this.m,p):p;}
  grow(k){if(this.n+k>this.v.length){let L=this.v.length*2;while(L<this.n+k)L*=2;const nv=new Float32Array(L);nv.set(this.v.subarray(0,this.n));this.v=nv;}}
  vert(p,n,c,o){this.grow(13);const v=this.v;let i=this.n;v[i++]=p[0];v[i++]=p[1];v[i++]=p[2];v[i++]=n[0];v[i++]=n[1];v[i++]=n[2];v[i++]=c[0];v[i++]=c[1];v[i++]=c[2];v[i++]=c[3];v[i++]=o[0];v[i++]=o[1];v[i++]=o[2];this.n=i;}
  tri(a,b,c,col,ctr,k){
    let n=vCross([b[0]-a[0],b[1]-a[1],b[2]-a[2]],[c[0]-a[0],c[1]-a[1],c[2]-a[2]]);const l=hypot(n[0],n[1],n[2]);if(l<1e-9)return;n=[n[0]/l,n[1]/l,n[2]/l];
    if(ctr){const d=[(a[0]+b[0]+c[0])/3-ctr[0],(a[1]+b[1]+c[1])/3-ctr[1],(a[2]+b[2]+c[2])/3-ctr[2]];if(n[0]*d[0]+n[1]*d[1]+n[2]*d[2]<0){const t=b;b=c;c=t;n=[-n[0],-n[1],-n[2]];}}
    if(k==null)k=1+(rnd()-.5)*2*this.j;const cc=[col[0]*k,col[1]*k,col[2]*k,col[3]||0];
    for(const p of[a,b,c])this.vert(p,n,cc,ctr?vNorm([p[0]-ctr[0],p[1]-ctr[1],p[2]-ctr[2]]):n);
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
  at(m,fn){const o=this.m;this.m=o?mMul(o,m):m;const r=fn();this.m=o;return r;}
  // stamp a Blender model (see MODELS) with the current transform; opt.pal overrides colours by material name, opt.k tints, opt.sway marks vegetation sway weight
  model(name,opt){opt=opt||{};const M=getModel(name);if(!M)return false;const m=this.m||mT(0,0,0),tint=opt.k||1,pal=M.pal.map((p,i)=>{const o=opt.pal&&opt.pal[M.names[i]];const c=o||p;return[c[0]*tint,c[1]*tint,c[2]*tint,opt.em!=null?opt.em:(o?(o[3]||0):c[3])];});
    const P=M.pos,N=M.sn,ix=M.idx,ao=M.ao,tc=M.tc,nt=ix.length/3,sw=opt.sway||0,ht=M.h||1;const fdm=(M.names||[]).map(nm=>nm.startsWith('fd_'));this.grow(nt*39);
    const wp=new Float32Array(P.length),wn=new Float32Array(N.length);for(let i=0;i<P.length;i+=3){const p=mP(m,[P[i],P[i+1],P[i+2]]),n=vNorm(mD(m,[N[i],N[i+1],N[i+2]]));wp[i]=p[0];wp[i+1]=p[1];wp[i+2]=p[2];wn[i]=n[0];wn[i+1]=n[1];wn[i+2]=n[2];}
    const det=m[0]*(m[5]*m[10]-m[6]*m[9])-m[4]*(m[1]*m[10]-m[2]*m[9])+m[8]*(m[1]*m[6]-m[2]*m[5]),flip=det<0;
    for(let t=0;t<nt;t++){let a=ix[t*3],b=ix[t*3+1],c=ix[t*3+2];if(flip){const q=b;b=c;c=q;}const col=pal[tc[t]],k=1+(rnd()-.5)*2*(opt.j!=null?opt.j:.04);
      const A=[wp[a*3],wp[a*3+1],wp[a*3+2]],B=[wp[b*3],wp[b*3+1],wp[b*3+2]],C=[wp[c*3],wp[c*3+1],wp[c*3+2]];let n=vCross(vSub(B,A),vSub(C,A));const l=vLen(n);if(l<1e-12)continue;n=vSc(n,1/l);
      const nf=fdm[tc[t]];   // 'fd_' face details: no outline shell, so eyes and lips are not ringed in black
      for(const v of[a,b,c]){const o=nf?1:ao[v]/255*.62+.38,cc=[col[0]*k*o,col[1]*k*o,col[2]*k*o,sw?sw*clamp(P[v*3+1]/ht,0,1):col[3]];this.vert([wp[v*3],wp[v*3+1],wp[v*3+2]],n,cc,nf?[0,0,0]:[wn[v*3],wn[v*3+1],wn[v*3+2]]);}}
    return true;}
}
// --- model decoding (data generated from Blender by tools/glb2js.py)
const MODEL_CACHE={};
function b64(s,T){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new T(u.buffer);}
function getModel(name){if(MODEL_CACHE[name]!==undefined)return MODEL_CACHE[name];const D=(typeof MODELS!=='undefined')&&MODELS[name];if(!D){MODEL_CACHE[name]=null;return null;}
  const q=b64(D.p,Int16Array),nv=q.length/3,pos=new Float32Array(q.length),[s,ox,oy,oz]=D.s;for(let i=0;i<nv;i++){pos[i*3]=q[i*3]/32767*s+ox;pos[i*3+1]=q[i*3+1]/32767*s+oy;pos[i*3+2]=q[i*3+2]/32767*s+oz;}
  const idx=nv>65535?b64(D.i,Uint32Array):b64(D.i,Uint16Array),tc=b64(D.c,Uint8Array),ao=D.a?b64(D.a,Uint8Array):new Uint8Array(nv).fill(255);
  const sn=new Float32Array(nv*3);for(let t=0;t<idx.length;t+=3){const a=idx[t],b=idx[t+1],c=idx[t+2];const A=[pos[a*3],pos[a*3+1],pos[a*3+2]],n=vCross(vSub([pos[b*3],pos[b*3+1],pos[b*3+2]],A),vSub([pos[c*3],pos[c*3+1],pos[c*3+2]],A));for(const v of[a,b,c]){sn[v*3]+=n[0];sn[v*3+1]+=n[1];sn[v*3+2]+=n[2];}}
  let hy=0;for(let i=1;i<pos.length;i+=3)hy=max(hy,pos[i]);
  return MODEL_CACHE[name]={pos,idx,tc,ao,sn,pal:D.pal,names:D.n||[],h:hy};}
const hasModel=n=>!!getModel(n);
function modelMesh(name,opt){const g=new Geo(0);if(!g.model(name,opt||{}))return null;return mesh(g);}

// --- WebGL
const cv=$('gl');const gl=cv.getContext('webgl',{antialias:true,alpha:false,preserveDrawingBuffer:false});
if(!gl){$('err').style.display='flex';throw new Error('no webgl');}
const NL=12;
const WAVE=`float wv(vec2 p,float t,float a){return a*(sin(p.x*.11+t*.8)*.55+sin(p.y*.19-t*1.15+p.x*.06)*.38+sin((p.x+p.y)*.33+t*1.9)*.16+sin((p.x*.7-p.y)*.61-t*2.7)*.09*(.3+uWave));}
float wh(vec2 p){float t=uTime,a=(.1+uWave*1.1)*mix(.35,1.,smoothstep(48.,62.,p.y));float h=wv(p,t,a);float d=distance(p,uRip.xy);h+=uRip.z*sin(d*.21-t*2.6)*exp(-d*.018)*smoothstep(uRip.w*30.+20.,uRip.w*30.,d);return h;}`;
const VS=`attribute vec3 aP,aN,aO;attribute vec4 aC;uniform mat4 uVP,uM;uniform float uOut,uTime,uMat,uWave;uniform vec2 uWind;uniform vec4 uRip;varying vec3 vW,vN;varying vec4 vC;
${WAVE}
void main(){vec4 w=uM*vec4(aP,1.);vec3 n=mat3(uM)*aN;vec4 c=aC;
 if(uMat>1.5&&uMat<2.5){float h=wh(w.xz);w.y+=h;n=normalize(vec3(h-wh(w.xz+vec2(.6,0.)),.6,h-wh(w.xz+vec2(0.,.6))));c.a=h;}
 if(uMat>2.5&&uMat<3.5){float k=c.a;float ph=dot(w.xz,vec2(.31,.23));w.xz+=uWind*(sin(uTime*2.1+ph)*.45+.55+sin(uTime*5.3+ph*2.)*.15)*k*.35;c.a=0.;}
 vec3 o=mat3(uM)*aO;w.xyz+=normalize(o+vec3(1e-5))*uOut;vW=w.xyz;vN=n;vC=c;gl_Position=uVP*w;}`;
const FS=`precision highp float;varying vec3 vW,vN;varying vec4 vC;uniform sampler2D uNz;
uniform vec3 uFog,uAmb,uSunD,uSunC,uFocus,uCam;uniform float uFogD,uOut,uHatch,uAlpha,uFogMin,uMat,uTime,uFlash,uWet,uFogH;uniform vec4 uL[${NL}];uniform vec3 uLC[${NL}];
void main(){vec3 col;float em=vC.a;vec3 n=normalize(vN);vec3 V=normalize(uCam-vW);
 if(uOut>0.){col=vec3(.02,.045,.05);em=0.;}
 else{vec3 base=vC.rgb;float spec=0.;
  if(uMat>.5&&uMat<1.5){em=0.;vec4 a=texture2D(uNz,vW.xz*.017),b=texture2D(uNz,vW.xz*.11),c=texture2D(uNz,vW.xz*.73);
   base*=.74+.46*a.r;base=mix(base,base*vec3(1.12,1.05,.72),smoothstep(.45,.8,a.g)*.6);base*=.86+.28*b.b;base*=.84+.3*c.g;
   float blade=smoothstep(.55,.9,texture2D(uNz,vW.xz*vec2(2.3,1.7)).a);base=mix(base,base*1.25,blade*.35);spec=uWet*.4*b.r;}
  else if(uMat>1.5&&uMat<2.5){em=0.;float h=vC.a;vec4 a=texture2D(uNz,vW.xz*.03+vec2(uTime*.01,uTime*.006)),b=texture2D(uNz,vW.xz*.09-vec2(uTime*.02,0.));
   n=normalize(n+vec3(a.r-.5,0.,b.g-.5)*.5);base=mix(vec3(.04,.11,.12),vec3(.09,.2,.2),a.g);float fr=pow(1.-max(dot(n,V),0.),3.);base+=fr*vec3(.12,.2,.22);
   float foam=smoothstep(.62,.98,b.r+h*.45)*(.08+.45*clamp(h,0.,1.));base=mix(base,vec3(.45,.56,.55),clamp(foam,0.,.55));spec=.9;}
  else if(uMat>4.5&&uMat<5.5){vec3 an=abs(n);vec4 s1=texture2D(uNz,vW.zy*.09)*an.x+texture2D(uNz,vW.xz*.09)*an.y+texture2D(uNz,vW.xy*.09)*an.z;
   vec4 s2=texture2D(uNz,vW.zy*.31)*an.x+texture2D(uNz,vW.xz*.31)*an.y+texture2D(uNz,vW.xy*.31)*an.z;
   float scale=smoothstep(.08,.42,s2.a);base*=.55+.6*s1.r;base*=.7+.42*scale;base=mix(base,base*vec3(.75,1.15,1.05),s1.g*.5);spec=.75*(1.-scale*.4);}
  vec3 l=uAmb+uSunC*max(dot(n,uSunD),0.);vec3 sp=vec3(0.);
  for(int i=0;i<${NL};i++){vec3 d=uL[i].xyz-vW;float ds=length(d);float a=max(0.,1.-ds/uL[i].w);a*=a;vec3 L=d/max(ds,.001);l+=uLC[i]*a*(.45+.55*max(dot(n,L),0.));
   if(spec>0.)sp+=uLC[i]*a*pow(max(dot(reflect(-L,n),V),0.),18.)*spec;}
  l+=uFlash*vec3(.75,.85,1.)*(.35+.65*max(n.y,0.)+.5*pow(1.-max(dot(n,V),0.),2.));sp+=uFlash*spec*vec3(.8,.9,1.)*pow(max(dot(reflect(vec3(0.,-1.,0.),n),V),0.),10.)*1.5;
  float ll=max(dot(l,vec3(.33)),.001);l*=mix(1.,(floor(ll*6.+.5)/6.)/ll,.55);
  col=base*l+sp;float lum=dot(col,vec3(.3,.6,.1));
  float h=step(.55,fract((gl_FragCoord.x+gl_FragCoord.y)/7.));float h2=step(.6,fract((gl_FragCoord.x-gl_FragCoord.y)/9.));
  col*=1.-uHatch*(1.-em)*(.34*h*(1.-smoothstep(.05,.2,lum))+.3*h2*(1.-smoothstep(.02,.09,lum)));
  col=mix(col,vC.rgb*(1.+uFlash*.3),em);}
 float d=distance(vW,uFocus)*uFogD;float f=1.-exp(-d*d);float hf=exp(-max(vW.y,0.)*uFogH);f=max(f,uFogMin*(.6+.4*hf))*(1.-em*.75);
 gl_FragColor=vec4(mix(col,uFog*(1.+uFlash*.8),clamp(f,0.,1.)),uAlpha);}`;
// depth pass: distance from camera packed into 2 bytes
const DVS=`attribute vec3 aP;attribute vec4 aC;uniform mat4 uVP,uM;uniform float uMat,uTime,uWave;uniform vec4 uRip;varying vec3 vW;
${WAVE}
void main(){vec4 w=uM*vec4(aP,1.);if(uMat>1.5&&uMat<2.5)w.y+=wh(w.xz);vW=w.xyz;gl_Position=uVP*w;}`;
const DFS=`precision highp float;varying vec3 vW;uniform vec3 uCam;void main(){float d=clamp(distance(vW,uCam)/320.,0.,1.)*65535.;float hi=floor(d/256.);gl_FragColor=vec4(hi/255.,(d-hi*256.)/255.,0.,1.);}`;
// volumetric mist: ray-march a ground-hugging slab of world-anchored noise, lit by the lanterns
const QVS=`attribute vec2 aQ;varying vec2 vUV;void main(){vUV=aQ*.5+.5;gl_Position=vec4(aQ,0.,1.);}`;
const MFS=`precision highp float;varying vec2 vUV;uniform sampler2D uD,uNz;uniform mat4 uIVP;uniform vec3 uCam,uMistC;uniform float uTime,uDen,uTop,uSteps,uFlash,uMaxD;uniform vec2 uWind;uniform vec4 uL[${NL}];uniform vec3 uLC[${NL}];
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec4 a=uIVP*vec4(vUV*2.-1.,1.,1.);vec3 dir=normalize(a.xyz/a.w-uCam);vec4 dp=texture2D(uD,vUV);float d=(dp.r*255.*256.+dp.g*255.)/65535.*320.;if(dp.b>.5||d<=0.)d=320.;
 float t0=0.,t1=min(d,uMaxD);float yb=-.6;
 if(abs(dir.y)>1e-4){float ta=(yb-uCam.y)/dir.y,tb=(uTop-uCam.y)/dir.y;t0=max(t0,min(ta,tb));t1=min(t1,max(ta,tb));}else if(uCam.y>uTop||uCam.y<yb){gl_FragColor=vec4(0.);return;}
 if(t1<=t0){gl_FragColor=vec4(0.);return;}
 float st=(t1-t0)/uSteps,j=hash(gl_FragCoord.xy+fract(uTime*7.1));vec3 acc=vec3(0.);float T=1.;
 for(int i=0;i<14;i++){if(float(i)>=uSteps)break;float t=t0+(float(i)+j)*st;vec3 p=uCam+dir*t;
  float h=clamp(1.-(p.y-yb)/(uTop-yb),0.,1.);
  float n1=texture2D(uNz,p.xz*.013+uWind*uTime*.006).r,n2=texture2D(uNz,p.xz*.041+vec2(p.y*.05)-uWind*uTime*.013).g,n3=texture2D(uNz,p.xz*.11+uWind*uTime*.03).b;
  float den=max(0.,n1*.95+n2*.55+n3*.25-.62)*h*h*uDen;
  if(den>.0005){vec3 lc=uMistC*(1.+uFlash*2.5);for(int k=0;k<${NL};k++){vec3 q=uL[k].xyz-p;float r=uL[k].w*.55;float dd=dot(q,q)/(r*r);lc+=uLC[k]*.5/(1.+dd*9.)*step(dd,1.);}
   float al=1.-exp(-den*st);acc+=T*al*lc;T*=1.-al;if(T<.03)break;}}
 gl_FragColor=vec4(acc,1.-T);}`;
// particles: soft points, streaks and additive ribbons
const PVS=`attribute vec3 aP;attribute vec4 aC;attribute float aS;uniform mat4 uVP;uniform vec3 uCam,uFog;uniform float uFogD,uPx;varying vec4 vC;
void main(){gl_Position=uVP*vec4(aP,1.);gl_PointSize=max(1.,aS*uPx/max(gl_Position.w,.1));float d=distance(aP,uCam)*uFogD;vC=vec4(mix(aC.rgb,uFog,(1.-exp(-d*d))*.8),aC.a);}`;
const PFS=`precision mediump float;varying vec4 vC;uniform float uPt;void main(){float a=vC.a;if(uPt>.5){vec2 c=gl_PointCoord-.5;float r=dot(c,c)*4.;if(r>1.)discard;a*=1.-r;}gl_FragColor=vec4(vC.rgb*a,a);}`;
function sh(t,s){const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o;}
function program(vs,fs){const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
  const U={},A={};const nu=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<nu;i++){const n=gl.getActiveUniform(p,i).name.replace(/\[0\]$/,'');U[n]=gl.getUniformLocation(p,n);}
  const na=gl.getProgramParameter(p,gl.ACTIVE_ATTRIBUTES);for(let i=0;i<na;i++){const n=gl.getActiveAttrib(p,i).name;A[n]=gl.getAttribLocation(p,n);}return{p,U,A};}
const PM=program(VS,FS),PD=program(DVS,DFS),PMI=program(QVS,MFS),PP=program(PVS,PFS);
// tileable noise texture: R/G/B = fbm at three scales, A = cellular (scales / cobbles)
const NZ=(()=>{const S=256,d=new Uint8Array(S*S*4);let s2=7;const r=()=>{s2=(s2*16807)%2147483647;return(s2-1)/2147483646;};
  const lat=P=>{const L=new Float32Array(P*P);for(let i=0;i<L.length;i++)L[i]=r();return L;};
  function vn(L,P,x,y){const xi=floor(x),yi=floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),g=(i,j)=>L[((j%P+P)%P)*P+((i%P+P)%P)];return lerp(lerp(g(xi,yi),g(xi+1,yi),u),lerp(g(xi,yi+1),g(xi+1,yi+1),u),v);}
  const fb=(base)=>{const Ls=[1,2,4,8].map(k=>lat(base*k));return(x,y)=>{let a=0,w=.5,t=0;for(let o=0;o<4;o++){a+=w*vn(Ls[o],base<<o,x*(base<<o),y*(base<<o));t+=w;w*=.5;}return a/t;};};
  const f1=fb(4),f2=fb(8),f3=fb(16);const CP=24,pts=[];for(let i=0;i<CP;i++)for(let j=0;j<CP;j++)pts.push([(i+r())/CP,(j+r())/CP]);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const u=x/S,v=y/S,k=(y*S+x)*4;const c=n=>clamp((n-.5)*1.9+.5,0,1)*255;d[k]=c(f1(u,v));d[k+1]=c(f2(u,v));d[k+2]=c(f3(u,v));
    const ci=floor(u*CP),cj=floor(v*CP);let best=9;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ii=(ci+di+CP)%CP,jj=(cj+dj+CP)%CP,p=pts[ii*CP+jj];let dx=p[0]+(ci+di-ii)/CP-u,dy=p[1]+(cj+dj-jj)/CP-v;if(ci+di<0)dx=p[0]-1-u;if(ci+di>=CP)dx=p[0]+1-u;if(cj+dj<0)dy=p[1]-1-v;if(cj+dj>=CP)dy=p[1]+1-v;best=min(best,dx*dx+dy*dy);}
    d[k+3]=clamp(sqrt(best)*CP*1.4,0,1)*255;}
  const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,S,S,0,gl.RGBA,gl.UNSIGNED_BYTE,d);gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);return t;})();
const QB=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,QB);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
const DF={fb:null,tex:null,rb:null,w:0,h:0};
function depthFB(w,h){if(DF.w===w&&DF.h===h)return;DF.w=w;DF.h=h;if(DF.fb){gl.deleteFramebuffer(DF.fb);gl.deleteTexture(DF.tex);gl.deleteRenderbuffer(DF.rb);}
  DF.tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,DF.tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);for(const[p,v]of[[gl.TEXTURE_MIN_FILTER,gl.NEAREST],[gl.TEXTURE_MAG_FILTER,gl.NEAREST],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,p,v);
  DF.rb=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,DF.rb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);
  DF.fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,DF.fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,DF.tex,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,DF.rb);
  DF.ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;gl.bindFramebuffer(gl.FRAMEBUFFER,null);}
function mesh(g){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,g.v.subarray(0,g.n),gl.STATIC_DRAW);return{b,n:g.n/13};}
const R={items:[],lights:[],fog:[.075,.15,.165],fogD:1/30,fogMin:0,fogH:.15,focus:[0,0,0],amb:[.36,.47,.5],sunC:[.34,.42,.46],scale:1,outline:true,hatch:true,vp:null,w:1,h:1,
  t:0,wind:[1,.35],wave:0,flash:0,wet:0,rip:[0,0,0,0],mist:{on:true,den:1,top:3.4,col:[.32,.44,.45],steps:10,maxD:90},eye:[0,0,0],uw:0};
const I4=mT(0,0,0);
// mat: 0 default, 1 ground, 2 water, 3 vegetation (sway), 5 creature skin
function draw(m,mat,out=.035,alpha=1,mode=0){R.items.push({m,mat:mat||I4,out,alpha,mode});}
function light(x,y,z,r,c){R.lights.push([x,y,z,r,c[0],c[1],c[2]]);}
function bindMesh(m,A){gl.bindBuffer(gl.ARRAY_BUFFER,m.b);gl.vertexAttribPointer(A.aP,3,gl.FLOAT,false,52,0);if(A.aN!=null&&A.aN>=0)gl.vertexAttribPointer(A.aN,3,gl.FLOAT,false,52,12);if(A.aC!=null&&A.aC>=0)gl.vertexAttribPointer(A.aC,4,gl.FLOAT,false,52,24);if(A.aO!=null&&A.aO>=0)gl.vertexAttribPointer(A.aO,3,gl.FLOAT,false,52,40);}
function useAttrs(A,list){for(let i=0;i<8;i++)gl.disableVertexAttribArray(i);for(const k of list)if(A[k]!=null&&A[k]>=0)gl.enableVertexAttribArray(A[k]);}
function resize(){const w=floor(innerWidth*R.scale),h=floor(innerHeight*R.scale);if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}R.w=w;R.h=h;const hc=$('hud2d');if(hc.width!==innerWidth||hc.height!==innerHeight){hc.width=innerWidth;hc.height=innerHeight;}}
function setCommon(U){gl.uniformMatrix4fv(U.uVP,false,R.vp);if(U.uTime)gl.uniform1f(U.uTime,R.t);if(U.uWave)gl.uniform1f(U.uWave,R.wave);if(U.uRip)gl.uniform4fv(U.uRip,R.rip);if(U.uWind)gl.uniform2fv(U.uWind,R.wind);if(U.uCam)gl.uniform3fv(U.uCam,R.eye);}
function render(eye,tgt,fov,up){
  resize();R.eye=eye;R.vp=mMul(mPersp(fov,R.w/R.h,.3,900),mLook(eye,tgt,up||[0,1,0]));
  const f=R.focus;R.lights.sort((a,b)=>(hypot(a[0]-f[0],a[2]-f[2])-a[3])-(hypot(b[0]-f[0],b[2]-f[2])-b[3]));
  const L=new Float32Array(NL*4),LC=new Float32Array(NL*3);for(let i=0;i<NL&&i<R.lights.length;i++){const l=R.lights[i];L.set(l.slice(0,4),i*4);LC.set(l.slice(4),i*3);}
  for(let i=R.lights.length;i<NL;i++){L[i*4+1]=-999;L[i*4+3]=1;}
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,NZ);
  const mist=R.mist.on&&R.mist.den>0;
  // 1) depth pass for the mist
  if(mist){const dw=max(1,floor(R.w/2)),dh=max(1,floor(R.h/2));depthFB(dw,dh);if(DF.ok){gl.bindFramebuffer(gl.FRAMEBUFFER,DF.fb);gl.viewport(0,0,dw,dh);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.disable(gl.BLEND);gl.useProgram(PD.p);useAttrs(PD.A,['aP']);setCommon(PD.U);
    for(const it of R.items)if(it.alpha>=1&&it.mode!==3&&!it.nodepth){bindMesh(it.m,PD.A);gl.uniformMatrix4fv(PD.U.uM,false,it.mat);gl.uniform1f(PD.U.uMat,it.mode);gl.drawArrays(gl.TRIANGLES,0,it.m.n);}
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);}}
  // 2) main pass
  gl.viewport(0,0,R.w,R.h);const fc=R.fog.map(c=>c*(1+R.flash*.8));gl.clearColor(fc[0],fc[1],fc[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);
  gl.useProgram(PM.p);useAttrs(PM.A,['aP','aN','aC','aO']);const U=PM.U;setCommon(U);gl.uniform1i(U.uNz,0);
  gl.uniform3fv(U.uFog,R.fog);gl.uniform3fv(U.uAmb,R.amb);gl.uniform3fv(U.uSunD,vNorm([-.4,.8,.45]));gl.uniform3fv(U.uSunC,R.sunC);
  gl.uniform3fv(U.uFocus,R.focus);gl.uniform1f(U.uFogD,R.fogD);gl.uniform1f(U.uFogMin,R.fogMin);gl.uniform1f(U.uFogH,R.fogH);gl.uniform1f(U.uHatch,R.hatch?1:0);gl.uniform1f(U.uFlash,R.flash);gl.uniform1f(U.uWet,R.wet);
  gl.uniform4fv(U.uL,L);gl.uniform3fv(U.uLC,LC);
  gl.disable(gl.BLEND);gl.depthMask(true);gl.cullFace(gl.BACK);gl.uniform1f(U.uOut,0);gl.uniform1f(U.uAlpha,1);
  for(const it of R.items)if(it.alpha>=1){if(it.mode===3)gl.disable(gl.CULL_FACE);bindMesh(it.m,PM.A);gl.uniformMatrix4fv(U.uM,false,it.mat);gl.uniform1f(U.uMat,it.mode);gl.drawArrays(gl.TRIANGLES,0,it.m.n);if(it.mode===3)gl.enable(gl.CULL_FACE);}
  if(R.outline){gl.cullFace(gl.FRONT);for(const it of R.items)if(it.alpha>=1&&it.out>0){bindMesh(it.m,PM.A);gl.uniformMatrix4fv(U.uM,false,it.mat);gl.uniform1f(U.uMat,it.mode);gl.uniform1f(U.uOut,it.out);gl.drawArrays(gl.TRIANGLES,0,it.m.n);}gl.cullFace(gl.BACK);}
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.uniform1f(U.uOut,0);
  for(const it of R.items)if(it.alpha<1){bindMesh(it.m,PM.A);gl.uniformMatrix4fv(U.uM,false,it.mat);gl.uniform1f(U.uMat,it.mode);gl.uniform1f(U.uAlpha,it.alpha);gl.drawArrays(gl.TRIANGLES,0,it.m.n);}
  gl.uniform1f(U.uAlpha,1);
  // 3) particles (rain, spray, embers, lightning)
  PT.draw();
  // 4) volumetric mist
  if(mist&&DF.ok){gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(PMI.p);useAttrs(PMI.A,['aQ']);
    gl.bindBuffer(gl.ARRAY_BUFFER,QB);gl.vertexAttribPointer(PMI.A.aQ,2,gl.FLOAT,false,0,0);const V=PMI.U;
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,DF.tex);gl.uniform1i(V.uD,1);gl.uniform1i(V.uNz,0);gl.uniformMatrix4fv(V.uIVP,false,mInv(R.vp));gl.uniform3fv(V.uCam,eye);
    gl.uniform3fv(V.uMistC,R.mist.col);gl.uniform1f(V.uTime,R.t);gl.uniform1f(V.uDen,R.mist.den);gl.uniform1f(V.uTop,R.mist.top);gl.uniform1f(V.uSteps,R.mist.steps);gl.uniform1f(V.uFlash,R.flash);gl.uniform1f(V.uMaxD,R.mist.maxD);gl.uniform2fv(V.uWind,R.wind);
    gl.uniform4fv(V.uL,L);gl.uniform3fv(V.uLC,LC);gl.drawArrays(gl.TRIANGLES,0,3);gl.activeTexture(gl.TEXTURE0);gl.enable(gl.DEPTH_TEST);}
  gl.depthMask(true);gl.disable(gl.BLEND);R.items.length=0;R.lights.length=0;
}
function proj(x,y,z){const m=R.vp,w=m[3]*x+m[7]*y+m[11]*z+m[15];return{x:(m[0]*x+m[4]*y+m[8]*z+m[12])/w*.5+.5,y:.5-(m[1]*x+m[5]*y+m[9]*z+m[13])/w*.5,w};}

// --- particles: pool of points / streaks plus rain and lightning ribbons
const PT=(()=>{const MAX=9000,F=8;const pts={x:new Float32Array(MAX*3),v:new Float32Array(MAX*3),c:new Float32Array(MAX*4),s:new Float32Array(MAX),life:new Float32Array(MAX),max:new Float32Array(MAX),g:new Float32Array(MAX),k:new Uint8Array(MAX),n:0};
  const buf=gl.createBuffer(),data=new Float32Array(MAX*2*F),bolts=[];let rainN=0;const RAIN=new Float32Array(2600*3);let rainInit=false;
  function add(kind,x,y,z,vx,vy,vz,size,life,col,grav=0){let i=pts.n<MAX?pts.n++:floor(Math.random()*MAX);pts.x[i*3]=x;pts.x[i*3+1]=y;pts.x[i*3+2]=z;pts.v[i*3]=vx;pts.v[i*3+1]=vy;pts.v[i*3+2]=vz;
    pts.c.set(col,i*4);pts.s[i]=size;pts.life[i]=life;pts.max[i]=life;pts.g[i]=grav;pts.k[i]=kind;}
  function update(dt,cam){let j=0;for(let i=0;i<pts.n;i++){pts.life[i]-=dt;if(pts.life[i]<=0)continue;
      pts.v[i*3+1]-=pts.g[i]*dt;for(let a=0;a<3;a++)pts.x[i*3+a]+=pts.v[i*3+a]*dt;
      if(pts.k[i]===2&&pts.x[i*3+1]>R.surf){pts.life[i]=0;continue;}
      if(i!==j){pts.x.copyWithin(j*3,i*3,i*3+3);pts.v.copyWithin(j*3,i*3,i*3+3);pts.c.copyWithin(j*4,i*4,i*4+4);pts.s[j]=pts.s[i];pts.life[j]=pts.life[i];pts.max[j]=pts.max[i];pts.g[j]=pts.g[i];pts.k[j]=pts.k[i];}j++;}pts.n=j;
    // rain: box around the camera, world anchored
    rainN=floor(2600*clamp(R.rain||0,0,1));const box=[34,30,34];if(rainN&&!rainInit){for(let i=0;i<2600;i++){RAIN[i*3]=cam[0]+(Math.random()-.5)*box[0]*2;RAIN[i*3+1]=cam[1]+(Math.random()-.5)*box[1]*2;RAIN[i*3+2]=cam[2]+(Math.random()-.5)*box[2]*2;}rainInit=true;}
    const vy=-26,vx=R.wind[0]*5,vz=R.wind[1]*5;for(let i=0;i<rainN;i++){RAIN[i*3]+=vx*dt;RAIN[i*3+1]+=vy*dt;RAIN[i*3+2]+=vz*dt;for(let a=0;a<3;a++){const d=RAIN[i*3+a]-cam[a];if(d>box[a])RAIN[i*3+a]-=box[a]*2;else if(d<-box[a])RAIN[i*3+a]+=box[a]*2;}
      if(RAIN[i*3+1]<-.4){if(Math.random()<.05)add(1,RAIN[i*3],0,RAIN[i*3+2],0,1.2,0,.12,.22,[.6,.7,.72,.35],5);RAIN[i*3+1]+=box[1]*2;}}
    for(const b of bolts)b.t-=dt;for(let i=bolts.length-1;i>=0;i--)if(bolts[i].t<=0)bolts.splice(i,1);}
  function bolt(x0,y0,z0,x1,y1,z1,width=1.4){const segs=[];const sub=(a,b,d,w)=>{if(d===0){segs.push([a,b,w]);return;}const m=vLerp(a,b,.5),L=vLen(vSub(b,a));m[0]+=(Math.random()-.5)*L*.35;m[1]+=(Math.random()-.5)*L*.12;m[2]+=(Math.random()-.5)*L*.25;sub(a,m,d-1,w);sub(m,b,d-1,w);
      if(d>2&&Math.random()<.35){const e=vAdd(m,[(Math.random()-.5)*L*.7,-L*(.25+Math.random()*.3),(Math.random()-.5)*L*.5]);sub(m,e,d-2,w*.5);}};
    sub([x0,y0,z0],[x1,y1,z1],6,width);bolts.push({segs,t:.32+Math.random()*.2,max:.5});}
  function draw(){let n=0,pn=0;const cam=R.eye,px=R.h*.9;
    gl.useProgram(PP.p);useAttrs(PP.A,['aP','aC','aS']);const U=PP.U;gl.uniformMatrix4fv(U.uVP,false,R.vp);gl.uniform3fv(U.uCam,cam);gl.uniform3fv(U.uFog,R.fog);gl.uniform1f(U.uFogD,R.fogD*.6);gl.uniform1f(U.uPx,px);
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);const bind=()=>{gl.vertexAttribPointer(PP.A.aP,3,gl.FLOAT,false,32,0);gl.vertexAttribPointer(PP.A.aC,4,gl.FLOAT,false,32,12);gl.vertexAttribPointer(PP.A.aS,1,gl.FLOAT,false,32,28);};
    const put=(x,y,z,r,g,b,a,s)=>{const o=n*F;data[o]=x;data[o+1]=y;data[o+2]=z;data[o+3]=r;data[o+4]=g;data[o+5]=b;data[o+6]=a;data[o+7]=s;n++;};
    gl.enable(gl.BLEND);gl.depthMask(false);gl.enable(gl.DEPTH_TEST);
    // streaks (rain + falling water)
    gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.uniform1f(U.uPt,0);
    const rl=.75,wx=R.wind[0]*5*.03,wz=R.wind[1]*5*.03;for(let i=0;i<rainN&&n<MAX*2-2;i++){const x=RAIN[i*3],y=RAIN[i*3+1],z=RAIN[i*3+2];put(x,y,z,.62,.72,.78,.26+R.flash*.4,1);put(x-wx*rl*10,y+rl,z-wz*rl*10,.62,.72,.78,0,1);}
    for(let i=0;i<pts.n&&n<MAX*2-2;i++){if(pts.k[i]!==3)continue;const a=pts.life[i]/pts.max[i],x=pts.x[i*3],y=pts.x[i*3+1],z=pts.x[i*3+2],L=pts.s[i];const c=pts.c.subarray(i*4,i*4+4);
      put(x,y,z,c[0],c[1],c[2],c[3]*min(1,a*3),1);put(x-pts.v[i*3]*.05*L,y-pts.v[i*3+1]*.05*L,z-pts.v[i*3+2]*.05*L,c[0],c[1],c[2],0,1);}
    if(n){gl.bufferData(gl.ARRAY_BUFFER,data.subarray(0,n*F),gl.DYNAMIC_DRAW);bind();gl.drawArrays(gl.LINES,0,n);}
    // soft points (spray, embers, bubbles)
    n=0;gl.uniform1f(U.uPt,1);for(let i=0;i<pts.n;i++){if(pts.k[i]===3)continue;const a=pts.life[i]/pts.max[i],c=pts.c.subarray(i*4,i*4+4);const fade=pts.k[i]===1?a:min(1,a*2.5)*min(1,(1-a)*6+.2);put(pts.x[i*3],pts.x[i*3+1],pts.x[i*3+2],c[0],c[1],c[2],c[3]*fade,pts.s[i]*(pts.k[i]===4?(1.4-a*.6):1));}
    if(n){gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.bufferData(gl.ARRAY_BUFFER,data.subarray(0,n*F),gl.DYNAMIC_DRAW);bind();gl.drawArrays(gl.POINTS,0,n);}
    // lightning ribbons (additive)
    n=0;gl.uniform1f(U.uPt,0);for(const b of bolts){const fl=(b.t>b.max*.6||Math.random()<.7)?1:.25;for(const[a,c,w]of b.segs){const d=vNorm(vSub(c,a)),toC=vNorm(vSub(cam,a)),s=vSc(vNorm(vCross(d,toC)),w);
      const p0=vAdd(a,s),p1=vSub(a,s),p2=vAdd(c,s),p3=vSub(c,s),al=fl*min(1,b.t*6);for(const p of[p0,p1,p2,p1,p3,p2])put(p[0],p[1],p[2],.85,.92,1,al,1);
      const s2=vSc(s,4);const q0=vAdd(a,s2),q1=vSub(a,s2),q2=vAdd(c,s2),q3=vSub(c,s2);for(const p of[q0,q1,q2,q1,q3,q2])put(p[0],p[1],p[2],.35,.45,.9,al*.18,1);if(n>MAX*2-24)break;}}
    if(n){gl.blendFunc(gl.ONE,gl.ONE);gl.disable(gl.DEPTH_TEST);gl.bufferData(gl.ARRAY_BUFFER,data.subarray(0,n*F),gl.DYNAMIC_DRAW);bind();gl.drawArrays(gl.TRIANGLES,0,n);gl.enable(gl.DEPTH_TEST);}
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);}
  return{add,update,draw,bolt,get n(){return pts.n;},bolts};})();
// kinds: 1 splash point (gravity), 2 bubble (rises, dies at surface), 3 falling-water streak, 4 spray/mist puff, 5 ember
R.surf=-.3;

// --- Audio (all synthesized)
const AU={ctx:null,vol:.8,ambVol:.7};
function auInit(){if(AU.ctx)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;try{
  const c=AU.ctx=new C();AU.master=c.createGain();AU.mfl=c.createBiquadFilter();AU.mfl.type='lowpass';AU.mfl.frequency.value=20000;AU.master.connect(AU.mfl);AU.mfl.connect(c.destination);
  AU.amb=c.createGain();AU.amb.connect(AU.master);AU.sfx=c.createGain();AU.sfx.connect(AU.master);
  const b=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.nb=b;
  const loop=(type,f,q,vol,hz,dest)=>{const s=c.createBufferSource();s.buffer=b;s.loop=true;const fl=c.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=c.createGain();g.gain.value=vol;
    const lf=c.createOscillator();lf.frequency.value=hz;const lg=c.createGain();lg.gain.value=vol*.7;lf.connect(lg);lg.connect(g.gain);lf.start();s.connect(fl);fl.connect(g);g.connect(dest||AU.amb);s.start();return{g,fl};};
  AU.wind=loop('bandpass',480,.7,.07,.11);AU.sea=loop('lowpass',380,.4,.09,.085);
  // storm layers start silent and are raised by stormAudio()
  AU.rainL=loop('highpass',2600,.4,0,.3);AU.gust=loop('bandpass',300,1.2,0,.07);AU.surf=loop('lowpass',220,.6,0,.05);
  for(const f of[49,49.7,73.6]){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=f;const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=170;const g=c.createGain();g.gain.value=.045;o.connect(fl);fl.connect(g);g.connect(AU.amb);o.start();}
  auVol();}catch(e){AU.ctx=null;}}
function auVol(){if(!AU.ctx)return;AU.master.gain.value=AU.vol;AU.amb.gain.value=AU.ambVol;}
function stormAudio(k,uw){if(!AU.ctx)return;const t=AU.ctx.currentTime;AU.rainL.g.gain.setTargetAtTime(.16*k,t,.5);AU.gust.g.gain.setTargetAtTime(.22*k,t,.5);AU.gust.fl.frequency.setTargetAtTime(260+k*320,t,.8);AU.surf.g.gain.setTargetAtTime(.25*k,t,.6);
  AU.wind.g.gain.setTargetAtTime(.07+.12*k,t,.6);AU.mfl.frequency.setTargetAtTime(uw?420:20000,t,uw?.08:.3);}
function tone(f,d,o={}){if(!AU.ctx||!isFinite(f)||!isFinite(d)||d<=0||(o.to!=null&&!(o.to>0))||!isFinite(o.delay||0))return;const c=AU.ctx,t=c.currentTime+(o.delay||0),os=c.createOscillator(),g=c.createGain();os.type=o.type||'sine';os.frequency.setValueAtTime(f,t);if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t+d);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(o.vol||.2,t+min(o.att||.02,d/3));g.gain.exponentialRampToValueAtTime(.001,t+d);os.connect(g);let out=g;
  if(o.lp){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp;g.connect(fl);out=fl;}out.connect(o.dest||AU.sfx);os.start(t);os.stop(t+d+.05);}
function noise(d,o={}){if(!AU.ctx||!isFinite(d)||d<=0||(o.to!=null&&!(o.to>0))||!isFinite(o.delay||0)||!isFinite(o.f||800))return;const c=AU.ctx,t=c.currentTime+(o.delay||0),s=c.createBufferSource();s.buffer=AU.nb;s.loop=true;const fl=c.createBiquadFilter();fl.type=o.type||'lowpass';fl.frequency.setValueAtTime(o.f||800,t);if(o.to)fl.frequency.exponentialRampToValueAtTime(o.to,t+d);fl.Q.value=o.q||.7;
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
  heart(v=1){tone(58,.14,{vol:.35*v});tone(52,.16,{vol:.28*v,delay:.2});},
  door(){noise(.3,{f:300,vol:.3,to:100});tone(80,.2,{vol:.3,to:50});},
  splash(){noise(2.2,{f:2500,to:200,vol:.5,att:.05});},
  bigSplash(){noise(3.5,{f:1800,to:120,vol:.8,att:.04});noise(2.5,{f:300,to:60,vol:.9,att:.02});tone(55,1.5,{vol:.5,to:28});},
  rumble(d){noise(d,{f:90,vol:.9,att:1.5,to:60});tone(31,d,{type:'sawtooth',vol:.5,lp:120});},
  thunder(dist=1,delay=0){const v=clamp(1.3-dist*.5,.25,1.1);noise(.25,{f:4000,to:600,vol:.55*v,delay,att:.005});noise(3.2+dist,{f:600,to:45,vol:.95*v,att:.04,delay:delay+.05});noise(2.4,{f:120,to:40,vol:.8*v,att:.3,delay:delay+.3});tone(38,2.6,{type:'sawtooth',vol:.25*v,lp:110,delay:delay+.1});},
  creak(){tone(180,.4,{type:'sawtooth',vol:.06,to:140,lp:900});},
  bubbles(){for(let i=0;i<8;i++)tone(300+Math.random()*500,.08,{type:'sine',vol:.08,to:600+Math.random()*600,delay:i*.07+Math.random()*.05});},
  roar(dur=5.5,pk=1){if(!AU.ctx)return;for(const[f,v]of[[62,.5],[93,.35],[47,.5],[140,.16],[31,.45]]){tone(f*1.5*pk,dur,{type:'sawtooth',vol:v,to:f*.55*pk,lp:700,att:.4});}noise(dur,{f:1400,to:150,vol:.6,att:.5,type:'bandpass',q:1.2});noise(dur,{f:300,to:70,vol:.9,att:.3});},
};
