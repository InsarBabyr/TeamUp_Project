const SUPABASE_URL='https://emigzyfpkbpigncisehs.supabase.co';
const SUPABASE_KEY='sb_publishable_j_cdvdOxvXw91W7yLHtVVg_86n9NOCS';
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
    <button class="btn" data-a="submitAuth" id="authBtn" data-mode="login" style="margin-top:8px;">Log In</button>
  </div>
</div>`);

let S={projects:[],me:null,view:'landing',pid:null,op:null,tab:'new',ready:false};
const F={skills:[],type:'All',novice:false,urgent:false,q:''};
const nR=()=>({skill:'',level:1,link:'',did:'',when:'Today',tg:''});
const nC=()=>({title:'',type:'Hackathon',desc:'',sk:{},urgent:false,trial:'Quick chat',trialTask:'',trialDue:'',novice:true,n:1});

let R=nR(), C=nC(), G={name:'',email:'',pw:''}, RCV=false, tm, lastT=0;
const P=()=>S.projects.find(p=>p.id===S.pid);

const chip=(t,on,at,x='')=>`<button class="chip${on?' on':''}${x}" ${at}>${esc(t)}</button>`;
const skl=p=>p.req.map(s=>`<span class="chip req">${esc(s)}</span>`).join('')+p.opt.map(s=>`<span class="chip opt">${esc(s)}</span>`).join('');
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

const mine=p=>S.me&&p.authorId==='me';
const applied=p=>p.offers.some(o=>o.cid==='me');
const vis=()=>S.projects.filter(p=>p.authorId!=='me'&&p.status==='open'&&(!F.skills.length||F.skills.every(s=>p.req.includes(s)||p.opt.includes(s)))&&(F.type==='All'||p.type===F.type)&&(!F.novice||p.novice)&&(!F.urgent||p.urgent)&&(!F.q||sc(p)>=0)).sort((a,b)=>F.q?sc(b)-sc(a):0);

const card=p=>`<article class="card" data-a="open" data-id="${p.id}"><div class="top"><h3>${esc(p.title)}</h3>${p.urgent?'<span class="urg">Urgent</span>':''}</div><div class="mut">${p.type} · ${esc(p.author)}</div>${p.desc?`<p class="dsc">${esc(p.desc.slice(0,140))}${p.desc.length>140?'…':''}</p>`:''}<div class="row">${skl(p)}</div><div class="foot"><span class="mut">${p.n} needed${p.novice?' · beginners welcome':''}</span><button class="btn sm" data-a="open" data-id="${p.id}">${applied(p)?'Applied':'Apply'}</button></div></article>`;

const grid=()=>{
    if(!S.ready) return '<div class="card">Loading projects…</div>';
    const v=vis();
    return v.length?v.map(card).join(''):'<div class="card">Nothing found. Clear some filters or create your own project.</div>';
};

const head=()=>{
    const m=S.me, cur={detail:'find',manage:'mine'}[S.view]||S.view;
    const tabs = m ? 
        `<button class="nv${cur==='find'?' on':''}" data-a="go" data-v="find">${ic('find')} Find</button>
         <button class="nv${cur==='mine'?' on':''}" data-a="go" data-v="mine">${ic('projects')} My projects</button>
         <button class="nv${cur==='create'?' on':''}" data-a="go" data-v="create">${ic('post')} Post</button>
         <button class="nv${cur==='apps'?' on':''}" data-a="go" data-v="apps">${ic('apps')} Applications</button>
         <button class="nv${cur==='profile'?' on':''}" data-a="go" data-v="profile">${ic('me')} Me</button>` 
        : `<button class="nv${cur==='find'?' on':''}" data-a="go" data-v="find">Browse projects</button>`;

    return `<header class="hd">
        <div class="in" style="justify-content: space-between; padding-top: 16px; padding-bottom: 16px;">
            <button class="logo" data-a="go" data-v="landing" aria-label="TeamUp home">
                <img class="lgi" src="assets/logo.svg" alt="" width="34" height="24" style="margin-right:8px;">
                TeamUp
            </button>

            <nav class="bar" style="flex:none; align-items:center;">
                ${tabs}${sndBtn()}
                ${!m ? (S.view==='landing'?'<button class="ghost sm" data-a="how" style="border:none; margin-right:8px;">How it works</button>':'') + '<button class="btn sm" data-a="openAuth">Sign In / Register</button>' : ''}
            </nav>
        </div>
    </header>`;
};

const V={};
const words=['startup','hackathon','research paper','thesis','course project'];

V.landing=()=>{
    const cta=S.me?`<button class="btn xl" style="background:var(--ink);color:var(--po);" data-a="go" data-v="create">Create a project</button><button class="ghost xl" style="background:var(--card);color:var(--ink);border:none;" data-a="go" data-v="find">Browse projects</button>`:`<button class="btn xl" style="background:var(--ink);color:var(--po);" data-a="openAuth">Sign In / Register</button><button class="ghost xl" style="background:var(--card);color:var(--ink);border:none;" data-a="go" data-v="find">Browse projects</button>`;
    const mq=['Python','SQL','Figma','React','JavaScript','Docker','Power BI / Tableau','Excel','User Research','Machine Learning','Data Analysis','UI/UX Design'].map(s=>`<span>${s}</span>`).join('<span>✦</span>');
    return `<section class="lh"><i class="blob" data-d="40" style="width:260px;height:260px;right:6%;top:-70px;background:var(--mint)"></i><i class="blob" data-d="-28" style="width:150px;height:150px;right:30%;bottom:-50px;background:var(--po)"></i><i class="blob" data-d="20" style="width:90px;height:90px;left:52%;top:40px;background:var(--pea)"></i>
