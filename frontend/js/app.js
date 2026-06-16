const SB_URL='https://tzfwlailknlxwdgxvxrc.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6ZndsYWlsa25seHdkZ3h2eHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Mzg2NDYsImV4cCI6MjA5NzExNDY0Nn0.fPdICmSn18Diq3IuDCzSYPj1jnyPShFPJFY0PbJGsso';

function today(){return new Date().toISOString().split('T')[0];}
function getToken(){return localStorage.getItem('rnp_token')||SB_KEY;}
function authHeaders(){return{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+getToken()};}

let currentUser=null,params=[],entries={},activeParam=null,currentDate=today();
let analyticsRange='week',chartTrend=null,chartSection=null,currentPage='production';

async function sbSignup(email,password){
  try{
    const r=await fetch(SB_URL+'/auth/v1/signup',{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY},body:JSON.stringify({email,password})});
    const d=await r.json();
    if(!r.ok)return{error:{message:d.msg||d.error_description||"Ro'yxatdan o'tishda xato"}};
    return{data:d};
  }catch(e){return{error:{message:'Tarmoq xatosi: '+e.message}};}
}

async function sbLogin(email,password){
  try{
    const r=await fetch(SB_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY},body:JSON.stringify({email,password})});
    const d=await r.json();
    console.log('Login response',r.status,d);
    if(!r.ok){
      const msg=d.error_description||d.msg||d.message||JSON.stringify(d);
      return{error:{message:msg+' ('+r.status+')'}};
    }
    localStorage.setItem('rnp_token',d.access_token);
    localStorage.setItem('rnp_user',JSON.stringify(d.user));
    return{data:{user:d.user}};
  }catch(e){
    console.error('Login fetch error',e);
    return{error:{message:'Tarmoq xatosi: '+e.message}};
  }
}

async function sbGet(table,filters={}){
  try{
    let q=SB_URL+'/rest/v1/'+table+'?select=*';
    Object.entries(filters).forEach(([k,v])=>{q+='&'+k+'=eq.'+encodeURIComponent(v);});
    q+='&order=sort_order';
    const r=await fetch(q,{headers:authHeaders()});
    const d=await r.json();
    return r.ok?{data:d}:{data:[],error:d};
  }catch(e){return{data:[],error:{message:e.message}};}
}

async function sbUpsert(table,body,conflict){
  try{
    const r=await fetch(SB_URL+'/rest/v1/'+table+'?on_conflict='+conflict,{
      method:'POST',
      headers:{...authHeaders(),'Prefer':'resolution=merge-duplicates,return=representation'},
      body:JSON.stringify(body)
    });
    const d=await r.json();
    return r.ok?{data:Array.isArray(d)?d[0]:d}:{error:{message:JSON.stringify(d)}};
  }catch(e){return{error:{message:e.message}};}
}

document.addEventListener('DOMContentLoaded',async()=>{
  document.getElementById('dateInput').value=currentDate;
  bindUI();
  const u=localStorage.getItem('rnp_user');
  const t=localStorage.getItem('rnp_token');
  if(u&&t){currentUser=JSON.parse(u);showApp();await loadAll();}
  else showLogin();
});

function bindUI(){
  document.getElementById('loginBtn').addEventListener('click',doLogin);
  document.getElementById('loginPassword').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
  document.getElementById('registerBtn').addEventListener('click',doRegister);
  document.getElementById('regPassword').addEventListener('keydown',e=>{if(e.key==='Enter')doRegister();});
  document.getElementById('switchToRegister').addEventListener('click',e=>{e.preventDefault();document.getElementById('loginBtn').closest('.login-body').style.display='none';document.getElementById('registerForm').style.display='block';});
  document.getElementById('switchToLogin').addEventListener('click',e=>{e.preventDefault();document.getElementById('registerForm').style.display='none';document.getElementById('loginBtn').closest('.login-body').style.display='block';});
  document.getElementById('logoutBtn').addEventListener('click',()=>{localStorage.removeItem('rnp_token');localStorage.removeItem('rnp_user');showLogin();});
  document.getElementById('dateInput').addEventListener('change',async e=>{currentDate=e.target.value;await loadEntries();renderParams();});
  document.getElementById('searchInput').addEventListener('input',e=>{renderParams(e.target.value.toLowerCase());});
  document.getElementById('saveBtn').addEventListener('click',saveValue);
  document.getElementById('valueInput').addEventListener('keydown',e=>{if(e.key==='Enter')saveValue();});
  const sidebar=document.getElementById('sidebar');
  const overlay=document.getElementById('sidebarOverlay');
  document.getElementById('menuBtn').addEventListener('click',()=>{sidebar.classList.add('open');overlay.classList.add('active');});
  const close=()=>{sidebar.classList.remove('open');overlay.classList.remove('active');};
  document.getElementById('sidebarClose').addEventListener('click',close);
  overlay.addEventListener('click',close);
  document.querySelectorAll('.nav-item').forEach(item=>{item.addEventListener('click',e=>{e.preventDefault();const pg=item.getAttribute('data-page')||'production';showPage(pg);close();});});
  document.querySelectorAll('.an-tab').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.an-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');analyticsRange=btn.getAttribute('data-range');const cr=document.getElementById('customRangeWrap');cr.classList.toggle('hidden',analyticsRange!=='custom');if(analyticsRange!=='custom')loadAnalytics();});});
  document.getElementById('applyCustomRange').addEventListener('click',loadAnalytics);
}

