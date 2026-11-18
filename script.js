/* ===== UTIL ===== */
const KEY='stp_data_v1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const pd=s=>{const[a,b,c]=s.slice(0,10).split('-').map(Number);return new Date(a,b-1,c)};
const todayS=()=>ymd(new Date());
const addDays=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return ymd(d)};
const mondayOf=s=>{const d=pd(s);d.setDate(d.getDate()-(d.getDay()+6)%7);return ymd(d)};
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&ymd(pd(s))===s;
const MONTHS=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAYS=['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
const fmtDate=s=>{const d=pd(s);return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`};
const TYPE={Kuliah:'#3b82f6',Belajar:'#10b981',Ujian:'#ef4444',Lainnya:'#8b5cf6'};
const PR=['Rendah','Sedang','Tinggi'];
const ST=[['todo','To Do'],['doing','Doing'],['done','Done']];
const stLabel=k=>(ST.find(s=>s[0]===k)||[,k])[1];
const empty=m=>`<div class="empty">${esc(m)}</div>`;

/* ===== STORE ===== */
let D;
const blank=()=>({profile:{name:'',university:'',major:'',semester:'',avatar:''},courses:[],tasks:[],events:[],sessions:[],settings:{weeklyGoalHours:10,focusMin:25,breakMin:5,theme:'light'}});
const okArr=(a,f)=>Array.isArray(a)&&a.every(x=>x&&typeof x==='object'&&f(x));
const rx=/^\d{4}-\d{2}-\d{2}/;
const valid=o=>o&&typeof o==='object'&&okArr(o.courses,c=>c.id&&c.name)&&okArr(o.tasks,t=>t.id&&t.title&&rx.test(t.deadline))&&okArr(o.events,e=>e.id&&rx.test(e.date)&&e.start&&e.end)&&okArr(o.sessions,s=>s.id&&rx.test(s.date)&&typeof s.minutes==='number');
const norm=o=>{const b=blank();return{...b,...o,profile:{...b.profile,...o.profile},settings:{...b.settings,...o.settings},tasks:o.tasks.map(t=>({desc:'',priority:'Sedang',status:'todo',courseId:'',createdAt:0,...t,subtasks:Array.isArray(t.subtasks)?t.subtasks:[]}))}};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(D))}catch(x){toast('Gagal menyimpan (penyimpanan penuh)','bad')}};
function load(){try{const o=JSON.parse(localStorage.getItem(KEY));if(valid(o))return norm(o)}catch(x){}return seed()}
function seed(){
  const c=[{id:uid(),name:'Pemrograman Web',color:'#4f46e5'},{id:uid(),name:'Basis Data',color:'#059669'},{id:uid(),name:'Matematika Diskrit',color:'#d97706'}];
  const t=todayS(),d=n=>addDays(t,n);
  const tk=(title,ci,n,time,priority,status,subs=[])=>({id:uid(),title,desc:'',courseId:c[ci].id,deadline:d(n)+'T'+time,priority,status,subtasks:subs.map(([text,done])=>({id:uid(),text,done})),createdAt:Date.now()});
  const ev=(title,n,start,end,type,ci)=>({id:uid(),title,date:d(n),start,end,type,courseId:c[ci].id,note:''});
  const mins=[60,45,90,0,120,30,75];
  return{...blank(),courses:c,
    tasks:[tk('Laporan praktikum ERD',1,-1,'23:59','Tinggi','doing',[['Gambar ERD',true],['Tulis analisis',false]]),
      tk('Landing page tugas besar',0,2,'17:00','Tinggi','doing',[['Wireframe',true],['HTML & CSS',false],['Responsif',false]]),
      tk('Latihan logika proposisi',2,4,'12:00','Sedang','todo'),
      tk('Query SQL join',1,6,'09:00','Sedang','todo'),
      tk('Resume bab 3',2,-3,'10:00','Rendah','done'),
      tk('Presentasi proyek akhir',0,9,'08:00','Tinggi','todo')],
    events:[ev('Kuliah Pemrograman Web',0,'09:00','10:30','Kuliah',0),ev('Belajar kelompok',0,'14:00','15:30','Belajar',1),ev('UTS Basis Data',3,'10:00','12:00','Ujian',1),ev('Kuliah Matdis',1,'13:00','14:40','Kuliah',2)],
    sessions:mins.map((m,i)=>({id:uid(),date:d(-i),courseId:c[i%3].id,minutes:m,note:''})).filter(s=>s.minutes>0)};
}
const course=id=>D.courses.find(c=>c.id===id)||{name:'Tanpa mata kuliah',color:'#94a3b8'};
const courseOpts=(sel,blk)=>(blk?'<option value="">— Tanpa —</option>':'')+D.courses.map(c=>`<option value="${c.id}" ${c.id===sel?'selected':''}>${esc(c.name)}</option>`).join('');
const isOver=t=>t.status!=='done'&&new Date(t.deadline)<new Date();
const dl=t=>`${fmtDate(t.deadline)} ${t.deadline.slice(11,16)}`;
const avatar=()=>D.profile.avatar?`<img alt="" src="${esc(D.profile.avatar)}">`:esc((D.profile.name||'?').trim().charAt(0).toUpperCase());

/* ===== UI: toast & modal ===== */
function toast(m,t=''){const e=document.createElement('div');e.className='toast '+t;e.textContent=m;$('#toasts').append(e);setTimeout(()=>e.remove(),2800)}
function closeModal(){const o=$('#ov');if(o)o.remove()}
function modal(title,body,fn,o={}){
  closeModal();
  const ov=document.createElement('div');ov.className='overlay';ov.id='ov';
  ov.innerHTML=`<form class="modal" novalidate><h3>${esc(title)}</h3>${body}<p class="err"></p><div class="row end">${o.del?'<button type="button" class="btn danger" data-del style="margin-right:auto">Hapus</button>':''}<button type="button" class="btn" data-x>Batal</button><button class="btn pri">${o.ok||'Simpan'}</button></div></form>`;
  document.body.append(ov);
  const f=$('form',ov);
  ov.addEventListener('mousedown',e=>{if(e.target===ov)closeModal()});
  $('[data-x]',f).onclick=closeModal;
  if(o.del)$('[data-del]',f).onclick=()=>{closeModal();confirmBox('Hapus item ini? Tindakan tidak bisa dibatalkan.',o.del)};
  f.onsubmit=e=>{e.preventDefault();const err=fn(Object.fromEntries(new FormData(f)),f);if(err)$('.err',f).textContent=err;else closeModal()};
  const first=f.querySelector('input:not([type=checkbox]),select,textarea');if(first)first.focus();
}
const confirmBox=(msg,fn)=>modal('Konfirmasi',`<p>${esc(msg)}</p>`,()=>{fn()},{ok:'Ya, lanjut'});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

/* ===== CHART HELPERS ===== */
const mins=d=>D.sessions.filter(s=>s.date===d).reduce((a,s)=>a+s.minutes,0);
const wkMins=ws=>[0,1,2,3,4,5,6].reduce((a,i)=>a+mins(addDays(ws,i)),0);
const last7=()=>[6,5,4,3,2,1,0].map(i=>{const d=addDays(todayS(),-i);return{l:DAYS[(pd(d).getDay()+6)%7],v:mins(d)/60}});
const last4=()=>[3,2,1,0].map(i=>{const w=addDays(mondayOf(todayS()),-7*i),d=pd(w);return{l:`${d.getDate()}/${d.getMonth()+1}`,v:wkMins(w)/60}});
function barChart(a){
  const W=420,H=150,m=Math.max(1,...a.map(x=>x.v)),bw=W/a.length;
  return `<svg viewBox="0 0 ${W} ${H}" class="chart">${a.map((x,i)=>{const h=x.v/m*(H-48),bx=i*bw+bw*.2,cx=bx+bw*.3;return `<rect x="${bx}" y="${H-24-h}" width="${bw*.6}" height="${Math.max(h,1)}" rx="4" fill="var(--accent)"/><text x="${cx}" y="${H-29-h}" text-anchor="middle">${x.v?x.v.toFixed(1):''}</text><text x="${cx}" y="${H-7}" text-anchor="middle">${esc(x.l)}</text>`}).join('')}</svg>`;
}
function ring(h,g){
  const p=Math.min(1,h/g),C=2*Math.PI*52;
  return `<svg viewBox="0 0 130 130" class="ring"><circle cx="65" cy="65" r="52" fill="none" stroke="var(--line)" stroke-width="12"/><circle cx="65" cy="65" r="52" fill="none" stroke="var(--accent)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C*p} ${C}" transform="rotate(-90 65 65)"/><text x="65" y="72" text-anchor="middle" class="rt">${Math.round(h/g*100)}%</text></svg>`;
}
function streak(){const days=new Set(D.sessions.filter(s=>s.minutes>0).map(s=>s.date));let d=todayS(),n=0;if(!days.has(d))d=addDays(d,-1);while(days.has(d)){n++;d=addDays(d,-1)}return n}

/* ===== DASHBOARD ===== */
const stat=(l,n,c='')=>`<div class="card stat ${c}"><b>${n}</b><span>${l}</span></div>`;
function renderDashboard(){
  const T=D.tasks,done=T.filter(t=>t.status==='done').length;
  const h=new Date().getHours(),g=h<11?'pagi':h<15?'siang':h<19?'sore':'malam';
  const up=T.filter(t=>t.status!=='done').sort((a,b)=>a.deadline.localeCompare(b.deadline)).slice(0,5);
  const ev=D.events.filter(e=>e.date===todayS()).sort((a,b)=>a.start.localeCompare(b.start));
  const goal=D.settings.weeklyGoalHours,wh=wkMins(mondayOf(todayS()))/60;
  $('#dashboard').innerHTML=`<h2 class="greet">Selamat ${g}, ${esc(D.profile.name||'Mahasiswa')} 👋</h2>
  <div class="stats">${stat('Total tugas',T.length)}${stat('Selesai',done,'ok')}${stat('Belum selesai',T.length-done)}${stat('Terlambat',T.filter(isOver).length,'bad')}</div>
  <div class="grid2">
    <div class="card"><h3>5 tugas terdekat</h3>${up.length?up.map(t=>{const c=course(t.courseId);return `<div class="trow"><input type="checkbox" data-act="toggle" data-id="${t.id}"><div class="grow"><b>${esc(t.title)}</b><small><i class="dot" style="background:${c.color}"></i>${esc(c.name)} · ${dl(t)}</small></div>${isOver(t)?'<span class="badge bad">Terlambat</span>':''}</div>`}).join(''):empty('Semua tugas selesai 🎉')}</div>
    <div class="card"><h3>Agenda hari ini</h3>${ev.length?ev.map(e=>`<div class="trow"><i class="dot" style="background:${TYPE[e.type]||TYPE.Lainnya}"></i><div class="grow"><b>${esc(e.title)}</b><small>${esc(e.start)}–${esc(e.end)} · ${esc(e.type)}</small></div></div>`).join(''):empty('Tidak ada agenda hari ini.')}</div>
    <div class="card"><h3>Jam belajar 7 hari terakhir</h3>${barChart(last7())}</div>
    <div class="card"><h3>Target belajar mingguan</h3><div class="row" style="align-items:center">${ring(wh,goal)}<div><div class="big">${wh.toFixed(1)} jam</div><span class="muted">dari target ${goal} jam minggu ini</span></div></div></div>
    <div class="card span2"><h3>Tambah tugas cepat</h3><form id="qa" class="row" novalidate><label>Judul<input name="title" placeholder="Judul tugas"></label><label>Mata kuliah<select name="courseId">${courseOpts('',true)}</select></label><label>Deadline<input type="date" name="date" value="${addDays(todayS(),1)}"></label><button class="btn pri" style="margin-bottom:10px">Tambah</button></form></div>
  </div>`;
}

/* ===== PLANNER ===== */
let cal={ref:todayS(),view:'month'};
function itemsOn(d){
  const ev=D.events.filter(e=>e.date===d).map(e=>({k:'e',id:e.id,s:e.start,t:`${e.start} ${e.title}`,c:TYPE[e.type]||TYPE.Lainnya}));
  const tk=D.tasks.filter(t=>t.deadline.slice(0,10)===d).map(t=>({k:'t',id:t.id,s:t.deadline.slice(11,16),t:`📌 ${t.deadline.slice(11,16)} ${t.title}`,c:course(t.courseId).color,done:t.status==='done'}));
  return ev.concat(tk).sort((a,b)=>a.s.localeCompare(b.s));
}
function dayCell(d,mo,max){
  const it=itemsOn(d),dim=mo>=0&&pd(d).getMonth()!==mo;
  return `<div class="day ${dim?'dim':''} ${d===todayS()?'today':''}" data-act="newev" data-date="${d}"><span class="dn">${pd(d).getDate()}</span>${it.slice(0,max).map(x=>`<div class="chip ${x.done?'done':''}" data-act="${x.k==='e'?'editev':'edittask'}" data-id="${x.id}" style="background:${x.c}" title="${esc(x.t)}">${esc(x.t)}</div>`).join('')}${it.length>max?`<div class="more">+${it.length-max} lagi</div>`:''}</div>`;
}
function renderPlanner(){
  const wk=cal.view==='week',r=pd(cal.ref),ws=mondayOf(cal.ref);let cells='';
  if(wk)for(let i=0;i<7;i++)cells+=dayCell(addDays(ws,i),-1,99);
  else{const st=mondayOf(ymd(new Date(r.getFullYear(),r.getMonth(),1)));for(let i=0;i<42;i++)cells+=dayCell(addDays(st,i),r.getMonth(),3)}
  const ttl=wk?`${fmtDate(ws)} – ${fmtDate(addDays(ws,6))}`:`${MONTHS[r.getMonth()]} ${r.getFullYear()}`;
  $('#planner').innerHTML=`<div class="toolbar"><button class="btn" data-act="calnav" data-d="-1">‹</button><button class="btn" data-act="caltoday">Hari ini</button><button class="btn" data-act="calnav" data-d="1">›</button><h2 class="grow" style="margin:0 8px">${ttl}</h2><button class="btn ${wk?'':'on'}" data-act="calview" data-v="month">Bulanan</button><button class="btn ${wk?'on':''}" data-act="calview" data-v="week">Mingguan</button><button class="btn pri" data-act="newev" data-date="${todayS()}">+ Tambah Event</button></div>
  <div class="cal ${wk?'week':''}">${DAYS.map(d=>`<div class="hd">${d}</div>`).join('')}${cells}</div>
  <div class="legend">${Object.entries(TYPE).map(([k,c])=>`<span><i style="background:${c}"></i>${k}</span>`).join('')}<span>📌 Deadline tugas (warna mata kuliah)</span></div>`;
}
function eventForm(e={}){
  const isNew=!e.id;
  modal(isNew?'Tambah Event':'Edit Event',`<label>Judul<input name="title" value="${esc(e.title)}"></label>
  <div class="row"><label>Tanggal<input type="date" name="date" value="${e.date||todayS()}"></label><label>Mulai<input type="time" name="start" value="${e.start||'08:00'}"></label><label>Selesai<input type="time" name="end" value="${e.end||'09:00'}"></label></div>
  <div class="row"><label>Tipe<select name="type">${Object.keys(TYPE).map(k=>`<option ${k===e.type?'selected':''}>${k}</option>`).join('')}</select></label><label>Mata kuliah<select name="courseId">${courseOpts(e.courseId,true)}</select></label></div>
  <label>Catatan<textarea name="note">${esc(e.note)}</textarea></label>`,f=>{
    if(!f.title.trim())return 'Judul wajib diisi.';
    if(!validDate(f.date))return 'Tanggal tidak valid.';
    if(!f.start||!f.end||f.end<=f.start)return 'Jam selesai harus setelah jam mulai.';
    const o={id:e.id||uid(),title:f.title.trim(),date:f.date,start:f.start,end:f.end,type:f.type,courseId:f.courseId,note:f.note.trim()};
    if(isNew)D.events.push(o);else Object.assign(D.events.find(x=>x.id===e.id),o);
    save();toast('Event disimpan');render();
  },{del:isNew?null:()=>{D.events=D.events.filter(x=>x.id!==e.id);save();toast('Event dihapus');render()}});
}

/* ===== TASKS ===== */
let tf={q:'',st:'',pr:'',c:'',sort:'deadline',view:'list'};
const pb=t=>({Tinggi:'bad',Sedang:'warn',Rendah:'ok'}[t.priority]);
function taskItem(t){
  const c=course(t.courseId),n=t.subtasks.length,dn=t.subtasks.filter(s=>s.done).length,fin=t.status==='done';
  return `<div class="trow top"><input type="checkbox" data-act="toggle" data-id="${t.id}" ${fin?'checked':''}><div class="grow"><b class="${fin?'strike':''}">${esc(t.title)}</b> <span class="badge ${pb(t)}">${t.priority}</span> <span class="badge">${stLabel(t.status)}</span>${isOver(t)?' <span class="badge bad">Terlambat</span>':''}<small><i class="dot" style="background:${c.color}"></i>${esc(c.name)} · ${dl(t)}</small>${n?`<div class="prog"><div class="bar"><i style="width:${dn/n*100}%"></i></div><small>${dn}/${n} subtask</small></div>`:''}</div><button class="btn sm" data-act="edittask" data-id="${t.id}">Edit</button><button class="btn sm danger" data-act="deltask" data-id="${t.id}">Hapus</button></div>`;
}
function kanban(a){
  return `<div class="kan">${ST.map(([k,l],i)=>{const L=a.filter(t=>t.status===k);return `<div class="col" data-col="${k}"><b>${l} (${L.length})</b>${L.map(t=>{const c=course(t.courseId);return `<div class="kcard" draggable="true" data-id="${t.id}"><b>${esc(t.title)}</b><small><i class="dot" style="background:${c.color}"></i>${esc(c.name)} · ${dl(t)}</small><div><span class="badge ${pb(t)}">${t.priority}</span>${isOver(t)?' <span class="badge bad">Terlambat</span>':''}</div><div class="row" style="align-items:center">${i>0?`<button class="btn sm" data-act="move" data-id="${t.id}" data-dir="-1">◀</button>`:''}<button class="btn sm" data-act="edittask" data-id="${t.id}">Edit</button>${i<2?`<button class="btn sm" data-act="move" data-id="${t.id}" data-dir="1">▶</button>`:''}</div></div>`}).join('')}</div>`}).join('')}</div>`;
}
function renderTasks(){
  const q=tf.q.toLowerCase();
  const a=D.tasks.filter(t=>(!q||(t.title+' '+t.desc).toLowerCase().includes(q))&&(!tf.st||t.status===tf.st)&&(!tf.pr||t.priority===tf.pr)&&(!tf.c||t.courseId===tf.c));
  a.sort(tf.sort==='deadline'?(x,y)=>x.deadline.localeCompare(y.deadline):tf.sort==='priority'?(x,y)=>PR.indexOf(y.priority)-PR.indexOf(x.priority):(x,y)=>y.createdAt-x.createdAt);
  $('#tasks').innerHTML=`<div class="toolbar"><input id="tq" data-tf="q" placeholder="Cari tugas…" value="${esc(tf.q)}" style="max-width:220px">
  <select data-tf="st"><option value="">Semua status</option>${ST.map(([k,l])=>`<option value="${k}" ${tf.st===k?'selected':''}>${l}</option>`).join('')}</select>
  <select data-tf="pr"><option value="">Semua prioritas</option>${PR.map(p=>`<option ${tf.pr===p?'selected':''}>${p}</option>`).join('')}</select>
  <select data-tf="c"><option value="">Semua mata kuliah</option>${courseOpts(tf.c)}</select>
  <select data-tf="sort">${[['deadline','Sort: Deadline'],['priority','Sort: Prioritas'],['new','Sort: Terbaru']].map(([k,l])=>`<option value="${k}" ${tf.sort===k?'selected':''}>${l}</option>`).join('')}</select>
  <div class="grow"></div><button class="btn ${tf.view==='list'?'on':''}" data-act="tview" data-v="list">List</button><button class="btn ${tf.view==='kanban'?'on':''}" data-act="tview" data-v="kanban">Kanban</button><button class="btn pri" data-act="newtask">+ Tugas</button></div>
  ${tf.view==='list'?`<div class="card">${a.length?a.map(taskItem).join(''):empty('Tidak ada tugas yang cocok.')}</div>`:kanban(a)}`;
}
const subRow=(s={})=>`<div class="sub" data-id="${s.id||''}"><input type="checkbox" ${s.done?'checked':''}><input type="text" value="${esc(s.text)}" placeholder="Langkah…"><button type="button" class="btn sm" data-rm>×</button></div>`;
function taskForm(t={}){
  const isNew=!t.id,[dd,tt]=(t.deadline||'').split('T');
  modal(isNew?'Tambah Tugas':'Edit Tugas',`<label>Judul<input name="title" value="${esc(t.title)}"></label>
  <label>Deskripsi<textarea name="desc">${esc(t.desc)}</textarea></label>
  <div class="row"><label>Mata kuliah<select name="courseId">${courseOpts(t.courseId,true)}</select></label><label>Deadline<input type="date" name="date" value="${dd||addDays(todayS(),1)}"></label><label>Jam<input type="time" name="time" value="${tt||'23:59'}"></label></div>
  <div class="row"><label>Prioritas<select name="priority">${PR.map(p=>`<option ${p===(t.priority||'Sedang')?'selected':''}>${p}</option>`).join('')}</select></label><label>Status<select name="status">${ST.map(([k,l])=>`<option value="${k}" ${k===(t.status||'todo')?'selected':''}>${l}</option>`).join('')}</select></label></div>
  <b>Subtask</b><div id="subs">${(t.subtasks||[]).map(subRow).join('')}</div><button type="button" class="btn sm" id="addsub">+ Subtask</button>`,(f,form)=>{
    if(!f.title.trim())return 'Judul wajib diisi.';
    if(!validDate(f.date))return 'Tanggal deadline tidak valid.';
    if(!f.time)return 'Jam deadline wajib diisi.';
    const subs=$$('.sub',form).map(r=>({id:r.dataset.id||uid(),text:$('[type=text]',r).value.trim(),done:$('[type=checkbox]',r).checked})).filter(s=>s.text);
    const o={id:t.id||uid(),title:f.title.trim(),desc:f.desc.trim(),courseId:f.courseId,deadline:`${f.date}T${f.time}`,priority:f.priority,status:f.status,subtasks:subs,createdAt:t.createdAt||Date.now()};
    if(isNew)D.tasks.push(o);else Object.assign(D.tasks.find(x=>x.id===t.id),o);
    save();toast('Tugas disimpan');render();
  },{del:isNew?null:()=>{D.tasks=D.tasks.filter(x=>x.id!==t.id);save();toast('Tugas dihapus');render()}});
  $('#addsub').onclick=()=>$('#subs').insertAdjacentHTML('beforeend',subRow());
  $('#subs').onclick=e=>{if(e.target.hasAttribute('data-rm'))e.target.closest('.sub').remove()};
}

/* ===== STUDY ===== */
const P={left:0,run:false,mode:'focus',end:0,iv:0,course:''};
function resetTimer(){clearInterval(P.iv);P.run=false;P.left=(P.mode==='focus'?D.settings.focusMin:D.settings.breakMin)*60}
function timerUI(){
  const m=$('#tm');if(!m)return;
  m.textContent=`${pad(Math.floor(P.left/60))}:${pad(P.left%60)}`;
  $('#tmode').textContent=P.mode==='focus'?'Sesi fokus':'Istirahat';
  $('#tstart').textContent=P.run?'Pause':'Start';
}
function beep(){try{const a=new(window.AudioContext||window.webkitAudioContext)();[0,.25,.5].forEach(t=>{const o=a.createOscillator(),g=a.createGain();o.frequency.value=880;o.connect(g);g.connect(a.destination);g.gain.setValueAtTime(.2,a.currentTime+t);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+t+.2);o.start(a.currentTime+t);o.stop(a.currentTime+t+.2)})}catch(e){}}
function tick(){P.left=Math.max(0,Math.round((P.end-Date.now())/1000));timerUI();if(!P.left)finish()}
function startPause(){
  if(P.run){clearInterval(P.iv);P.run=false;return timerUI()}
  if(P.mode==='focus'&&!P.course)return toast('Pilih mata kuliah dulu','bad');
  P.end=Date.now()+P.left*1000;P.run=true;P.iv=setInterval(tick,250);timerUI();
}
function finish(){
  beep();
  if(P.mode==='focus'){D.sessions.push({id:uid(),date:todayS(),courseId:P.course,minutes:D.settings.focusMin,note:'Pomodoro'});save();toast(`Sesi fokus selesai! ${D.settings.focusMin} menit tersimpan 🎉`);P.mode='break'}
  else{toast('Istirahat selesai, saatnya fokus lagi');P.mode='focus'}
  resetTimer();
  if(cur==='study')renderStudy();else timerUI();
  const c=$('#tcard');if(c){c.classList.add('flash');setTimeout(()=>c.classList.remove('flash'),3200)}
}
function renderStudy(){
  const wh=wkMins(mondayOf(todayS()))/60,goal=D.settings.weeklyGoalHours;
  const by={};D.sessions.forEach(s=>by[s.courseId]=(by[s.courseId]||0)+s.minutes);
  const mx=Math.max(1,...Object.values(by));
  const hist=[...D.sessions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,15);
  $('#study').innerHTML=`<div class="grid2">
  <div class="card tcard" id="tcard"><h3>Timer Pomodoro</h3><div class="muted" id="tmode"></div><div class="time" id="tm"></div>
    <select id="pc"><option value="">Pilih mata kuliah…</option>${courseOpts(P.course)}</select>
    <div class="row" style="margin-top:12px"><button class="btn pri" id="tstart" data-act="tstart"></button><button class="btn" data-act="treset">Reset</button></div>
    <div class="row" style="margin-top:14px"><label>Fokus (menit)<input type="number" min="1" max="180" data-set="focusMin" value="${D.settings.focusMin}"></label><label>Istirahat (menit)<input type="number" min="1" max="60" data-set="breakMin" value="${D.settings.breakMin}"></label></div></div>
  <div class="card"><h3>Target mingguan &amp; streak</h3><div class="row" style="align-items:center">${ring(wh,goal)}<div><div class="big">${streak()} 🔥</div><span class="muted">hari berturut-turut</span><p>${wh.toFixed(1)} / ${goal} jam (${Math.round(wh/goal*100)}%)</p></div></div></div>
  <div class="card"><h3>7 hari terakhir (jam)</h3>${barChart(last7())}</div>
  <div class="card"><h3>4 minggu terakhir (jam)</h3>${barChart(last4())}</div>
  <div class="card"><h3>Distribusi per mata kuliah</h3>${Object.keys(by).length?Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([id,m])=>{const c=course(id);return `<div class="dist"><span>${esc(c.name)}</span><div class="bar"><i style="width:${m/mx*100}%;background:${c.color}"></i></div><small>${(m/60).toFixed(1)} j</small></div>`}).join(''):empty('Belum ada sesi.')}</div>
  <div class="card"><h3>Input sesi manual</h3><form id="sf" novalidate><div class="row"><label>Tanggal<input type="date" name="date" value="${todayS()}"></label><label>Durasi (menit)<input type="number" name="minutes" min="1" value="30"></label></div><label>Mata kuliah<select name="courseId">${courseOpts('',true)}</select></label><label>Catatan<input name="note"></label><button class="btn pri">Tambah sesi</button></form></div>
  <div class="card span2"><h3>Riwayat sesi</h3>${hist.length?hist.map(s=>{const c=course(s.courseId);return `<div class="trow"><i class="dot" style="background:${c.color}"></i><div class="grow"><b>${esc(c.name)}</b> · ${s.minutes} menit<small>${fmtDate(s.date)}${s.note?' · '+esc(s.note):''}</small></div><button class="btn sm danger" data-act="delsess" data-id="${s.id}">Hapus</button></div>`}).join(''):empty('Belum ada riwayat.')}</div></div>`;
  timerUI();
}

/* ===== ACCOUNT ===== */
function courseForm(c={}){
  modal(c.id?'Edit Mata Kuliah':'Tambah Mata Kuliah',`<label>Nama<input name="name" value="${esc(c.name)}"></label><label>Warna<input type="color" name="color" value="${c.color||'#4f46e5'}"></label>`,f=>{
    if(!f.name.trim())return 'Nama wajib diisi.';
    if(c.id)Object.assign(D.courses.find(x=>x.id===c.id),{name:f.name.trim(),color:f.color});else D.courses.push({id:uid(),name:f.name.trim(),color:f.color});
    save();toast('Mata kuliah disimpan');render();
  });
}
function renderAccount(){
  const p=D.profile,s=D.settings;
  $('#account').innerHTML=`<div class="grid2">
  <div class="card"><h3>Profil</h3><div class="row" style="align-items:center;margin-bottom:12px"><div class="avatar lg">${avatar()}</div><label style="margin:0">Foto<input type="file" id="av" accept="image/*"></label></div>
    <form id="pf" novalidate><label>Nama<input name="name" value="${esc(p.name)}"></label><label>Universitas<input name="university" value="${esc(p.university)}"></label><div class="row"><label>Jurusan<input name="major" value="${esc(p.major)}"></label><label>Semester<input name="semester" type="number" min="1" max="14" value="${esc(p.semester)}"></label></div><button class="btn pri">Simpan profil</button></form></div>
  <div class="card"><h3>Pengaturan</h3><form id="st" novalidate><label>Target belajar mingguan (jam)<input type="number" step="0.5" min="0.5" name="weeklyGoalHours" value="${s.weeklyGoalHours}"></label><div class="row"><label>Fokus (menit)<input type="number" min="1" name="focusMin" value="${s.focusMin}"></label><label>Istirahat (menit)<input type="number" min="1" name="breakMin" value="${s.breakMin}"></label></div><label>Tema<select name="theme"><option value="light" ${s.theme==='light'?'selected':''}>Terang</option><option value="dark" ${s.theme==='dark'?'selected':''}>Gelap</option></select></label><button class="btn pri">Simpan pengaturan</button></form></div>
  <div class="card"><div class="row" style="align-items:center"><h3 class="grow">Mata kuliah</h3><button class="btn sm pri" data-act="newcourse">+ Tambah</button></div>${D.courses.length?D.courses.map(c=>`<div class="trow"><i class="dot" style="background:${c.color}"></i><div class="grow">${esc(c.name)}</div><button class="btn sm" data-act="editcourse" data-id="${c.id}">Edit</button><button class="btn sm danger" data-act="delcourse" data-id="${c.id}">Hapus</button></div>`).join(''):empty('Belum ada mata kuliah.')}</div>
  <div class="card"><h3>Data</h3><p class="muted">Data tersimpan di browser (localStorage). Ekspor secara berkala sebagai cadangan.</p><div class="row" style="align-items:center"><button class="btn" data-act="export">Export JSON</button><button class="btn" data-act="import">Import JSON</button><button class="btn danger" data-act="reset">Reset semua data</button></div><input type="file" id="imp" accept=".json,application/json" hidden></div></div>`;
}
function doExport(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(D,null,2)],{type:'application/json'}));a.download=`stp-backup-${todayS()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Data diekspor')}
function onboard(){
  if(D.profile.name.trim())return;
  modal('Selamat datang! 👋',`<p class="muted">Isi nama dan mata kuliah pertamamu.</p><label>Nama<input name="name"></label><label>Mata kuliah pertama${D.courses.length?' (opsional)':''}<input name="course"></label><label>Warna<input type="color" name="color" value="#4f46e5"></label>`,f=>{
    if(!f.name.trim())return 'Nama wajib diisi.';
    if(!f.course.trim()&&!D.courses.length)return 'Isi mata kuliah pertama.';
    D.profile.name=f.name.trim();
    if(f.course.trim())D.courses.push({id:uid(),name:f.course.trim(),color:f.color});
    save();toast('Selamat datang, '+D.profile.name+'!');render();
  },{ok:'Mulai'});
}

/* ===== EVENTS (delegated) ===== */
const A={
  toggle(d){const t=D.tasks.find(x=>x.id===d.id);if(!t)return;t.status=t.status==='done'?'todo':'done';save();render()},
  newev:d=>eventForm({date:d.date}),
  editev:d=>eventForm(D.events.find(x=>x.id===d.id)),
  edittask:d=>taskForm(D.tasks.find(x=>x.id===d.id)),
  newtask:()=>taskForm(),
  deltask:d=>confirmBox('Hapus tugas ini?',()=>{D.tasks=D.tasks.filter(x=>x.id!==d.id);save();toast('Tugas dihapus');render()}),
  move(d){const t=D.tasks.find(x=>x.id===d.id),i=ST.findIndex(s=>s[0]===t.status)+Number(d.dir);if(ST[i]){t.status=ST[i][0];save();render()}},
  tview(d){tf.view=d.v;render()},
  calnav(d){const n=Number(d.d);if(cal.view==='week')cal.ref=addDays(cal.ref,7*n);else{const x=pd(cal.ref);x.setDate(1);x.setMonth(x.getMonth()+n);cal.ref=ymd(x)}render()},
  caltoday(){cal.ref=todayS();render()},
  calview(d){cal.view=d.v;render()},
  tstart:startPause,
  treset(){P.mode='focus';resetTimer();timerUI()},
  delsess:d=>confirmBox('Hapus sesi ini?',()=>{D.sessions=D.sessions.filter(x=>x.id!==d.id);save();toast('Sesi dihapus');render()}),
  newcourse:()=>courseForm(),
  editcourse:d=>courseForm(D.courses.find(x=>x.id===d.id)),
  delcourse:d=>confirmBox('Hapus mata kuliah ini? Tugas/sesi terkait akan tampil sebagai "Tanpa mata kuliah".',()=>{D.courses=D.courses.filter(x=>x.id!==d.id);save();toast('Mata kuliah dihapus');render()}),
  export:doExport,
  import:()=>$('#imp').click(),
  reset:()=>confirmBox('Semua data (termasuk data contoh) akan dihapus permanen. Lanjutkan?',()=>{D=blank();save();P.mode='focus';resetTimer();toast('Data direset');render();setTimeout(onboard,50)}),
  theme(){D.settings.theme=D.settings.theme==='dark'?'light':'dark';save();render()}
};
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(el&&A[el.dataset.act])A[el.dataset.act](el.dataset)});