<div class="in"><h1 class="big">Your next <span id="rw" class="hl">${words[0]}</span><br>needs a team.</h1><p style="font-size: 18px; max-width: 620px; line-height: 1.5;">TeamUp finds people by what they can actually do, not by who you happen to know. Sign in with your university email, publish a project or join one in a click.</p><div class="row" style="margin-top:8px">${cta}</div>${HERO()}</div></section>
<div class="mq" aria-hidden="true"><div>${mq}<span>✦</span>${mq}<span>✦</span></div></div>
<section class="sec" id="how"><h2>Three steps to a team</h2><div class="g3">
<div class="card">${IMG1()}<div class="num">1</div><h3>Post or browse</h3><div class="mut">Describe your project and the skills you need, or filter other students' projects by skill and type.</div></div>
<div class="card">${IMG2()}<div class="num">2</div><h3>Apply in a click</h3><div class="mut">Your profile with skills, levels and links does the talking. Add one line about what you did.</div></div>
<div class="card">${IMG3()}<div class="num">3</div><h3>Try, then team up</h3><div class="mut">Authors give a small trial task first. Contacts open only after acceptance.</div></div></div></section>
<section class="sec"><h2>One account. Two roles.</h2><div class="g3">
<div class="card" style="background:var(--lav2);color:var(--po)"><span class="pill" style="align-self:flex-start;color:var(--ink)">Author</span><h3>You post a project</h3><div>Publish your thesis, research or hackathon idea, review applicants, accept to a trial, build the team.</div></div>
<div class="card" style="background:#1D4ED8;color:#fff"><span class="pill" style="align-self:flex-start;color:var(--ink)">Candidate</span><h3>You join someone else's</h3><div>Apply to other students' projects from the same profile. You can be both at once, but never apply to your own.</div></div></div></section>
<section class="sec"><div class="cta" style="align-items:center; text-align:center;"><h2>Stop asking in group chats.</h2><div style="max-width:560px;line-height:1.5; font-size:16px;">Find the person with the skill you need in minutes.</div><div class="row">${S.me?`<button class="btn xl" style="background:var(--card);color:var(--ink);" data-a="go" data-v="find">Browse projects</button>`:`<button class="btn xl" style="background:var(--card);color:var(--ink);" data-a="openAuth">Sign in with university email</button>`}</div></div></section>
<footer class="ft">TeamUp · student team finder · prototype. All data in the database is synthetic test data.</footer>`;
};

V.find=()=>{
    const m = S.me;
    
    const leftCol = `
        <div class="col" style="gap:16px;">
            <div class="card">
                <div class="lbl" style="font-size:15px; margin-bottom:8px;">Filters</div>
                
                <div class="col" style="margin-bottom:12px;">
                    <div class="lbl mut">Type</div>
                    <div class="row">
                        ${chip('All types', F.type==='All', 'data-a="ft" data-t="All"')}
                        ${TY.map(t=>chip(t, F.type===t, `data-a="ft" data-t="${t}"`)).join('')}
                    </div>
                </div>

                <div class="col" style="margin-bottom:12px;">
                    <div class="lbl mut">Conditions</div>
                    <div class="row">
                        ${chip('Beginners welcome', F.novice, 'data-a="fn"')}
                        ${chip('Urgent', F.urgent, 'data-a="fu"')}
                    </div>
                </div>
                
                <div class="col">
                    <div class="lbl mut">Skills</div>
                    ${skSel('fsel','Add a skill filter…','fsel',F.skills)}<div class="row">${F.skills.map(s=>xchip(s,'on',null,'data-a="fsx"',s)).join('')}</div>
                </div>
            </div>
        </div>
    `;

    const midCol = `
        <div class="col" style="gap:16px;">
            <input id="q" maxlength="60" class="fld search-input" placeholder="🔍 Search by title, description or skill..." value="${esc(F.q)}">
            <div id="grid" class="grid" style="grid-template-columns: 1fr;">${grid()}</div>
        </div>
    `;

    const urgList = S.projects.filter(p=>p.urgent && p.status==='open' && p.authorId!=='me').slice(0,3);
    const rightCol = `
        <div class="col" style="gap:16px;">
            <div class="card">
                <h3 style="margin-bottom:12px; font-size:15px;">Urgent projects</h3>
                ${urgList.length ? urgList.map(p=>`
                    <div style="cursor:pointer; margin-bottom:12px;" data-a="open" data-id="${p.id}">
                        <div style="font-weight:700; font-size:13px; color:var(--ink);">${esc(p.title)}</div>
                        <div class="mut" style="font-size:12px; margin-top:2px;">${p.type} · ${p.n} needed</div>
                    </div>
                `).join('<hr style="border:0;border-top:1px solid var(--ln);margin:12px 0;">') : '<div class="mut" style="font-size:12px;">No urgent projects right now</div>'}
            </div>
            <div class="card" style="background:var(--bg); border:1px dashed var(--mut);">
                <h3 style="margin-bottom:8px; font-size:14px;">How trials work</h3>
                <div class="mut" style="font-size:12px;">The author gives a small independent task first. If it goes well, you are accepted and contacts open.</div>
            </div>
        </div>
    `;

    return `<div class="dashboard-layout wrap" style="padding-top:24px;">${leftCol}${midCol}${rightCol}</div>`;
};

V.detail=()=>{
    const p=P();
    if(!p)return V.find();
    const own=mine(p), done=applied(p);
    const form = own ? `<div class="side card w380"><h3>This is your project</h3><div class="mut">Applications: ${p.offers.length}</div><button class="btn" data-a="manage" data-id="${p.id}">Manage applications</button></div>` : 
    !S.me ? `<div class="side card w380"><h3>Apply to this project</h3><div class="mut">Sign in with your university email to apply.</div><button class="btn" data-a="openAuth">Sign In</button></div>` :
    done ? `<div class="side card w380"><h3>Application sent</h3><div class="mut">Track it in My applications. The author's contact opens after acceptance.</div><button class="ghost" data-a="go" data-v="apps">My applications</button></div>` :
    `<div class="side card w380"><h3>Apply</h3>
<div class="col"><div class="lbl">Skill</div><div class="row">${p.req.concat(p.opt).map(s=>chip(s,R.skill===s,`data-a="rs" data-s="${s}"`)).join('')}</div></div>
<div class="col"><div class="lbl">Your level</div><div class="row">${LV.map((l,i)=>chip(l,R.level===i,`data-a="rl" data-i="${i}"`)).join('')}</div></div>
<div class="col"><label class="lbl" for="rl">Link to your work</label><input id="rl" class="fld" data-k="R.link" maxlength="300" placeholder="GitHub, Figma, Kaggle, coursework" value="${esc(R.link)}"><span class="mut">With a link, the skill gets a “Link provided” mark.</span></div>
<div class="col"><label class="lbl" for="rd">What exactly did you do</label><textarea id="rd" class="fld" data-k="R.did" maxlength="500" placeholder="One or two lines">${esc(R.did)}</textarea></div>
<div class="col"><div class="lbl">When can you start</div><div class="row">${AV.map(w=>chip(w,R.when===w,`data-a="rw" data-w="${w}"`)).join('')}</div></div>
<div class="col"><label class="lbl" for="rt">Telegram</label><input id="rt" class="fld" data-k="R.tg" maxlength="33" placeholder="@username" value="${esc(R.tg)}"><span class="mut">The author sees it only after accepting you.</span></div>
<button class="btn" data-a="send">Apply</button></div>`;
    return `<div class="wrap"><div class="main col" style="gap:16px"><button class="ghost" style="align-self:flex-start; border:none; background:transparent; padding-left:0; color:var(--mut);" data-a="go" data-v="find">← Back to projects</button>
<div class="card"><div class="top"><h1>${esc(p.title)}</h1>${p.urgent?'<span class="urg">Urgent</span>':''}</div><div class="mut">${p.type} · ${esc(p.author)}</div><div style="line-height:1.5">${esc(p.desc)}</div></div>
<div class="card"><div class="lbl">Skills needed</div><div class="row">${skl(p)}</div><div class="mut">Beginners welcome: ${p.novice?'yes':'no'} · People needed: ${p.n}</div></div>
<div class="card" style="background:var(--lav); border-color:var(--lav2);"><div class="lbl" style="color:var(--lav2)">How the trial works</div><div style="font-size:14px;line-height:1.5; color:var(--ink)">Format: ${esc(p.trial)}. You take a small independent piece of the project and the author decides who stays. Contacts open after acceptance.${p.trialTask?` Trial task: ${esc(p.trialTask)}${p.trialDue?', deadline '+esc(p.trialDue):''}.`:''}</div></div></div>${form}</div>`;
};

