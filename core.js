// Shared by the desktop (app.js) and mobile (mobile.js) pages: Supabase, state, sign-in,
// actions, data loading, notifications and animations. Each page adds its own views and render().

const SUPABASE_URL='https://emigzyfpkbpigncisehs.supabase.co';
const SUPABASE_KEY='sb_publishable_j_cdvdOxvXw91W7yLHtVVg_86n9NOCS';
// Cloudflare Turnstile site key (public). Empty = no CAPTCHA; it must be set before CAPTCHA is turned on in Supabase Auth.
const TURNSTILE_SITEKEY='0x4AAAAAAFp02kb3de86slUI';
const sb=/PASTE/.test(SUPABASE_URL+SUPABASE_KEY)?null:supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

let SKC=[], PRG=[], PCAT='';
const MAXPS=8, MAXMS=15;
const SK=['Python','SQL','Figma','React','JavaScript','Docker','Power BI / Tableau','Excel','User Research','Machine Learning','Data Analysis','UI/UX Design'];
const TY=['Thesis','Research','Hackathon','Startup','Coursework'], LV=['Learning','Coursework','Real project'], TR=['No trial','Quick chat','Small task'], AV=['Today','This week','Later'];
const STT={new:'Under review',trial:'On trial',team:'Accepted',reserve:'Rejected'};

const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cl=(s,m)=>String(s==null?'':s).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,m);

document.body.insertAdjacentHTML('beforeend', `
<div id="authModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="authModalTitle">
  <div class="modal-card">
    <div class="top" style="align-items:center;">
      <h2 id="authModalTitle" style="font-size:20px;margin:0;">Sign In</h2>
      <button class="ghost sm" data-a="closeAuth" aria-label="Close" style="min-height:32px;padding:0 8px;border-radius:8px;">✕</button>
    </div>
    <div id="authTabs" class="tabs-row">
      <button id="tabLogin" class="active" data-a="setAuth" data-m="login">Sign In</button>
      <button id="tabRegister" data-a="setAuth" data-m="register">Register</button>
    </div>
    <div id="regFields" class="col" style="display:none;">
      <label class="lbl" for="authName">First name</label>
      <input id="authName" class="fld" data-k="G.name" maxlength="60" autocomplete="name" placeholder="Alex Student">
    </div>
    <div class="col">
      <label class="lbl" for="authEmail">Email</label>
      <input id="authEmail" class="fld" data-k="G.email" type="email" maxlength="80" autocomplete="username" placeholder="name@astanait.edu.kz">
    </div>
    <div id="authHint" class="mut" style="display:none;"></div>
    <div id="codeFields" class="col" style="display:none;">
      <label class="lbl" for="authCode">Code from the email</label>
      <input id="authCode" class="fld" inputmode="numeric" maxlength="10" autocomplete="one-time-code" placeholder="123456">
    </div>
    <div id="pwFields" class="col">
      <label class="lbl" for="authPassword" id="authPwLbl">Password</label>
      <input id="authPassword" class="fld" data-k="G.pw" type="password" maxlength="72" autocomplete="current-password" placeholder="••••••••">
    </div>
    <div id="pw2Fields" class="col" style="display:none;">
      <label class="lbl" for="authPassword2">Repeat new password</label>
      <input id="authPassword2" class="fld" type="password" maxlength="72" autocomplete="new-password" placeholder="••••••••">
    </div>
    <button id="forgotLink" class="lnk" data-a="setAuth" data-m="forgot">Forgot password?</button>
    <button id="resendLink" class="lnk" data-a="resendCode" style="display:none;">Send the code again</button>
    <button id="backLink" class="lnk" data-a="setAuth" data-m="login" style="display:none;">← Back to sign in</button>
    <div id="captcha" class="cap"></div>
    <button class="btn" data-a="submitAuth" id="authBtn" data-mode="login" style="margin-top:8px;">Log In</button>
  </div>
</div>`);

let S={projects:[],me:null,view:'landing',pid:null,op:null,tab:'new',ready:false};
const F={skills:[],type:'All',novice:false,urgent:false,fit:false,hide:false,q:'',sort:'match'};
const nR=()=>({skill:'',level:1,link:'',did:'',when:'Today',tg:''});
const nC=()=>({title:'',type:'Hackathon',desc:'',sk:{},urgent:false,trial:'Quick chat',trialTask:'',trialDue:'',novice:true,n:1,links:[],files:[],old:[],del:[]});

let R=nR(), C=nC(), G={name:'',email:'',pw:''}, RCV=false, tm, lastT=0;
const P=()=>S.projects.find(p=>p.id===S.pid);