async function doLogin(){
  const email=document.getElementById('loginEmail').value.trim();
  const pass=document.getElementById('loginPassword').value;
  const errEl=document.getElementById('loginError');
  const btn=document.getElementById('loginBtn');
  errEl.textContent='';
  if(!email||!pass){errEl.textContent='Email va parol kiriting';return;}
  console.log('Login attempt email:',JSON.stringify(email),'pass length:',pass.length,'codes:',Array.from(pass).map(c=>c.charCodeAt(0)));
  btn.textContent='Kirilmoqda...';btn.disabled=true;
  try{
    const{data,error}=await sbLogin(email,pass);
    if(error){errEl.textContent=error.message;return;}
    currentUser=data.user;showApp();await loadAll();
  }catch(e){
    errEl.textContent='Xato: '+e.message;
  }finally{
    btn.textContent='Kirish';btn.disabled=false;
  }
}

async function adminDirectLogin(){
  const errEl=document.getElementById('loginError');
  errEl.textContent='Kirilmoqda...';
  try{
    const r=await fetch(SB_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY},body:'{"email":"admin@rnp.uz","password":"Admin123!"}'});
    const d=await r.json();
    console.log('Direct admin login:',r.status,d);
    if(r.ok){localStorage.setItem('rnp_token',d.access_token);localStorage.setItem('rnp_user',JSON.stringify(d.user));currentUser=d.user;showApp();await loadAll();}
    else{errEl.textContent='Xato: '+JSON.stringify(d);}
  }catch(e){errEl.textContent='Network: '+e.message;}
}

async function doRegister(){
  const email=document.getElementById('regEmail').value.trim();
  const pass=document.getElementById('regPassword').value;
  const errEl=document.getElementById('registerError');
  const sucEl=document.getElementById('registerSuccess');
  const btn=document.getElementById('registerBtn');
  errEl.textContent='';sucEl.textContent='';
  if(!email||!pass){errEl.textContent='Email va parol kiriting';return;}
  if(pass.length<6){errEl.textContent='Parol kamida 6 ta belgi bo\'lishi kerak';return;}
  btn.textContent='Ro\'yxatdan o\'tilmoqda...';btn.disabled=true;
  const{data,error}=await sbSignup(email,pass);
  btn.textContent='Ro\'yxatdan o\'tish';btn.disabled=false;
  if(error){errEl.textContent=error.message;return;}
  if(data.access_token){
    localStorage.setItem('rnp_token',data.access_token);
    localStorage.setItem('rnp_user',JSON.stringify(data.user));
    currentUser=data.user;showApp();await loadAll();
  }else{
    sucEl.textContent='Email tasdiqlang! Pochtangizni tekshiring.';
  }
}

function showLogin(){document.getElementById('loginOverlay').classList.remove('hidden');document.getElementById('app').classList.add('hidden');document.getElementById('loginPassword').value='';}
function showApp(){document.getElementById('loginOverlay').classList.add('hidden');document.getElementById('app').classList.remove('hidden');document.getElementById('userDisplay').textContent=currentUser?.email||'';}

async function loadAll(){await loadParams();await loadEntries();}

async function loadParams(){
  const{data,error}=await sbGet('params',{active:true});
  if(error){showToast('Yuklanmadi','error');return;}
  params=data||[];renderParams();
  const pc=document.getElementById('paramsCount');
  if(pc)pc.textContent=params.length+' ta';
}

async function loadEntries(){
  const{data}=await sbGet('entries',{entry_date:currentDate});
  entries={};(data||[]).forEach(e=>{entries[e.param_id]=e;});updateTodayList();
}