V.create=()=>`<div class="wrap"><div class="main card"><h1>Post a project</h1>
<div class="col"><label class="lbl" for="ct">Title</label><input id="ct" class="fld" data-k="C.title" maxlength="80" placeholder="What are we building" value="${esc(C.title)}"></div>
<div class="col"><label class="lbl" for="cd">Description</label><textarea id="cd" class="fld" data-k="C.desc" maxlength="1000" placeholder="What needs to be done and by when">${esc(C.desc)}</textarea></div>
<div class="col"><div class="lbl">Type</div><div class="row">${TY.map(t=>chip(t,C.type===t,`data-a="cty" data-t="${t}"`)).join('')}</div></div>
<div class="col"><div class="lbl">Skills <span class="mut">(${Object.keys(C.sk).length}/${MAXPS})</span></div><div class="mut">Pick a skill from the list. Tap an added skill to switch between <b>Required</b> and <b>Nice to have</b>.</div>${skSel('csel','Add a skill…','csel',Object.keys(C.sk))}<div class="row">${Object.keys(C.sk).length?Object.keys(C.sk).map(s=>xchip(s+' ('+(C.sk[s]==='req'?'Required':'Nice to have')+')',C.sk[s],'data-a="csk"','data-a="cskx"',s)).join(''):'<span class="mut">No skills added yet.</span>'}</div></div></div>
<div class="side card w380"><h3>Terms</h3>
<div class="col"><div class="lbl">Urgency</div><div class="row">${chip('Not urgent',!C.urgent,'data-a="cu" data-u="0"')}${chip('Urgent',C.urgent,'data-a="cu" data-u="1"')}</div></div>
<div class="col"><div class="lbl">Trial format</div><div class="row">${TR.map(t=>chip(t,C.trial===t,`data-a="ctr" data-t="${t}"`)).join('')}</div></div>
<div class="col"><label class="lbl" for="tt">Trial task (optional)</label><textarea id="tt" class="fld" data-k="C.trialTask" maxlength="300" placeholder="A small independent task">${esc(C.trialTask)}</textarea></div><div class="col"><label class="lbl" for="td">Trial deadline (optional)</label><input id="td" type="date" min="${todayStr()}" class="fld" data-k="C.trialDue" value="${esc(C.trialDue)}"></div>
<div class="row" style="justify-content:space-between"><span class="lbl">Beginners welcome</span>${chip(C.novice?'Yes':'No',C.novice,'data-a="cno"')}</div>
<div class="row" style="justify-content:space-between"><span class="lbl">People needed</span><div class="row">${chip('−',0,'data-a="cn" data-d="-1"')}<b>${C.n}</b>${chip('+',0,'data-a="cn" data-d="1"')}</div></div>
<div class="mut">Your Telegram (from Profile) opens to a candidate after you accept them.</div><button class="btn" data-a="pub">Publish</button></div></div>`;

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

