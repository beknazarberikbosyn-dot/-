
// ---------------------------------------------------------------- effects: rigid debris, fire, R'lyeh glow
// rigid debris: small boxes with velocity and spin that bounce on the floor, slide to a stop and fade out
const DBR=[];const DBR_MAX=240;
const DBR_M={},DBR_C={stone:['#2c4a3e','#22382f','#3a5a4c'],wood:['#5a4030','#6b4c36','#3e2c20'],glass:['#a8c0c4','#c4d8da','#90aab0'],brick:['#6e4a3a','#5a3a2e','#7a5444']};
function dbrMesh(k,i){const key=k+i;if(!DBR_M[key]){const g=new Geo(.02);g.bx(0,-.5,0,1,1,1,H(DBR_C[k][i],k==='glass'?.25:k==='stone'&&i===2?.08:0));DBR_M[key]=mesh(g);}return DBR_M[key];}
// spawn n pieces at a point; o: vx/vz push, vy lift, sp spread speed, sz size, floor height, life
function debris(x,y,z,n,kind='stone',o={}){const sz=o.sz||.18,sp=o.sp==null?3:o.sp,fl=o.floor==null?0:o.floor;
  for(let i=0;i<n;i++){if(DBR.length>=DBR_MAX)DBR.shift();const s=sz*(.45+Math.random()*.9);
    DBR.push({x:x+rr(-.1,.1),y:max(y,fl+s),z:z+rr(-.1,.1),vx:(o.vx||0)+rr(-sp,sp),vy:(o.vy==null?2.5:o.vy)+Math.random()*sp,vz:(o.vz||0)+rr(-sp,sp),
      rx:Math.random()*6,ry:Math.random()*6,rz:Math.random()*6,wx:rr(-9,9),wy:rr(-6,6),wz:rr(-9,9),
      s:[s*(kind==='glass'?1.3:kind==='wood'?2.4:1),s*(kind==='glass'?.12:kind==='wood'?.5:.8+Math.random()*.4),s*(kind==='glass'?1:kind==='wood'?.5:1)],
      fl,m:dbrMesh(kind,i%3),life:o.life||(6+Math.random()*3),sleep:0,room:S.inside,kind});}}
function dbrTick(dt){for(let i=DBR.length-1;i>=0;i--){const d=DBR[i];d.life-=dt;if(d.life<=0||d.room!==S.inside){DBR.splice(i,1);continue;}if(d.sleep)continue;
    d.vy-=19.6*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.z+=d.vz*dt;d.rx+=d.wx*dt;d.ry+=d.wy*dt;d.rz+=d.wz*dt;
    if(hitAt(d.x,d.z,.05)&&d.y<3){d.x-=d.vx*dt;d.z-=d.vz*dt;d.vx*=-.35;d.vz*=-.35;}   // walls kick it back
    const lo=d.fl+d.s[1]*.5;if(d.y<lo){d.y=lo;if(d.vy<-1.2){d.vy=-d.vy*(d.kind==='glass'?.18:.32);if(d.kind==='glass'&&Math.random()<.3)tone(2600+Math.random()*1800,.05,{type:'triangle',vol:.02,to:1800});}else d.vy=0;
      d.vx*=.72;d.vz*=.72;d.wx*=.6;d.wy*=.6;d.wz*=.6;
      if(abs(d.vy)<.2&&hypot(d.vx,d.vz)<.12){d.sleep=1;d.rx=Math.round(d.rx/(PI/2))*PI/2;d.rz=Math.round(d.rz/(PI/2))*PI/2;}}}}   // settle flat on a face
