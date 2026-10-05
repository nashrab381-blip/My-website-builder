const state={files:{
"index.html":`<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>KARAN Project</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<main id="home" class="card">
<h1>KARAN Code Runner</h1>
<p>Try the preview modes: desktop, laptop, tablet and mobile.</p>
<a href="about.html">Open About Page</a>
<button onclick="hello()">Test JavaScript</button>
</main>
<script src="script.js"></script>
</body>
</html>`,
"about.html":`<!doctype html>
<html><head><title>About</title><link rel="stylesheet" href="style.css"></head>
<body><main class="card"><h1>About Page</h1><a href="index.html">Home</a></main></body></html>`,
"style.css":`body{margin:0;font-family:Arial;background:#eef3ff;color:#172033}.card{max-width:650px;margin:10vh auto;padding:35px;background:white;border-radius:20px;box-shadow:0 15px 50px #0002}h1{color:#315fe9}a,button{display:inline-block;margin:8px;padding:11px 16px;border-radius:8px;background:#315fe9;color:white;text-decoration:none;border:0}@media(max-width:600px){.card{margin:20px;padding:22px}h1{font-size:26px}}`,
"script.js":`function hello(){console.log("JavaScript is working");alert("JavaScript is working!");}`
},folders:[],active:"index.html",open:["index.html","about.html","style.css","script.js"],settings:{font:15,tab:4,wrap:false,auto:true}};
const $=id=>document.getElementById(id),editor=$("editor"),numbers=$("numbers"),tree=$("tree"),tabs=$("tabs"),preview=$("preview"),out=$("inspectOutput"),consoleOut=$("consoleOutput");
let dialogMode="file",zoom=1,currentInspect="overview";