V.mine=()=>{
    const M=S.projects.filter(p=>p.authorId==='me'), p=M.find(x=>x.id===S.op)||M[0];
    if(p) S.op=p.id;
    const left=`<div class="side col" style="gap:12px"><button class="btn" data-a="go" data-v="create">+ Create project</button>${M.length?M.map(x=>`<article class="card${p&&x.id===p.id?' sel':''}" data-a="op" data-id="${x.id}" style="${p&&x.id===p.id?'border-color:var(--lav2); background:var(--lav);':''}"><div class="top"><h3 style="${p&&x.id===p.id?'color:var(--lav2);':''}">${esc(x.title)}</h3><span class="chip ${x.status==='open'?'on':''}">${x.status==='open'?'Open':'Closed'}</span></div><div class="mut">${x.offers.length} applications · ${x.offers.filter(o=>o.st==='new').length} new</div></article>`).join(''):'<div class="card mut">No projects yet. Create one and applications will appear here.</div>'}</div>`;
    if(!p) return `<div class="wrap">${left}</div>`;
    const T=[['new','New'],['trial','On trial'],['team','Accepted'],['reserve','Rejected']], L=p.offers.filter(o=>o.st===S.tab);
    return `<div class="wrap">${left}<div class="main col" style="gap:16px"><div class="top"><h1>${esc(p.title)}</h1><button class="ghost" data-a="${p.status==='open'?'close':'reopen'}">${p.status==='open'?'Close project':'Reopen project'}</button></div>
<div class="card"><div class="row">${skl(p)}</div><div class="col"><label class="lbl" for="tt">Trial task (optional)</label><textarea id="tt" class="fld" data-k="T.trialTask" maxlength="300" placeholder="A small independent task for candidates on trial">${esc(p.trialTask||'')}</textarea></div><div class="col"><label class="lbl" for="td">Trial deadline (optional)</label><input id="td" type="date" class="fld" data-k="T.trialDue" value="${esc(p.trialDue||'')}"></div></div>
<div class="row">${T.map(([k,t])=>chip(`${t} ${p.offers.filter(o=>o.st===k).length}`,S.tab===k,`data-a="tab" data-t="${k}"`)).join('')}</div>
${L.length?L.map(o=>oc(o,p)).join(''):'<div class="card mut">Nothing here yet.</div>'}</div></div>`;
};