function dbrDraw(){for(const d of DBR){const f=min(1,d.life/1.2);draw(d.m,mM(mT(d.x,d.y-(1-f)*d.s[1],d.z),mRy(d.ry),mRx(d.rx),mRz(d.rz),mS(d.s[0],d.s[1],d.s[2])),.02);}}
// first wall hit along a ray (walls are columns in the collision grid; the ground stops it too)
function rayHit(o,d,maxT){for(let t=.5;t<maxT;t+=.2){const x=o[0]+d[0]*t,y=o[1]+d[1]*t,z=o[2]+d[2]*t;if(y<=0||y<3.2&&hitAt(x,z,.03))return t;}return maxT;}
// dust puff: grey soft points that grow and drift up
function dust(x,y,z,n,s=1,col=[.4,.42,.4,.35]){for(let i=0;i<n;i++)PT.add(4,x+rr(-.4,.4)*s,y+rr(0,.3)*s,z+rr(-.4,.4)*s,rr(-1.6,1.6)*s,rr(.2,1.2)*s,rr(-1.6,1.6)*s,(.3+Math.random()*.4)*s,1.4+Math.random(),col,-.15);}

// a layered fire: wide dark-orange body, bright core licking faster, embers and smoke above
function bigFire(x,y,z,sc,ph,t,smoke=true){const k=1+sin(t*13+ph)*.12+sin(t*29+ph*2)*.06;
  draw(M_flame,mM(mT(x,y,z),mRy(t*1.6+ph),mS(2.4*sc*k,3*sc*(1+sin(t*7+ph)*.18),2.4*sc*k)),0);
  for(let j=0;j<2;j++){const a=ph+j*2.1+t*.7,r=.35*sc;draw(M_flame,mM(mT(x+cos(a)*r,y,z+sin(a)*r),mRy(-t*3+j),mS(1.2*sc,(1.5+sin(t*11+j*1.7+ph)*.4)*sc,1.2*sc)),0);}
  draw(M_flame,mM(mT(x,y+.1*sc,z),mRy(-t*4+ph),mS(1.1*sc*k,1.8*sc*(1+sin(t*17+ph)*.25),1.1*sc*k)),0);
  if(Math.random()<.22*sc)PT.add(5,x+rr(-.8,.8)*sc,y+rr(.5,1.5)*sc,z+rr(-.8,.8)*sc,R.wind[0]*.8+rr(-.6,.6),1.6+Math.random()*2.4,R.wind[1]*.8+rr(-.6,.6),.05+Math.random()*.07,1.2+Math.random()*1.4,[1,.45+Math.random()*.35,.12,.95],-.6);
  if(smoke&&Math.random()<.06*sc)PT.add(4,x+rr(-.5,.5)*sc,y+3.2*sc,z+rr(-.5,.5)*sc,R.wind[0]*1.2,1.2+Math.random(),R.wind[1]*1.2,(.8+Math.random()*.8)*sc,3+Math.random()*2,[.06,.04,.035,.18],-.08);}
function fireLight(x,y,z,r,ph,t){const f=1+sin(t*9+ph)*.12+sin(t*23+ph*3)*.08+(Math.random()-.5)*.1;light(x,y,z,r*f,[.55,.22+.04*sin(t*5+ph),.06]);}

// R'lyeh: glyph pulses, spores rising toward the throne, light breathing with the Sleeper
function rlGlow(k,t){const br=.5+.5*sin(t*1.1),fz=P.z;
  for(let i=0;i<4;i++){const z=fz+8+i*14,ph=t*1.6-z*.12,p=max(0,sin(ph));light(800+(i%2?-10:10),3,z,14+p*10,[.18*(1+p),.85*(.6+p*.6),.55*(.6+p*.5)]);}
  light(800,16,205,40+br*30,[.2+br*.15,.8+br*.3,.55]);
  if(RL.M){const e=mP(RL.M.head,[0,7.7,-8.4]);light(e[0],e[1],e[2]-6,18+br*14+(RL.fly?RL.fly*12:0),[.95,.85,.35]);}
  if(Math.random()<.7)PT.add(5,P.x+rr(-14,14),rr(0,1.5),P.z+rr(-6,24),rr(-.2,.2),.5+Math.random()*.8,.4+Math.random()*.6,.05+Math.random()*.05,4+Math.random()*3,[.35,1,.7,.8],-.05);
  if(Math.random()<.04+k*.2)dust(P.x+rr(-12,12),rr(8,20),P.z+rr(-2,20),3,1.4,[.12,.22,.18,.3]);}

