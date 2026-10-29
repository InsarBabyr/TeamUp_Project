// Desktop page: header and views. Shared logic lives in core.js, loaded first.

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
                ${tabs}${bell()}${sndBtn()}
                ${!m ? (S.view==='landing'?'<button class="ghost sm" data-a="how" style="border:none; margin-right:8px;">How it works</button>':'') + '<button class="btn sm" data-a="openAuth">Sign In / Register</button>' : ''}
            </nav>
        </div>
    </header>`;
};

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
${guide()}
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
                        ${chip('Fits me', F.fit, 'data-a="ffit"')}
                        ${chip('Hide applied', F.hide, 'data-a="fhide"')}
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
<div class="card"><div class="lbl">Skills needed</div><div class="row">${skl(p)}</div><div class="mut">Beginners welcome: ${p.novice?'yes':'no'} · People needed: ${p.n}</div></div>${mats(p)}
<div class="card" style="background:var(--lav); border-color:var(--lav2);"><div class="lbl" style="color:var(--lav2)">How the trial works</div><div style="font-size:14px;line-height:1.5; color:var(--ink)">Format: ${esc(p.trial)}. You take a small independent piece of the project and the author decides who stays. Contacts open after acceptance.${p.trialTask?` Trial task: ${esc(p.trialTask)}${p.trialDue?', deadline '+esc(p.trialDue):''}.`:''}</div></div></div>${form}</div>`;
};

V.create=()=>`<div class="wrap"><div class="main card"><h1>${C.edit?'Edit project':'Post a project'}</h1>
<div class="col"><label class="lbl" for="ct">Title</label><input id="ct" class="fld" data-k="C.title" maxlength="80" placeholder="What are we building" value="${esc(C.title)}"></div>
<div class="col"><label class="lbl" for="cd">Description</label><textarea id="cd" class="fld" data-k="C.desc" maxlength="1000" placeholder="What needs to be done and by when">${esc(C.desc)}</textarea></div>
<div class="col"><div class="lbl">Type</div><div class="row">${TY.map(t=>chip(t,C.type===t,`data-a="cty" data-t="${t}"`)).join('')}</div></div>
<div class="col"><div class="lbl">Skills <span class="mut">(${Object.keys(C.sk).length}/${MAXPS})</span></div><div class="mut">Pick a skill from the list. Tap an added skill to switch between <b>Required</b> and <b>Nice to have</b>.</div>${skSel('csel','Add a skill…','csel',Object.keys(C.sk))}<div class="row">${Object.keys(C.sk).length?Object.keys(C.sk).map(s=>xchip(s+' ('+(C.sk[s]==='req'?'Required':'Nice to have')+')',C.sk[s],'data-a="csk"','data-a="cskx"',s)).join(''):'<span class="mut">No skills added yet.</span>'}</div></div>
${matForm()}</div>
<div class="side card w380"><h3>Terms</h3>
<div class="col"><div class="lbl">Urgency</div><div class="row">${chip('Not urgent',!C.urgent,'data-a="cu" data-u="0"')}${chip('Urgent',C.urgent,'data-a="cu" data-u="1"')}</div></div>
<div class="col"><div class="lbl">Trial format</div><div class="row">${TR.map(t=>chip(t,C.trial===t,`data-a="ctr" data-t="${t}"`)).join('')}</div></div>
<div class="col"><label class="lbl" for="tt">Trial task (optional)</label><textarea id="tt" class="fld" data-k="C.trialTask" maxlength="300" placeholder="A small independent task">${esc(C.trialTask)}</textarea></div><div class="col"><label class="lbl" for="td">Trial deadline (optional)</label><input id="td" type="date" min="${todayStr()}" class="fld" data-k="C.trialDue" value="${esc(C.trialDue)}"></div>
<div class="row" style="justify-content:space-between"><span class="lbl">Beginners welcome</span>${chip(C.novice?'Yes':'No',C.novice,'data-a="cno"')}</div>
<div class="row" style="justify-content:space-between"><span class="lbl">People needed</span><div class="row">${chip('−',0,'data-a="cn" data-d="-1"')}<b>${C.n}</b>${chip('+',0,'data-a="cn" data-d="1"')}</div></div>
<div class="mut">Your Telegram (from Profile) opens to a candidate after you accept them.</div><button class="btn" data-a="pub">${C.edit?'Save changes':'Publish'}</button>${C.edit?'<button class="ghost" data-a="cancelEdit">Cancel</button>':''}</div></div>`;

V.mine=()=>{
    const M=S.projects.filter(p=>p.authorId==='me'), p=M.find(x=>x.id===S.op)||M[0];
    if(p) S.op=p.id;
    const left=`<div class="side col" style="gap:12px"><button class="btn" data-a="go" data-v="create">+ Create project</button>${M.length?M.map(x=>`<article class="card${p&&x.id===p.id?' sel':''}" data-a="op" data-id="${x.id}" style="${p&&x.id===p.id?'border-color:var(--lav2); background:var(--lav);':''}"><div class="top"><h3 style="${p&&x.id===p.id?'color:var(--lav2);':''}">${esc(x.title)}</h3><span class="chip ${x.status==='open'?'on':''}">${x.status==='open'?'Open':x.status==='assembled'?'Assembled':'Closed'}</span></div><div class="mut">${x.offers.length} applications · ${x.offers.filter(o=>o.st==='new').length} new</div></article>`).join(''):'<div class="card mut">No projects yet. Create one and applications will appear here.</div>'}</div>`;
    if(!p) return `<div class="wrap">${left}</div>`;
    const T=[['new','New'],['trial','On trial'],['team','Accepted'],['reserve','Rejected']], L=p.offers.filter(o=>o.st===S.tab);
    return `<div class="wrap">${left}<div class="main col" style="gap:16px"><div class="top"><h1>${esc(p.title)}</h1><span class="row acts"><button class="ghost" data-a="edit" data-id="${p.id}">Edit project</button>${p.status==='open'?'<button class="ghost" data-a="asm">Team assembled</button><button class="ghost" data-a="close">Close project</button>':`<span class="chip on">${pst(p.status)}</span><button class="ghost" data-a="reopen">Reopen project</button>`}</span></div>
<div class="card"><div class="row">${skl(p)}</div><div class="col"><label class="lbl" for="tt">Trial task (optional)</label><textarea id="tt" class="fld" data-k="T.trialTask" maxlength="300" placeholder="A small independent task for candidates on trial">${esc(p.trialTask||'')}</textarea></div><div class="col"><label class="lbl" for="td">Trial deadline (optional)</label><input id="td" type="date" class="fld" data-k="T.trialDue" value="${esc(p.trialDue||'')}"></div></div>
<div class="row">${T.map(([k,t])=>chip(`${t} ${p.offers.filter(o=>o.st===k).length}`,S.tab===k,`data-a="tab" data-t="${k}"`)).join('')}</div>
${L.length?L.map(o=>oc(o,p)).join(''):'<div class="card mut">Nothing here yet.</div>'}</div></div>`;
};

V.manage=V.mine;

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

function render(top){
    if(gated.includes(S.view)&&!S.me) { S.view='landing'; A.openAuth(); }
    const a=$('#app');
    a.innerHTML=head()+V[S.view]();
    if(top){ scrollTo(0,0); }
}

init();