V.manage=V.mine;
V.apps=()=>{
    const L=[];
    S.projects.forEach(p=>p.offers.filter(o=>o.cid==='me').forEach(o=>L.push([p,o])));
    return `<div class="wrap"><div class="main col" style="gap:16px"><h1>My applications</h1>${L.length?L.map(([p,o])=>`<div class="card"><div class="top"><h3>${esc(p.title)}</h3><span class="chip ${o.st==='team'||o.st==='trial'?'on':''}">${STT[o.st]}</span></div><div class="mut">${p.type} · ${esc(p.author)}${p.status==='closed'?' · Project closed':''}</div><div class="row"><span class="chip req">${esc(o.skill)} · ${LV[o.level]}</span></div>${o.st==='team'?`<div class="mut">Author's Telegram: <b>${esc(p.tg||'not provided')}</b></div>`:'<div class="mut">The author\'s contact opens once you are accepted.</div>'}${o.st==='trial'&&p.trialTask?`<div class="mut">Trial task: ${esc(p.trialTask)}${p.trialDue?' · deadline '+esc(p.trialDue):''}</div>`:''}<div class="row"><button class="ghost" data-a="open" data-id="${p.id}">View project</button>${o.st==='new'||o.st==='trial'?`<button class="ghost" data-a="wd" data-o="${o.id}">Withdraw</button>`:''}</div></div>`).join(''):'<div class="card">You have not applied yet.<button class="btn" data-a="go" data-v="find">Find projects</button></div>'}</div></div>`;
};