function icon(n){return({html:"🌐",css:"🎨",js:"🟨",json:"🟧",py:"🐍",java:"☕",cpp:"⚙️",c:"⚙️",ts:"🔷",md:"📝"})[n.split(".").pop().toLowerCase()]||"📄"}
function esc(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function filePath(n){return n.replace(/^\/+/,"").replace(/\\/g,"/")}
function renderTree(){
  const root=document.createElement("div");
  const folderSet=new Set([""]);
  Object.keys(state.files).forEach(n=>{
    const parts=filePath(n).split("/");
    let path="";
    for(let i=0;i<parts.length-1;i++){path=path?path+"/"+parts[i]:parts[i];folderSet.add(path)}
  });
  state.folders.forEach(f=>folderSet.add(filePath(f)));
  const folders=[...folderSet].filter(Boolean).sort();
  const makeFolder=(folder)=>{
    const wrap=document.createElement("div");wrap.className="tree-folder";
    const row=document.createElement("div");row.className="folder-row";
    row.innerHTML=`<button class="folder-toggle">▾</button><span>📁</span><span class="folder-name">${esc(folder.split("/").pop())}</span>`;
    const children=document.createElement("div");children.className="folder-children";
    row.onclick=()=>{children.style.display=children.style.display==="none"?"block":"none";row.querySelector(".folder-toggle").textContent=children.style.display==="none"?"▸":"▾"};
    wrap.append(row,children);
    return {wrap,children};
  };
  const map={};
  folders.forEach(f=>map[f]=makeFolder(f));
  Object.keys(state.files).sort().forEach(n=>{
    const d=document.createElement("div");d.className="file-item "+(n===state.active?"active":"");
    const parts=filePath(n).split("/");const parent=parts.slice(0,-1).join("/");
    d.innerHTML=`<span>${icon(n)}</span><span class="name">${esc(parts.at(-1))}</span>`;
    d.title=n;
    d.onclick=()=>openFile(n);
    d.oncontextmenu=e=>{e.preventDefault();delFile(n)};
    if(parent && map[parent]) map[parent].children.appendChild(d);
    else {d.style.paddingLeft="8px";root.appendChild(d)}
  });
  folders.forEach(f=>{
    const parent=f.split("/").slice(0,-1).join("/");
    if(parent && map[parent]) map[parent].children.appendChild(map[f].wrap);
    else root.appendChild(map[f].wrap);
  });
  tree.innerHTML="";tree.appendChild(root);
}
function renderTabs(){tabs.innerHTML=state.open.filter(n=>state.files[n]!=null).map(n=>`<div class="tab ${n===state.active?"active":""}" data-file="${esc(n)}"><span>${icon(n)} ${esc(n)}</span><span class="x">×</span></div>`).join("");tabs.querySelectorAll(".tab").forEach(t=>{t.onclick=()=>openFile(t.dataset.file);t.querySelector(".x").onclick=e=>{e.stopPropagation();closeTab(t.dataset.file)}})}
function render(){renderTree();renderTabs();if(state.active)editor.value=state.files[state.active]||"";$("language").textContent=(state.active||"").split(".").pop().toUpperCase();lines();status()}
function openFile(n){if(!(n in state.files))return;state.active=n;if(!state.open.includes(n))state.open.push(n);render();editor.focus()}
function closeTab(n){if(state.open.length<2)return;state.open=state.open.filter(x=>x!==n);if(state.active===n)state.active=state.open[state.open.length-1];render()}
function delFile(n){if(!confirm("Delete "+n+"?"))return;delete state.files[n];state.open=state.open.filter(x=>x!==n);state.active=state.open[0]||Object.keys(state.files)[0]||null;render();save();run()}
function lines(){numbers.innerHTML=Array.from({length:Math.max(1,editor.value.split("\n").length)},(_,i)=>i+1).join("<br>");numbers.scrollTop=editor.scrollTop}
function status(){let p=editor.selectionStart,b=editor.value.slice(0,p),l=b.split("\n").length,c=p-b.lastIndexOf("\n");$("statusFile").textContent=state.active||"No file";$("statusInfo").textContent=`Ln ${l}, Col ${c} · ${editor.value.length.toLocaleString()} chars`}
function sync(){if(state.active)state.files[state.active]=editor.value;save();lines();status()}
editor.addEventListener("input",()=>{sync();if(state.settings.auto&&state.active==="index.html"){clearTimeout(window.rt);window.rt=setTimeout(run,250)}});["click","keyup","select"].forEach(e=>editor.addEventListener(e,status));editor.addEventListener("scroll",()=>numbers.scrollTop=editor.scrollTop);

function buildPreview(){
 let h=state.files["index.html"]||"",c=state.files["style.css"]||"",j=state.files["script.js"]||"";
 if(!/<meta[^>]+name=["']viewport/i.test(h))h=h.replace(/<head[^>]*>/i,m=>m+'<meta name="viewport" content="width=device-width,initial-scale=1">');
 if(c&&!/<link[^>]+style\.css/i.test(h))h=h.replace(/<\/head>/i,`<style>${c}</style></head>`);
 if(j&&!/<script[^>]+script\.js/i.test(h))h=h.replace(/<\/body>/i,`<script>${j}<\/script></body>`);
 return h;
}
function run(){consoleOut.textContent="Loading preview…";preview.srcdoc=buildPreview();preview.onload=()=>consoleOut.textContent="Preview ready."}
$("run").onclick=run;$("refresh").onclick=run;$("clearConsole").onclick=()=>consoleOut.textContent="";
$("popout").onclick=()=>{let w=window.open();if(w){w.document.write(buildPreview());w.document.close()}};
function setZoom(v){zoom=Math.max(.7,Math.min(1.3,v));$("zoomValue").textContent=Math.round(zoom*100)+"%";$("deviceFrame").style.transform=`scale(${zoom})`;$("deviceFrame").style.transformOrigin="center center"}
$("zoomIn").onclick=()=>setZoom(zoom+.1);$("zoomOut").onclick=()=>setZoom(zoom-.1);
document.querySelectorAll(".device").forEach(b=>b.onclick=()=>{document.querySelectorAll(".device").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("deviceFrame").className="device-frame "+b.dataset.device;setZoom(1)});

function showPanel(name){document.querySelectorAll(".navbtn").forEach(x=>x.classList.toggle("active",x.dataset.panel===name));if(window.innerWidth<=900){document.querySelectorAll(".panel-files,.panel-editor,.panel-preview,.panel-inspector").forEach(x=>x.classList.remove("mobile-visible"));const map={files:".panel-files",editor:".panel-editor",preview:".panel-preview",inspector:".panel-inspector"};document.querySelector(map[name]).classList.add("mobile-visible")}}
document.querySelectorAll(".navbtn").forEach(b=>b.onclick=()=>showPanel(b.dataset.panel));

function openName(mode){dialogMode=mode;$("dialogTitle").textContent=mode==="file"?"New File":"New Folder";$("dialogHint").textContent=mode==="file"?"You can use a path such as pages/about.html to place a file in a folder.":"Create a folder path such as pages or components/ui.";$("nameInput").value="";$("nameInput").placeholder=mode==="file"?"pages/about.html":"pages";$("nameDialog").showModal();setTimeout(()=>$("nameInput").focus(),20)}
$("addFile").onclick=()=>openName("file");$("addFolder").onclick=()=>openName("folder");
function quickCreate(name,content){
 if(state.files[name]){openFile(name);return}
 state.files[name]=content; if(!state.open.includes(name))state.open.push(name);state.active=name;render();save();run();
}
$("quickHtml").onclick=()=>quickCreate(state.files["home.html"]?"home-2.html":"home.html",starter(state.files["home.html"]?"home-2.html":"home.html"));
$("quickCss").onclick=()=>quickCreate(state.files["theme.css"]?"theme-2.css":"theme.css",starter(state.files["theme.css"]?"theme-2.css":"theme.css"));
$("quickJs").onclick=()=>quickCreate(state.files["app.js"]?"app-2.js":"app.js",starter(state.files["app.js"]?"app-2.js":"app.js"));
$("cancelDialog").onclick=()=>$("nameDialog").close();
$("nameForm").onsubmit=e=>{
 e.preventDefault();
 let n=filePath($("nameInput").value.trim()).replace(/^\/+|\/+$/g,"");
 if(!n)return;
 if(dialogMode==="folder"){
   if(state.folders.includes(n)) return alert("Folder already exists.");
   state.folders.push(n); $("nameDialog").close(); render(); save(); return;
 }
 if(!/^[^/]+\.[A-Za-z0-9]+$/.test(n)) return alert("For a file use a name like home.html, style.css or app.js");
 if(state.files[n]) return alert("File already exists.");
 state.files[n]=starter(n); state.open.push(n); state.active=n;
 $("nameDialog").close(); render(); save(); run();
};
function starter(n){let e=n.split(".").pop().toLowerCase();if(e==="html")return"<!doctype html>\\n<html>\\n<head>\\n<title>New Page</title>\\n</head>\\n<body>\\n<h1>New Page</h1>\\n</body>\\n</html>\\n";if(e==="css")return"/* CSS */\\n";if(e==="js")return'console.log("Hello");\\n';if(e==="py")return'print("Hello from Python")\\n';return""}

$("newProject").onclick=()=>{if(confirm("Create a new project?")){state.files={"index.html":"<!doctype html>\\n<html>\\n<head><title>New Project</title></head>\\n<body><h1>New Project</h1></body>\\n</html>"};state.folders=[];state.open=["index.html"];state.active="index.html";render();save();run()}};
$("saveProject").onclick=()=>{sync();alert("Project saved on this device.")};
function save(){try{localStorage.setItem("karan-advanced-runner",JSON.stringify(state))}catch(e){}}
function load(){try{let x=JSON.parse(localStorage.getItem("karan-advanced-runner"));if(x&&x.files)Object.assign(state,x)}catch(e){}}

$("searchBtn").onclick=()=>{$("findbar").classList.toggle("hidden");$("findInput").focus()};$("toggleFind").onclick=()=>$("findbar").classList.toggle("hidden");$("closeFind").onclick=()=>$("findbar").classList.add("hidden");
$("findNext").onclick=()=>findNext();$("replaceOne").onclick=()=>replaceOne();$("replaceAll").onclick=()=>replaceAll();
function findNext(){let q=$("findInput").value;if(!q)return;let i=editor.value.indexOf(q,editor.selectionEnd);if(i<0)i=editor.value.indexOf(q);if(i>=0){editor.focus();editor.setSelectionRange(i,i+q.length)}}
function replaceOne(){let q=$("findInput").value,r=$("replaceInput").value,p=editor.selectionStart;if(q&&editor.value.slice(p,p+q.length)===q){editor.setRangeText(r,p,p+q.length,"end");sync()}else findNext()}
function replaceAll(){let q=$("findInput").value,r=$("replaceInput").value;if(q){editor.value=editor.value.split(q).join(r);sync()}}

$("settingsBtn").onclick=()=>{$("fontSize").value=state.settings.font;$("tabSize").value=state.settings.tab;$("wordWrap").checked=state.settings.wrap;$("autoRun").checked=state.settings.auto;$("settingsDialog").showModal()};
$("settingsForm").onsubmit=()=>{state.settings.font=+$("fontSize").value;state.settings.tab=+$("tabSize").value;state.settings.wrap=$("wordWrap").checked;state.settings.auto=$("autoRun").checked;apply();save()};
function apply(){editor.style.fontSize=state.settings.font+"px";editor.style.tabSize=state.settings.tab;editor.classList.toggle("wrap",state.settings.wrap)}
editor.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();run()}else if((e.ctrlKey||e.metaKey)&&e.key==="s"){e.preventDefault();sync()}else if((e.ctrlKey||e.metaKey)&&e.key==="f"){e.preventDefault();$("findbar").classList.remove("hidden");$("findInput").focus()}else if(e.key==="Tab"){e.preventDefault();let p=editor.selectionStart;editor.setRangeText(" ".repeat(state.settings.tab),p,editor.selectionEnd,"end");sync()}});