async function saveValue(){
  if(!activeParam){showToast('Avval parametr tanlang','error');return;}
  const val=document.getElementById('valueInput').value.trim();
  if(!val){showToast('Qiymat kiriting','error');return;}
  const{data,error}=await sbUpsert('entries',{param_id:activeParam.id,value:parseFloat(val),entry_date:currentDate,created_by:currentUser.id},'param_id,entry_date');
  if(error){showToast('Xato: '+error.message,'error');return;}
  await loadEntries();
  renderParams(document.getElementById('searchInput').value.toLowerCase());
  showToast('Saqlandi ✓','success');
  const idx=params.findIndex(p=>p.id===activeParam.id);
  if(idx<params.length-1)selectParam(params[idx+1]);
}

function renderParams(filter=''){
  const container=document.getElementById('paramsList');container.innerHTML='';
  const sections={};
  params.forEach(p=>{if(filter&&!p.name.toLowerCase().includes(filter))return;const s=p.section||'Umumiy';if(!sections[s])sections[s]=[];sections[s].push(p);});
  if(!Object.keys(sections).length){container.innerHTML='<p class="loading">Topilmadi</p>';return;}
  Object.entries(sections).forEach(([sec,list])=>{
    const secEl=document.createElement('div');
    secEl.innerHTML=`<div class="param-section-title">${sec}</div>`;
    list.forEach(p=>{
      const e=entries[p.id];const item=document.createElement('div');
      item.className='param-item'+(activeParam?.id===p.id?' active':'');
      item.innerHTML=`<span class="param-dot"></span><span>${p.name}</span>${e?`<span class="param-badge">${e.value} ${p.unit||''}</span>`:''}`;
      item.addEventListener('click',()=>selectParam(p));secEl.appendChild(item);
    });container.appendChild(secEl);
  });
}

function selectParam(p){
  activeParam=p;
  document.querySelectorAll('.param-item').forEach(el=>{const n=el.querySelector('span:nth-child(2)');if(n&&n.textContent===p.name)el.classList.add('active');else el.classList.remove('active');});
  document.getElementById('inputSectionLabel').textContent=p.section||'—';
  document.getElementById('activeParamName').textContent=p.name;
  document.getElementById('unitLabel').textContent=p.unit||'—';
  const ex=entries[p.id];document.getElementById('valueInput').value=ex?ex.value:'';
  document.getElementById('valueInput').focus();
  if(window.innerWidth<=600)document.getElementById('inputPanel').scrollIntoView({behavior:'smooth'});
}

function updateTodayList(){
  const list=document.getElementById('todayList');const filled=Object.values(entries);
  const badge=document.getElementById('todayCountBadge');
  if(badge)badge.textContent=filled.length||'';
  if(!filled.length){list.innerHTML='<span class="empty-hint">Hali kiritilmagan</span>';return;}
  list.innerHTML=filled.map(e=>{const p=params.find(x=>x.id===e.param_id);return`<div class="today-entry"><div class="today-entry-name">${p?.name||''}</div><div class="today-entry-val">${e.value} ${p?.unit||''}</div></div>`;}).join('');
}

function showToast(msg,type=''){
  const t=document.getElementById('toast');t.textContent=msg;t.className='toast show'+(type?' '+type:'');
  setTimeout(()=>{t.className='toast';},4000);
}

/* ══════════ PAGE ROUTING ══════════ */
function showPage(page){
  currentPage=page;
  const isProd=page==='production';
  document.getElementById('productionPage').classList.toggle('hidden',!isProd);
  document.getElementById('analyticsPage').classList.toggle('hidden',isProd);
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.getAttribute('data-page')===page));
  if(page==='analytics')loadAnalytics();
}

/* ══════════ ANALYTICS ══════════ */
function datesBetween(from,to){
  const dates=[];const d=new Date(from);const end=new Date(to);
  while(d<=end){dates.push(d.toISOString().split('T')[0]);d.setDate(d.getDate()+1);}
  return dates;
}

function getAnalyticsRange(){
  const toBase=today();
  let from,to=toBase;
  if(analyticsRange==='week'){const d=new Date();d.setDate(d.getDate()-6);from=d.toISOString().split('T')[0];}
  else if(analyticsRange==='30'){const d=new Date();d.setDate(d.getDate()-29);from=d.toISOString().split('T')[0];}
  else if(analyticsRange==='month'){const d=new Date();d.setDate(1);from=d.toISOString().split('T')[0];}
  else{from=document.getElementById('analyticsFrom').value||toBase;to=document.getElementById('analyticsTo').value||toBase;}
  return{from,to};
}