V.profile=()=>{
    const m=S.me, sel=m.skills.map(x=>x.s), list=(cats().find(c=>c.name===PCAT)||{skills:[]}).skills.filter(s=>!sel.includes(s));
    return `<div class="wrap"><div class="main card"><h1>Profile</h1><div class="mut">${esc(m.email)} · ${esc(m.uni)}</div>
<div class="col"><label class="lbl" for="pn">First name</label><input id="pn" class="fld" data-k="M.name" maxlength="60" autocomplete="given-name" placeholder="John" value="${esc(m.name)}"></div>
<div class="col"><label class="lbl" for="pln">Last name</label><input id="pln" class="fld" data-k="M.last" maxlength="60" autocomplete="family-name" placeholder="Doe" value="${esc(m.last||'')}"></div>
<div class="col"><label class="lbl" for="pgs">Group</label><div class="grp"><select id="pgs" class="fld" data-k="M.prog" aria-label="Programme"><option value=""${m.prog?'':' selected'} disabled hidden>Select program</option>${progOpts(m.prog)}</select><input id="pgn" class="fld" data-k="M.num" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" placeholder="e.g. 2625" aria-label="Group number" value="${esc(m.num||'')}"></div><span class="mut">Shown to others as ${esc(grp(m.prog,m.num)||'SE-2625')}. Both parts are needed to save the group.</span></div>
<div class="col"><label class="lbl" for="pt">Telegram</label><input id="pt" class="fld" data-k="M.tg" maxlength="33" placeholder="@username" value="${esc(m.tg)}"><span class="mut">Shown to an author or candidate only after acceptance.</span></div>
<div class="col"><div class="lbl">Availability</div><div class="row">${AV.map(a=>chip(a,m.avail===a,`data-a="pav" data-w="${a}"`)).join('')}</div></div>
<div class="col"><div class="lbl">My skills <span class="mut">(${sel.length}/${MAXMS})</span></div><div class="row">${m.skills.length?m.skills.map(x=>xchip(x.s,'on',null,'data-a="psk"',x.s)).join(''):'<span class="mut">No skills added yet. Choose a category below.</span>'}</div></div>
<div class="col"><label class="lbl" for="pcat">Add a skill</label><select id="pcat" class="fld" data-c="pcat"><option value=""${PCAT?'':' selected'} disabled hidden>Select a category…</option>${cats().map(c=>`<option value="${esc(c.name)}"${c.name===PCAT?' selected':''}>${esc(c.name)}</option>`).join('')}</select><div class="row">${list.map(s=>chip('+ '+s,0,`data-a="psk" data-s="${esc(s)}"`)).join('')}</div></div>
${m.skills.map((x,i)=>`<div class="card"><div class="top"><b>${esc(x.s)}</b><button class="ghost" data-a="prm" data-i="${i}">Remove</button></div><div class="row">${LV.map((l,j)=>chip(l,x.level===j,`data-a="plv" data-i="${i}" data-j="${j}"`)).join('')}</div><input class="fld" data-pl="${i}" maxlength="300" placeholder="Link to your work (GitHub, Figma…)" aria-label="Link for ${esc(x.s)}" value="${esc(x.link)}"></div>`).join('')}
<button class="ghost" style="align-self:flex-start; margin-top:16px; border-color:#FCA5A5; color:#B91C1C;" data-a="out">Sign Out</button></div></div>`;
};

