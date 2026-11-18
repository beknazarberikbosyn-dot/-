// ================= PUZZLES (first-person) & JOURNAL =================
const GN=['Звезда','Око','Спящий','Луна','Волна','Пирамида','Трезубец','Солнце'];
function glyph(c,i,x,y,s,color){c.save();c.translate(x,y);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=max(1.6,s*.17);c.lineCap='round';c.lineJoin='round';c.beginPath();
  if(i===0){for(let k=0;k<5;k++){const a=-PI/2+k*4*PI/5;c[k?'lineTo':'moveTo'](cos(a)*s,sin(a)*s);}c.closePath();c.stroke();}
  else if(i===1){c.moveTo(-s,0);c.quadraticCurveTo(0,-s*1.1,s,0);c.quadraticCurveTo(0,s*1.1,-s,0);c.stroke();c.beginPath();c.arc(0,0,s*.3,0,7);c.fill();}
  else if(i===2){for(let t=0;t<=44;t++){const a=t*.36,r=s*.08+s*.06*t/2.8;c[t?'lineTo':'moveTo'](cos(a)*r,sin(a)*r);}c.stroke();}
  else if(i===3){c.arc(0,0,s*.9,.6,2*PI-.6);c.quadraticCurveTo(-s*.1,0,cos(.6)*s*.9,sin(.6)*s*.9);c.stroke();}
  else if(i===4){for(const d of[-.55,0,.55]){c.moveTo(-s,d*s);c.bezierCurveTo(-s*.5,d*s-s*.4,-s*.1,d*s+s*.4,s*.1,d*s);c.bezierCurveTo(s*.4,d*s-s*.4,s*.7,d*s+s*.3,s,d*s);}c.stroke();}
  else if(i===5){c.moveTo(0,-s);c.lineTo(s,s*.8);c.lineTo(-s,s*.8);c.closePath();c.moveTo(-s*.5,-.1*s);c.lineTo(s*.5,-.1*s);c.stroke();}
  else if(i===6){c.moveTo(0,s);c.lineTo(0,-s);c.moveTo(-s*.7,-s);c.lineTo(-s*.7,-s*.2);c.quadraticCurveTo(0,s*.3,s*.7,-s*.2);c.lineTo(s*.7,-s);c.stroke();}
  else{c.arc(0,0,s*.45,0,7);c.stroke();for(let k=0;k<8;k++){const a=k*PI/4;c.beginPath();c.moveTo(cos(a)*s*.7,sin(a)*s*.7);c.lineTo(cos(a)*s,sin(a)*s);c.stroke();}}
  c.restore();}