function allCode(){return Object.entries(state.files).map(([n,c])=>({name:n,code:c}));}
function analyze(){
 const fs=allCode(), names=new Set(fs.map(x=>filePath(x.name))), links=[], colors=new Set(), ids=[], classes=[], funcs=[], imports=[], issues=[], scripts=[], styles=[];
 fs.forEach(({name,code})=>{
  const rel=code.match(/(?:href|src|action)=["']([^"'#]+)["']/gi)||[];
  rel.forEach(x=>{const m=x.match(/(?:href|src|action)=["']([^"'#]+)["']/i);if(m&&/\.(html?|css|js|json|png|jpe?g|svg|webp|gif)$/i.test(m[1]))links.push({from:name,to:m[1],exists:names.has(filePath(m[1]))})});
  [...code.matchAll(/#(?:[0-9a-f]{3,8})\b/gi),...code.matchAll(/\b(?:rgb|rgba|hsl|hsla)\([^)]*\)/gi)].forEach(m=>colors.add(m[0]));
  [...code.matchAll(/\bid=["']([^"']+)["']/gi)].forEach(m=>ids.push({name:m[1],file:name}));
  [...code.matchAll(/\bclass=["']([^"']+)["']/gi)].forEach(m=>m[1].split(/\s+/).forEach(v=>classes.push({name:v,file:name})));
  [...code.matchAll(/(?:function\s+|(?:const|let|var)\s+)([A-Za-z_$][\w$]*)\s*(?:=|\()/g)].forEach(m=>funcs.push({name:m[1],file:name}));
  [...code.matchAll(/(?:import\s+.*?\s+from\s+|require\()\s*["']([^"']+)["']/g)].forEach(m=>imports.push({from:name,to:m[1]}));
  if(/<script[^>]+src=["']([^"']+)/i.test(code))scripts.push(name);
  if(/<link[^>]+stylesheet/i.test(code)||/\.css\b/i.test(name))styles.push(name);
  const open=(code.match(/<([a-z][\w-]*)\b/gi)||[]).length,close=(code.match(/<\/([a-z][\w-]*)\s*>/gi)||[]).length;
  if(/\.html?$/i.test(name)&&Math.abs(open-close)>3)issues.push({level:"warn",text:`Possible unbalanced HTML tags in ${name}. Open: ${open}, close: ${close}.`});
  if(/\bTODO\b|\bFIXME\b/i.test(code))issues.push({level:"info",text:`TODO/FIXME marker found in ${name}.`});
  if(/console\.log\s*\(/.test(code)&&/\.js$/i.test(name))issues.push({level:"info",text:`console.log detected in ${name}.`});
  if(/eval\s*\(/.test(code))issues.push({level:"warn",text:`eval() detected in ${name}; review security.`});
 });
 const idMap={};ids.forEach(x=>{idMap[x.name]=(idMap[x.name]||0)+1});Object.entries(idMap).filter(([,n])=>n>1).forEach(([n])=>issues.push({level:"warn",text:`Duplicate HTML id "${n}" detected.`}));
 links.filter(x=>!x.exists&&!/^https?:|^\/|^#|^data:/i.test(x.to)).forEach(x=>issues.push({level:"bad",text:`Broken local reference: ${x.from} → ${x.to}`}));
 state.analysis={fs,links,colors:[...colors],ids,classes,funcs,imports,issues,scripts,styles};
 renderInspect();
}

function renderInspect(){
 const a=state.analysis||{fs:allCode(),links:[],colors:[],ids:[],classes:[],funcs:[],imports:[],issues:[],scripts:[],styles:[]};
 let h="";
 if(currentInspect==="overview"){h=`<div class="metric-grid"><div class="metric"><b>${a.fs.length}</b><span>Files</span></div><div class="metric"><b>${a.links.length}</b><span>References</span></div><div class="metric"><b>${a.colors.length}</b><span>Colors</span></div><div class="metric"><b>${a.issues.length}</b><span>Issues</span></div><div class="metric"><b>${a.funcs.length}</b><span>Functions</span></div><div class="metric"><b>${a.ids.length}</b><span>HTML IDs</span></div></div><div class="inspect-card"><h4>Detected project</h4><p>${a.fs.map(x=>`<span class="pill">${esc(x.name)}</span>`).join("")}</p></div><div class="inspect-card"><h4>What can be detected</h4><p>File references, HTML navigation, CSS/JS dependencies, colors, IDs, classes, functions, imports, common warnings, TODO markers, console logs, eval(), and missing local files.</p></div>`}
 if(currentInspect==="files")h=a.fs.map(x=>`<div class="inspect-card"><h4>${icon(x.name)} ${esc(x.name)}</h4><p>${x.code.length.toLocaleString()} characters · ${(x.code.match(/\n/g)||[]).length+1} lines</p></div>`).join("");
 if(currentInspect==="links")h=a.links.length?a.links.map(x=>`<div class="inspect-card"><h4>🔗 ${esc(x.from)}</h4><p class="${x.exists?"ok":"bad"}">${x.exists?"✓":"✕"} <span class="code-ref">${esc(x.to)}</span> ${x.exists?"file found":"file not found"}</p></div>`).join(""):`<div class="inspect-card"><p>No file references detected.</p></div>`;
 if(currentInspect==="styles")h=`<div class="inspect-card"><h4>🎨 Detected Colors</h4><p>${a.colors.length?a.colors.map(c=>`<span class="pill">${esc(c)}</span>`).join(""):"No colors detected."}</p></div><div class="inspect-card"><h4>CSS / Classes</h4><p>${a.classes.length?a.classes.map(c=>`<span class="pill">.${esc(c.name)}</span>`).join(""):"No classes detected."}</p></div>`;
 if(currentInspect==="issues")h=a.issues.length?a.issues.map(x=>`<div class="inspect-card"><p class="${x.level==="bad"?"bad":x.level==="warn"?"warn":"ok"}">${x.level==="bad"?"✕":x.level==="warn"?"⚠":"ℹ"} ${esc(x.text)}</p></div>`).join(""):`<div class="inspect-card"><p class="ok">✓ No detected issues from the built-in checks.</p></div>`;
 out.innerHTML=h;
}
$("inspectAll").onclick=()=>analyze();$("inspectCurrent").onclick=()=>{analyze();showPanel("inspector")};
document.querySelectorAll(".inspect-tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".inspect-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentInspect=b.dataset.inspect;renderInspect()});
$("formatBtn").onclick=()=>{if(state.active&&/\.html?$/i.test(state.active)){let s=editor.value.replace(/>\s*</g,"><").replace(/</g,"\\n<").replace(/>/g,">\\n");editor.value=s.replace(/^\\s+|\\s+$/g,"");sync()}};
load();apply();render();analyze();run();