const gated=['find','detail','mine','manage','apps','profile','create'];
function render(top){
    if(gated.includes(S.view)&&!S.me) { S.view='landing'; A.openAuth(); }
    const a=$('#app');
    a.innerHTML=head()+V[S.view]();
    if(top){ scrollTo(0,0); }
}

const go=(v,top=true)=>{
    S.view=v; render(top);
    if(S.me&&['find','mine','apps'].includes(v)){
        load().then(()=>{if(S.view===v)render(false)}).catch(()=>{});
    }
};

const need=()=>{if(S.me)return false; toast('Sign in with your university email first'); A.openAuth(); return true;};

const A={
    go:d=>{if(d.id)S.op=d.id; go(d.v)},
    how:()=>{const e=$('#how'); e&&e.scrollIntoView({behavior:'smooth'})},
    
    openAuth:()=>{ $('#authModal').classList.add('visible'); A.setAuth({m:'login'}); setTimeout(()=>$('#authEmail').focus(),50); },
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
        const r=await sb.auth.resend({type:'signup',email:e});
        toast(r.error?r.error.message:'We sent a new code');
    },
    submitAuth:async()=>{
        const btn=$('#authBtn'), mode=btn.dataset.mode;
        const e=cl($('#authEmail').value,80).toLowerCase(), n=cl($('#authName').value,60), pw=$('#authPassword').value;
        btn.disabled=true;
        try{
            if(mode === 'forgot') {
                if(!EM.test(e)) return toast('Enter your university email');
                if(!tok('rst')) return;
                const r=await sb.auth.resetPasswordForEmail(e);
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
                const r=await sb.auth.signUp({email:e,password:pw,options:{data:{name:n}}});
                if(r.error) return toast(/database error|^\s*\{\s*\}\s*$/i.test(r.error.message)||!e.endsWith('@astanait.edu.kz')?'Registration failed. Only @astanait.edu.kz addresses are allowed.':r.error.message);
                if(!r.data.session) return A.setAuth({m:'confirm'});
                await bootUser(r.data.user);
            } else {
                if(!EM.test(e)||!pw) return toast('Enter your university email and password');
                const r=await sb.auth.signInWithPassword({email:e,password:pw});
                if(r.error&&r.error.code==='email_not_confirmed'){
                    A.setAuth({m:'confirm'});
                    if(tok('cf')) await sb.auth.resend({type:'signup',email:e});
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
    
    out:async()=>{await sb.auth.signOut(); S.me=null; S.projects=[]; toast('Signed out'); go('landing')},
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
        if(!tok('pub')) return;
        if(C.trialDue&&!okDate(C.trialDue)) return toast('Trial deadline must be a real date, today or later');
        const due=C.trialDue?C.trialDue:null;
        let r=await sb.from('projects').insert({author_id:S.me.uid,title:cl(C.title,80),project_type:TYDB[C.type],description:cl(C.desc,1000)||'No description yet.',urgent:C.urgent,beginner_friendly:C.novice,spots_needed:C.n,trial_format:C.trial,trial_task:cl(C.trialTask,300)||null,trial_due:due}).select('id').single();
        if(r.error) return dberr(r.error);
        const id=r.data.id, rows=req.map(k=>({project_id:id,skill_id:SKID[k],is_required:true})).concat(opt.map(k=>({project_id:id,skill_id:SKID[k],is_required:false})));
        const r2=await sb.from('project_skills').insert(rows);
        if(r2.error){await sb.from('projects').delete().eq('id',id); return dberr(r2.error)}
        S.op=id; S.tab='new'; C=nC(); await load(); toast('Project published'); go('mine');
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
    if(t.dataset.pl!==undefined&&S.me){ S.me.skills[+t.dataset.pl].link=cl(t.value,300); queueLink(+t.dataset.pl); }
    if(t.id==='q'){ F.q=t.value; const g=$('#grid'); if(g) g.innerHTML=grid(); }
});

document.addEventListener('keydown',e=>{
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

async function load(){
    if(!S.me) return;
    const uid=S.me.uid;
    const[pr,ap,ct]=await Promise.all([
        sb.from('projects').select('id,author_id,title,project_type,description,urgent,beginner_friendly,spots_needed,status,trial_format,trial_task,trial_due,created_at,author:profiles!projects_author_id_fkey(display_name,program_code,group_number),project_skills(is_required,skills(name))').order('created_at',{ascending:false}),
        sb.from('applications').select('id,project_id,candidate_id,note,status,created_at,cand:profiles!applications_candidate_id_fkey(display_name,last_name,program_code,group_number,availability,user_skills(level,link_url,skills(name)))').order('created_at',{ascending:false}),
        sb.from('contacts').select('user_id,telegram')
    ]);
    const er=pr.error||ap.error||ct.error;
    if(er) return dberr(er);
    
    const tg={}; ct.data.forEach(c=>tg[c.user_id]=c.telegram);
    
    S.projects=pr.data.map(p=>{
        const req=[], opt=[];
        (p.project_skills||[]).forEach(x=>(x.is_required?req:opt).push(x.skills.name));
        const all=req.concat(opt);
        const offers=ap.data.filter(a=>a.project_id===p.id).map(a=>{
            const c=a.cand||{}, sk=(c.user_skills||[]).map(x=>({s:x.skills.name,level:Math.max(0,LVDB.indexOf(x.level)),link:x.link_url||''})), mk=sk.find(x=>all.includes(x.s))||sk[0]||{s:'',level:0,link:''};
            return{id:a.id,cid:a.candidate_id===uid?'me':a.candidate_id,name:((c.display_name||'')+' '+(c.last_name||'')).trim(),group:grp(c.program_code,c.group_number),skills:sk,skill:mk.s,level:mk.level,link:mk.link,did:a.note||'',when:AVR[c.availability]||'',tg:tg[a.candidate_id]||'',st:STR[a.status]||'new'};
        });
        return{id:p.id,title:p.title,type:TYR[p.project_type],authorId:p.author_id===uid?'me':p.author_id,author:p.author?who(p.author.display_name,p.author.program_code,p.author.group_number):'',tg:tg[p.author_id]||'',desc:p.description||'',req,opt,urgent:p.urgent,novice:p.beginner_friendly,trial:p.trial_format||'Quick chat',n:p.spots_needed,status:p.status,trialTask:p.trial_task||'',trialDue:p.trial_due||'',offers};
    });
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
addEventListener('pointermove',e=>{mv.x=e.clientX/innerWidth-.5;mv.y=e.clientY/innerHeight-.5;if(!raf)raf=requestAnimationFrame(tick)});
function pop(x,y){
    const c=['--lav2','--mint','--but','--pea'];
    for(let i=0;i<18;i++){
        const e=document.createElement('i'),a=Math.random()*6.28,d=60+Math.random()*80;
        e.style.cssText=`position:fixed;left:${x}px;top:${y}px;width:8px;height:8px;border-radius:${i%2?'50%':'2px'};background:var(${c[i%4]});pointer-events:none;z-index:9`;
        document.body.appendChild(e);
        e.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d+40}px) scale(.3)`,opacity:0}],{duration:700+Math.random()*300,easing:'cubic-bezier(.2,.8,.3,1)'}).onfinish=()=>e.remove()
    }
}
let wi=0;
if(!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(()=>{
    const e=$('#rw');
    if(!e)return;
    e.style.opacity=0;
    e.style.transform='translateY(8px)';
    setTimeout(()=>{wi=(wi+1)%words.length;e.textContent=words[wi];e.style.opacity=1;e.style.transform='none'},260);
},2400);

init();