const chip=(t,on,at,x='')=>`<button class="chip${on?' on':''}${x}" ${at}>${esc(t)}</button>`;
// "Fits you": how many of a project's skills are in your profile (not shown on your own projects)
const myS=()=>new Set(S.me?S.me.skills.map(x=>x.s):[]);
const fit=p=>{const h=myS();return{req:p.req.filter(s=>h.has(s)).length,opt:p.opt.filter(s=>h.has(s)).length}};
const fitScore=p=>{const f=fit(p);return f.req*2+f.opt};
const fitTag=p=>{
    if(!S.me||mine(p)||!p.req.length) return '';
    const f=fit(p), n=p.req.length;
    if(!f.req&&!f.opt) return '';
    return f.req===n?`<div class="fit all">✓ You have ${n>1?'all '+n+' required skills':'the required skill'}${f.opt?` + ${f.opt} nice-to-have`:''}</div>`
        :f.req?`<div class="fit">You have ${f.req} of ${n} required skills${f.opt?` + ${f.opt} nice-to-have`:''}</div>`
        :`<div class="fit">You have ${f.opt} nice-to-have skill${f.opt>1?'s':''}, none of the required</div>`;
};
const skl=p=>{
    const h=S.me&&!mine(p)?myS():new Set();
    const c=(s,k)=>h.has(s)?`<span class="chip ${k} have" title="You have this skill">✓ ${esc(s)}</span>`:`<span class="chip ${k}">${esc(s)}</span>`;
    return p.req.map(s=>c(s,'req')).join('')+p.opt.map(s=>c(s,'opt')).join('');
};
const todayStr=()=>new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
const realDate=s=>{ if(!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false; const[y,m,d]=s.split('-').map(Number), x=new Date(y,m-1,d); return x.getFullYear()===y&&x.getMonth()===m-1&&x.getDate()===d; };
const okDate=s=>realDate(s)&&s>=todayStr();   // a real calendar date, today or later
const TGRE=/^@[A-Za-z][A-Za-z0-9_]{4,31}$/;   // Telegram: 5-32 characters, starts with a letter
const HEAVY=/[?&]heavy\b/.test(location.search);   // ?heavy = unoptimised originals, used only for the before/after measurement
const ic=n=>`<svg class="ic" aria-hidden="true" focusable="false"><use href="assets/icons.svg#i-${n}"></use></svg>`;
const pic=(n,alt,w,h,s1,s2,sizes,cls='')=>HEAVY
  ?`<img class="${cls}" src="assets/original/${n}.png" alt="${esc(alt)}" width="${w}" height="${h}">`
  :`<img class="${cls}" src="assets/${n}-${s1}.webp" srcset="assets/${n}-${s1}.webp ${s1}w, assets/${n}-${s2}.webp ${s2}w" sizes="${sizes}" alt="${esc(alt)}" width="${w}" height="${h}" decoding="async"${cls==='step-img'?' loading="lazy"':' fetchpriority="high"'}>`;
let SND=false; try{SND=localStorage.getItem('tu_snd')==='1'}catch(e){}
let ding=null;
const beep=()=>{ if(!SND) return; try{ ding=ding||new Audio('assets/notify.mp3'); ding.currentTime=0; const p=ding.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} };
const sndBtn=()=>`<button class="ghost sm snd" data-a="snd" aria-pressed="${SND}" aria-label="Notification sound: ${SND?'on':'off'}" title="Notification sound: ${SND?'on':'off'}">${ic(SND?'sound-on':'sound-off')}<span class="snd-t">${SND?'Sound on':'Sound off'}</span></button>`;
const IMG1=()=>pic('step1','Illustration: two project cards with skill tags and a magnifying glass',480,320,480,960,'(max-width:600px) 90vw, 360px','step-img');
const IMG2=()=>pic('step2','Illustration: a student profile card with skills and an Apply button',480,320,480,960,'(max-width:600px) 90vw, 360px','step-img');
const IMG3=()=>pic('step3','Illustration: three students joined into one team, with a progress bar and a check mark',480,320,480,960,'(max-width:600px) 90vw, 360px','step-img');
const HERO=()=>`<div class="hero-img">${pic('hero','Illustration: three students connect around one project card with the skills it needs',720,480,720,1440,'(max-width:900px) 360px, 460px','hero')}</div>`;
const grp=(c,n)=>c&&n?`${c}-${n}`:'';
const who=(nm,c,n)=>nm+(grp(c,n)?` (${grp(c,n)})`:'');
const cats=()=>SKC.length?SKC:[{name:'Popular',skills:SK}];
const skSel=(id,ph,act,taken)=>`<select id="${id}" class="fld" data-c="${act}" aria-label="${esc(ph)}"><option value="" selected disabled hidden>${esc(ph)}</option>${cats().map(c=>`<optgroup label="${esc(c.name)}">${c.skills.map(s=>`<option value="${esc(s)}"${taken.includes(s)?' disabled':''}>${esc(s)}</option>`).join('')}</optgroup>`).join('')}</select>`;
const xchip=(label,cls,main,rm,s)=>`<span class="chip xc ${cls}">${main?`<button ${main} data-s="${esc(s)}" class="xm">${esc(label)}</button>`:`<span class="xm">${esc(label)}</span>`}<button ${rm} data-s="${esc(s)}" class="xx" aria-label="Remove ${esc(s)}">✕</button></span>`;
const progOpts=sel=>{const g={};PRG.forEach(p=>(g[p.area]=g[p.area]||[]).push(p));return Object.keys(g).map(a=>`<optgroup label="${esc(a)}">${g[a].map(p=>`<option value="${esc(p.code)}"${p.code===sel?' selected':''}>${esc(p.name)} (${esc(p.code)})</option>`).join('')}</optgroup>`).join('')};

function toast(m){
    lastT=Date.now();
    const t=$('#t');
    t.textContent=m;
    t.classList.add('sh');
    clearTimeout(tm);
    tm=setTimeout(()=>t.classList.remove('sh'),2800);
}

const BK={rst:[3,1/60],cf:[3,1/60],send:[3,1/20],pub:[2,1/30],st:[10,1/2],cl:[10,1/2]};
function tok(n){
    const[c,r]=BK[n];
    let b={};
    try{b=JSON.parse(localStorage.getItem('tu_rl')||'{}')}catch(e){}
    const now=Date.now(),x=b[n]||{t:c,at:now};
    x.t=Math.min(c,x.t+(now-x.at)/1000*r);
    x.at=now;
    let ok=x.t>=1;
    if(ok) x.t-=1;
    b[n]=x;
    try{localStorage.setItem('tu_rl',JSON.stringify(b))}catch(e){}
    if(!ok) toast('Too fast. Wait '+Math.ceil((1-x.t)/r)+' s');
    return ok;
}

// project status as shown to people
const pst=s=>s==='assembled'?'Team assembled':s==='closed'?'Project closed':'Open';
// project type with its own shade of blue (colour only)
const tpl=t=>`<span class="tp tp-${String(t||'').toLowerCase()}">${t}</span>`;
const mine=p=>S.me&&p.authorId==='me';
const applied=p=>p.offers.some(o=>o.cid==='me');
const vis=()=>S.projects.filter(p=>p.authorId!=='me'&&p.status==='open'&&(!F.skills.length||F.skills.every(s=>p.req.includes(s)||p.opt.includes(s)))&&(F.type==='All'||p.type===F.type)&&(!F.novice||p.novice)&&(!F.urgent||p.urgent)&&(!F.fit||fit(p).req>0)&&(!F.hide||!applied(p))&&(!F.q||sc(p)>=0)).sort((a,b)=>F.q?sc(b)-sc(a):F.sort==='match'?fitScore(b)-fitScore(a):0);

const card=p=>`<article class="card" data-a="open" data-id="${p.id}"><div class="top"><h3>${esc(p.title)}</h3>${p.urgent?'<span class="urg">Urgent</span>':''}</div><div class="mut">${tpl(p.type)} · ${esc(p.author)}</div>${p.desc?`<p class="dsc">${esc(p.desc.slice(0,140))}${p.desc.length>140?'…':''}</p>`:''}<div class="row">${skl(p)}</div>${fitTag(p)}<div class="foot"><span class="mut">${p.n} needed${p.novice?' · beginners welcome':''}</span><button class="btn sm" data-a="open" data-id="${p.id}">${applied(p)?'Applied':'Apply'}</button></div></article>`;

const grid=()=>{
    if(!S.ready) return '<div class="card">Loading projects…</div>';
    const v=vis(), n=v.length, filtered=F.skills.length||F.type!=='All'||F.novice||F.urgent||F.fit||F.hide||F.q;
    const so=(k,t)=>`<button class="lnk srt${F.sort===k?' on':''}" data-a="fsort" data-s="${k}" aria-pressed="${F.sort===k}">${t}</button>`;
    const sorter=!S.me||F.q?'':S.me.skills.length?` · Sort: ${so('match','Best match')} / ${so('new','Newest')}`:` · <button class="lnk" data-a="go" data-v="profile">Add your skills</button> to see which projects fit you`;
    const cnt=`<div class="mut cnt"><span role="status">${n} project${n===1?'':'s'}${filtered?' match your filters':''}${S.more?` · newest ${PLIM} loaded`:''}</span>${sorter}</div>`;
    return cnt+(n?v.map(card).join(''):`<div class="card">Nothing found.${filtered?' <button class="lnk" data-a="fclr">Clear all filters</button>':''} Or create your own project.</div>`);
};

// Views shared by both layouts; each page adds the rest to V
const V={};
const btns=o=>o.st==='new'?`<button class="ghost" data-a="st" data-o="${o.id}" data-s="trial">On trial</button><button class="btn sm" data-a="st" data-o="${o.id}" data-s="team">Accept</button><button class="ghost" data-a="st" data-o="${o.id}" data-s="reserve">Reject</button>`
:o.st==='trial'?`<button class="btn sm" data-a="st" data-o="${o.id}" data-s="team">Accept</button><button class="ghost" data-a="st" data-o="${o.id}" data-s="reserve">Reject</button>`
:o.st==='team'?'<span class="ok">Accepted</span>':`<button class="ghost" data-a="st" data-o="${o.id}" data-s="trial">Reconsider: on trial</button>`;
const oc=(o,p)=>`<div class="card"><div class="top"><div><b>${esc(o.name)}</b>${o.group?` <span class="mut">· ${esc(o.group)}</span>`:''}</div>${o.link?'<span class="ok">✓ link to work</span>':'<span class="mut">no link</span>'}</div>
<div class="row"><span class="chip req">Applied for: ${esc(o.skill)} · ${LV[o.level]}</span><span class="chip">${esc(o.when)}</span></div>
${(o.skills||[]).length?`<div class="row">${o.skills.map(x=>`<span class="chip">${esc(x.s)} · ${LV[x.level]||''}${x.link?' ✓':''}</span>`).join('')}</div>`:''}
<div class="mut">${o.link?`<a href="${esc(o.link)}" target="_blank" rel="noopener">Work</a> · `:''}“${esc(o.did)}”</div>
${o.st==='team'?`<div class="mut">Telegram: <b>${esc(o.tg)}</b></div>`:'<div class="mut">Contact opens after acceptance</div>'}
${o.st==='trial'&&p.trialTask?`<div class="mut">Trial task: ${esc(p.trialTask)}${p.trialDue?' · deadline '+esc(p.trialDue):''}</div>`:''}
<div class="row">${btns(o)}</div></div>`;
V.apps=()=>{
    const L=[];
    S.projects.forEach(p=>p.offers.filter(o=>o.cid==='me').forEach(o=>L.push([p,o])));
    return `<div class="wrap"><div class="main col" style="gap:16px"><h1>My applications</h1>${L.length?L.map(([p,o])=>`<div class="card"><div class="top"><h3>${esc(p.title)}</h3><span class="chip st st-${o.st}">${STT[o.st]}</span></div><div class="mut">${tpl(p.type)} · ${esc(p.author)}${p.status==='open'?'':' · '+pst(p.status)}</div><div class="row"><span class="chip req">${esc(o.skill)} · ${LV[o.level]}</span></div>${o.st==='team'?`<div class="mut">Author's Telegram: <b>${esc(p.tg||'not provided')}</b></div>`:'<div class="mut">The author\'s contact opens once you are accepted.</div>'}${o.st==='trial'&&p.trialTask?`<div class="mut">Trial task: ${esc(p.trialTask)}${p.trialDue?' · deadline '+esc(p.trialDue):''}</div>`:''}<div class="row"><button class="ghost" data-a="open" data-id="${p.id}">View project</button>${o.st==='new'||o.st==='trial'?`<button class="ghost" data-a="wd" data-o="${o.id}">Withdraw</button>`:''}</div></div>`).join(''):'<div class="card">You have not applied yet.<button class="btn" data-a="go" data-v="find">Find projects</button></div>'}</div></div>`;
};

const gated=['find','detail','mine','manage','apps','profile','create'];

const go=(v,top=true)=>{
    S.view=v; render(top);
    if(S.me&&['find','mine','apps'].includes(v)){
        load().then(()=>{if(S.view===v)render(false)}).catch(()=>{});
    }
};

const need=()=>{if(S.me)return false; toast('Sign in with your university email first'); A.openAuth(); return true;};

// CAPTCHA for sign-in, sign-up and the emails Supabase sends; each token works once
let capId=null;
function capRender(){
    if(!TURNSTILE_SITEKEY||capId!==null||!window.turnstile) return;
    capId=turnstile.render('#captcha',{sitekey:TURNSTILE_SITEKEY,appearance:'interaction-only',size:'flexible'});
}
// resolves to a token, undefined when CAPTCHA is off, or null if the check did not finish in 10 s
async function capToken(){
    if(!TURNSTILE_SITEKEY) return undefined;
    for(let i=0;i<40;i++){
        capRender();
        const t=capId!==null&&turnstile.getResponse(capId);
        if(t) return t;
        await new Promise(r=>setTimeout(r,250));
    }
    toast('The security check did not finish. Reload the page and try again.');
    return null;
}
const capReset=()=>{ if(capId!==null&&window.turnstile) turnstile.reset(capId); };

const A={
    go:d=>{if(d.id)S.op=d.id; if(d.v==='create'&&C.edit) C=nC(); go(d.v)},
    edit:d=>{
        const p=S.projects.find(x=>x.id===d.id); if(!p||p.authorId!=='me') return;
        const sk={}; p.req.forEach(s=>sk[s]='req'); p.opt.forEach(s=>sk[s]='opt');
        const m=MAT[p.id], had=m&&m!=='loading';
        C={edit:p.id,title:p.title,type:p.type,desc:p.desc==='No description yet.'?'':p.desc,sk,urgent:p.urgent,trial:p.trial,trialTask:p.trialTask,trialDue:p.trialDue,due0:p.trialDue,novice:p.novice,n:p.n,sk0:p.req.concat(p.opt),
           links:p.links.map(l=>({url:l.url,label:l.label})),files:[],del:[],old:had?m.files.slice():[]};
        go('create');
        if(!had) loadMat(p.id).then(()=>{ if(C.edit===p.id){ C.old=MAT[p.id].files.slice(); render(false); } });
    },
    ladd:()=>{if(C.links.length<MAXL) C.links.push({url:'',label:''}); render(false)},
    lrm:d=>{C.links.splice(+d.i,1); render(false)},
    fpick:()=>{const i=$('#cfile'); if(i) i.click()},
    fq:d=>{C.files.splice(+d.i,1); render(false)},
    fdel:d=>{C.del.push(d.p); render(false)},
    cancelEdit:()=>{const id=C.edit; C=nC(); S.op=id; go('mine')},
    how:()=>{const e=$('#how'); e&&e.scrollIntoView({behavior:RM?'auto':'smooth'})},
    
    openAuth:()=>{ $('#authModal').classList.add('visible'); A.setAuth({m:'login'}); capRender(); setTimeout(()=>$('#authEmail').focus(),50); },
    closeAuth:()=>{ $('#authModal').classList.remove('visible'); $('#authPassword').value=''; $('#authPassword2').value=''; $('#authCode').value=''; G.pw=''; RCV=false; },
    setAuth:d=>{
        const m = d.m, isReg = m === 'register', isRec = m === 'forgot' || m === 'reset' || m === 'confirm', show = (id, on) => { $(id).style.display = on ? '' : 'none'; };
        show('#authTabs', !isRec);
        show('#regFields', isReg);
        show('#authHint', isRec);
        show('#codeFields', m === 'reset' || m === 'confirm');
        show('#pwFields', m !== 'forgot' && m !== 'confirm');
        show('#pw2Fields', m === 'reset');
        show('#forgotLink', m === 'login');
        show('#resendLink', m === 'confirm');
        show('#backLink', isRec);
        $('#tabLogin').classList.toggle('active', !isReg);
        $('#tabRegister').classList.toggle('active', isReg);
        $('#authModalTitle').textContent = {register:'Register', forgot:'Reset password', reset:'Set a new password', confirm:'Confirm your email'}[m] || 'Sign In';
        $('#authHint').textContent = m === 'forgot' ? 'Enter your university email. We will send you a code to reset your password.'
            : m === 'confirm' ? 'We sent a code to your university email. Enter it to finish. It can take a few minutes, check the Junk folder too.'
            : 'If this email is registered, we sent a code to it. It can take a few minutes, check the Junk folder too.';
        $('#authPwLbl').textContent = m === 'reset' ? 'New password' : 'Password';
        const b = $('#authBtn');
        b.textContent = {register:'Create Account', forgot:'Send code', reset:'Save new password', confirm:'Confirm email'}[m] || 'Log In';
        b.dataset.mode = m;
        $('#authPassword').autocomplete = isReg || m === 'reset' ? 'new-password' : 'current-password';
        if(m === 'reset') { $('#authPassword').value = ''; G.pw = ''; RCV = false; }
        if(m === 'reset' || m === 'confirm') { $('#authCode').value = ''; setTimeout(() => $('#authCode').focus(), 50); }
    },
    resendCode:async()=>{
        const e=cl($('#authEmail').value,80).toLowerCase();
        if(!EM.test(e)) return toast('Enter your university email');
        if(!tok('cf')) return;
        const captchaToken=await capToken(); if(captchaToken===null) return;
        const r=await sb.auth.resend({type:'signup',email:e,options:{captchaToken}}); capReset();
        toast(r.error?r.error.message:'We sent a new code');
    },
    fsort:d=>{F.sort=d.s; render(false)},
    fclr:()=>{F.skills=[]; F.type='All'; F.novice=false; F.urgent=false; F.fit=false; F.hide=false; F.q=''; render(false)},
    ffit:()=>{F.fit=!F.fit; render(false)},
    fhide:()=>{F.hide=!F.hide; render(false)},
    bell:()=>{NOPEN=!NOPEN; render(false)},
    nall:async()=>{
        const r=await sb.from('notifications').update({read_at:new Date().toISOString()}).is('read_at',null);
        if(r.error) return dberr(r.error);
        NT.forEach(n=>{n.read_at=n.read_at||new Date().toISOString()}); render(false);
    },
    nopen:async d=>{
        const n=NT.find(x=>String(x.id)===d.id); if(!n) return;
        NOPEN=false;
        if(!n.read_at){ n.read_at=new Date().toISOString(); sb.from('notifications').update({read_at:n.read_at}).eq('id',n.id).then(r=>r.error&&dberr(r.error)); }
        if(n.kind==='status'||n.kind==='assembled') return go('apps');
        S.op=n.project_id; go('mine');
    },
    submitAuth:async()=>{
        const btn=$('#authBtn'), mode=btn.dataset.mode;
        const e=cl($('#authEmail').value,80).toLowerCase(), n=cl($('#authName').value,60), pw=$('#authPassword').value;
        btn.disabled=true;
        try{
            if(mode === 'forgot') {
                if(!EM.test(e)) return toast('Enter your university email');
                if(!tok('rst')) return;
                const captchaToken=await capToken(); if(captchaToken===null) return;
                const r=await sb.auth.resetPasswordForEmail(e,{captchaToken}); capReset();
                if(r.error) return toast(r.error.message);
                return A.setAuth({m:'reset'});
            }
            if(mode === 'reset') {
                const code=$('#authCode').value.replace(/\s/g,''), pw2=$('#authPassword2').value;
                if(!EM.test(e)||!/^\d{6,10}$/.test(code)) return toast('Enter your email and the code from the email');
                if(pw.length<8) return toast('The new password needs 8+ characters');
                if(pw!==pw2) return toast('The passwords do not match');
                // the code is single-use: once it is accepted, a retry (e.g. after a rejected password) only repeats the update
                if(!RCV){
                    const v=await sb.auth.verifyOtp({email:e,token:code,type:'recovery'});
                    if(v.error) return toast('The code is wrong or expired. Request a new one.');
                    RCV=true;
                }
                const u=await sb.auth.updateUser({password:pw});
                if(u.error) return toast(u.error.message);
                RCV=false;
                await bootUser(u.data.user);
                if(!S.me) return;
                A.closeAuth();
                toast('Password updated');
                if(S.view==='landing') go('find'); else render(true);
                return;
            }
            if(mode === 'confirm') {
                const code=$('#authCode').value.replace(/\s/g,'');
                if(!EM.test(e)||!/^\d{6,10}$/.test(code)) return toast('Enter your email and the code from the email');
                const v=await sb.auth.verifyOtp({email:e,token:code,type:'signup'});
                if(v.error) return toast('The code is wrong or expired. Send the code again.');
                await bootUser(v.data.user);
                if(!S.me) return;
                A.closeAuth();
                toast('Email confirmed. Welcome, '+S.me.name);
                if(S.view==='landing') go('find'); else render(true);
                return;
            }
            if(mode === 'register') {
                if(!EM.test(e)||n.length<2||pw.length<8) return toast('Enter your name, a valid email and a password of 8+ characters');
                const captchaToken=await capToken(); if(captchaToken===null) return;
                const r=await sb.auth.signUp({email:e,password:pw,options:{data:{name:n},captchaToken}}); capReset();
                if(r.error) return toast(/database error|^\s*\{\s*\}\s*$/i.test(r.error.message)||!e.endsWith('@astanait.edu.kz')?'Registration failed. Only @astanait.edu.kz addresses are allowed.':r.error.message);
                if(!r.data.session) return A.setAuth({m:'confirm'});
                await bootUser(r.data.user);
            } else {
                if(!EM.test(e)||!pw) return toast('Enter your university email and password');
                const captchaToken=await capToken(); if(captchaToken===null) return;
                const r=await sb.auth.signInWithPassword({email:e,password:pw,options:{captchaToken}}); capReset();
                if(r.error&&r.error.code==='email_not_confirmed'){
                    A.setAuth({m:'confirm'});
                    if(tok('cf')){ const t=await capToken(); if(t!==null){ await sb.auth.resend({type:'signup',email:e,options:{captchaToken:t}}); capReset(); } }
                    return toast('Confirm your email first. We sent you a code.');
                }
                if(r.error) return toast(r.error.message);
                await bootUser(r.data.user);
            }
            if(!S.me) return;
            A.closeAuth();
            toast('Welcome, '+S.me.name);
            if(S.view==='landing') go('find'); else render(true);
        } finally { btn.disabled=false; }
    },
    
    out:async()=>{await sb.removeAllChannels(); live=null; NT=[]; NOPEN=false; await sb.auth.signOut(); S.me=null; S.projects=[]; toast('Signed out'); go('landing')},
    open:d=>{
        S.pid=d.id;
        const p=P(), m=S.me, x=m&&m.skills.find(k=>p.req.concat(p.opt).includes(k.s));
        R=nR(); R.skill=x?x.s:p.req[0]||'';
        if(x){R.level=x.level; R.link=x.link||''}
        if(m){R.when=m.avail; R.tg=m.tg}
        go('detail');
    },
    fsel:(d,v)=>{if(v&&!F.skills.includes(v)) F.skills.push(v); render(false)},
    fsx:d=>{const i=F.skills.indexOf(d.s); if(i>=0) F.skills.splice(i,1); render(false)},
    csel:(d,v)=>{
        if(!v||C.sk[v]) return render(false);
        if(Object.keys(C.sk).length>=MAXPS) return toast('Up to '+MAXPS+' skills per project');
        C.sk[v]='req'; render(false)
    },
    csk:d=>{if(C.sk[d.s]) C.sk[d.s]=C.sk[d.s]==='req'?'opt':'req'; render(false)},
    cskx:d=>{delete C.sk[d.s]; render(false)},
    pcat:(d,v)=>{PCAT=v; render(false)},
    snd:()=>{SND=!SND; try{localStorage.setItem('tu_snd',SND?'1':'0')}catch(e){} render(false); toast(SND?'Sound on':'Sound off'); beep()},
    fs:d=>{const i=F.skills.indexOf(d.s); i<0?F.skills.push(d.s):F.skills.splice(i,1); render(false)},
    ft:d=>{F.type=d.t; render(false)},
    fn:()=>{F.novice=!F.novice; render(false)},
    fu:()=>{F.urgent=!F.urgent; render(false)},
    rs:d=>{
        R.skill=d.s;
        const x=S.me&&S.me.skills.find(k=>k.s===d.s);
        if(x){R.level=x.level; R.link=x.link||''}
        render(false);
    },
    rl:d=>{R.level=+d.i; render(false)},
    rw:d=>{R.when=d.w; render(false)},
    send:async()=>{
        if(need()) return;
        const p=P(), d=cl(R.did,500), tg=cl(R.tg,33).replace(/^@?/,'@');
        let l=cl(R.link,300);
        if(p.authorId==='me') return toast('You cannot apply to your own project');
        if(applied(p)) return toast('You have already applied');
        if(!R.skill) return toast('Choose the skill you are applying with');
        if(!p.req.concat(p.opt).includes(R.skill)||d.length<5||!TGRE.test(tg)) return toast('Check the fields: describe what you did (5+ characters), Telegram like @username');
        if(l){
            if(!/^https?:\/\//i.test(l)) l='https://'+l;
            try{if(!/^https?:$/.test(new URL(l).protocol)) throw 0}catch(e){return toast('That link looks invalid')}
        }
        if(!tok('send')) return;
        const sid=SKID[R.skill];
        if(!sid) return toast('Unknown skill');
        // one transaction: skill, contact, availability and the application are saved together or not at all
        const r=await sb.rpc('apply_to_project',{p_project_id:p.id,p_skill_id:sid,p_level:LVDB[R.level],p_link:l||null,p_note:d,p_telegram:tg,p_availability:AVDB[R.when]});
        if(r.error) return dberr(r.error);
        S.me.tg=tg; S.me.avail=R.when;
        const k=S.me.skills.find(x=>x.s===R.skill);
        if(k){k.level=R.level; k.link=l} else S.me.skills.push({s:R.skill,level:R.level,link:l});
        await load(); toast('Application sent'); render(false);
    },
    cty:d=>{C.type=d.t; render(false)},
    cu:d=>{C.urgent=d.u==='1'; render(false)},
    ctr:d=>{C.trial=d.t; render(false)},
    cno:()=>{C.novice=!C.novice; render(false)},
    cn:d=>{C.n=Math.min(10,Math.max(1,C.n+ +d.d)); render(false)},
    pub:async()=>{
        if(need()) return;
        const req=Object.keys(C.sk).filter(s=>C.sk[s]==='req'), opt=Object.keys(C.sk).filter(s=>C.sk[s]==='opt');
        if(cl(C.title,80).length<3||!req.length) return toast('Add a title (3+ characters) and at least one required skill');
        const links=normLinks(); if(!links) return toast('Check the links: each must be a web address like https://github.com/…');
        if(C.edit) return saveEdit(req,opt,links);
        if(!tok('pub')) return;
        if(C.trialDue&&!okDate(C.trialDue)) return toast('Trial deadline must be a real date, today or later');
        const due=C.trialDue?C.trialDue:null;
        let r=await sb.from('projects').insert({author_id:S.me.uid,title:cl(C.title,80),project_type:TYDB[C.type],description:cl(C.desc,1000)||'No description yet.',urgent:C.urgent,beginner_friendly:C.novice,spots_needed:C.n,trial_format:C.trial,trial_task:cl(C.trialTask,300)||null,trial_due:due,links}).select('id').single();
        if(r.error) return dberr(r.error);
        const id=r.data.id, rows=req.map(k=>({project_id:id,skill_id:SKID[k],is_required:true})).concat(opt.map(k=>({project_id:id,skill_id:SKID[k],is_required:false})));
        const r2=await sb.from('project_skills').insert(rows);
        if(r2.error){await sb.from('projects').delete().eq('id',id); return dberr(r2.error)}
        const filesOk=!C.files.length||await syncFiles(id);
        S.op=id; S.tab='new'; C=nC(); await load(); if(filesOk) toast('Project published'); go('mine');
    },
    manage:d=>{S.op=d.id; S.tab='new'; go('mine')},
    tab:d=>{S.tab=d.t; render(false)},
    op:d=>{S.op=d.id; render(false)},
    st:async d=>{
        if(!tok('st')) return;
        const r=await sb.from('applications').update({status:STDB[d.s]}).eq('id',d.o);
        if(r.error) return dberr(r.error);
        await load(); toast(d.s==='trial'?'Moved to trial':d.s==='team'?'Accepted, contact opened':'Rejected'); render(false);
    },
    wd:async d=>{if(!confirm('Withdraw this application? The author will no longer see it.')||!tok('cl'))return; const r=await sb.from('applications').delete().eq('id',d.o); if(r.error) return dberr(r.error); await load(); toast('Application withdrawn'); render(false);},
    asm:async()=>{
        if(!confirm('Mark the team as assembled? The project leaves Find, and everyone who applied gets a notification.')||!tok('cl')) return;
        const r=await sb.from('projects').update({status:'assembled'}).eq('id',S.op); if(r.error) return dberr(r.error);
        await load(); toast('Team assembled. Everyone who applied was notified'); render(false);
    },
    close:async()=>{if(!tok('cl'))return; const r=await sb.from('projects').update({status:'closed'}).eq('id',S.op); if(r.error) return dberr(r.error); await load(); toast('Project closed'); render(false);},
    reopen:async()=>{if(!tok('cl'))return; const r=await sb.from('projects').update({status:'open'}).eq('id',S.op); if(r.error) return dberr(r.error); await load(); toast('Project reopened'); render(false);},
    pav:d=>{S.me.avail=d.w; queueProfile(); render(false);},
    psk:async d=>{
        const i=S.me.skills.findIndex(x=>x.s===d.s), id=SKID[d.s];
        if(i<0){
            if(S.me.skills.length>=MAXMS) return toast('Up to '+MAXMS+' skills in a profile');
            const r=await sb.from('user_skills').insert({user_id:S.me.uid,skill_id:id,level:'study_tasks'});
            if(r.error) return dberr(r.error);
            S.me.skills.push({s:d.s,level:1,link:''});
        }else{
            const r=await sb.from('user_skills').delete().eq('user_id',S.me.uid).eq('skill_id',id);
            if(r.error) return dberr(r.error);
            S.me.skills.splice(i,1);
        }
        render(false);
    },
    prm:async d=>{
        const x=S.me.skills[+d.i];
        const r=await sb.from('user_skills').delete().eq('user_id',S.me.uid).eq('skill_id',SKID[x.s]);
        if(r.error) return dberr(r.error);
        S.me.skills.splice(+d.i,1); render(false);
    },
    plv:async d=>{
        const x=S.me.skills[+d.i];
        const r=await sb.from('user_skills').update({level:LVDB[+d.j]}).eq('user_id',S.me.uid).eq('skill_id',SKID[x.s]);
        if(r.error) return dberr(r.error);
        x.level=+d.j; render(false);
    }
};

document.addEventListener('click',e=>{
    if(NOPEN&&!e.target.closest('.ntf')){ NOPEN=false; render(false); }
    const t=e.target.closest('[data-a]');
    if(!t||!A[t.dataset.a]) return;
    const a=t.dataset.a;
    Promise.resolve(A[a](t.dataset)).then(()=>{
        if((a==='send'||a==='pub'||(a==='st'&&t.dataset.s==='team'))&&Date.now()-lastT<400&&/sent|published|Accepted/.test($('#t').textContent)) {pop(e.clientX,e.clientY); beep();}
    }).catch(x=>{console.error(x); toast('Something went wrong. Try again.');});
});

function bindK(t){
    const[o,k]=t.dataset.k.split('.'), m={R,C,G,M:S.me,T:S.projects.find(x=>x.id===S.op)}[o];
    if(o==='M'&&k==='num'){ t.value=t.value.replace(/\D/g,'').slice(0,4); }
    if(m){ m[k]=t.value; if(o==='M') queueProfile(); if(o==='T') queueTrial(); }
}

document.addEventListener('input',e=>{
    const t=e.target;
    if(t.dataset.k) bindK(t);
    if(t.dataset.l){ const[i,k]=t.dataset.l.split(':'); if(C.links[+i]) C.links[+i][k]=t.value; }
    if(t.dataset.pl!==undefined&&S.me){ S.me.skills[+t.dataset.pl].link=cl(t.value,300); queueLink(+t.dataset.pl); }
    if(t.id==='q'){ F.q=t.value; const g=$('#grid'); if(g) g.innerHTML=grid(); }
});

document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&NOPEN){ NOPEN=false; render(false); return; }
    const m=$('#authModal');
    if(!m||!m.classList.contains('visible')) return;
    if(e.key==='Escape') A.closeAuth();
    else if(e.key==='Enter'&&e.target.tagName==='INPUT'){
        e.preventDefault();
        A.submitAuth().catch(x=>{console.error(x); toast('Something went wrong. Try again.');});
    }
});

