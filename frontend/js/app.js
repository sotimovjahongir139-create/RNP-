let currentUser=null,params=[],entries={},activeParam=null,currentDate=today();
document.addEventListener('DOMContentLoaded',async()=>{
  document.getElementById('dateInput').value=currentDate;
  bindUI();
  const{data:{session},error:se}=await supabase.auth.getSession();
  if(se){showErr('Session xato: '+se.message);return;}
  if(session){currentUser=session.user;showApp();await loadAll();}
  else showLogin();
  supabase.auth.onAuthStateChange((_,session)=>{if(!session)showLogin();});
});
function today(){return new Date().toISOString().split('T')[0];}
function showErr(msg){const el=document.getElementById('loginError');if(el)el.textContent=msg;alert(msg);}
function bindUI(){
  document.getElementById('loginBtn').addEventListener('click',doLogin);
  document.getElementById('loginPassword').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
  document.getElementById('logoutBtn').addEventListener('click',async()=>{await supabase.auth.signOut();showLogin();});
  document.getElementById('dateInput').addEventListener('change',async e=>{currentDate=e.target.value;await loadEntries();renderParams();});
  document.getElementById('searchInput').addEventListener('input',e=>{renderParams(e.target.value.toLowerCase());});
  document.getElementById('saveBtn').addEventListener('click',saveValue);
  document.getElementById('valueInput').addEventListener('keydown',e=>{if(e.key==='Enter')saveValue();});
  const sidebar=document.getElementById('sidebar');
  const overlay=document.getElementById('sidebarOverlay');
  document.getElementById('menuBtn').addEventListener('click',()=>{sidebar.classList.add('open');overlay.classList.add('active');});
  const closeSidebar=()=>{sidebar.classList.remove('open');overlay.classList.remove('active');};
  document.getElementById('sidebarClose').addEventListener('click',closeSidebar);
  overlay.addEventListener('click',closeSidebar);
  document.querySelectorAll('.nav-item').forEach(item=>{item.addEventListener('click',e=>{e.preventDefault();document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));item.classList.add('active');closeSidebar();});});
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
    const{data,error}=await supabase.auth.signInWithPassword({email,password:pass});
    if(error){errEl.textContent='Xato: '+error.message;btn.textContent='Kirish';btn.disabled=false;return;}
    currentUser=data.user;showApp();await loadAll();
  }catch(e){errEl.textContent='Xato: '+e.message;}
  btn.textContent='Kirish';btn.disabled=false;
}
function showLogin(){document.getElementById('loginOverlay').classList.remove('hidden');document.getElementById('app').classList.add('hidden');document.getElementById('loginPassword').value='';}
function showApp(){document.getElementById('loginOverlay').classList.add('hidden');document.getElementById('app').classList.remove('hidden');document.getElementById('userDisplay').textContent=currentUser?.email||'';}
async function loadAll(){await loadParams();await loadEntries();}
async function loadParams(){
  const{data,error}=await supabase.from('params').select('*').eq('active',true).order('sort_order');
  if(error){showToast('Parametrlar yuklanmadi: '+error.message,'error');return;}
  params=data||[];renderParams();
}
async function loadEntries(){
  const{data,error}=await supabase.from('entries').select('*').eq('entry_date',currentDate);
  if(error)return;
  entries={};(data||[]).forEach(e=>{entries[e.param_id]=e;});updateTodayList();
}
async function saveValue(){
  if(!activeParam){showToast('Avval parametr tanlang','error');return;}
  const val=document.getElementById('valueInput').value.trim();
  if(val===''){showToast('Qiymat kiriting','error');return;}
  const{data,error}=await supabase.from('entries').upsert({param_id:activeParam.id,value:parseFloat(val),entry_date:currentDate,created_by:currentUser.id},{onConflict:'param_id,entry_date'}).select().single();
  if(error){showToast('Saqlashda xatolik: '+error.message,'error');return;}
  entries[activeParam.id]=data;
  renderParams(document.getElementById('searchInput').value.toLowerCase());
  updateTodayList();showToast('Saqlandi ✓','success');
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
  const existing=entries[p.id];const input=document.getElementById('valueInput');
  input.value=existing?existing.value:'';input.focus();
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
