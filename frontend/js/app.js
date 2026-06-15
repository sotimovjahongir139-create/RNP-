const supabase = (() => {
  const url = 'https://tzfwlailknlxwdgxvxrc.supabase.co';
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6ZndsYWlsa25seHdkZ3h2eHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Mzg2NDYsImV4cCI6MjA5NzExNDY0Nn0.fPdICmSn18Diq3IuDCzSYPj1jnyPShFPJFY0PbJGsso';
  const h={'Content-Type':'application/json','apikey':key,'Authorization':'Bearer '+key};
  return {
    auth:{
      async getSession(){
        const t=localStorage.getItem('rnp_token');
        const u=localStorage.getItem('rnp_user');
        if(t&&u)return{data:{session:{user:JSON.parse(u),access_token:t}},error:null};
        return{data:{session:null},error:null};
      },
      async signInWithPassword({email,password}){
        const r=await fetch(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:h,body:JSON.stringify({email,password})});
        const d=await r.json();
        if(!r.ok)return{data:null,error:{message:d.error_description||d.msg||'Xato'}};
        localStorage.setItem('rnp_token',d.access_token);
        localStorage.setItem('rnp_user',JSON.stringify(d.user));
        return{data:{user:d.user,session:d},error:null};
      },
      async signOut(){localStorage.removeItem('rnp_token');localStorage.removeItem('rnp_user');},
      onAuthStateChange(cb){return{data:{subscription:{unsubscribe(){}}}}}
    },
    from(table){
      const base=url+'/rest/v1/'+table;
      const token=localStorage.getItem('rnp_token')||key;
      const rh={...h,'Authorization':'Bearer '+token};
      return{
        select(cols='*'){
          let q=base+'?select='+cols;
          let filters=[];
          const obj={
            eq(col,val){filters.push(col+'=eq.'+encodeURIComponent(val));return obj;},
            order(col){q+=(q.includes('?')?'&':'?')+'order='+col;return obj;},
            async then(resolve){
              const url2=q+(filters.length?'&'+filters.join('&'):'');
              const r=await fetch(url2,{headers:rh});
              const d=await r.json();
              resolve(r.ok?{data:d,error:null}:{data:null,error:{message:JSON.stringify(d)}});
            }
          };
          return obj;
        },
        upsert(body,opts={}){
          const obj={
            select(){return obj;},
            single(){return obj;},
            async then(resolve){
              const r=await fetch(base+'?on_conflict='+(opts.onConflict||''),{
                method:'POST',
                headers:{...rh,'Prefer':'resolution=merge-duplicates,return=representation'},
                body:JSON.stringify(body)
              });
              const d=await r.json();
              const item=Array.isArray(d)?d[0]:d;
              resolve(r.ok?{data:item,error:null}:{data:null,error:{message:JSON.stringify(d)}});
            }
          };
          return obj;
        }
      };
    }
  };
})();

let currentUser=null,params=[],entries={},activeParam=null,currentDate=today();
document.addEventListener('DOMContentLoaded',async()=>{
  document.getElementById('dateInput').value=currentDate;
  bindUI();
  const{data:{session}}=await supabase.auth.getSession();
  if(session){currentUser=session.user;showApp();await loadAll();}
  else showLogin();
});
function today(){return new Date().toISOString().split('T')[0];}
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
  const{data,error}=await supabase.auth.signInWithPassword({email,password:pass});
  if(error){errEl.textContent='Xato: '+error.message;btn.textContent='Kirish';btn.disabled=false;return;}
  currentUser=data.user;showApp();await loadAll();
  btn.textContent='Kirish';btn.disabled=false;
}
function showLogin(){document.getElementById('loginOverlay').classList.remove('hidden');document.getElementById('app').classList.add('hidden');document.getElementById('loginPassword').value='';}
function showApp(){document.getElementById('loginOverlay').classList.add('hidden');document.getElementById('app').classList.remove('hidden');document.getElementById('userDisplay').textContent=currentUser?.email||'';}
async function loadAll(){await loadParams();await loadEntries();}
async function loadParams(){
  const{data,error}=await supabase.from('params').select('*').eq('active',true).order('sort_order');
  if(error){showToast('Xato: '+error.message,'error');return;}
  params=data||[];renderParams();
}
async function loadEntries(){
  const{data}=await supabase.from('entries').select('*').eq('entry_date',currentDate);
  entries={};(data||[]).forEach(e=>{entries[e.param_id]=e;});updateTodayList();
}
async function saveValue(){
  if(!activeParam){showToast('Avval parametr tanlang','error');return;}
  const val=document.getElementById('valueInput').value.trim();
  if(!val){showToast('Qiymat kiriting','error');return;}
  const{data,error}=await supabase.from('entries').upsert({param_id:activeParam.id,value:parseFloat(val),entry_date:currentDate,created_by:currentUser.id},{onConflict:'param_id,entry_date'});
  if(error){showToast('Xato: '+error.message,'error');return;}
  if(data)entries[activeParam.id]=data;
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