document.addEventListener('change',e=>{
    const t=e.target, a=t.dataset&&t.dataset.c;
    if(t.id==='cfile'){ const l=[...t.files]; t.value=''; addFiles(l).catch(x=>{console.error(x); toast('Could not read the file');}); return; }
    if(t.dataset&&t.dataset.k&&t.tagName==='SELECT') bindK(t);
    if(!a||!A[a]) return;
    Promise.resolve(A[a](t.dataset,t.value)).catch(x=>{console.error(x); toast('Something went wrong. Try again.');});
});

const EM=/^[\p{L}\p{N}._%+\-]+@[\p{L}\p{N}\-]+(\.[\p{L}\p{N}\-]+)+$/u;
const TYDB={Thesis:'thesis',Research:'research',Hackathon:'hackathon',Startup:'startup',Coursework:'coursework'}, TYR={thesis:'Thesis',research:'Research',hackathon:'Hackathon',startup:'Startup',coursework:'Coursework'};
const LVDB=['learning','study_tasks','real_project'];
const STDB={new:'new',trial:'on_trial',team:'accepted',reserve:'rejected'}, STR={new:'new',on_trial:'trial',accepted:'team',rejected:'reserve'};
const AVDB={'Today':'today','This week':'this_week','Later':'later'}, AVR={today:'Today',this_week:'This week',later:'Later'};
const SKID={};