const FORMS={
  qa(v){
    if(!v.title.trim())return toast('Judul wajib diisi','bad');
    if(!validDate(v.date))return toast('Tanggal tidak valid','bad');
    D.tasks.push({id:uid(),title:v.title.trim(),desc:'',courseId:v.courseId,deadline:v.date+'T23:59',priority:'Sedang',status:'todo',subtasks:[],createdAt:Date.now()});
    save();toast('Tugas ditambahkan');render();
  },
  sf(v){
    const m=Number(v.minutes);
    if(!validDate(v.date))return toast('Tanggal tidak valid','bad');
    if(!(m>0))return toast('Durasi harus lebih dari 0','bad');
    D.sessions.push({id:uid(),date:v.date,courseId:v.courseId,minutes:Math.round(m),note:v.note.trim()});
    save();toast('Sesi ditambahkan');render();
  },
  pf(v){
    if(!v.name.trim())return toast('Nama wajib diisi','bad');
    Object.assign(D.profile,{name:v.name.trim(),university:v.university.trim(),major:v.major.trim(),semester:v.semester});
    save();toast('Profil disimpan');render();
  },
  st(v){
    const g=Number(v.weeklyGoalHours),f=Number(v.focusMin),b=Number(v.breakMin);
    if(!(g>0&&f>0&&b>0))return toast('Semua nilai harus lebih dari 0','bad');
    Object.assign(D.settings,{weeklyGoalHours:g,focusMin:Math.round(f),breakMin:Math.round(b),theme:v.theme});
    save();if(!P.run)resetTimer();toast('Pengaturan disimpan');render();
  }
};
document.addEventListener('submit',e=>{const h=FORMS[e.target.id];if(h){e.preventDefault();h(Object.fromEntries(new FormData(e.target)))}});