async function loadAnalytics(){
  const{from,to}=getAnalyticsRange();
  document.getElementById('analyticsDateLabel').textContent=from+' — '+to;
  const url=SB_URL+'/rest/v1/entries?select=*&entry_date=gte.'+from+'&entry_date=lte.'+to+'&order=entry_date';
  let data=[];
  try{const r=await fetch(url,{headers:authHeaders()});if(r.ok)data=await r.json();}catch(e){}
  renderKPIs(data,from,to);
  renderTrendChart(data,from,to);
  renderSectionChart(data);
  renderAnalyticsTable(data,from,to);
}

function renderKPIs(data,from,to){
  const total=data.length;
  const filledSet=new Set(data.map(e=>e.param_id));
  const filled=filledSet.size;
  const total_params=params.length||1;
  const pct=Math.round(filled/total_params*100);
  const activeDays=new Set(data.map(e=>e.entry_date)).size;
  const numVals=data.filter(e=>typeof e.value==='number');
  const avg=numVals.length?Math.round(numVals.reduce((s,e)=>s+e.value,0)/numVals.length*10)/10:0;
  document.getElementById('kpiTotalEntries').textContent=total;
  document.getElementById('kpiFilledParams').textContent=filled+'/'+total_params;
  document.getElementById('kpiCompletion').textContent=pct+'%';
  document.getElementById('kpiActiveDays').textContent=activeDays+' kun';
  document.getElementById('kpiAvgValue').textContent=avg;
}

function renderTrendChart(data,from,to){
  const dates=datesBetween(from,to);
  const counts={};data.forEach(e=>{counts[e.entry_date]=(counts[e.entry_date]||0)+1;});
  const labels=dates.map(d=>{const p=d.slice(5).split('-');return p[1]+'/'+p[0];});
  const vals=dates.map(d=>counts[d]||0);
  document.getElementById('trendSub').textContent=data.length+' ta kiritish';
  const ctx=document.getElementById('trendChart').getContext('2d');
  if(chartTrend)chartTrend.destroy();
  chartTrend=new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[{label:'Kiritishlar',data:vals,borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,.1)',borderWidth:2,pointRadius:dates.length>20?0:3,pointBackgroundColor:'#6366f1',fill:true,tension:.4}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{title:t=>'Sana: '+t[0].label}}},scales:{x:{grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:10},maxTicksLimit:10}},y:{grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:10},precision:0},beginAtZero:true}}}
  });
}

function renderSectionChart(data){
  if(!params.length)return;
  const sc={};
  data.forEach(e=>{const p=params.find(x=>x.id===e.param_id);if(p){sc[p.section]=(sc[p.section]||0)+1;}});
  const sections=Object.keys(sc).sort((a,b)=>sc[b]-sc[a]);
  const vals=sections.map(s=>sc[s]);
  const palette=['#6366f1','#8b5cf6','#0ea5e9','#059669','#f97316','#ec4899','#14b8a6','#f59e0b'];
  document.getElementById('sectionSub').textContent=sections.length+' ta bo\'lim';
  const ctx=document.getElementById('sectionChart').getContext('2d');
  if(chartSection)chartSection.destroy();
  chartSection=new Chart(ctx,{
    type:'bar',
    data:{labels:sections.map(s=>s.length>14?s.slice(0,13)+'…':s),datasets:[{data:vals,backgroundColor:sections.map((_,i)=>palette[i%palette.length]+'bb'),borderColor:sections.map((_,i)=>palette[i%palette.length]),borderWidth:1.5,borderRadius:5}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{font:{size:10}}},y:{grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:10},precision:0},beginAtZero:true}}}
  });
}

function renderAnalyticsTable(data,from,to){
  const dates=datesBetween(from,to).reverse();
  const total_params=params.length||1;
  document.getElementById('tableSubLabel').textContent=dates.length+' kun';
  document.getElementById('analyticsTableBody').innerHTML=dates.map(date=>{
    const day=data.filter(e=>e.entry_date===date);
    const filled=new Set(day.map(e=>e.param_id)).size;
    const pct=Math.round(filled/total_params*100);
    const sc=pct>=80?'st-high':pct>=50?'st-mid':pct>0?'st-low':'st-none';
    const st=pct>=80?'Yaxshi':pct>=50?"O'rtacha":pct>0?'Past':'—';
    return`<tr>
      <td style="font-weight:600;font-variant-numeric:tabular-nums">${date}</td>
      <td>${day.length}</td>
      <td>${filled}/${total_params}</td>
      <td><div class="bar-wrap"><div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div><span class="bar-pct">${pct}%</span></div></td>
      <td><span class="st-badge ${sc}">${st}</span></td>
    </tr>`;
  }).join('');
}