function dberr(e){
    const m=String(e&&e.message||e);
    const rls=(e&&e.code==='42501')||/row-level security/i.test(m);
    if(e&&e.code==='P0001') return toast(m.slice(0,120));
    toast(e&&e.code==='23505'?'This already exists (duplicate)':rls?'Not allowed by the database rules':e&&e.code==='23514'?'The database rejected this value':'Database error: '+m.slice(0,90));
}

async function loadSkills(){
    const[r,pg]=await Promise.all([
        sb.from('skills').select('id,name,skill_categories(name,sort_order)').order('name'),
        sb.from('programs').select('code,name,area').order('area').order('name')
    ]);
    if(r.error) return dberr(r.error);
    const by={};
    r.data.forEach(x=>{
        SKID[x.name]=x.id;
        const c=x.skill_categories||{name:'Other',sort_order:99};
        (by[c.name]=by[c.name]||{name:c.name,o:c.sort_order,skills:[]}).skills.push(x.name);
    });
    SKC=Object.values(by).sort((a,b)=>a.o-b.o);
    if(pg.error) dberr(pg.error); else PRG=pg.data;
}

// Find shows the newest PLIM open projects; your own and the ones you applied to are always loaded
const PLIM=100;
const PF='id,author_id,title,project_type,description,urgent,beginner_friendly,spots_needed,status,trial_format,trial_task,trial_due,created_at,author:profiles!projects_author_id_fkey(display_name,program_code,group_number),project_skills(is_required,skills(name)),links';
// Project materials: up to MAXL links (a column on projects) and MAXF files in the private
// Storage bucket, stored as <project id>/<prefix>-<name>. Storage enforces the size and type limits too.
const MAXL=5, MAXF=3, FMAX=3*1024*1024, BUCKET='project-files';
const FT={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation'};
const ext=n=>(n.match(/\.([a-z0-9]+)$/i)||['',''])[1].toLowerCase();
const ficon=n=>ic(({pdf:'file',docx:'doc',pptx:'slides'})[ext(n)]||'image');
const fsz=b=>b<1048576?Math.max(1,Math.round(b/1024))+' KB':(b/1048576).toFixed(1)+' MB';
const linkLabel=u=>{try{const h=new URL(u).hostname.replace(/^www\./,'');return /github/.test(h)?'GitHub':/figma/.test(h)?'Figma':/^docs\.google/.test(h)?'Google Docs':/^drive\.google/.test(h)?'Google Drive':/notion/.test(h)?'Notion':/canva/.test(h)?'Canva':h.slice(0,40)}catch(e){return 'Link'}};
// links from the form, cleaned; null if one of them is not a web address
function normLinks(){
    const out=[];
    for(const x of C.links){
        let u=cl(x.url,300); if(!u) continue;
        if(!/^https?:\/\//i.test(u)) u='https://'+u;
        try{ const q=new URL(u); if(!/^https?:$/.test(q.protocol)||!q.hostname.includes('.')) throw 0; }catch(e){ return null; }
        out.push({label:cl(x.label,40)||linkLabel(u),url:u});
    }
    return out;
}
// photos are made smaller before upload: at most 1600 px, WebP (JPEG where the browser cannot write WebP)
async function shrink(f){
    if(!/^image\/(png|jpeg|webp)$/.test(f.type)) return f;
    try{
        const bmp=await createImageBitmap(f), k=Math.min(1,1600/Math.max(bmp.width,bmp.height)), c=document.createElement('canvas');
        c.width=Math.round(bmp.width*k); c.height=Math.round(bmp.height*k); c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
        for(const [type,e] of [['image/webp','webp'],['image/jpeg','jpg']]){
            const b=await new Promise(r=>c.toBlob(r,type,0.82));
            if(b&&b.type===type) return b.size<f.size?new File([b],f.name.replace(/\.[^.]+$/,'')+'.'+e,{type}):f;
        }
    }catch(e){}
    return f;
}
const fcount=()=>C.old.length-C.del.length+C.files.length;
async function addFiles(list){
    for(let f of list){
        if(fcount()>=MAXF) return toast(`At most ${MAXF} files per project`);
        if(!FT[ext(f.name)]) { toast(f.name+': only PDF, images, Word or PowerPoint'); continue; }
        f=await shrink(f);
        if(f.size>FMAX) { toast(f.name+' is over 3 MB. Upload it to Google Drive and add a link instead'); continue; }
        C.files.push({file:f,name:f.name,size:f.size,type:FT[ext(f.name)]});
    }
    render(false);
}
// apply the file changes from the form: removals first (they free slots), then uploads
async function syncFiles(id){
    if(C.del.length){ const r=await sb.storage.from(BUCKET).remove(C.del); if(r.error) return toast('Could not remove a file: '+r.error.message),false; }
    for(const f of C.files){
        const safe=f.name.normalize('NFKD').replace(/[^\w.\-]+/g,'_').slice(-80);
        // re-wrapped with the type from the extension: browsers often leave .docx/.pptx untyped, which Storage would refuse
        const r=await sb.storage.from(BUCKET).upload(`${id}/${Date.now().toString(36)}-${safe}`,new Blob([f.file],{type:f.type}),{contentType:f.type,upsert:false});
        if(r.error) return toast('Could not upload '+f.name+': '+r.error.message),false;
    }
    delete MAT[id];
    return true;
}
// files of a project with download links valid for an hour; MAT[id] = 'loading' | {files, at}
const MAT={};
async function loadMat(id){
    MAT[id]='loading';
    const r=await sb.storage.from(BUCKET).list(id,{limit:10,sortBy:{column:'created_at',order:'asc'}});
    const files=r.error?[]:r.data.filter(o=>o.id).map(o=>({path:id+'/'+o.name,name:o.name.replace(/^[a-z0-9]+-/,''),size:(o.metadata||{}).size||0}));
    if(files.length){ const u=await sb.storage.from(BUCKET).createSignedUrls(files.map(f=>f.path),3600); if(!u.error) u.data.forEach((x,i)=>files[i].url=x.signedUrl); }
    MAT[id]={files,at:Date.now()};
}
// the Materials card on the project page
const mats=p=>{
    const m=MAT[p.id];
    if(m===undefined||(m!=='loading'&&Date.now()-m.at>50*60000)) loadMat(p.id).then(()=>{ if(S.view==='detail'&&S.pid===p.id) render(false); });
    const files=m&&m!=='loading'?m.files.filter(f=>f.url):[];
    if(!p.links.length&&!files.length) return '';
    return `<div class="card"><div class="lbl">Materials</div><div class="col mats">${p.links.map(l=>`<a class="mat" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${ic('link')}${esc(l.label)}</a>`).join('')}${files.map(f=>`<a class="mat" href="${esc(f.url)}" target="_blank" rel="noopener" download="${esc(f.name)}">${ficon(f.name)}${esc(f.name)} <span class="mut">${fsz(f.size)}</span></a>`).join('')}</div></div>`;
};
// links and files in the project form
const fileRow=(name,size,rm,note)=>`<div class="row frow"><span class="fn">${ficon(name)}${esc(name)}</span><span class="mut">${fsz(size)}${note?' · '+note:''}</span><button class="ghost sm" ${rm} aria-label="Remove ${esc(name)}">✕</button></div>`;
const matForm=()=>`<div class="col"><div class="lbl">Links <span class="mut">(${C.links.length}/${MAXL})</span></div>
${C.links.map((x,i)=>`<div class="row lrow"><input class="fld" data-l="${i}:url" maxlength="300" inputmode="url" placeholder="https://github.com/…" value="${esc(x.url)}" aria-label="Link ${i+1} address"><input class="fld" data-l="${i}:label" maxlength="40" placeholder="Name (optional)" value="${esc(x.label)}" aria-label="Link ${i+1} name"><button class="ghost sm" data-a="lrm" data-i="${i}" aria-label="Remove link ${i+1}">✕</button></div>`).join('')}
${C.links.length<MAXL?'<button class="lnk" data-a="ladd">+ Add a link</button>':''}</div>
<div class="col"><div class="lbl">Files <span class="mut">(${fcount()}/${MAXF})</span></div><div class="mut">PDF, images, Word or PowerPoint, up to 3 MB each; photos are compressed automatically. Bigger files: put them on Google Drive and add a link.</div>
${C.old.filter(f=>!C.del.includes(f.path)).map(f=>fileRow(f.name,f.size,`data-a="fdel" data-p="${esc(f.path)}"`)).join('')}${C.files.map((f,i)=>fileRow(f.name,f.size,`data-a="fq" data-i="${i}"`,'will be uploaded')).join('')}
${fcount()<MAXF?'<button class="ghost sm" data-a="fpick">Attach a file</button><input id="cfile" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.pptx" multiple hidden>':''}</div>`;

// Save an edited project: its fields, then its skills (added or changed first, removed last,
// so a failure never leaves the project without skills)
async function saveEdit(req,opt,links){
    if(!tok('cl')) return;
    if(C.trialDue&&C.trialDue!==C.due0&&!okDate(C.trialDue)) return toast('Trial deadline must be a real date, today or later');
    const id=C.edit;
    let r=await sb.from('projects').update({title:cl(C.title,80),project_type:TYDB[C.type],description:cl(C.desc,1000)||'No description yet.',urgent:C.urgent,beginner_friendly:C.novice,spots_needed:C.n,trial_format:C.trial,trial_task:cl(C.trialTask,300)||null,trial_due:C.trialDue||null,links}).eq('id',id);
    if(r.error) return dberr(r.error);
    const rows=req.map(k=>({project_id:id,skill_id:SKID[k],is_required:true})).concat(opt.map(k=>({project_id:id,skill_id:SKID[k],is_required:false})));
    r=await sb.from('project_skills').upsert(rows,{onConflict:'project_id,skill_id'});
    if(r.error) return dberr(r.error);
    const gone=C.sk0.filter(s=>!C.sk[s]).map(s=>SKID[s]).filter(Boolean);
    if(gone.length){ r=await sb.from('project_skills').delete().eq('project_id',id).in('skill_id',gone); if(r.error) return dberr(r.error); }
    if(!await syncFiles(id)) return;
    C=nC(); S.op=id; await load(); toast('Changes saved'); go('mine');
}

async function load(){
    if(!S.me) return;
    const uid=S.me.uid;
    const[pr,mn,ap,ct]=await Promise.all([
        sb.from('projects').select(PF).eq('status','open').neq('author_id',uid).order('created_at',{ascending:false}).limit(PLIM),
        sb.from('projects').select(PF).eq('author_id',uid),
        sb.from('applications').select('id,project_id,candidate_id,note,status,created_at,cand:profiles!applications_candidate_id_fkey(display_name,last_name,program_code,group_number,availability,user_skills(level,link_url,skills(name)))').order('created_at',{ascending:false}),
        sb.from('contacts').select('user_id,telegram')
    ]);
    const er=pr.error||mn.error||ap.error||ct.error;
    if(er) return dberr(er);
    // projects you applied to that are closed or older than the newest PLIM
    const have=new Set(pr.data.concat(mn.data).map(p=>p.id));
    const miss=[...new Set(ap.data.filter(a=>a.candidate_id===uid&&!have.has(a.project_id)).map(a=>a.project_id))];
    let ex=[];
    if(miss.length){ const r=await sb.from('projects').select(PF).in('id',miss); if(r.error) return dberr(r.error); ex=r.data; }
    const rows=pr.data.concat(mn.data,ex).sort((a,b)=>a.created_at<b.created_at?1:a.created_at>b.created_at?-1:0);
    S.more=pr.data.length===PLIM;
    await loadNotes();
    
    const tg={}; ct.data.forEach(c=>tg[c.user_id]=c.telegram);
    
    S.projects=rows.map(p=>{
        const req=[], opt=[];
        (p.project_skills||[]).forEach(x=>(x.is_required?req:opt).push(x.skills.name));
        const all=req.concat(opt);
        const offers=ap.data.filter(a=>a.project_id===p.id).map(a=>{
            const c=a.cand||{}, sk=(c.user_skills||[]).map(x=>({s:x.skills.name,level:Math.max(0,LVDB.indexOf(x.level)),link:x.link_url||''})), mk=sk.find(x=>all.includes(x.s))||sk[0]||{s:'',level:0,link:''};
            return{id:a.id,cid:a.candidate_id===uid?'me':a.candidate_id,name:((c.display_name||'')+' '+(c.last_name||'')).trim(),group:grp(c.program_code,c.group_number),skills:sk,skill:mk.s,level:mk.level,link:mk.link,did:a.note||'',when:AVR[c.availability]||'',tg:tg[a.candidate_id]||'',st:STR[a.status]||'new'};
        });
        return{id:p.id,title:p.title,type:TYR[p.project_type],authorId:p.author_id===uid?'me':p.author_id,author:p.author?who(p.author.display_name,p.author.program_code,p.author.group_number):'',tg:tg[p.author_id]||'',desc:p.description||'',req,opt,urgent:p.urgent,novice:p.beginner_friendly,trial:p.trial_format||'Quick chat',n:p.spots_needed,status:p.status,trialTask:p.trial_task||'',trialDue:p.trial_due||'',links:p.links||[],offers};
    });
}

// Notifications: history for the bell, written by database triggers; new ones arrive live
let NT=[], NOPEN=false, live=null;
const ntText=n=>{
    const t='“'+(n.project_title||'a project')+'”';
    if(n.kind==='assembled') return n.status==='accepted'?'Team assembled for '+t+'. You are in it!':t+': the team is assembled';
    return n.kind==='new_application'?(n.actor_name||'Someone')+' applied to '+t
        :n.kind==='withdrawn'?(n.actor_name||'A candidate')+' withdrew from '+t
        :t+': '+(STT[STR[n.status]]||n.status);
};
const ago=d=>{const m=Math.max(0,Math.round((Date.now()-new Date(d))/60000));return m<1?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago'};
const bell=()=>{
    if(!S.me) return '';
    const un=NT.filter(n=>!n.read_at).length;
    return `<span class="ntf"><button class="ghost sm bell" data-a="bell" aria-expanded="${NOPEN}" aria-label="Notifications${un?', '+un+' unread':''}">${ic('bell')}${un?`<span class="bdg">${un>9?'9+':un}</span>`:''}</button>${NOPEN?`<div class="ntp" role="dialog" aria-label="Notifications"><div class="nth"><b>Notifications</b>${un?'<button class="lnk" data-a="nall">Mark all as read</button>':''}</div>${NT.length?NT.map(n=>`<button class="nti${n.read_at?'':' un'}" data-a="nopen" data-id="${n.id}"><span>${esc(ntText(n))}</span><span class="mut">${ago(n.created_at)}</span></button>`).join(''):'<div class="mut nte">No notifications yet</div>'}</div>`:''}</span>`;
};
async function loadNotes(){
    if(!S.me) return;
    const r=await sb.from('notifications').select('id,kind,project_id,project_title,actor_name,status,read_at,created_at').order('created_at',{ascending:false}).limit(30);
    NT=r.error?[]:r.data;   // before the notifications migration runs the table is missing: just show none
}
function listen(){
    if(live||!S.me) return;
    live=sb.channel('notifications').on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'user_id=eq.'+S.me.uid},async ev=>{
        await load();
        toast(ntText(ev.new)); beep();
        // do not re-render under someone who is typing
        const a=document.activeElement;
        if(!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) render(false);
    }).subscribe();
}

async function bootUser(u){
    let r=await sb.from('profiles').select('display_name,last_name,program_code,group_number,availability').eq('id',u.id).maybeSingle();
    if(r.error) return dberr(r.error);
    let pr=r.data;
    if(!pr){
        let nm=cl((u.user_metadata&&u.user_metadata.name)||u.email.split('@')[0],60);
        if(nm.length<2) nm='Student';
        const w=await sb.from('profiles').insert({id:u.id,display_name:nm});
        if(w.error) return dberr(w.error);
        pr={display_name:nm,last_name:null,program_code:null,group_number:null,availability:'this_week'};
    }
    const[c,us]=await Promise.all([sb.from('contacts').select('telegram').eq('user_id',u.id).maybeSingle(),sb.from('user_skills').select('level,link_url,skills(name)').eq('user_id',u.id)]);
    S.me={id:'me',uid:u.id,name:pr.display_name,email:u.email,uni:u.email.split('@')[1],tg:c.data?c.data.telegram:'',last:pr.last_name||'',prog:pr.program_code||'',num:pr.group_number||'',avail:AVR[pr.availability]||'This week',skills:(us.data||[]).map(x=>({s:x.skills.name,level:Math.max(0,LVDB.indexOf(x.level)),link:x.link_url||''}))};
    await loadSkills(); await load();
    listen();
}

let spT,tT,lT={};
const queueProfile=()=>{clearTimeout(spT); spT=setTimeout(syncProfile,800)};
async function syncProfile(){
    const m=S.me; if(!m)return;
    const n=cl(m.name,60), up={last_name:cl(m.last,60)||null,availability:AVDB[m.avail]||'this_week'}, num=String(m.num||'').trim();
    if(m.prog&&/^\d{4}$/.test(num)){ up.program_code=m.prog; up.group_number=num; }
    else if(!m.prog&&!num){ up.program_code=null; up.group_number=null; }
    if(n.length>=2) up.display_name=n;
    let r=await sb.from('profiles').update(up).eq('id',m.uid);
    if(r.error) return dberr(r.error);
    const t=cl(m.tg,33);
    if(TGRE.test(t)){
        r=await sb.from('contacts').upsert({user_id:m.uid,telegram:t});
        if(r.error) dberr(r.error);
    }
}
const queueTrial=()=>{
    clearTimeout(tT);
    tT=setTimeout(async()=>{
        const p=S.projects.find(x=>x.id===S.op); if(!p||p.authorId!=='me')return;
        const r=await sb.from('projects').update({trial_task:cl(p.trialTask,300)||null,trial_due:realDate(p.trialDue)?p.trialDue:null}).eq('id',p.id);
        if(r.error) dberr(r.error);
    },800);
};
const queueLink=i=>{
    clearTimeout(lT[i]);
    lT[i]=setTimeout(async()=>{
        const x=S.me&&S.me.skills[i]; if(!x)return;
        let l=cl(x.link,300); if(l&&!/^https?:\/\//i.test(l)) l='https://'+l;
        const r=await sb.from('user_skills').update({link_url:l||null}).eq('user_id',S.me.uid).eq('skill_id',SKID[x.s]);
        if(r.error) dberr(r.error);
    },800);
};

async function init(){
    render();
    if(!sb){toast('Set SUPABASE_URL and SUPABASE_KEY at the top of the script');return}
    try{const r=await sb.auth.getSession(); if(r.data.session) await bootUser(r.data.session.user);}catch(e){console.error(e)}
    S.ready=true; render(false);
}

const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const E={
    spring(p,v,t,dt,k,c){v+=((t-p)*k-v*c)*dt;return[p+v*dt,v]},
    fuzzy(q,t){let qi=0,s=0,pv=-2;for(let i=0;i<t.length&&qi<q.length;i++){if(t[i]===q[qi]){s+=10;if(pv===i-1)s+=15;if(i===0||t[i-1]===' ')s+=20;pv=i;qi++}}return qi===q.length?s:-1}
};

const sc=p=>{const q=F.q.toLowerCase();return Math.max(E.fuzzy(q,p.title.toLowerCase()),(p.desc||'').toLowerCase().includes(q)?30:-1,...p.req.concat(p.opt).map(s=>E.fuzzy(q,s.toLowerCase())))};
const mv={x:0,y:0};let px=0,py=0,vx=0,vy=0,raf=0,lt=0;
function tick(t){
    const dt=Math.min(.032,(t-lt)/1000)||.016;lt=t;
    [px,vx]=E.spring(px,vx,mv.x,dt,120,14);[py,vy]=E.spring(py,vy,mv.y,dt,120,14);
    document.querySelectorAll('.blob').forEach(b=>{const d=+b.dataset.d;b.style.transform=`translate(${px*d}px,${py*d}px)`});
    raf=Math.abs(px-mv.x)+Math.abs(vx)+Math.abs(py-mv.y)+Math.abs(vy)>.002?requestAnimationFrame(tick):0
}
if(!RM)addEventListener('pointermove',e=>{mv.x=e.clientX/innerWidth-.5;mv.y=e.clientY/innerHeight-.5;if(!raf)raf=requestAnimationFrame(tick)});
function pop(x,y){
    if(RM)return;
    const c=['--lav2','--mint','--but','--pea'];
    for(let i=0;i<18;i++){
        const e=document.createElement('i'),a=Math.random()*6.28,d=60+Math.random()*80;
        e.style.cssText=`position:fixed;left:${x}px;top:${y}px;width:8px;height:8px;border-radius:${i%2?'50%':'2px'};background:var(${c[i%4]});pointer-events:none;z-index:9`;
        document.body.appendChild(e);
        e.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d+40}px) scale(.3)`,opacity:0}],{duration:700+Math.random()*300,easing:'cubic-bezier(.2,.8,.3,1)'}).onfinish=()=>e.remove()
    }
}
let wi=0;
// The rotating word has its own line and never wraps; one font size, fitted to the longest word,
// keeps the heading the same height for every word, so the page does not jump.
function fitRw(){
    const e=$('#rw'); if(!e) return;
    const cur=e.textContent, box=e.parentElement.clientWidth;
    e.style.fontSize='';
    let widest=0;
    for(const w of words){ e.textContent=w; widest=Math.max(widest,e.offsetWidth); }
    e.textContent=cur;
    if(widest>box) e.style.fontSize=(parseFloat(getComputedStyle(e).fontSize)*box/widest*0.98)+'px';
}
addEventListener('resize',fitRw);
if(document.fonts) document.fonts.ready.then(fitRw);
new MutationObserver(()=>{ const e=$('#rw'); if(e&&!e.dataset.fit){ e.dataset.fit=1; fitRw(); } }).observe($('#app'),{childList:true});
if(!RM) setInterval(()=>{
    const e=$('#rw');
    if(!e)return;
    e.style.opacity=0;
    e.style.transform='translateY(8px)';
    setTimeout(()=>{wi=(wi+1)%words.length;e.textContent=words[wi];e.style.opacity=1;e.style.transform='none'},260);
},2400);

// ---------- Animated how-to guide on the landing page ----------
// Each guide is a few steps; each step has the explanation (h, d), a mock screen (v) and the element the cursor clicks (c, a selector in v).
// Steps advance every GSTEP ms of time the guide is playing and on screen; one timer drives both the step and its progress bar.
const GSTEP=3600;
const mk={
    nav:(on,badge)=>`<div class="mk-nav"><span class="mk-brand"><img class="mk-logo" src="assets/logo.svg" alt="" width="34" height="24">TeamUp</span><span class="mk-sp"></span>${['Find','My projects','Post','Applications','Me'].map(t=>`<span class="mk-tab${t===on?' on':''}" data-t="${t}">${t}</span>`).join('')}<span class="mk-bell">${ic('bell')}${badge?`<i>${badge}</i>`:''}</span></div>`,
    field:(l,v,type)=>`<div class="mk-f"><span class="mk-l">${l}</span><span class="mk-in">${type?`<span class="ty" style="--n:${v.length}">${v}</span>`:v}</span></div>`,
    chips:(a,cls='')=>`<div class="mk-row">${a.map(x=>`<span class="mk-chip ${cls}">${x}</span>`).join('')}</div>`,
    btn:(t,hl)=>`<span class="mk-btn${hl?' hl':''}">${t}</span>`,
    toast:t=>`<span class="mk-toast">${t}</span>`,
    card:(t,meta,inner='',hl)=>`<div class="mk-card${hl?' hl':''}"><b>${t}</b><span class="mk-m">${meta}</span>${inner}</div>`
};
const GD=[
 {k:'create',t:'Create a project',s:[
  {h:'Open “Post”',d:'It is in the top menu; on a phone, tap “+ New”.',c:'.mk-tab[data-t=Post]',v:mk.nav('Find')+`<div class="mk-body">${mk.card('Open projects','12 projects · best match first')}${mk.card('AI Study Buddy','Hackathon · 2 needed')}</div>`},
  {h:'Describe the project',d:'Give it a clear title, say what needs to be done and pick the type: hackathon, thesis, startup…',c:'.mk-in',v:mk.nav('Post')+`<div class="mk-body"><b class="mk-h">Post a project</b>${mk.field('Title','Campus food delivery app',1)}${mk.field('Type',mk.chips(['Hackathon','Thesis','Startup']).replace('mk-chip ','mk-chip on '))}</div>`},
  {h:'Add the skills you need',d:'Mark them required or nice to have. Students who have them see your project first. Links and files go here too.',c:'.pop:last-child',v:mk.nav('Post')+`<div class="mk-body"><b class="mk-h">Post a project</b>${mk.field('Title','Campus food delivery app')}<span class="mk-l">Skills</span>${mk.chips(['Flutter · required','UI/UX Design · required','Firebase · nice to have'],'pop')}<span class="mk-l">Links</span>${mk.chips([ic('link')+' Figma'],'pop')}</div>`},
  {h:'Choose a trial and publish',d:'A quick chat or a small task shows who fits. Press “Publish”: the project appears in Find.',c:'.mk-btn.hl',v:mk.nav('Post')+`<div class="mk-body"><b class="mk-h">Terms</b>${mk.field('Trial format',mk.chips(['Quick chat','Small task']).replace('mk-chip "','mk-chip on"'))}${mk.field('People needed','2')}<div class="mk-end">${mk.btn('Publish',1)}</div></div>${mk.toast('Project published')}`}
 ]},
 {k:'profile',t:'Fill in your profile',s:[
  {h:'Open “Me”',d:'Your profile is what authors see when you apply, so it is worth two minutes.',c:'.mk-tab[data-t=Me]',v:mk.nav('Find')+`<div class="mk-body">${mk.card('Open projects','12 projects')}</div>`},
  {h:'Name, group and Telegram',d:'Your group, like SE-2402, and your Telegram. The Telegram is shown only to authors who accept you.',c:'.mk-f:nth-of-type(3) .mk-in',v:mk.nav('Me')+`<div class="mk-body"><b class="mk-h">Profile</b>${mk.field('Name','Aruzhan Sadykova',1)}${mk.field('Group','SE-2402')}${mk.field('Telegram','@aruzhan_s',1)}</div>`},
  {h:'Add your skills and level',d:'Learning, coursework or a real project: be honest, it decides which projects fit you.',c:'.mk-chip.on',v:mk.nav('Me')+`<div class="mk-body"><b class="mk-h">My skills</b>${mk.card('Python','Real project',mk.chips(['Learning','Coursework','Real project']).replace(/mk-chip ">Real/,'mk-chip on">Real'))}${mk.card('Figma','Coursework','',0)}</div>`},
  {h:'Prove it with a link',d:'A GitHub repo, a Figma file or coursework. Skills with a link get a “✓ link” mark. Everything saves by itself.',c:'.mk-in',v:mk.nav('Me')+`<div class="mk-body"><b class="mk-h">My skills</b>${mk.card('Python','Real project · ✓ link',mk.field('Link to your work','github.com/aruzhan/bot',1),1)}</div>${mk.toast('Saved')}`}
 ]},
 {k:'apply',t:'Apply to a project',s:[
  {h:'Find a project that fits',d:'Projects with your skills come first. Use “Fits me”, the type and skill filters, or search.',c:'.mk-card.hl',v:mk.nav('Find')+`<div class="mk-body">${mk.chips(['Fits me','Hackathon','Beginners welcome']).replace('mk-chip ','mk-chip on ')}${mk.card('Campus food delivery app','Hackathon · 2 needed','<span class="mk-fit">✓ You have all 2 required skills</span>',1)}${mk.card('NLP for Kazakh','Research · 1 needed')}</div>`},
  {h:'Read the details',d:'What the team needs, the trial format, and materials: links and files from the author.',c:'.mk-row:last-of-type .mk-chip',v:mk.nav('Find')+`<div class="mk-body"><b class="mk-h">Campus food delivery app</b>${mk.chips(['✓ Flutter','✓ UI/UX Design','Firebase'])}<span class="mk-l">Materials</span>${mk.chips([ic('link')+' Figma',ic('file')+' brief.pdf'])}</div>`},
  {h:'Tell what you did',d:'Pick the skill you apply with, your level and one line about your work. Add a link if you have one.',c:'.mk-btn.hl',v:mk.nav('Find')+`<div class="mk-body"><b class="mk-h">Apply</b>${mk.field('Skill',mk.chips(['Flutter']).replace('mk-chip ','mk-chip on '))}${mk.field('What exactly did you do','Built a Flutter app for a course',1)}<div class="mk-end">${mk.btn('Apply',1)}</div></div>`},
  {h:'Follow it in Applications',d:'Under review → On trial → Accepted. The bell tells you when the status changes.',c:'.mk-bell',v:mk.nav('Applications',1)+`<div class="mk-body"><b class="mk-h">My applications</b>${mk.card('Campus food delivery app','Flutter · Coursework','<span class="mk-st">On trial</span>',1)}</div>${mk.toast('“Campus food delivery app”: On trial')}`}
 ]},
 {k:'manage',t:'Pick your team',s:[
  {h:'Get notified',d:'The bell shows new applications to your projects, even ones that came while you were away.',c:'.mk-bell',v:mk.nav('Find',2)+`<div class="mk-body"><div class="mk-pop"><b>Notifications</b><span class="un">Daniyar applied to “Campus food delivery app”</span><span>Aigerim applied to “Campus food delivery app”</span></div></div>`},
  {h:'Compare candidates',d:'Each application shows the skill, level, links to work and what the student did.',c:'.mk-card.hl',v:mk.nav('My projects')+`<div class="mk-body"><b class="mk-h">Campus food delivery app</b>${mk.card('Daniyar · SE-2401','Flutter · Real project · ✓ link','<span class="mk-m">“Shipped a delivery app at a hackathon”</span>',1)}${mk.card('Aigerim · CS-2403','UI/UX Design · Coursework')}</div>`},
  {h:'Give a small trial',d:'Move a candidate to “On trial” and write a small task with a deadline.',c:'.mk-btn.hl',v:mk.nav('My projects')+`<div class="mk-body">${mk.card('Daniyar · SE-2401','Flutter · Real project',`<div class="mk-row">${mk.btn('On trial',1)}${mk.btn('Accept')}${mk.btn('Reject')}</div>`)}${mk.field('Trial task','Build the order screen by Friday',1)}</div>`},
  {h:'Accept and team up',d:'Accept the people you want: their Telegram opens. When the team is complete, mark it “Team assembled”.',c:'.mk-btn.hl',v:mk.nav('My projects')+`<div class="mk-body"><div class="mk-end">${mk.btn('Team assembled',1)}</div>${mk.card('Daniyar · SE-2401','Accepted','<span class="mk-m">Telegram: <b>@daniyar_dev</b></span>')}</div>${mk.toast('Team assembled. Everyone who applied was notified')}`}
 ]}
];
const GS={g:0,s:0,play:!RM,el:0,last:Date.now()};
const guide=()=>{
    const g=GD[GS.g];
    return `<section class="sec" id="guide" data-g="${GS.g}" aria-labelledby="guide-h"><h2 id="guide-h">How to use TeamUp</h2>
<div class="gtabs" role="tablist">${GD.map((x,i)=>`<button role="tab" class="gtab${i===GS.g?' on':''}" aria-selected="${i===GS.g}" data-a="gtab" data-i="${i}">${x.t}</button>`).join('')}</div>
<div class="gbox${GS.play?'':' paused'}">
<ol class="gsteps">${g.s.map((s,i)=>`<li><button class="gstep${i===GS.s?' on':''}" data-a="gstep" data-i="${i}"${i===GS.s?' aria-current="step"':''}><span class="gnum">${i+1}</span><span><b>${s.h}</b><span class="gd">${s.d}</span></span><i class="gbar" style="width:0"></i></button></li>`).join('')}</ol>
<div class="gscreen" aria-hidden="true">${g.s.map((s,i)=>`<div class="gf${i===GS.s?' on':''}">${s.v}</div>`).join('')}<span class="gcur">${ic('cursor')}</span></div>
<button class="ghost sm gplay" data-a="gplay" aria-label="${GS.play?'Pause':'Play'} the guide">${GS.play?'❚❚ Pause':'▶ Play'}</button>
</div></section>`;
};
// show step s of the current guide by switching classes, without re-rendering the page
function gShow(s){
    const box=$('#guide'); if(!box) return;
    GS.s=s; GS.el=0;
    const g=GD[GS.g];
    box.querySelectorAll('.gstep').forEach((b,i)=>{ b.classList.toggle('on',i===s); if(i===s) b.setAttribute('aria-current','step'); else b.removeAttribute('aria-current'); const bar=b.querySelector('.gbar'); bar.style.transition='none'; bar.style.width='0'; });
    box.querySelectorAll('.gf').forEach((f,i)=>f.classList.toggle('on',i===s));
    const c=box.querySelector('.gcur'); c.classList.remove('click'); gPos(); setTimeout(()=>c.classList.add('click'),RM?0:750);
}
// put the cursor on the step's target element, measured on the mock as it is laid out now (works at any width)
function gPos(){
    const box=$('#guide'); if(!box) return;
    const scr=box.querySelector('.gscreen'), f=box.querySelectorAll('.gf')[GS.s], c=box.querySelector('.gcur');
    const t=f&&f.querySelector(GD[GS.g].s[GS.s].c); if(!t) return;
    const a=scr.getBoundingClientRect(), r=t.getBoundingClientRect();
    c.style.left=(r.left-a.left+Math.min(r.width*.6,r.width-6))+'px'; c.style.top=(r.top-a.top+r.height*.6)+'px';
}
// redraw the guide (tab or play/pause changed) keeping the time already spent on the step
const gRedraw=()=>{
    const box=$('#guide'); if(!box) return;
    box.outerHTML=guide();
    const bar=$('#guide .gstep.on .gbar'); if(bar) bar.style.width=Math.min(100,GS.el/GSTEP*100)+'%';
    gPos(); const c=$('#guide .gcur'); if(c) c.classList.add('click');
};
Object.assign(A,{
    gtab:d=>{GS.g=+d.i; GS.s=0; GS.el=0; gRedraw();},
    gstep:d=>{gShow(+d.i);},
    gplay:()=>{GS.play=!GS.play; gRedraw();}
});
setInterval(()=>{
    const now=Date.now(), dt=now-GS.last; GS.last=now;
    const box=$('#guide'); if(!box) return;
    gPos();
    const r=box.getBoundingClientRect();
    if(!GS.play||document.hidden||r.bottom<0||r.top>innerHeight) return;
    GS.el+=Math.min(dt,500);
    const bar=box.querySelector('.gstep.on .gbar');
    if(bar){ bar.style.transition=''; bar.style.width=Math.min(100,GS.el/GSTEP*100)+'%'; }
    if(GS.el<GSTEP) return;
    const n=GD[GS.g].s.length;
    if(GS.s+1<n) gShow(GS.s+1); else { GS.g=(GS.g+1)%GD.length; GS.s=0; GS.el=0; gRedraw(); }
},100);