// ---------------------------------------------------------------- creative / admin mode (F2 or ` — for the developer)
// jump to any story stage (reloads the page clean, then skips straight there), fly through walls, god mode, game speed, quick triggers
const DEV={open:false,fly:false,god:false,ts:1,info:true};
try{Object.assign(DEV,JSON.parse(localStorage.getItem('zovDev')||'{}'),{open:false});}catch(e){}
function devSave(){try{localStorage.setItem('zovDev',JSON.stringify({fly:DEV.fly,god:DEV.god,ts:DEV.ts,info:DEV.info}));}catch(e){}}
const DEV_ST=[['Деревня',[['town','Прибытие в деревню'],['pub','Паб «Дьяволов риф»'],['back','Чёрный ход паба'],['cellar','Подвал'],['alarm','Тревога в подвале'],['stalk','Слежка'],['doctor','Дом доктора'],['play','Комендантский час']]],
  ['Акт 2',[['upstairs','Второй этаж'],['paul','Отец Пол, роба'],['church','У новой церкви'],['churchin','Внутри церкви'],['cave','Дорога к пещере'],['rlyeh','Р\'льех']]],
  ['Акт 3',[['return','Возвращение с доктором'],['chase','Погоня'],['defense','Оборона дома'],['escort','Конвой'],['chapelend','Финал в часовне']]]];
function devJump(st){devSave();location.hash='dev='+st;location.reload();}
function devBuild(){if($('dev'))return;const d=document.createElement('div');d.id='dev';
  d.style.cssText='position:fixed;top:12px;right:12px;width:300px;max-height:calc(100vh - 24px);overflow:auto;z-index:60;background:rgba(8,14,15,.93);border:1px solid #5fd6a0;color:#d9cdb0;font:13px/1.35 Georgia,serif;padding:10px 12px;display:none;border-radius:4px';
  let h='<div style="display:flex;justify-content:space-between;align-items:center"><b style="color:#5fd6a0">Режим разработчика</b><span style="opacity:.6">F2 · ⌥D · ё</span></div>';
  for(const[g,l]of DEV_ST){h+='<div style="margin:8px 0 3px;color:#9fb8ae">'+g+'</div><div style="display:flex;flex-wrap:wrap;gap:4px">';for(const[k,n]of l)h+='<button data-st="'+k+'">'+n+'</button>';h+='</div>';}
  h+='<div style="margin:9px 0 3px;color:#9fb8ae">Игрок</div><label><input type="checkbox" id="dvFly"> Полёт сквозь стены (Пробел — вверх, C — вниз)</label><br><label><input type="checkbox" id="dvGod"> Бессмертие</label><br><label><input type="checkbox" id="dvInfo"> Координаты и этап</label>';
  h+='<div style="margin:6px 0 3px">Скорость игры: <b id="dvTsV"></b></div><div style="display:flex;gap:4px">'+[.25,.5,1,2,4].map(v=>'<button data-ts="'+v+'">×'+v+'</button>').join('')+'</div>';
  h+='<div style="margin:9px 0 3px;color:#9fb8ae">События</div><div style="display:flex;flex-wrap:wrap;gap:4px">'+[1,2,3,4].map(v=>'<button data-hl="'+v+'">Галлюцинация '+v+'</button>').join('')+'<button data-ev="sac">Смерть-жертва</button><button data-ev="skip">Пропустить реплику</button><button data-ev="mark">К метке</button><button data-ev="heal">Здоровье 100</button></div>';
  d.innerHTML=h;document.body.appendChild(d);
  const st=document.createElement('style');st.textContent='#dev button{background:#18282a;color:#d9cdb0;border:1px solid #3a5a52;padding:3px 6px;font:12px Georgia,serif;cursor:pointer;border-radius:3px}#dev button:hover{border-color:#5fd6a0;color:#fff}#dev label{cursor:pointer}';document.head.appendChild(st);
  d.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;e.stopPropagation();
    if(b.dataset.st)devJump(b.dataset.st);else if(b.dataset.ts){DEV.ts=+b.dataset.ts;devSync();}else if(b.dataset.hl){if(S.mode==='play')halluc(+b.dataset.hl);}
    else{const v=b.dataset.ev;if(v==='sac'&&S.mode==='play')sacrifice();else if(v==='skip')subAdvance();else if(v==='heal')S.hp=100;else if(v==='mark'){const T=markTarget();if(T){P.x=T[0]+1.2;P.z=T[1]+1.2;camSnap();}}}});
  for(const[id,k]of[['dvFly','fly'],['dvGod','god'],['dvInfo','info']])$(id).onchange=e=>{DEV[k]=e.target.checked;if(k==='fly'&&!DEV.fly)DEV.fy=0;devSync();};devSync();}
