const SB_URL='https://tzfwlailknlxwdgxvxrc.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6ZndsYWlsa25seHdkZ3h2eHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Mzg2NDYsImV4cCI6MjA5NzExNDY0Nn0.fPdICmSn18Diq3IuDCzSYPj1jnyPShFPJFY0PbJGsso';

function today(){return new Date().toISOString().split('T')[0];}
function getToken(){return localStorage.getItem('rnp_token')||SB_KEY;}
function authHeaders(){return{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+getToken()};}

let currentUser=null,params=[],entries={},activeParam=null,currentDate=today();

async function sbLogin(email,password){
  try{
    const r=await fetch(SB_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY},body:JSON.stringify({email,password})});
    const d=await r.json();
    if(!r.ok)return{error:{message:d.error_description||d.msg||'Login yoki parol xato'}};
    localStorage.setItem('rnp_token',d.access_token);
    localStorage.setItem('rnp_user',JSON.stringify(d.user));
    return{data:{user:d.user}};
  }catch(e){return{error:{message:'Tarmoq xatosi: '+e.message}};}
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
  document.querySelectorAll('.nav-item').forEach(item=>{item.addEventListener('click',e=>{e.preventDefault();document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));item.classList.add('active');close();});});
}

async function doLogin(){
  const email=document.getElementById('loginEmail').value.trim();
  const pass=document.getElementById('loginPassword').value;
  const errEl=document.getElementById('loginError');
  const btn=document.getElementById('loginBtn');
  errEl.textContent='';
  if(!email||!pass){errEl.textContent='Email va parol kiriting';return;}
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

function showLogin(){document.getElementById('loginOverlay').classList.remove('hidden');document.getElementById('app').classList.add('hidden');document.getElementById('loginPassword').value='';}
function showApp(){document.getElementById('loginOverlay').classList.add('hidden');document.getElementById('app').classList.remove('hidden');document.getElementById('userDisplay').textContent=currentUser?.email||'';}

async function loadAll(){await loadParams();await loadEntries();}

async function loadParams(){
  const{data,error}=await sbGet('params',{active:true});
  if(error){showToast('Yuklanmadi','error');return;}
  params=data||[];renderParams();
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
  document.getElementById('inputSectionLabel').textContent=p.section||'';
  document.getElementById('activeParamName').textContent=p.name;
  document.getElementById('unitLabel').textContent=p.unit||'—';
  const ex=entries[p.id];document.getElementById('valueInput').value=ex?ex.value:'';
  document.getElementById('valueInput').focus();
  if(window.innerWidth<=560)document.getElementById('inputPanel').scrollIntoView({behavior:'smooth'});
}

function updateTodayList(){
  const list=document.getElementById('todayList');const filled=Object.values(entries);
  if(!filled.length){list.innerHTML='<span class="empty-hint">Hali kiritilmagan</span>';return;}
  list.innerHTML=filled.map(e=>{const p=params.find(x=>x.id===e.param_id);return`<div class="today-entry"><div class="today-entry-name">${p?.name||''}</div><div class="today-entry-val">${e.value} ${p?.unit||''}</div></div>`;}).join('');
}

function showToast(msg,type=''){
  const t=document.getElementById('toast');t.textContent=msg;t.className='toast show '+type;
  setTimeout(()=>{t.className='toast';},4000);
}