document.addEventListener('input',e=>{
  const k=e.target.dataset&&e.target.dataset.tf;if(!k)return;
  tf[k]=e.target.value;renderTasks();
  if(k==='q'){const i=$('#tq');i.focus();i.setSelectionRange(i.value.length,i.value.length)}
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset&&t.dataset.set){const v=Math.round(Number(t.value));if(v>0){D.settings[t.dataset.set]=v;save();if(!P.run)resetTimer();timerUI()}else{t.value=D.settings[t.dataset.set];toast('Durasi harus lebih dari 0','bad')}}
  if(t.id==='pc')P.course=t.value;
  if(t.id==='av'&&t.files[0]){
    const r=new FileReader();
    r.onload=()=>{const im=new Image();
      im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=200;const s=Math.min(im.width,im.height);c.getContext('2d').drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,200,200);D.profile.avatar=c.toDataURL('image/jpeg',.85);save();toast('Foto diperbarui');render()};
      im.onerror=()=>toast('File gambar tidak valid','bad');im.src=r.result};
    r.readAsDataURL(t.files[0]);
  }
  if(t.id==='imp'&&t.files[0]){
    const r=new FileReader();
    r.onload=()=>{try{const o=JSON.parse(r.result);if(!valid(o))throw new Error('x');confirmBox('Import akan menimpa semua data saat ini. Lanjutkan?',()=>{D=norm(o);save();resetTimer();toast('Import berhasil');render()})}catch(x){toast('File JSON tidak valid','bad')}};
    r.readAsText(t.files[0]);t.value='';
  }
});
document.addEventListener('dragstart',e=>{const c=e.target.closest&&e.target.closest('.kcard');if(c)e.dataTransfer.setData('text/plain',c.dataset.id)});
document.addEventListener('dragover',e=>{const c=e.target.closest&&e.target.closest('.col');if(c){e.preventDefault();c.classList.add('over')}});
document.addEventListener('dragleave',e=>{const c=e.target.closest&&e.target.closest('.col');if(c)c.classList.remove('over')});
document.addEventListener('drop',e=>{
  const c=e.target.closest&&e.target.closest('.col');if(!c)return;e.preventDefault();
  const t=D.tasks.find(x=>x.id===e.dataTransfer.getData('text/plain'));
  if(t){t.status=c.dataset.col;save();toast('Status dipindah ke '+stLabel(t.status));render()}
});

/* ===== ROUTER & INIT ===== */
const PAGES={dashboard:['Dashboard',renderDashboard],planner:['Planner',renderPlanner],tasks:['Task',renderTasks],study:['Progress Study',renderStudy],account:['Account',renderAccount]};
let cur='dashboard';
function go(p){cur=p;$$('main section').forEach(s=>s.classList.toggle('show',s.id===p));$$('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.p===p));render()}
function render(){
  document.documentElement.dataset.theme=D.settings.theme;
  $('#title').textContent=PAGES[cur][0];
  $('#date').textContent=new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  $('#avatarTop').innerHTML=avatar();
  PAGES[cur][1]();
}
D=load();save();resetTimer();
$('#nav').onclick=e=>{const b=e.target.closest('button');if(b)go(b.dataset.p)};
go('dashboard');onboard();