function glyphEl(i,size=40,color='#0b1416'){const c=document.createElement('canvas');c.width=c.height=size;if(i>=0)glyph(c.getContext('2d'),i,size/2,size/2,size*.36,color);else{const x=c.getContext('2d');x.font=size*.7+'px Georgia';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#8a7a5c';x.fillText('?',size/2,size/2);}return c;}
function el(tag,props,...kids){const e=document.createElement(tag);if(props)for(const k in props){if(k==='style')e.style.cssText=props[k];else if(k==='html')e.innerHTML=props[k];else e[k]=props[k];}for(const k of kids)if(k)e.append(k);return e;}
const SG=[2,1,4,0,3],ROM=['I','II','III','IV','V'];
const PZ=[
 {i:0,x:3,z:-12.5,y:1.15,ix:3,iz:-11.3,g:2,name:'Стол скульптора',label:'Осмотреть глиняные осколки'},
 {i:1,x:26,z:-12.9,y:1.3,ix:26,iz:-11.5,g:1,name:'Дверь часовни',label:'Осмотреть замок на двери часовни'},
 {i:2,x:46.2,z:35.4,y:1.1,ix:45.7,iz:33.9,g:4,name:'Маяк',label:'Прочесть судовой журнал'},
 {i:3,x:48,z:5,y:1.6,ix:48,iz:7,g:0,name:'Обелиск на кладбище',label:'Осмотреть обелиск'},
 {i:4,x:-8.6,z:30,y:1.2,ix:-7.5,iz:30,g:3,name:'Рыбный склад',label:'Осмотреть полку с идолами'},
 {i:5,x:14.7,z:35.2,y:.6,ix:13.8,iz:36,g:7,name:'Контора начальника порта',label:'Открыть сейф начальника порта'}];
const LORE=[
 ['Сны скульптора','На обороте барельефа — записка: <i>«1 марта 1925 года. Я вылепил это во сне. Мне снились исполинские города из зелёного камня, покрытого слизью, и голос из-под земли, повторявший одно: „Ктулху фхтагн“».</i><br>В те же ночи художники и поэты по всему миру видели один и тот же сон. Кто-то сошёл с ума. Здесь, в Грейхейвене, этот сон считают <b>благословением</b>.'],
 ['Песнь культа','На двери проступила надпись и её перевод, сделанный чьей-то дрожащей рукой: <i>«В своём доме в Р\'льехе мёртвый Ктулху ждёт и видит сны».</i><br>Этот культ старше человечества. Ему поклонялись в льдах Гренландии и на болотах Луизианы, где в 1907 году полиция застала сотню безумцев, плясавших вокруг костра с человеческими жертвами. Теперь он здесь.'],
 ['Город со дна','Весной 1925 года землетрясение подняло из Тихого океана затонувший город Р\'льех. Матросы «Эммы» открыли в нём исполинскую дверь — и <b>нечто</b> вышло наружу. «Гора шла, спотыкаясь», — записал Йохансен. Двое умерли от одного взгляда на него. Потом город снова ушёл под воду. <i>Но тот, кто спит, не умер.</i>'],
 ['Когда звёзды встанут верно','На обелиске высечено: Великие Древние пришли со звёзд задолго до людей. Они не из плоти и крови; когда звёзды стоят неверно, они не могут жить — и лежат в каменных домах, храня себя чарами Ктулху. Но <b>когда звёзды встанут верно</b>, культ освободит своего жреца, и он восстанет из моря.<br>Под текстом — свежая зарубка: сегодняшняя дата.'],
 ['Чужая кровь','Под идолами — приходная книга «улова». Но в ней не рыба: имена, даты, пометки «приезжий», «один», «никто не хватится». Двадцать три строки за десять лет. Жертв приносят с пирса, ночью, при факелах — тому, чьё изображение стоит на полке: голова спрута, крылья, когти. Местные зовут его ласково: <b>Спящий</b>.'],
 ['Последняя строка','В сейфе — ключи от катера. И та самая книга, раскрытая на последней странице. Двадцать четвёртая строка, чернила ещё не высохли:<br><b>«Эдвард Крейн, журналист. Приедет сам. Письмо отправлено»</b>.<br>Письмо старого моряка… было приманкой.']];
let curPz=-1,pzTimer=0;
PZ.forEach(z=>addInter(z.x,z.z,2.6,z.label,()=>openPuzzle(z.i),()=>S.escaped&&!S.solved[z.i]));
function openPuzzle(i){if(i===5&&S.solved.slice(0,5).some(v=>!v)){toast('Замок с пятью барабанами, на каждом — странные знаки. Нужно узнать все <b>пять знаков культа</b>.',4);return;}
  for(const e of EN)if(e.active&&e.state==='chase'){toast('Не сейчас — за вами гонятся!',2);return;}
  const z=PZ[i];curPz=i;S.pause=true;CAM.fp=true;CAM.rate=3.5;S.camFn=()=>{CAM.ge=[z.ix,1.62,z.iz];CAM.gt=[z.x,z.y,z.z];};SFX.page();
  clearTimeout(pzTimer);pzTimer=setTimeout(()=>{if(curPz!==i)return;$('pzT').textContent=z.name;const b=$('pzB');b.innerHTML='';$('pzD').innerHTML='';PB[i](b,$('pzD'));$('pzX').textContent='Отойти (Esc)';$('puz').style.display='flex';},S.fast?0:950);}
function closePuzzle(){const was=curPz;curPz=-1;clearTimeout(pzTimer);$('puz').style.display='none';S.pause=false;if(was===5&&S.solved[5]){finale();return;}S.camFn=null;CAM.fp=false;CAM.rate=5;}
$('pzX').onclick=closePuzzle;
function solvePuzzle(i){S.solved[i]=1;S.lore.push(i);SFX.solve();const z=PZ[i];S.cp=[z.ix,z.iz];const b=$('pzB');$('pzD').innerHTML='';
  setTimeout(()=>{b.innerHTML='';b.append(el('h2',{textContent:'«'+LORE[i][0]+'»',style:'margin-top:4px'}),el('div',{className:'hand',html:LORE[i][1],style:'text-align:left'}));
    if(i<5){const s=el('div',{className:'lore',style:'text-align:center;font-size:20px'},'Найден знак '+ROM[i]+': ');s.append(glyphEl(SG[i],44),' «'+GN[SG[i]]+'»');b.append(s);}
    $('pzX').textContent=i<5?'Записать в блокнот':'…';const n=S.solved.slice(0,5).filter(v=>v).length;
    if(i<5)setObj(n<5?'Найдите знаки культа: '+n+' / 5<br><span style="font-size:15px">Стрелки по краям экрана ведут к местам, где их искать.</span>':'Все знаки найдены. Откройте сейф в конторе начальника порта — у входа на пирс.');},S.fast?0:650);}
const PB=[
 // 0 — bas-relief tiles
 (b,d)=>{d.innerHTML='Разбитый глиняный барельеф. Щёлкайте по осколкам, чтобы повернуть их и собрать изображение.';const src=document.createElement('canvas');src.width=src.height=300;drawRelief(src.getContext('2d'));
  const g=el('div',{className:'tiles'}),rot=[],ang=[];for(let k=0;k<9;k++){rot[k]=k===4?0:1+floor(Math.random()*3);ang[k]=rot[k]*90;const c=el('canvas',{width:100,height:100});c.getContext('2d').drawImage(src,(k%3)*100,floor(k/3)*100,100,100,0,0,100,100);c.style.transform='rotate('+ang[k]+'deg)';
    c.onclick=()=>{if(S.solved[0])return;rot[k]=(rot[k]+1)%4;ang[k]+=90;c.style.transform='rotate('+ang[k]+'deg)';SFX.click();if(rot.every(r=>!r))solvePuzzle(0);};g.append(c);}b.append(g);PB.t0=()=>g.childNodes.forEach((c,k)=>{while(rot[k])c.onclick();});},
 // 1 — coupled cipher rings
 (b,d)=>{d.innerHTML='Три сцепленных кольца со знаками. На косяке нацарапано: <i>«Звезда над Оком, Око над Спящим»</i>.<br>Под стрелкой должны встать: снаружи — Звезда, в середине — Око, внутри — Спящий. Внешнее кольцо тянет за собой среднее, среднее — внутреннее.';
  const perm=[[0,5,3,7,1,4,6,2],[1,6,0,4,2,7,3,5],[2,3,6,1,5,0,7,4]],o=[3,5,2],c=el('canvas',{width:330,height:330}),x=c.getContext('2d'),RR=[138,98,58];
  const dr=()=>{x.clearRect(0,0,330,330);x.fillStyle='#b08d3c';x.beginPath();x.arc(165,165,160,0,7);x.fill();for(let r=0;r<3;r++){x.fillStyle=['#c9a650','#b9963f','#d0b060'][r];x.beginPath();x.arc(165,165,RR[r]+20,0,7);x.fill();x.strokeStyle='#3a2c10';x.lineWidth=2.5;x.stroke();
    for(let k=0;k<8;k++){const a=-PI/2+(k-o[r])*PI/4;glyph(x,perm[r][k],165+cos(a)*RR[r],165+sin(a)*RR[r],13-r*1.5,k===o[r]?'#7a1410':'#2a1f08');}}
    x.fillStyle='#2a1f08';x.beginPath();x.arc(165,165,36,0,7);x.fill();x.fillStyle='#7a1410';x.beginPath();x.moveTo(165,22);x.lineTo(156,4);x.lineTo(174,4);x.fill();};
  const turn=(r,s)=>{if(S.solved[1])return;for(let q=r;q<min(3,r+2);q++)o[q]=(o[q]+s+8)%8;SFX.click();dr();if(perm[0][o[0]]===0&&perm[1][o[1]]===1&&perm[2][o[2]]===2)solvePuzzle(1);};
  dr();b.append(c);const row=el('div');['Внешнее','Среднее','Внутреннее'].forEach((n,r)=>{const s=el('span',{className:'slot',style:'cursor:default'},n);const w=el('span');w.append(el('button',{textContent:'↺',style:'width:36px',onclick:()=>turn(r,1)}),el('button',{textContent:'↻',style:'width:36px',onclick:()=>turn(r,-1)}));s.append(w);row.append(s);});b.append(row);
  PB.t1=()=>{while(perm[0][o[0]]!==0)turn(0,1);while(perm[1][o[1]]!==1)turn(1,1);while(perm[2][o[2]]!==2)turn(2,1);};},
 // 2 — coordinates
 (b,d)=>{d.innerHTML='Вырванные страницы судового журнала и навигационный прибор смотрителя. Наведите его на место, <b>где спит ОНО</b>.';
  b.append(el('div',{className:'pages'},el('div',{className:'page hand',html:'<b>Журнал шхуны «Эмма»</b><br>20 февраля вышли из Окленда. 22 марта, на <u>49°51′ ю. ш., 128°34′ з. д.</u>, нас нагнала паровая яхта «Алерт». Её команда — дикари с дурными лицами — велела повернуть назад. Мы отказались и приняли бой.'}),
   el('div',{className:'page hand',html:'<b>Рукой помощника Йохансена</b><br>На другой день, уже на захваченной яхте, мы упёрлись в берег, которого нет на картах: <u>47°9′ ю. ш., 126°43′ з. д.</u> Ил, тина и циклопические стены из зелёного камня. Город, поднятый со дна. Там оно и лежало.'})));
  const vals=[45,0,120,0],names=['° ю. ш.','′','° з. д.','′'],row=el('div',{style:'margin-top:12px'}),ins=[];
  vals.forEach((v,k)=>{const i=el('input',{type:'number',value:v,min:0,max:k%2?59:180,style:'width:74px;font-size:26px;font-family:var(--head);text-align:center;background:#efe6cc;border:2.5px solid #0b1416;border-radius:6px'});ins.push(i);row.append(i,el('span',{textContent:names[k]+(k===1?'  ':' '),style:'font-size:20px;margin-right:10px'}));});
  const chk=()=>{if(ins.map(i=>+i.value).join()==='47,9,126,43')solvePuzzle(2);else{SFX.thud();toast('Стрелка прибора дрогнула и замерла. Не то место…',2.5);}};
  b.append(row,el('button',{className:'b',textContent:'Навести прибор',style:'margin-top:10px',onclick:chk}));PB.t2=()=>{[47,9,126,43].forEach((v,k)=>ins[k].value=v);chk();};},
 // 3 — star runes (lights out on a ring)
 (b,d)=>{d.innerHTML='Пять звёзд вокруг обелиска. Надпись: <i>«Когда все звёзды встанут верно — он проснётся»</i>.<br>Зажгите все пять. Каждая звезда меняет и двух своих соседок.';
  const st=[1,1,1,1,1],box=el('div',{style:'position:relative;width:300px;height:270px;margin:6px auto'}),els=[];
  const tg=i=>{for(const k of[i,(i+1)%5,(i+4)%5])st[k]^=1;};do{for(let n=0;n<6;n++)tg(floor(Math.random()*5));}while(st.reduce((a,v)=>a+v)>2);
  const dr=()=>els.forEach((e,i)=>{e.className='slot'+(st[i]?' on':'');e.firstChild.replaceWith(glyphEl(0,46,st[i]?'#bff3e8':'#0b1416'));});
  for(let i=0;i<5;i++){const a=-PI/2+i*2*PI/5,e=el('div',{className:'slot',style:'position:absolute;margin:0;left:'+(150+cos(a)*108-37)+'px;top:'+(130+sin(a)*100-34)+'px'},glyphEl(0,46));e.onclick=()=>{if(S.solved[3])return;tg(i);SFX.click();dr();if(st.every(v=>v))solvePuzzle(3);};els.push(e);box.append(e);}
  dr();b.append(box);PB.t3=()=>{const s=[0,0,0,0,0];for(let m=0;m<32;m++){const t=st.slice();for(let i=0;i<5;i++)if(m>>i&1)for(const k of[i,(i+1)%5,(i+4)%5])t[k]^=1;if(t.every(v=>v)){for(let i=0;i<5;i++)if(m>>i&1)els[i].onclick();return;}}};},
 // 4 — idol ordering logic
 (b,d)=>{d.innerHTML='Четыре идола сдвинуты с мест. На полке вырезаны правила. Щёлкните по двум идолам, чтобы поменять их местами.';
  const ord=[2,0,3,1],row=el('div'),want=[3,2,1,0];let sel=-1;
  const dr=()=>{row.innerHTML='';ord.forEach((g,k)=>{const s=el('div',{className:'slot'+(sel===k?' sel':'')},glyphEl(g,52),GN[g]);s.onclick=()=>{if(S.solved[4])return;SFX.click();if(sel<0)sel=k;else{const t=ord[sel];ord[sel]=ord[k];ord[k]=t;sel=-1;}dr();if(ord.join()===want.join())solvePuzzle(4);};row.append(s);});};
  dr();b.append(row,el('div',{className:'hand',style:'text-align:left;margin-top:8px',html:'• Спящий никогда не стоит с краю.<br>• Око стоит сразу справа от Спящего.<br>• Луна восходит левее Звезды.<br>• Звезда не касается Спящего.'}));
  PB.t4=()=>{for(let k=0;k<4;k++){const j=ord.indexOf(want[k]);if(j!==k){row.childNodes[k].onclick();row.childNodes[j].onclick();}}};},
 // 5 — final safe
 (b,d)=>{d.innerHTML='Замок с пятью барабанами. Выставьте знаки культа в том порядке, в каком вы их записали.';
  const top=el('div',{style:'font-size:17px'});SG.forEach((g,k)=>{const s=el('span',{className:'sign'},ROM[k]+' — ');s.append(glyphEl(g,30),GN[g]);top.append(s);});
  const cur=SG.map(g=>(g+3)%8),row=el('div',{style:'margin-top:8px'}),cs=[];
  const set=(k,s)=>{if(S.solved[5])return;cur[k]=(cur[k]+s+8)%8;SFX.click();cs[k].replaceWith(cs[k]=glyphEl(cur[k],52));if(cur.join()===SG.join()){solvePuzzle(5);}};
  cur.forEach((g,k)=>{const s=el('div',{className:'slot',style:'cursor:default'});cs[k]=glyphEl(g,52);s.append(el('button',{textContent:'▲',onclick:()=>set(k,1)}),cs[k],el('button',{textContent:'▼',onclick:()=>set(k,-1)}),ROM[k]);row.append(s);});b.append(top,row);
  PB.t5=()=>{for(let k=0;k<5;k++)while(cur[k]!==SG[k])set(k,1);};}];
function drawRelief(c){c.fillStyle='#9a8a68';c.fillRect(0,0,300,300);for(let i=0;i<900;i++){c.fillStyle=Math.random()<.5?'rgba(60,45,25,.18)':'rgba(220,200,160,.16)';c.fillRect(Math.random()*300,Math.random()*300,2,2);}
  c.strokeStyle='#40341f';c.lineWidth=4;c.lineCap='round';c.lineJoin='round';c.strokeRect(10,10,280,280);c.lineWidth=2;c.strokeRect(18,18,264,264);c.lineWidth=4;
  c.fillStyle='#857555';for(const s of[-1,1]){c.beginPath();c.moveTo(150+s*45,95);c.lineTo(150+s*128,30);c.lineTo(150+s*112,90);c.lineTo(150+s*122,150);c.lineTo(150+s*50,125);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(150+s*128,30);c.lineTo(150+s*75,110);c.stroke();}
  c.beginPath();c.ellipse(150,95,52,46,0,0,7);c.fill();c.stroke();c.beginPath();c.ellipse(150,170,40,50,0,0,7);c.fill();c.stroke();
  c.lineWidth=5;for(const s of[-1,1]){c.beginPath();c.moveTo(150+s*30,90);c.lineTo(150+s*12,98);c.stroke();}
  c.lineWidth=4;[-32,-19,-6,6,19,32].forEach((dx,k)=>{c.beginPath();c.moveTo(150+dx,128);c.bezierCurveTo(150+dx*1.6,165,150+dx*.6,190,150+dx*1.9,222+(k%2)*12);c.quadraticCurveTo(150+dx*2.3,236,150+dx*2.1,218);c.stroke();});
  for(const s of[-1,1]){c.beginPath();c.moveTo(150+s*38,180);c.lineTo(150+s*70,215);c.moveTo(150+s*70,215);c.lineTo(150+s*62,230);c.moveTo(150+s*70,215);c.lineTo(150+s*74,232);c.moveTo(150+s*70,215);c.lineTo(150+s*84,226);c.stroke();}
  [0,1,2,3,4].forEach((g,k)=>glyph(c,[0,1,2,3,4][k],62+k*44,262,11,'#40341f'));
  c.lineWidth=1.5;c.beginPath();c.moveTo(30,60);c.lineTo(80,120);c.lineTo(60,200);c.moveTo(250,30);c.lineTo(230,140);c.lineTo(270,220);c.stroke();}
function renderJournal(){const j=$('jbody');j.innerHTML='';j.append(el('p',{html:'<b>Цель:</b> '+S.obj}));
  const s=el('p',{html:'<b>Знаки культа:</b> '});SG.forEach((g,k)=>{const sp=el('span',{className:'sign'},ROM[k]+' ');sp.append(glyphEl(S.solved[k]?g:-1,34));s.append(sp);});j.append(s);
  if(!S.lore.length)j.append(el('p',{className:'hand',html:'<i>Записей пока нет. Что бы ни происходило в этой деревне — ответы где-то рядом.</i>'}));
  S.lore.forEach(i=>j.append(el('div',{className:'lore'},el('b',{textContent:LORE[i][0],style:'font-size:20px'}),el('div',{className:'hand',html:LORE[i][1]}))));
  const eg=EGGS.filter(e=>S.eggs[e.id]);j.append(el('p',{className:'lore',html:'<b>Находки ('+eg.length+' / '+EGGS.length+'):</b> '+(eg.map(e=>e.t).join(', ')||'—')}));
  j.append(el('p',{style:'font-size:16px',html:'<b>Памятка:</b> жителей можно бить (ЛКМ, ЛКМ, затем F — нокаут; ПКМ вовремя — парирование). От культистов в робах — только бежать. Враги медленнее вас: выйдите за пунктирный круг их обзора или скройтесь из виду на пару секунд — и вас потеряют. Пригнувшись (C) за ящиками, бочками и лодками, вы невидимы.'}));}