function devSync(){if(!$('dev'))return;$('dvFly').checked=DEV.fly;$('dvGod').checked=DEV.god;$('dvInfo').checked=DEV.info;$('dvTsV').textContent='×'+DEV.ts;S.ts=DEV.ts;devSave();}
function devToggle(){devBuild();DEV.open=!DEV.open;$('dev').style.display=DEV.open?'block':'none';if(DEV.open&&document.pointerLockElement)document.exitPointerLock();}
addEventListener('keydown',e=>{if(e.code==='F2'||e.code==='Backquote'||e.code==='IntlBackslash'||e.altKey&&e.code==='KeyD'){e.preventDefault();devToggle();}},true);
// fly: move along the full view direction, through walls; space / C for height. Called from updPlayer before the normal walk.
function devFly(dt){if(!DEV.fly)return false;const sp=(K.ShiftLeft||K.ShiftRight?22:9)*dt,fx=sin(P.rot),fz=cos(P.rot),cp=cos(CAM.pitch),f=[fx*cp,sin(CAM.pitch),fz*cp];
  const fw=(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0),sx=(K.KeyD?1:0)-(K.KeyA?1:0);P.rot+=((K.ArrowLeft?1:0)-(K.ArrowRight?1:0))*dt*2.2;CAM.yaw=P.rot;
  P.x+=(f[0]*fw-fz*sx)*sp;P.z+=(f[2]*fw+fx*sx)*sp;DEV.fy=max(0,(DEV.fy||0)+(f[1]*fw+(K.Space?1:0)-(K.KeyC?1:0))*sp);P.mv=0;S.hp=max(S.hp,1);return true;}
function devHud(c,w,h){if(!DEV.info||!$('dev')||!DEV.open&&!DEV.fly&&!DEV.god)return;c.save();c.font='12px monospace';c.textAlign='left';c.textBaseline='top';c.fillStyle='rgba(8,14,15,.7)';c.fillRect(60,8,330,50);c.fillStyle='#5fd6a0';
  c.fillText('x '+P.x.toFixed(1)+'  z '+P.z.toFixed(1)+'  rot '+P.rot.toFixed(2)+(DEV.fy?'  h '+DEV.fy.toFixed(1):''),66,14);
  c.fillText('комната: '+(S.inside||'улица')+'  режим: '+S.mode+'  ×'+DEV.ts+(DEV.god?'  бессмертие':'')+(DEV.fly?'  полёт':''),66,30);c.fillText('частицы '+PT.n+'  обломки '+DBR.length,66,46);c.restore();}
// a reload with #dev=<stage> starts the game and skips straight to that stage (sound starts on the first key or click)
function devBoot(){const m=/dev=(\w+)/.exec(location.hash);if(!m)return;history.replaceState(null,'',location.pathname+location.search);
  const go=()=>{auInit();};addEventListener('pointerdown',go,{once:true});addEventListener('keydown',go,{once:true});
  setTimeout(()=>{$('title').style.display='none';intro();setTimeout(()=>{DBG.toPlay(m[1]);S.ts=DEV.ts;setTimeout(()=>{devBuild();if(DEV.fly||DEV.god)devSync();toast('Режим разработчика: этап «'+m[1]+'». F2 — меню.',3);},500);},200);},50);}
