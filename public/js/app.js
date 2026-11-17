/*
 * Curling-track — hlavní aplikace (bez frameworku a build kroku).
 *
 * Navigace v souboru (vyhledejte názvy sekcí):
 * 1) Konstanty / FORMATS / datové továrny / normalize
 * 2) Ukázka, herní logika, simulace kamenů a skóre
 * 3) Stav aplikace / Cloudflare D1 autosave / undo
 * 4) Vykreslování UI včetně statistiky a pravidel
 * 5) Delegované události / ovládání / start
 *
 * API: js/cloud.js. Ukládání zápasů: doSave(), flushSaves(), loadCloudGames().
 * Pravidla pro záložku Pravidla jsou v js/rules-data.js.
 */
(function(){
const POS=['Lead','Second','Third','Fourth'];
/* formáty hry: počet hráčů a náhradníků, kamenů v endu a platná pravidla */
const FORMATS={
  classic:{key:'classic',label:'Klasicky (4 hráči)',players:4,alts:2,roster:['Lead','Second','Third','Fourth'],pos:['Lead','Second','Third','Fourth'],stones:16,preset:0,ends:8,rule:'five',notick:true,
    note:'Tým tvoří 4 hráči a na soupisku k utkání lze zapsat až 2 náhradníky. Během zápasu může tým vystřídat jen jednou. Každý hráč hází 2 kameny. Platí pravidlo pěti kamenů (free guard zone) a no-tick.'},
  triples:{key:'triples',label:'Triples (3 hráči)',players:3,alts:2,nosub:true,roster:['Hráč 1','Hráč 2','Hráč 3'],pos:['Lead','Middle','Skip'],stones:12,preset:0,ends:6,rule:'five',notick:true,rotate:true,
    note:'Tým tvoří 3 hráči, každý hází 2 kameny (6 kamenů na tým v endu). Na soupisku lze zapsat až 2 náhradníky, střídat se ale smí jen mezi zápasy, ne během zápasu. Pozice Lead, Middle a Skip se střídají po každých dvou endech. Platí pravidlo pěti kamenů a no-tick.'},
  md:{key:'md',label:'Mixed doubles',players:2,alts:0,roster:['Hráč 1','Hráč 2'],pos:['1. a 5. kámen','2.–4. kámen'],stones:12,preset:2,ends:8,rule:'md',notick:false,
    note:'Tým tvoří jedna žena a jeden muž, náhradníci nejsou povoleni. Každý tým má v endu 1 umístěný kámen a hází 5 kamenů. Do 4. odehraného kamene nesmí být žádný kámen vyřazen ze hry. No-tick neplatí.'}
};
let FM=FORMATS.classic;
const useFmt=g=>{FM=FORMATS[(g&&g.format)||'classic']||FORMATS.classic;return FM};
/* označení kamene: v mixed doubles A a B pro umístěné kameny, pak 1–10 */
const lab=k=>FM.preset?(k<FM.preset?['A','B'][k]:String(k-FM.preset+1)):String(k+1);
/* na které pozici sestavy hází kámen k (-1 = umístěný kámen) */
function posOf(k){if(FM.key!=='md')return Math.floor(k/4);if(k<2)return -1;const j=Math.floor((k-2)/2);return(j===0||j===4)?0:1}
function stoneGroups(){if(FM.key!=='md')return FM.pos.map((l,p)=>({l,ks:[0,1,2,3].map(j=>p*4+j)}));
  return[{l:'Umístěné kameny',ks:[0,1]},{l:'1. kámen',ks:[2,3]},{l:'2.–4. kámen',ks:[4,5,6,7,8,9]},{l:'5. kámen',ks:[10,11]}]}
/* umístěné kameny mixed doubles: A = stráž na středu, B = vzadu ve 4 ft; power play posune oba ke straně */
const MD_GUARD_Y=(6.401+1.829)/2;
function presetPos(pp){const sd=pp==='L'?-1:pp==='R'?1:0;
  if(!sd)return[{x:0,y:MD_GUARD_Y},{x:0,y:-(0.61-0.145)}];
  const bx=sd*1.219,by=0.145;return[{x:Math.round(bx*(1-(MD_GUARD_Y-by)/(38.405-by))*1000)/1000,y:MD_GUARD_Y},{x:bx,y:by}]}
const OUTS=[['hog','Není ve hře (hog line)'],['through','Průjezd (za back line)'],['out','Vyjel z plochy']];
const outLabel=s=>s.out==='hog'?'Není ve hře':s.out==='through'?'Průjezd':s.out==='rule'?'Odstraněn podle pravidla':'Vyjel z plochy';
const SHOTS=['Draw','Guard','Come-around','Freeze','Raise','Tap','Takeout','Hit & roll','Double','Peel','Tick'];
/* hodnocení hodu v procentech; kámen bez hodnocení má rating '' */
const RATES=[100,75,50,25,0];
const isRated=s=>typeof s.rating==='number';
const rateLabel=v=>v+'\u00a0%';
const GOALS=['Skórovat 2+','Vynutit 1','Ukrást','Blank','Omezit ztrátu'];
const METS={ano:'Splněno',ne:'Nesplněno'};
METS['\u010d\u00e1ste\u010dn\u011b']='Částečně';
const R12=1.829,R8=1.219,R4=0.61,RB=0.152,RS=0.145,HOUSE=R12+RS,HOG=6.401,BACK=-1.829,HALFW=2.375;

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const todayISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const newId=()=>'g'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);

function newStone(){return{pname:null,shot:'',turn:'',x:null,y:null,out:false,rating:'',note:'',moves:[],removedBy:null}}
function newEnd(fm=FM){const st=Array.from({length:fm.stones},newStone);
  if(fm.preset){presetPos(null).forEach((p,i)=>Object.assign(st[i],{x:p.x,y:p.y,preset:true}))}
  return{stones:st,score:{us:null,them:null},hammer:null,pp:null,mdFirst:{us:null,them:null},tactic:{rating:0,goal:'',met:'',note:''}}}
function newGame(fk='classic'){const fm=FORMATS[fk];const team=window.CurlCloud?.me();const roster=window.CurlCloud?.roster()||[];return{id:newId(),format:fk,event:'',date:todayISO(),us:{name:team?.teamName||'Náš tým',color:'red',players:Array.from({length:4},(_,i)=>roster[i]||''),alts:['',''],coach:''},them:{name:'Soupeř',players:['','','',''],alts:['',''],coach:''},hammerStart:'them',subs:{us:null,them:null},ends:Array.from({length:fm.ends},()=>newEnd(fm)),summary:{tactic:0,exec:0,mental:0,worked:'',improve:'',conclusion:''},sample:false,created:Date.now(),updated:Date.now()}}
function normalize(g){
  if(!FORMATS[g.format])g.format='classic';useFmt(g);
  const b=newGame(g.format);
  ['us','them'].forEach(t=>{const T=g[t]||{};if(!Array.isArray(T.alts))T.alts=[T.alt||'',''];while(T.alts.length<2)T.alts.push('');delete T.alt;if(T.coach==null)T.coach='';g[t]=T});
  g.us=Object.assign(b.us,g.us);g.them=Object.assign(b.them,g.them);
  g.summary=Object.assign(b.summary,g.summary||{});
  if(!Array.isArray(g.ends)||!g.ends.length)g.ends=b.ends;
  g.ends=g.ends.map(e=>{const n=newEnd();const hadStones=e&&Array.isArray(e.stones)&&e.stones.length;e=Object.assign(n,e||{});e.score=Object.assign({us:null,them:null},e.score||{});e.tactic=Object.assign(newEnd().tactic,e.tactic||{});e.mdFirst=Object.assign({us:null,them:null},e.mdFirst||{});
    e.stones=Array.from({length:FM.stones},(_,k)=>Object.assign(newStone(),(hadStones?e.stones:n.stones)[k]||{}));e.stones.forEach(s=>{if(!Array.isArray(s.moves))s.moves=[];if(s.out==='inplay')s.out=false;s.rating=toPct(s.rating)});return e});
  if(!g.hammerStart)g.hammerStart='them';if(!g.date)g.date=todayISO();
  ['us','them'].forEach(t=>{while(g[t].players.length<4)g[t].players.push('')});
  const idName=(t,id)=>id<4?(g[t].players[id]||POS[id]):(g[t].alts[id-4]||'Náhradník '+(id-3));
  /* starší zápisy měly sestavu u každého endu: převede se na jedno střídání (první změna oproti rozpisce) */
  g.subs=Object.assign({us:null,them:null},g.subs||{});
  ['us','them'].forEach(t=>{
    const sb=g.subs[t];if(sb&&(FM.alts===0||!(sb.end>=1&&sb.end<g.ends.length&&sb.pos>=0&&sb.pos<FM.players&&String(sb.in||'').trim())))g.subs[t]=null;
    if(g.subs[t])return;
    if(FM.key!=='classic')return;
    const base=[0,1,2,3].map(p=>dispName(g[t].players[p],p));
    for(let ei=1;ei<g.ends.length&&!g.subs[t];ei++){const l=g.ends[ei].lineup&&g.ends[ei].lineup[t];if(!Array.isArray(l)||l.length!==4)continue;
      const names=l.map(x=>typeof x==='number'?idName(t,x):String(x??'')).map(dispName);
      const p=names.findIndex((n,i)=>n!==base[i]);if(p>=0&&!base.includes(names[p]))g.subs[t]={end:ei,pos:p,in:names[p]}}
  });
  g.ends.forEach(end=>{delete end.lineup});
  g.ends.forEach((end,ei)=>{
    end.stones.forEach((s,k)=>{if(typeof s.player==='number')s.pname=idName(teamOf(g,ei,k),s.player);delete s.player;if(s.pname===undefined||s.pname==='')s.pname=null});
  });
  return g;
}

function toPct(r){if(typeof r==='number')return RATES.includes(r)?r:'';if(r==='good')return 100;if(r==='B')return 50;if(r==='bad')return 0;const n=parseInt(r,10);return RATES.includes(n)?n:''}

/* ---------- sample ---------- */
function sampleGame(){
  const S=(shot,turn,x,y,rating,o={})=>Object.assign(newStone(),{shot,turn,x,y,rating:toPct(rating)},o);
  const g=newGame();
  Object.assign(g,{event:'Ukázkový zápas',date:'2026-11-08',sample:true,hammerStart:'them'});
  g.us={name:'TJ Ledňáčci',color:'red',players:['Kateřina Nováková','Tereza Malá','Jana Horáková','Eva Svobodová'],alts:['',''],coach:''};
  g.them={name:'CC Severka',players:['Petra Králová','Lucie Dvořáková','Markéta Černá','Hana Veselá'],alts:['',''],coach:''};
  const e1=g.ends[0];
  e1.stones=[
    S('Guard','In',0.05,3.2,'good'),
    S('Guard','Out',-1.0,2.6,'good'),
    S('Come-around','Out',0.15,0.45,'B',{note:'Měl skončit za stráží, zůstal odkrytý.',removedBy:5}),
    S('Come-around','In',-0.9,-0.3,'good'),
    S('Draw','In',-0.45,0.2,'good',{removedBy:9}),
    S('Hit & roll','Out',0.25,0.35,'B',{removedBy:6}),
    S('Takeout','In',0.2,0.38,'good'),
    S('Draw','Out',0.6,-0.6,'bad',{note:'Měl kousnout do 4 ft, přejel.'}),
    S('Guard','In',0.35,2.4,'good'),
    S('Double','In',null,null,'B',{out:true,note:'Vyrazil jen jeden kámen, sám vyjel.'}),
    S('Freeze','Out',-0.2,-0.15,'good'),
    S('Takeout','Out',-1.1,-1.4,'bad'),
    S('Guard','In',-0.1,1.6,'good'),
    S('Come-around','Out',0.05,0.05,'good',{moves:[{by:14,x:0.1,y:-0.7}]}),
    S('Tap','In',0.05,0.15,'good'),
    S('Draw','In',-0.05,0.08,'good',{note:'Přesný draw na jedničku.'})
  ];
  e1.score={us:0,them:1};e1.tactic={rating:4,goal:'Vynutit 1',met:'ano',note:'Středová stráž a trpělivá hra, soupeř musel brát jedničku posledním kamenem.'};
  const e2=g.ends[1];
  e2.stones=[
    S('Guard','Out',0,3.0,'good'),
    S('Guard','In',1.0,2.8,'good'),
    S('Draw','In',0.1,1.1,'B'),
    S('Come-around','In',0.85,0.1,'good'),
    S('Takeout','Out',1.6,-1.2,'bad',{note:'Netrefil, kámen za stráží zůstal.'}),
    S('Draw','Out',0.55,-0.35,'good'),
    S('Freeze','In',0.3,-0.5,'B',{moves:[{by:7,x:0.35,y:-1.3}]}),
    S('Tap','Out',0.35,-0.45,'good',{removedBy:8}),
    S('Hit & roll','In',0.5,-0.6,'good',{removedBy:9}),
    S('Takeout','Out',0.45,-0.55,'good'),
    S('Draw','Out',-0.05,0.1,'good',{removedBy:11}),
    S('Hit & roll','In',-0.25,0.05,'B',{note:'Plán byl zůstat na středu, odjel doleva.'}),
    S('Guard','In',0.3,1.8,'B'),
    S('Draw','Out',0.2,-0.2,'good',{removedBy:14}),
    S('Double','In',0.15,-0.3,'B'),
    S('Draw','In',0,-0.05,'good')
  ];
  e2.score={us:2,them:0};e2.tactic={rating:3,goal:'Skórovat 2+',met:'ano',note:'Třetí riskovala hit & roll místo čistého vyražení. Vyšlo to, ale bylo to zbytečné riziko.'};
  const rest=[
    [{us:0,them:1},{rating:4,goal:'Vynutit 1',met:'ano',note:'Dvě středové stráže, soupeř bral jedničku.'}],
    [{us:0,them:0},{rating:4,goal:'Blank',met:'ano',note:'Bez šance na dvojku, čistý end a kladivo zůstalo nám.'}],
    [{us:3,them:0},{rating:5,goal:'Skórovat 2+',met:'ano',note:'Hra do rohových stráží, skip dorazil trojku.'}],
    [{us:0,them:2},{rating:2,goal:'Omezit ztrátu',met:'částečně',note:'Zbytečný come-around místo vyčištění, soupeř skóroval dvojku.'}],
    [{us:1,them:0},{rating:3,goal:'Skórovat 2+',met:'ne',note:'Soupeř hrál vyrážecí hru, vzali jsme jedničku.'}],
    [{us:0,them:1},{rating:4,goal:'Vynutit 1',met:'ano',note:'S náskokem jsme hráli čistě, soupeř bral jedničku.'}]
  ];
  rest.forEach((r,i)=>{g.ends[i+2].score=r[0];g.ends[i+2].tactic=r[1]});
  g.summary={tactic:4,exec:3,mental:4,
    worked:'Středové stráže bez kladiva a trpělivá hra v 1. a 3. endu. Second hrála výborně freeze i tapy.',
    improve:'Hit & roll třetí – dvakrát odjela ze středu. Draw do 4 ft s out-turnem.',
    conclusion:'Těsná výhra 6:5. Na tréninku: hit & roll ze středu a draw na 4 ft s out-turnem.'};
  return g;
}

/* ---------- game logic ---------- */
const other=t=>t==='us'?'them':'us';
const colorOf=(g,team)=>team==='us'?g.us.color:(g.us.color==='red'?'yellow':'red');
function hammerFor(g,e){
  let h=g.hammerStart;
  for(let i=0;i<=e;i++){
    if(i>0){const p=g.ends[i-1].score;if((+p.us||0)>0)h='them';else if((+p.them||0)>0)h='us';else if(FM.key==='md'&&endPlayed(g.ends[i-1]))h=other(h);}
    if(g.ends[i].hammer)h=g.ends[i].hammer;
  }
  return h;
}
function autoHammer(g,e){if(e===0)return g.hammerStart;const sv=g.ends[e].hammer;g.ends[e].hammer=null;const h=hammerFor(g,e);g.ends[e].hammer=sv;return h}
const teamOf=(g,e,k)=>k%2===1?hammerFor(g,e):other(hammerFor(g,e));
const thrown=s=>s.out||s.x!=null;
/* návrh rány podle toho, co hod udělal: vyřazené a posunuté kameny, kde kámen skončil */
function suggestShot(g,e,k){
  const end=g.ends[e],s=end.stones[k];if(!s||!thrown(s)||k<FM.preset)return'';
  const T=teamOf(g,e,k),own=j=>teamOf(g,e,j)===T;
  const before=new Map(stateAt(end,k-1).map(o=>[o.k,o]));
  const removed=end.stones.map((o,j)=>o.removedBy===k?j:-1).filter(j=>j>=0);
  const moved=end.stones.map((o,j)=>(o.moves||[]).some(m=>m.by===k)?j:-1).filter(j=>j>=0);
  const inHouse=(x,y)=>Math.hypot(x,y)<=HOUSE;
  const stays=!s.out&&s.x!=null&&s.removedBy==null;
  const oppRem=removed.filter(j=>!own(j));
  if(oppRem.length>=2)return'Double';
  if(oppRem.length===1){const o=before.get(oppRem[0]);
    if(o&&inFGZ(o.x,o.y))return'Peel';
    return stays&&inHouse(s.x,s.y)?'Hit & roll':'Takeout'}
  if(removed.length)return'Takeout';
  const mOpp=moved.filter(j=>!own(j)),mOwn=moved.filter(own);
  if(mOpp.length){const o=before.get(mOpp[0]),m=(end.stones[mOpp[0]].moves||[]).find(x=>x.by===k);
    if(o&&m&&inFGZ(o.x,o.y)&&onCentre(o.x)&&!onCentre(m.x))return'Tick';
    return'Tap'}
  if(mOwn.length)return'Raise';
  if(!stays)return'';
  if(inFGZ(s.x,s.y))return'Guard';
  if(inHouse(s.x,s.y)){
    const others=stateAt(end,k).filter(o=>o.k!==k);
    if(others.some(o=>Math.hypot(o.x-s.x,o.y-s.y)<2*RS+.05))return'Freeze';
    if(others.some(o=>inFGZ(o.x,o.y)&&Math.abs(o.x-s.x)<.45&&o.y>s.y))return'Come-around';
  }
  return'Draw';
}
/* sestava = rozpiska; od endu se střídáním hraje na dané pozici náhradník (jedno střídání za zápas pro každý tým) */
/* v triples se pozice po každých dvou endech posouvají; v mixed doubles se volí, kdo hází 1. a 5. kámen */
const dispName=(n,i)=>(n||'').trim()||FM.roster[i]||'';
function rosterFor(g,e,team){const l=[];for(let i=0;i<FM.players;i++)l.push(dispName(g[team].players[i],i));const sb=g.subs&&g.subs[team];if(sb&&e>=sb.end&&sb.pos<FM.players)l[sb.pos]=sb.in;return l}
function mdFirstFor(g,e,t){for(let i=Math.min(e,g.ends.length-1);i>=0;i--){const v=g.ends[i].mdFirst&&g.ends[i].mdFirst[t];if(v===0||v===1)return v}return 0}
function lineupFor(g,e,team){const r=rosterFor(g,e,team);
  if(FM.rotate){const sh=Math.floor(e/2)%r.length;return r.map((_,p)=>r[(p-sh+r.length)%r.length])}
  if(FM.key==='md'){const f=mdFirstFor(g,e,team);return[r[f],r[1-f]]}
  return r}
function stoneName(g,e,s,k,t){const p=posOf(k);if(p<0)return'Umístěný kámen';return s.pname?s.pname:lineupFor(g,e,t)[p]}
function subsAt(g,e,t){const sb=g.subs&&g.subs[t];if(!sb||sb.end!==e)return null;
  return{pairs:[[dispName(g[t].players[sb.pos],sb.pos),sb.in]],pos:sb.pos,reorder:false}}
function lastThrown(end){let l=-1;end.stones.forEach((s,k)=>{if(thrown(s))l=k});return l}
function stateAt(end,t){
  const out=[];
  for(let k=0;k<=t&&k<end.stones.length;k++){
    const s=end.stones[k];if(s.out||s.x==null)continue;
    if(s.removedBy!=null&&s.removedBy<=t)continue;
    let x=s.x,y=s.y;
    (s.moves||[]).filter(m=>m.by<=t).sort((a,b)=>a.by-b.by).forEach(m=>{x=m.x;y=m.y});
    out.push({k,x,y});
  }
  return out;
}
/* pravidla: free guard zone (do 5. kamene), no-tick, v mixed doubles upravené pravidlo (do 4. odehraného kamene) */
const CL=RS+0.0065;/* kámen se dotýká středové čáry (široké 13 mm) */
const inFGZ=(x,y)=>y>0&&y<HOG&&Math.hypot(x,y)>HOUSE;
const onCentre=x=>Math.abs(x)<=CL;
const nearEdge=(x,y)=>Math.abs(Math.hypot(x,y)-HOUSE)<.03||(y>-.03&&y<.03)||Math.abs(Math.abs(x)-CL)<.03;
const ruleActive=k=>k>=FM.preset&&k<=4;
function protectedBefore(g,e,k){
  if(!ruleActive(k))return[];const end=g.ends[e],T=teamOf(g,e,k);
  return stateAt(end,k-1).filter(o=>o.k<k).map(o=>({...o,team:teamOf(g,e,o.k)}))
    .filter(o=>FM.rule==='md'?true:(o.team!==T&&inFGZ(o.x,o.y)))
    .map(o=>({...o,nt:FM.notick&&inFGZ(o.x,o.y)&&onCentre(o.x)}));
}
function violations(g,e,k){
  const prot=protectedBefore(g,e,k);if(!prot.length)return[];
  const after=new Map(stateAt(g.ends[e],k).map(o=>[o.k,o])),v=[];
  prot.forEach(o=>{const a=after.get(o.k);
    if(!a)v.push({type:FM.rule==='md'?'md':'fgz',k:o.k,edge:nearEdge(o.x,o.y)});
    else if(o.nt&&!onCentre(a.x))v.push({type:'notick',k:o.k,edge:nearEdge(o.x,o.y)||nearEdge(a.x,a.y)})});
  return v;
}
const RULE_NAME={fgz:'Pravidlo pěti kamenů',notick:'No-tick',md:'Upravené pravidlo free guard zone'};
function violText(v,k){
  const base=v.type==='notick'?`kámen ${lab(k)} posunul kámen ${lab(v.k)} soupeře ze středové čáry`
    :v.type==='md'?`kámen ${lab(k)} vyřadil kámen ${lab(v.k)} ze hry před 4. odehraným kamenem`
    :`kámen ${lab(k)} vyřadil chráněný kámen ${lab(v.k)} soupeře z free guard zone`;
  const ref={fgz:'R6(b)',notick:'R7(a)',md:'R17(e)'}[v.type];
  return `<b>${RULE_NAME[v.type]}</b> <span class="rid">${ref}</span> ${base}.${v.edge?' Kámen je zakreslený na hraně, posuďte sami.':''}`;
}
function applyRule(end,k,type){const s=end.stones[k],undo={x:s.x,y:s.y,out:s.out,removed:[],moves:[]};
  end.stones.forEach((o,j)=>{if(o.removedBy===k){undo.removed.push(j);o.removedBy=null}
    const ms=(o.moves||[]).filter(m=>m.by===k);if(ms.length){ms.forEach(m=>undo.moves.push({j,m}));o.moves=o.moves.filter(m=>m.by!==k)}});
  s.x=null;s.y=null;s.out='rule';s.rule={type,applied:true,undo}}
function undoRule(end,k){const s=end.stones[k],u=s.rule&&s.rule.undo;if(!u){delete s.rule;return}
  s.x=u.x;s.y=u.y;s.out=u.out;u.removed.forEach(j=>{end.stones[j].removedBy=k});u.moves.forEach(({j,m})=>{end.stones[j].moves.push(m)});delete s.rule}
function posAt(end,k,t){const v=stateAt(end,t).find(o=>o.k===k);return v||null}
function autoScore(g,e){
  const end=g.ends[e];if(lastThrown(end)<0)return null;
  const st=stateAt(end,end.stones.length-1).map(o=>({...o,team:teamOf(g,e,o.k),d:Math.hypot(o.x,o.y)})).filter(o=>o.d<=HOUSE).sort((a,b)=>a.d-b.d);
  const r={us:0,them:0};if(!st.length)return r;
  const t=st[0].team;for(const o of st){if(o.team!==t)break;r[t]++}
  return r;
}
function zoneOf(x,y){
  const d=Math.hypot(x,y);
  if(d<=RB+RS)return'Button';if(d<=R4+RS)return'4 ft';if(d<=R8+RS)return'8 ft';if(d<=HOUSE)return'12 ft';
  if(y>0)return'Guard zone';return'Za kruhy';
}
const endPlayed=end=>end.score.us!=null||end.score.them!=null;
function totals(g){let us=0,them=0;g.ends.forEach(e=>{us+=+e.score.us||0;them+=+e.score.them||0});return{us,them}}
const pctOf=(o)=>o.n?Math.round(o.sum/o.n):null;

/* ---------- state ---------- */
/* přiblížení kruhů má smysl jen na mobilu: jinde je plocha omezená šířkou sloupce a přiblížení by ji jen ořízlo */
const PHONE_MQ='(max-width:720px)';
function isZoomed(){try{return view==='house'&&matchMedia(PHONE_MQ).matches}catch(e){return false}}
let games={},loaded=false,curId=null,curEnd=0,curStone=0,mode='place',movingK=null,tab='ends',view='full',readOnly=false,metaOpen=false,confirmDel=false;
// Režim zápisu mění jen rozložení; data zápasů ani způsob ukládání nemění.
let focusMode=false,focusHeaderOpen=false,focusDrawer=null;
function syncFocusLayout(){document.body.classList.toggle('focus-mode',focusMode&&tab==='ends'&&!!cur());document.body.classList.toggle('focus-head-open',focusHeaderOpen);}

let bkOpen=false,statusText='Načítám zápasy…';
/* krok zpět: zásobník stavů aktuálního zápasu (psaní do textových polí se slučuje do jednoho kroku) */
let undoStack=[],lastSnap=null,undoFor=null,lastTouchT=0,mergeNext=false;
let seasonTeam=null,seasonN=0;
const saveTimers={};
const cur=()=>games[curId]||null;
const sortedIds=()=>Object.keys(games).sort((a,b)=>(games[b].date||'').localeCompare(games[a].date||'')||(games[b].created||0)-(games[a].created||0));
function gameLabel(g){return `${g.us.name} – ${g.them.name}`+(g.date?' · '+fmtDate(g.date):'')+(g.sample?' (ukázka)':'')}
function fmtDate(s){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');return m?`${+m[3]}. ${+m[2]}. ${m[1]}`:s}
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function pickDefault(){const ids=sortedIds();const rem=lsGet('curl.cur');curId=ids.includes(rem)?rem:(ids[0]||null);resetEndPos(0)}
function resetEndPos(e){curEnd=e;const g=cur();if(!g){curStone=0;return}useFmt(g);if(curEnd>=g.ends.length)curEnd=0;const l=lastThrown(g.ends[curEnd]);curStone=Math.min(l+1,FM.stones-1);movingK=null;mode='place'}

let holdUntil=0;
function setStatus(t,hold){if(!hold&&Date.now()<holdUntil)return;if(hold)holdUntil=Date.now()+hold;statusText=t;const el=$('#status');if(el)el.textContent=t}
function touch(){const g=cur();if(!g||readOnly)return;g.updated=Date.now();
  {const sk=g.ends[curEnd]&&g.ends[curEnd].stones[curStone];
   if(sk&&!sk.shotManual&&(!sk.shot||sk.shotAuto)){const sg=thrown(sk)?suggestShot(g,curEnd,curStone):'';if(sg!==sk.shot||(!!sg)!==!!sk.shotAuto){sk.shot=sg;sk.shotAuto=!!sg}}}
  /* skóre endu se doplní samo, jakmile jsou zapsané všechny kameny endu */
  const end=g.ends[curEnd];
  if(end&&!end.autoScored&&end.score.us==null&&end.score.them==null&&end.stones.every(thrown)){const r=autoScore(g,curEnd);
    if(r){end.score={us:r.us,them:r.them};end.autoScored=true;const e=curEnd;
      setTimeout(()=>{renderBoard();renderEndbar();const rp=$('#result-panel');if(rp)rp.outerHTML=resultHTML(g);applyRO();
        setStatus(`Skóre endu ${e+1} doplněno podle poloh kamenů (${r.us}:${r.them}). Zkontrolujte ho.`+(g.ends.every(endPlayed)?' Zápas je dohraný, stáhněte si zálohu.':''),8000)},0)}}
  const now=Date.now(),snap=JSON.stringify(g),merge=mergeNext&&now-lastTouchT<1500;mergeNext=false;
  if(undoFor===g.id&&lastSnap&&lastSnap!==snap&&!merge){undoStack.push(lastSnap);if(undoStack.length>60)undoStack.shift()}
  if(undoFor!==g.id){undoStack=[];undoFor=g.id}
  lastSnap=snap;lastTouchT=now;
  scheduleSave(g.id);updDue();}
function doUndo(){const g=cur();if(!g||readOnly||!undoStack.length)return;
  const snap=undoStack.pop(),gg=normalize(JSON.parse(snap));games[gg.id]=gg;lastSnap=snap;lastTouchT=0;
  useFmt(gg);if(curEnd>=gg.ends.length)curEnd=gg.ends.length-1;if(curStone>=FM.stones)curStone=FM.stones-1;movingK=null;
  scheduleSave(gg.id);render();holdUntil=0;setStatus('Vráceno o krok zpět.'+(undoStack.length?'':' Další krok zpět už není.'),3000);}
/* světlý / tmavý režim: bez volby se řídí nastavením systému */
function isDark(){const t=document.documentElement.getAttribute('data-theme');if(t)return t==='dark';try{return matchMedia('(prefers-color-scheme: dark)').matches}catch(e){return false}}
function themeSwitch(){const d=isDark();return `<button class="themesw nav" id="themesw" role="switch" aria-checked="${d}" data-act="theme" aria-label="Tmavý režim" title="${d?'Přepnout na světlý režim':'Přepnout na tmavý režim'}">
  <svg class="sun" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>
  <svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a.6.6 0 0 0-.8-.7A9.6 9.6 0 1 0 21.2 15.4a.6.6 0 0 0-.7-.8z"/></svg>
  <span class="knob"></span></button>`}
function setTheme(t){document.documentElement.setAttribute('data-theme',t);lsSet('curl.theme',t);const b=$('#themesw');if(b){b.setAttribute('aria-checked',String(t==='dark'));b.title=t==='dark'?'Přepnout na světlý režim':'Přepnout na tmavý režim'}}
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{const b=$('#themesw');if(b&&!document.documentElement.getAttribute('data-theme'))b.setAttribute('aria-checked',String(isDark()))})}catch(e){}
/* připomenutí zálohy */
function backupDue(){const lb=+(lsGet('curl.lastBackup')||0);return Object.values(games).some(x=>!x.sample&&(x.updated||0)>lb&&x.ends.some(endPlayed))}
function lastBackupText(){const lb=+(lsGet('curl.lastBackup')||0);if(!lb)return'Zálohu jste ještě nestáhli.';const d=new Date(lb);return'Poslední záloha: '+d.toLocaleDateString('cs-CZ')+' '+d.toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'})+'.'}
function updDue(){const i=$('#bkd .due');if(i)i.hidden=!backupDue()}
/* stažení souboru: v publikovaném odkazu přes schválení prohlížeče (capability downloads), jinde běžně */
let DL=null,inArt=false;
try{if(window.claude&&typeof window.claude.use==='function'){inArt=true;window.claude.use('downloads').then(d=>{DL=d}).catch(()=>{})}}catch(e){}
function saveFile(name,txt){
  if(DL){try{return DL.save({filename:name,data:txt}).then(()=>'saved',e=>(e&&/declin|cancel|denied|dismiss/i.test(String(e.code||e.message||e)))?'declined':'unavailable')}catch(e){return Promise.resolve('unavailable')}}
  if(inArt)return Promise.resolve('unavailable');
  try{downloadText(name,txt);return Promise.resolve('saved')}catch(e){return Promise.resolve('unavailable')}
}
function downloadText(name,txt){const url=URL.createObjectURL(new Blob([txt],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
/* Cloud storage: no match data is persisted in this browser.
 * A trailing debounce groups edits, a 30 s cap prevents endless postponement.
 * The API uses optimistic revision checks to prevent silent overwrites. */
const cloudRevs={},cloudPending=new Map(),cloudSaving=new Map();
const CLOUD_DEBOUNCE=2500,CLOUD_MAX_WAIT=30000;
function scheduleSave(id){
  const g=games[id];if(!g)return;
  let p=cloudPending.get(id);
  if(!p){p={since:Date.now()};cloudPending.set(id,p)}
  clearTimeout(saveTimers[id]);
  const delay=Math.max(0,Math.min(CLOUD_DEBOUNCE,CLOUD_MAX_WAIT-(Date.now()-p.since)));
  saveTimers[id]=setTimeout(()=>{delete saveTimers[id];doSave(id)},delay);
  setStatus('Čeká na uložení do cloudu…');
}
async function doSave(id){
  clearTimeout(saveTimers[id]);delete saveTimers[id];
  if(cloudSaving.has(id))return cloudSaving.get(id);
  if(!cloudPending.has(id)||!games[id])return;
  const snapshot=JSON.stringify(games[id]);
  const request=(async()=>{
    try{
      const result=await CurlCloud.putGame(JSON.parse(snapshot),cloudRevs[id]||0);
      cloudRevs[id]=result.revision;
      if(games[id]&&JSON.stringify(games[id])===snapshot){cloudPending.delete(id);setStatus('Uloženo v databázi Cloudflare D1.')}
      else if(games[id]){cloudPending.set(id,{since:Date.now()});}
    }catch(e){
      if(e.status===409){cloudPending.get(id).conflict=true;setStatus('KONFLIKT: zápas byl změněn na jiném zařízení. Neobnovujte stránku, stáhněte si zálohu a vyřešte konflikt.',120000)}
      else{setStatus('Nepodařilo se uložit: '+e.message+' Změny zůstávají jen v otevřené stránce.',30000);}
    }
  })();
  cloudSaving.set(id,request);
  await request;cloudSaving.delete(id);
  if(cloudPending.has(id)&&games[id]&&!cloudPending.get(id).conflict){
    clearTimeout(saveTimers[id]);saveTimers[id]=setTimeout(()=>{delete saveTimers[id];doSave(id)},cloudPending.get(id).since===Date.now()?CLOUD_DEBOUNCE:5000);
  }
}
function flushSaves(){for(const id of cloudPending.keys())if(games[id])void doSave(id)}
addEventListener('pagehide',flushSaves);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushSaves()});
addEventListener('online',flushSaves);
addEventListener('beforeunload',ev=>{if(cloudPending.size){ev.preventDefault();ev.returnValue=''}});
async function loadCloudGames(){
  const result=await CurlCloud.getGames();
  for(const row of result.games){games[row.game.id]=normalize(row.game);cloudRevs[row.game.id]=row.revision}
}
async function deleteCloudGame(id){
  clearTimeout(saveTimers[id]);delete saveTimers[id];
  if(cloudSaving.has(id))await cloudSaving.get(id);
  clearTimeout(saveTimers[id]);delete saveTimers[id];
  if(cloudRevs[id])await CurlCloud.deleteGame(id,cloudRevs[id]);
  cloudPending.delete(id);delete cloudRevs[id];delete games[id];
  confirmDel=false;metaOpen=false;pickDefault();render();setStatus('Zápas byl smazán z databáze.');
}

/* ---------- render ---------- */
function render(){useFmt(cur());if(undoFor!==curId){undoStack=[];lastSnap=cur()?JSON.stringify(cur()):null;undoFor=curId}syncFocusLayout();renderHeader();renderBoard();renderMeta();renderTabs();renderBody();applyRO()}
function applyRO(){
  document.body.classList.toggle('ro',readOnly);
  if(!readOnly)return;
  document.querySelectorAll('#app input,#app select:not(.nav),#app textarea,#app button:not(.nav)').forEach(el=>el.disabled=true);
}
/* kladívko = tým s výhodou (posledním kamenem) */
const HAMMER=`<svg class="hammer" viewBox="0 0 16 16" aria-hidden="true"><g transform="rotate(-40 8 8)" fill="currentColor"><rect x="3" y="2" width="10" height="4.4" rx="1.2"/><rect x="6.9" y="5.6" width="2.2" height="9.4" rx="1.1"/></g></svg>`;
const hammerMark=(g,t)=>`<span class="hmark" title="Výhoda: ${esc(g[t].name)}">${HAMMER}<i class="c-${colorOf(g,t)}"></i></span>`;
const logo=`<svg width="34" height="34" viewBox="-2 -2 4 4" aria-hidden="true"><circle r="1.83" fill="var(--ring-blue)"/><circle r="1.22" fill="var(--ring-white)"/><circle r=".61" fill="var(--ring-red)"/><circle r=".2" fill="var(--ring-white)"/></svg>`;
function renderHeader(){
  const opts=sortedIds().map(id=>`<option value="${id}" ${id===curId?'selected':''}>${esc(gameLabel(games[id]))}</option>`).join('');
  $('#hdr').innerHTML=`
    <div class="brand"><span class="logo-tile">${logo}</span><div><div class="eyebrow">Trenérský zápis</div><h1>Curlingový zápisník</h1></div></div>
    <div class="picker">
      <label class="lbl" for="gamesel">Zápas</label>
      <select id="gamesel" class="nav" ${opts?'':'disabled'}>${opts||'<option>Žádný zápas</option>'}</select>
      <button class="btn primary ed" data-act="newgame">${icon('plus')}<span>Nový zápas</span></button>
      <details class="bk" id="bkd" ${bkOpen?'open':''}><summary class="btn">${icon('backup')}<span>Záloha</span> <i class="due" title="Od poslední zálohy přibyla data. Doporučujeme stáhnout zálohu." ${backupDue()?'':'hidden'}></i></summary>
        <div class="bkin">
          <button class="btn small primary nav" data-act="bkdl">${icon('download')}<span>Stáhnout zálohu (.txt)</span></button>
          <span class="effects">${lastBackupText()}</span>
          <label class="lbl" for="bk-file">Obnovit ze souboru zálohy</label>
          <input type="file" id="bk-file" class="nav" accept=".txt,.json,text/plain,application/json">
          <label class="lbl" for="bk-text">Nebo vložte text zálohy</label>
          <textarea id="bk-text" class="nav" placeholder="Sem vložte text zálohy…"></textarea>
          <div class="confirm"><button class="btn small nav" data-act="bkrestore">Obnovit</button></div>
        </div></details>
      <button class="btn focus-entry nav" data-act="focus-toggle" aria-pressed="${focusMode}">${focusMode?'Běžný režim':'Režim zapisování'}</button>
      ${themeSwitch()}
    </div>
    <div class="status"><span id="status" aria-live="polite">${esc(statusText)}</span> <span id="bk-msg" aria-live="polite"></span></div>`;
}
function renderBoard(){
  const g=cur();const el=$('#board');
  if(!g){el.innerHTML='';return}
  const t=totals(g);const played=g.ends.filter(endPlayed).length;
  el.innerHTML=`<section class="board" aria-label="Skóre">
    <div class="scoreline"><span class="tm"><span class="dot c-${colorOf(g,'us')}"></span><span class="n">${esc(g.us.name)}</span></span>
    <span class="sc num"><span>${t.us}</span> <span class="col">:</span> <span>${t.them}</span></span>
    <span class="tm"><span class="n">${esc(g.them.name)}</span><span class="dot c-${colorOf(g,'them')}"></span></span></div>
    <div class="meta">${g.sample?'<span class="badge">Ukázka</span>':''}<span class="m-date">${esc(fmtDate(g.date))}</span>${g.event?`<span class="m-ev" title="${esc(g.event)}">${esc(g.event)}</span>`:''}<span class="m-ends">${played}/${g.ends.length} endů</span><span class="m-fmt">${FM.label}</span>
      <button class="btn small primary nav metabtn" data-act="metatoggle" aria-expanded="${metaOpen}">${icon('roster')}<span>${metaOpen?'Skrýt rozpisku':'Zápas a rozpiska'}</span></button></div>
  </section>`;
}
function renderMeta(){
  const g=cur();const el=$('#meta');
  if(!g||!metaOpen){el.innerHTML='';return}
  const pl=(team)=>Array.from({length:FM.players},(_,i)=>i).map(i=>`<div class="field"><label class="lbl" for="m-${team}-p${i}">${FM.roster[i]}</label><input type="text" id="m-${team}-p${i}" value="${esc(g[team].players[i])}" placeholder="Jméno"></div>`).join('');
  const extra=(t)=>`${FM.alts?'':'<p class="effects" style="margin:0">Náhradníci nejsou v mixed doubles povoleni.</p>'}<div class="row2">${Array.from({length:FM.alts},(_,i)=>i).map(i=>`<div class="field"><label class="lbl" for="m-${t}-a${i}">${FM.alts>1?'Náhradník '+(i+1):'Náhradník'}</label><input type="text" id="m-${t}-a${i}" value="${esc(g[t].alts[i])}" placeholder="Jméno"></div>`).join('')}</div><div class="field"><label class="lbl" for="m-${t}-coach">Trenér</label><input type="text" id="m-${t}-coach" value="${esc(g[t].coach)}" placeholder="Jméno"></div>`;
  el.innerHTML=`<details class="meta" id="metad" ${metaOpen?'open':''}>
    <summary>Zápas a rozpiska</summary>
    <div class="metagrid">
      <div class="fieldset fmtset">
        <span class="lbl">Formát hry</span>
        <div class="seg" role="group" aria-label="Formát hry">${Object.values(FORMATS).map(f=>`<button class="${g.format===f.key?'on':''}" data-act="fmt" data-v="${f.key}">${f.label}</button>`).join('')}</div>
        <p class="effects" style="margin:0" id="fmt-note">${FM.note}</p>
      </div>
      <div class="fieldset">
        <div class="field"><label class="lbl" for="m-event">Turnaj / akce</label><input type="text" id="m-event" value="${esc(g.event)}" placeholder="např. 1. liga, 4. kolo"></div>
        <div class="row2">
          <div class="field"><label class="lbl" for="m-date">Datum</label><input type="date" id="m-date" value="${esc(g.date)}"></div>
          <div class="field"><label class="lbl" for="m-ends">Počet endů</label><input type="number" inputmode="numeric" id="m-ends" min="1" max="12" value="${g.ends.length}"></div>
        </div>
        <div class="row2">
          <div class="field"><label class="lbl" for="m-color">Naše barva</label><select id="m-color"><option value="red" ${g.us.color==='red'?'selected':''}>Červená</option><option value="yellow" ${g.us.color==='yellow'?'selected':''}>Žlutá</option></select></div>
          <div class="field"><label class="lbl" for="m-hammer">Výhoda v 1. endu</label><select id="m-hammer"><option value="us" ${g.hammerStart==='us'?'selected':''}>Náš tým</option><option value="them" ${g.hammerStart==='them'?'selected':''}>Soupeř</option></select></div>
        </div>
      </div>
      <div class="fieldset">
        <div class="field"><label class="lbl" for="m-us-name">Náš tým</label><input type="text" id="m-us-name" value="${esc(g.us.name)}"></div>
        <div class="row2">${pl('us')}</div>
        ${extra('us')}
      </div>
      <div class="fieldset">
        <div class="field"><label class="lbl" for="m-them-name">Soupeř</label><input type="text" id="m-them-name" value="${esc(g.them.name)}"></div>
        <div class="row2">${pl('them')}</div>
        ${extra('them')}
      </div>
      <div class="delrow ed">${confirmDel?`<div class="confirm"><span>Smazat tento zápas i se všemi endy?</span><button class="btn danger small" data-act="delyes">Smazat</button><button class="btn small" data-act="delno">Ponechat</button></div>`:`<button class="btn danger small" data-act="delgame">Smazat zápas</button>`}</div>
    </div>
  </details>`;
}
/* sada čárových ikon (24×24, tah 1.8, barva podle textu) */
const IC={
 stone:'<circle cx="12" cy="14" r="7"/><path d="M8.5 7.5V6a2 2 0 0 1 2-2h4.5"/><circle cx="12" cy="14" r="2.6"/>',
 players:'<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="16.8" cy="9.5" r="2.5"/><path d="M15.6 14.4c2.6.1 4.4 1.8 4.9 4.6"/>',
 order:'<path d="M10 6.5h10M10 12h10M10 17.5h10"/><path d="M4 5.2 5.5 4v5"/><path d="M3.8 13.3c.4-.9 2.6-1 2.6.5 0 1-2.6 2.2-2.6 3.2h2.8"/>',
 chart:'<path d="M4 20V4"/><path d="M4 20h16"/><path d="M7.5 15.5l3.5-4 3 2.5 5-6"/><circle cx="19" cy="8" r="1.2"/>',
 season:'<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M8 14h2M12 14h2M16 14h.5M8 17h2M12 17h2"/>',
 help:'<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.7"/><circle cx="12" cy="16.9" r=".6" fill="currentColor"/>',
 rules:'<path d="M5 4.5h10.5a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3z"/><path d="M5 16.5a3 3 0 0 1 3-3h10.5"/><path d="M9 8h6"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 backup:'<path d="M7 17.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.6a4 4 0 0 1-.5 8.9"/><path d="M12 11v9M9 17l3 3 3-3"/>',
 roster:'<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4.5V3h6v1.5"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4"/>',
 copy:'<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.5"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/>',
 download:'<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19.5h14"/>',
 more:'<circle cx="5.5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18.5" cy="12" r="1.3" fill="currentColor"/>',
 flag:'<path d="M5.5 21V4"/><path d="M5.5 4.5h11l-2 4 2 4h-11"/>',
 swap:'<path d="M4 8h14l-4-4"/><path d="M20 16H6l4 4"/>',
 save:'<path d="M5 4.5h11l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19z"/><path d="M8 4.5v5h7v-5M8 20.5v-6h8v6"/>',
 target:'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3"/><circle cx="12" cy="12" r="2.5"/>'
};
const icon=(n,cls='')=>`<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[n]||''}</svg>`;
const TAB_ICON={ends:'stone',stats:'players',order:'order',summary:'chart',season:'season',help:'help',rules:'rules'};
const TAB_SHORT={ends:'Endy',stats:'Hráči',order:'Pořadí',summary:'Hodnocení',season:'Sezóna',help:'Návod',rules:'Pravidla'};
function renderTabs(){
  const g=cur();
  const list=(g?[['ends','Endy a kameny'],['stats','Hráči'],['order','Pořadí kamenů'],['summary','Hodnocení zápasu'],['season','Sezóna']]:[]).concat([['help','Návod'],['rules','Pravidla']]);
  $('#tabs').innerHTML=list.map(([k,l])=>`<button class="tab nav ${k==='help'?'tab-help':''} ${tab===k?'on':''}" data-act="tab" data-v="${k}">${icon(TAB_ICON[k])}<span>${l}</span></button>`).join('');
  renderBnav(list);
}
/* mobil: spodní navigace (4 hlavní záložky + Více) */
let moreOpen=false;
function renderBnav(list){
  let el=document.getElementById('bnav');
  if(!el){el=document.createElement('nav');el.id='bnav';el.className='bnav';el.setAttribute('aria-label','Hlavní navigace');document.getElementById('app').appendChild(el)}
  const main=list.filter(([k])=>['ends','stats','summary','order'].includes(k));
  const rest=list.filter(([k])=>!main.some(([m])=>m===k));
  const moreOn=rest.some(([k])=>k===tab);
  el.style.gridTemplateColumns=`repeat(${main.length+1},minmax(0,1fr))`;
  el.innerHTML=main.map(([k])=>`<button class="bn nav ${tab===k?'on':''}" data-act="tab" data-v="${k}" aria-current="${tab===k?'page':'false'}">${icon(TAB_ICON[k])}<span>${TAB_SHORT[k]}</span></button>`).join('')
    +`<button class="bn nav ${moreOn?'on':''}" data-act="bmore" aria-expanded="${moreOpen}">${icon(moreOn?TAB_ICON[tab]:'more')}<span>${moreOn?TAB_SHORT[tab]:'Více'}</span></button>`
    +`<div class="bmore" ${moreOpen?'':'hidden'}>${rest.map(([k,l])=>`<button class="bm nav ${tab===k?'on':''}" data-act="tab" data-v="${k}">${icon(TAB_ICON[k])}<span>${l}</span></button>`).join('')}</div>`;
  document.body.classList.add('has-bnav');
}

function renderBody(){
  const b=$('#body');
  if(!loaded){b.innerHTML=`<div class="empty-state"><h2>Načítám zápasy…</h2><p class="muted">Za chvíli se tu objeví uložené zápisy.</p></div>`;return}
  if(tab==='help'){b.innerHTML=helpHTML();return}
  if(tab==='rules'){b.innerHTML=rulesHTML();return}
  const g=cur();
  if(!g){b.innerHTML=`<div class="empty-state"><h2>Zatím žádný zápas</h2><p class="muted">Založte nový zápas a zapisujte kámen po kameni. Nebo si nahrajte ukázku a podívejte se, jak vypadá vyplněný zápis.</p><div class="confirm"><button class="btn primary ed" data-act="newgame">${icon('plus')}<span>Nový zápas</span></button><button class="btn ed" data-act="loadsample">Nahrát ukázku</button></div></div>`;return}
  if(tab==='ends'){b.innerHTML=`<div class="focus-toolbar" role="toolbar" aria-label="Ovládání režimu zapisování"><button class="btn small nav" data-act="focus-header" aria-expanded="${focusHeaderOpen}">${focusHeaderOpen?'Skrýt skóre a menu':'Zobrazit skóre a menu'}</button><span class="focus-caption">Zapisování · End ${curEnd+1}</span><button class="btn small nav" data-act="focus-exit">Ukončit režim</button></div><div class="endbar" id="endbar"></div><div class="work" id="work" style="margin-top:12px"></div>`;renderEndbar();renderWork()}
  else if(tab==='order'){b.innerHTML=`<div class="endbar" id="endbar"></div><div id="orderview" style="margin-top:12px"></div>`;renderEndbar();renderOrder()}
  else if(tab==='stats')b.innerHTML=statsHTML(g);
  else if(tab==='season')b.innerHTML=seasonHTML(g);
  else b.innerHTML=summaryHTML(g);
}
function helpHTML(){
  const SECI={1:'plus',2:'rules',3:'flag',4:'stone',5:'swap',6:'target',7:'players',8:'chart',9:'save'};
  const sec=(n,title,body)=>`<section class="panel"><h2 class="hico"><span class="hic">${icon(SECI[n]||'help')}</span>${n}. ${title}</h2>${body}</section>`;
  return `<div class="help">
  <p class="intro">Zápisník slouží trenérovi k zápisu zápasu kámen po kameni: kam kámen dojel, kdo ho hodil, jak se povedl, a k hodnocení taktiky každého endu i celého zápasu. Na notebooku, tabletu i mobilu funguje stejně.</p>
  <div class="grid2">
  ${sec(1,'Založení zápasu',`<ol>
    <li>Klikněte na <b>Nový zápas</b> nahoře.</li>
    <li>Otevře se <b>Zápas a rozpiska</b>. Vyplňte turnaj, datum, počet endů, barvu vašich kamenů a kdo má <b>výhodu v 1. endu</b>.</li>
    <li>Pro oba týmy zapište název, hráče na pozicích Lead až Fourth, až dva náhradníky a trenéra.</li>
    <li>Rozpisku kdykoli otevřete tlačítkem <b>Zápas a rozpiska</b> vpravo na liště se skóre. Při zápisu je schovaná, aby se plocha a editor vešly na obrazovku. Zápas se tam dá i smazat.</li></ol>
    <p class="muted">Horní lišta s výběrem zápasu zůstává na notebooku a tabletu nahoře i při posouvání stránky.</p>
    <p class="muted">Přepínač se <b>sluníčkem a měsíčkem</b> vpravo nahoře mění světlý a tmavý režim. Volba se zapamatuje, bez ní se aplikace řídí nastavením zařízení.</p>
    <p class="muted">Mezi zápasy přepínáte v nabídce <b>Zápas</b> nahoře. Tlačítko <b>Nahrát ukázku</b> na prázdné obrazovce vloží vyplněný ukázkový zápas na vyzkoušení.</p>`)}
  ${sec(2,'Formát hry a pravidla',`<ul>
    <li>V části <b>Zápas a rozpiska</b> zvolte formát: <b>Klasicky (4 hráči)</b>, <b>Triples (3 hráči)</b> nebo <b>Mixed doubles</b>. Podle něj se upraví počet hráčů, náhradníků, kamenů v endu a výchozí počet endů. Formát jde změnit, jen dokud nejsou zapsané kameny.</li>
    <li><b>Klasicky:</b> 4 hráči a až 2 náhradníci na soupisce, během zápasu jedno střídání. <b>Triples:</b> 3 hráči, každý hází 2 kameny, pozice se posouvají po dvou endech; až 2 náhradníci na soupisce, střídat se smí jen mezi zápasy. <b>Mixed doubles:</b> 2 hráči bez náhradníka, umístěné kameny A a B, power play jednou za zápas; v bloku Rozestavení endu zvolíte, kdo hází 1. a 5. kámen.</li>
    <li><b>Pravidlo pěti kamenů:</b> do 5. kamene endu nesmí tým vyřadit ze hry kámen soupeře ve free guard zone. <b>No-tick:</b> kámen soupeře, který se ve free guard zone dotýká středové čáry, nesmí být posunut mimo ni. V mixed doubles platí místo toho, že do 4. odehraného kamene nesmí být vyřazen ze hry žádný kámen.</li>
    <li>Číslo pravidla (například R6(b) nebo R7(a)) najdete v záložce <b>Pravidla</b>, kde jde pravidla vyhledávat podle čísla i podle slova.</li>
    <li>Během platnosti pravidla má chráněný kámen na ploše oranžový kroužek a středová čára je podbarvená. Když zapsaný hod pravidlo poruší, editor kamene to ukáže. <b>Uplatnit pravidlo</b> odstraní odehraný kámen a vrátí ostatní, <b>Ponechat stav</b> nechá kameny tak, jak jsou.</li></ul>`)}
  ${sec(3,'Lišta endů',`<ul>
    <li>Každé tlačítko je jeden end s jeho skóre. Klepnutím end otevřete.</li>
    <li>Kladívko s barevnou tečkou vpravo nahoře ukazuje, kdo má v endu <b>výhodu</b> (poslední kámen).</li>
    <li>Ikonka <span class="icn"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h14l-4-4"/><path d="M20 16H6l4 4"/></svg></span> s tečkou týmu znamená, že tým v tomto endu <b>střídal</b>.</li>
    <li><b>+ End</b> přidá prodloužení.</li></ul>`)}
  ${sec(4,'Zápis kamene',`<ol>
    <li>Pořadí hodů hlídá aplikace: týmy se střídají a tým s výhodou hází poslední kámen. Klasicky je v endu 16 kamenů, v triples 12, v mixed doubles 2 umístěné kameny A a B a 10 odehraných.</li>
    <li>V režimu <b>Umístit</b> klepněte do hrací plochy, kde kámen skončil. Kámen pak můžete <b>přetáhnout</b> na přesné místo myší nebo prstem. Myší ho můžete umístit i rovnou tažením se stisknutým tlačítkem. Na mobilu přiblížíte dům pro přesné umístění <b>lupou s +</b> v rohu plochy; lupa s − vrátí celou plochu. Na notebooku a tabletu je dům dost velký i na celé ploše.</li>
    <li>Pokud kámen ve hře nezůstal, zvolte v části <b>Kde skončil</b>: <b>Není ve hře</b> (nedojel za hog line), <b>Průjezd</b> (přejel za back line) nebo <b>Vyjel z plochy</b>.</li>
    <li>V editoru kamene doplňte <b>hráče</b>, <b>rotaci</b> (in-turn, out-turn), <b>ránu</b> a případně poznámku.</li>
    <li>Ohodnoťte hod: <b>100 %, 75 %, 50 %, 25 % nebo 0 %</b>. U zakresleného kamene se aplikace sama posune na další kámen.</li>
    <li>Mezi kameny se pohybujete tlačítky <b>‹ Kámen</b> a <b>Kámen ›</b>, na klávesnici šipkami <span class="key">←</span> <span class="key">→</span>.</li>
    <li>Kámen, se kterým právě pracujete, poznáte podle <b>černého pulzujícího kruhu</b>.</li>
    <li>V nabídce <b>Hráč</b> je u jména i pozice, například „Eva (Fourth)“.</li>
    <li><b><svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg> Zpět</b> u čísla endu (nebo <span class="key">Ctrl</span>+<span class="key">Z</span>) vrátí poslední změnu. Funguje opakovaně, až 60 kroků v otevřeném zápase.</li>
    <li><b>Na mobilu</b> je hodnocení hodu, posun mezi kameny a Zpět v liště dole na obrazovce, takže při zápisu nemusíte posouvat stránku.</li></ol>`)}
  ${sec(5,'Posunuté a vyražené kameny',`<ul>
    <li>Když hod posune dřívější kámen, přepněte na <b>Posunout</b> a posunutý kámen přetáhněte na místo, kam dojel. Jde to i dvěma klepnutími: na kámen a pak na nové místo. Pulzující kruh se při tom přesune na posouvaný kámen.</li>
    <li>Když hod kámen vyrazí, přepněte na <b>Vyřadit</b> a klepněte na vyražený kámen. Opětovné klepnutí na přeškrtnutý kámen ho vrátí.</li>
    <li>Plocha vždy ukazuje stav po vybraném kameni. Při procházení kamenů tak vidíte, jak se situace v domě vyvíjela.</li></ul>`)}
  ${sec(6,'Výsledek a taktika endu',`<ul>
    <li>Jakmile zapíšete poslední kámen endu, aplikace <b>sama doplní skóre endu</b> podle poloh kamenů a oznámí to nahoře. Zkontrolujte ho a případně přepište ručně (měření, sporné kameny).</li>
    <li>Výsledek jde kdykoli zapsat ručně, nebo klepnout na <b>Použít</b> u výsledku spočítaného z poloh kamenů.</li>
    <li><b>Výhoda</b> se do dalšího endu dopočítá sama podle skóre. Když je potřeba, přepíšete ji ručně.</li>
    <li>V <b>Taktice endu</b> zvolte cíl endu, zda byl splněn, hodnocení taktiky 1–5 a klíčová rozhodnutí.</li></ul>`)}
  ${sec(7,'Hráči a střídání',`<ul>
    <li>Záložka <b>Hráči</b> ukazuje sestavu obou týmů a úspěšnost každého hráče: celkem, na in-turn a out-turn a podle typu rány.</li>
    <li><b>Střídání:</b> každý tým může za zápas vystřídat <b>jen jednou</b>. V bloku Sestava zvolte, od kterého endu, kdo odchází a kdo přichází. Náhradník převezme pozici odcházejícího hráče. V triples se během zápasu střídat nesmí, náhradník nastoupí až v dalším zápase.</li>
    <li>Zapsané střídání jde zrušit tlačítkem <b>Zrušit střídání</b>.</li>
    <li>Jednotlivý kámen můžete ručně přiřadit jinému hráči v editoru kamene.</li></ul>`)}
  ${sec(8,'Pořadí kamenů a hodnocení zápasu',`<ul>
    <li><b>Pořadí kamenů</b> ukazuje všechny kameny vybraného endu: hráče, ránu, kde skončil a hodnocení. Klepnutím na kámen ho otevřete k úpravě.</li>
    <li><b>Hodnocení zápasu</b> obsahuje výsledkovou tabuli, klíčová čísla (úspěšnost, skórování s výhodou, ukradené endy, blank endy), přehled taktiky po endech a celkové hodnocení s poznámkami pro trénink.</li>
    <li>Dole je <b>Shrnutí pro tým</b>: hotový text se skóre, úspěšností hráčů, taktikou a závěrem. <b>Kopírovat shrnutí</b> ho vloží do schránky (pak ho vložíte do WhatsAppu, e-mailu…), <b>Stáhnout shrnutí</b> uloží textový soubor.</li>
    <li><b>Sezóna</b> sčítá všechny zápasy zvoleného týmu: bilanci, úspěšnost týmu a hráčů po zápasech, trend a úspěšnost ran. Hráče páruje podle jména, proto ho pište pokaždé stejně. Období zúžíte na posledních 5 nebo 10 zápasů.</li></ul>`)}
  ${sec(9,'Ukládání a záloha',`<ul>
    <li>Vše se ukládá automaticky, ale <b>jen v tomto prohlížeči na tomto zařízení</b>. V anonymním okně nebo po vymazání dat prohlížeče se zápasy ztratí.</li>
    <li>Tlačítko <b>Záloha</b> nahoře otevře nabídku. <b>Stáhnout zálohu</b> uloží textový soubor se všemi zápasy. Dělejte ji po každém zápase. Oranžová tečka u tlačítka znamená, že od poslední zálohy přibyla data.</li>
    <li><b>Obnovit ze souboru zálohy</b> v téže nabídce načte zálohu zpět: vyberte soubor, nebo vložte jeho text. Takto přenesete zápasy i na jiné zařízení.</li></ul>`)}
  </div></div>`;
}
/* záložka Pravidla: rejstřík pravidel World Curling (vydání 1. 9. 2026) s číslováním podle originálu.
   Texty jsou vlastní stručný český výklad, ne úplné znění; přesné znění je v oficiálním PDF podle stejného čísla. */
const RULEBOOK = window.CURLING_RULEBOOK;
const rnorm=t=>String(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const ridnorm=t=>rnorm(t).replace(/[^a-z0-9]/g,'');
function ruleItems(pref,items){return items.map(it=>{const id=it.l==='—'?pref:`${pref}(${it.l})`;
  return `<li data-s="${esc(rnorm(id+' '+it.x))}" data-ch="${esc(ridnorm(id.split('(')[0]))}" data-rest="${esc(ridnorm(id.slice(id.split('(')[0].length)))}"><span class="rid">${esc(id)}</span> ${esc(it.x)}${it.s&&it.s.length?`<ul>${ruleItems(id,it.s)}</ul>`:''}</li>`}).join('')}
/* strany kapitol v oficiálním PDF (podle obsahu dokumentu; obálka je strana 1) */
const RULE_PDF='https://worldcurling.org/wp-content/uploads/2026/08/Rules2026.pdf';
const RULE_PAGES={R1:4,R2:6,R3:7,R4:9,R5:10,R6:12,R7:12,R8:13,R9:14,R10:16,R11:17,R12:18,R13:22,R14:22,R15:24,R16:24,R17:25,R18:31,R19:31,C1:32,C2:33,C3:35,C4:36,C5:37,C6:37,C7:40,C8:42,C9:46,C10:50};
const TRIPLES_PDF='https://curling.ca/youthcurling/files/2025/02/Curling-Canada-Triples-2025-EN.pdf';
function ruleSrc(ch){const pg=RULE_PAGES[ch.id];
  return pg?`<a class="rsrc" href="${RULE_PDF}#page=${pg}" target="_blank" rel="noopener">Úplné znění ${ch.id} v PDF, str. ${pg} ↗</a>`
    :`<a class="rsrc" href="${TRIPLES_PDF}" target="_blank" rel="noopener">Pravidla triples (Curling Canada, PDF) ↗</a>`}
function ruleChapter(ch){return `<section class="panel rchap" id="rule-${ch.id}" data-s="${esc(rnorm(ch.id+' '+ch.t+' '+ch.en))}" data-ch="${esc(ridnorm(ch.id))}" data-rest="">
  <h2><span class="rid big">${esc(ch.id)}</span> ${esc(ch.t)} <span class="muted ren">${esc(ch.en)}</span></h2>${ruleSrc(ch)}<ul class="rlist">${ruleItems(ch.id,ch.p)}</ul></section>`}
function rulesHTML(){
  const chips=list=>list.map(ch=>`<button class="chip nav" data-act="rjump" data-v="${ch.id}" title="${esc(ch.t)}">${ch.id}</button>`).join('');
  return `<div class="help rules">
  <p class="intro">Rejstřík pravidel podle dokumentu <b>World Curling, The Rules of Curling and Rules of Competition</b>, vydání z 1. září 2026. Čísla kapitol a bodů odpovídají originálu, takže se ve sporu můžete odkázat třeba na <b>R7(a)(II)</b> a dohledat přesné anglické znění v oficiálním PDF. Texty jsou stručný český výklad, ne úplné znění. U každé kapitoly je odkaz na její stranu v oficiálním PDF. Pořadatel soutěže, například národní svaz, může pravidla upravit.</p>
  <div class="rsearch"><label class="lbl" for="rules-q">Hledat pravidlo</label><input type="search" id="rules-q" class="nav" placeholder="Číslo (R6, R9b, C6) nebo slovo (hog line, zametání, time-out)" autocomplete="off"><span class="effects" id="rules-n" aria-live="polite"></span></div>
  <div class="rnav"><span class="lbl">Pravidla curlingu</span><div class="chips">${chips(RULEBOOK.R)}</div><span class="lbl">Pravidla soutěží</span><div class="chips">${chips(RULEBOOK.C)}<button class="chip nav" data-act="rjump" data-v="T">Triples</button></div></div>
  <h2 class="rgroup" id="rg-R">Pravidla curlingu (The Rules of Curling)</h2>
  ${RULEBOOK.R.map(ruleChapter).join('')}
  <h2 class="rgroup" id="rg-C">Pravidla soutěží (Rules of Competition)</h2>
  ${RULEBOOK.C.map(ruleChapter).join('')}
  <h2 class="rgroup" id="rg-T">Mimo pravidla World Curling</h2>
  ${RULEBOOK.T.map(ruleChapter).join('')}
  <p class="intro" id="rules-empty" hidden>Nic nenalezeno. Zkuste jiné slovo nebo číslo pravidla.</p>
  <p class="intro">© World Curling. Úplné a závazné znění pravidel je dokument World Curling, The Rules of Curling and Rules of Competition: <a href="${RULE_PDF}" target="_blank" rel="noopener">oficiální PDF</a> · <a href="https://worldcurling.org/competitions/rules/" target="_blank" rel="noopener">World Curling – Rules of Curling</a> · <a href="https://www.curling.ca/" target="_blank" rel="noopener">Curling Canada (triples)</a></p>
  </div>`;
}
/* vyhledávání: číslo pravidla (r6b, R6(b), c 6) nebo slova; zobrazí shody i s nadřazenými body */
function filterRules(q){
  const root=document.querySelector('.rules');if(!root)return;
  const qt=rnorm(q).trim(),m=/^([rct])\s*(\d*)(.*)$/i.exec(qt),isId=!!m&&/^[rct]\s*\d/i.test(qt);
  const qch=isId?m[1]+m[2]:'',qrest=isId?ridnorm(m[3]):'';
  /* číslo pravidla: kapitola musí sedět přesně (R1 není R10), body podle začátku (R9b, R7(a)(II)) */
  const match=el=>!qt||(isId?(el.dataset.ch===qch&&el.dataset.rest.startsWith(qrest)&&(qrest||el.classList.contains('rchap'))):qt.split(/\s+/).every(w=>el.dataset.s.includes(w)));
  let hits=0;
  const walk=(li,force)=>{const self=force||match(li);let any=false;
    li.querySelectorAll(':scope > ul > li').forEach(c=>{if(walk(c,self))any=true});
    const show=self||any;li.hidden=!show;li.classList.toggle('hit',!!qt&&self&&!force);if(qt&&self&&!force)hits++;return show};
  root.querySelectorAll('.rchap').forEach(ch=>{const cm=!!qt&&match(ch);let any=false;
    ch.querySelectorAll(':scope > ul > li').forEach(li=>{if(walk(li,cm))any=true});ch.hidden=!(cm||any);if(cm)hits++});
  root.querySelectorAll('.rgroup').forEach(h=>{let n=h.nextElementSibling,vis=false;while(n&&n.classList.contains('rchap')){if(!n.hidden)vis=true;n=n.nextElementSibling}h.hidden=!vis});
  const n=$('#rules-n');if(n)n.textContent=qt?(hits?`Nalezeno: ${hits}`:''):'';
  const em=$('#rules-empty');if(em)em.hidden=!qt||hits>0;
}
function renderEndbar(){
  const g=cur();const el=$('#endbar');if(!el)return;
  el.innerHTML=g.ends.map((end,i)=>{const h=hammerFor(g,i);const sc=endPlayed(end)?`${end.score.us??0}:${end.score.them??0}`:'–';
    return `<button class="endchip nav ${i===curEnd?'on':''}" data-act="end" data-v="${i}" aria-label="End ${i+1}"><span class="h">${hammerMark(g,h)}</span><span class="e">${i+1}</span><span class="s num">${sc}</span>${subIcon(g,i)}</button>`}).join('')
    +`<button class="endchip add ed" data-act="addend" aria-label="Přidat end">+ End</button>`;
}
function subIcon(g,i){const who=['us','them'].filter(t=>subsAt(g,i,t));if(!who.length)return'';
  const tip='Střídání: '+who.map(t=>g[t].name+' – '+subsText(g,t,subsAt(g,i,t))).join('; ');
  return `<span class="sw" title="${esc(tip)}" aria-label="${esc(tip)}">${who.map(t=>`<i class="c-${colorOf(g,t)}"></i>`).join('')}<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h14l-4-4"/><path d="M20 16H6l4 4"/></svg></span>`}
function renderWork(){
  const g=cur();const el=$('#work');if(!el)return;
  el.innerHTML=focusMode&&tab==='ends'
    ? `<section class="sheetcol">${sheetPanel(g)}</section><section class="side focus-side">
         <div class="focus-side-heading"><span>Kámen ${lab(curStone)} · End ${curEnd+1}</span><div class="focus-actions">
           <button class="btn small nav ${focusDrawer==='score'?'primary':''}" data-act="focus-drawer" data-v="score" aria-expanded="${focusDrawer==='score'}">Výsledek endu</button>
           <button class="btn small nav ${focusDrawer==='goal'?'primary':''}" data-act="focus-drawer" data-v="goal" aria-expanded="${focusDrawer==='goal'}">Cíl endu</button>
         </div></div>
         <div class="focus-editor">${editorHTML(g)}${FM.key==='md'?mdPanelHTML(g):''}</div>
         ${focusDrawer?`<div class="focus-drawer" role="region" aria-label="${focusDrawer==='score'?'Výsledek endu':'Cíl endu'}"><div class="focus-drawer-head"><strong>${focusDrawer==='score'?'Výsledek endu':'Cíl a taktika endu'}</strong><button class="btn small nav" data-act="focus-close">Zavřít ×</button></div>${focusDrawer==='score'?resultHTML(g):tacticHTML(g)}</div>`:''}
       </section>`
    : `${mbarHTML(g)}<section class="sheetcol">${sheetPanel(g)}</section><section class="side">${editorHTML(g)}${FM.key==='md'?mdPanelHTML(g):''}${resultHTML(g)}${tacticHTML(g)}</section>`;
  applyRO();
}
/* mixed doubles: rozestavení endu (power play) a kdo hází 1. a 5. kámen */
function ppUsedBy(g,t,except){return g.ends.findIndex((en,i)=>i!==except&&en.pp&&hammerFor(g,i)===t)}
function mdPanelHTML(g){
  const e=curEnd,end=g.ends[e],h=hammerFor(g,e),used=ppUsedBy(g,h,e);
  const ppOk=e<8&&used<0;
  const r=t=>{const ro=rosterFor(g,e,t),f=mdFirstFor(g,e,t);return `<div class="field"><label class="lbl" for="mdf-${t}">${esc(g[t].name)}: 1. a 5. kámen hází</label><select id="mdf-${t}">${ro.map((n,i)=>`<option value="${i}" ${i===f?'selected':''}>${esc(n)}</option>`).join('')}</select></div>`};
  return `<div class="panel" id="md-panel"><h3>Rozestavení endu ${e+1}</h3>
    <div class="field"><span class="lbl">Umístěné kameny</span><div class="seg" role="group" aria-label="Rozestavení">
      <button class="${!end.pp?'on':''}" data-act="pp" data-v="">Standardní</button>
      <button class="${end.pp==='L'?'on':''}" data-act="pp" data-v="L" ${ppOk||end.pp?'':'disabled'}>Power play vlevo</button>
      <button class="${end.pp==='R'?'on':''}" data-act="pp" data-v="R" ${ppOk||end.pp?'':'disabled'}>Power play vpravo</button></div>
      <span class="effects">Power play může tým s výhodou (${esc(g[h].name)}) použít jednou za zápas, ne v extra endu.${used>=0?` Tento tým ho už použil v ${used+1}. endu.`:''}${e>=8?' Toto je extra end.':''}</span></div>
    <div class="row2">${r('us')}${r('them')}</div>
    <span class="effects">Kdo hází 1. a 5. kámen, platí i pro další endy, dokud to nezměníte.</span>
  </div>`;
}
/* záložka Pořadí kamenů: seznam 16 kamenů vybraného endu; klepnutí na kámen ho otevře v zápisu endu */
function renderOrder(){
  const g=cur();const el=$('#orderview');if(!el)return;
  el.innerHTML=listHTML(g)+`<p class="legend" style="margin:10px 0 0">Klepnutím na kámen ho otevřete v záložce Endy a kameny.</p>`;
  applyRO();
}

/* sheet */
/* kámen jde táhnout: v režimu Umístit aktuální kámen, v režimu Posunout i dřívější kameny */
const canDrag=k=>!readOnly&&((mode==='place'&&k===curStone)||(mode==='move'&&k<=curStone));
function stoneSVG(x,y,k,color,extra='',grab=false){
  return `<g transform="translate(${x} ${y})" ${extra}>${grab?'<circle r=".3" fill="transparent"/>':''}<circle r="${RS}" fill="var(--granite)" stroke="var(--granite-edge)" stroke-width=".012"/><circle r=".1" fill="var(--st-${color})"/><text class="sn" y=".004" dominant-baseline="central" fill="var(--st-${color}-ink)">${lab(k)}</text></g>`;
}
function sheetSVG(g){
  const e=curEnd,end=g.ends[e],t=curStone;
  const vis=stateAt(end,t);
  const zoom=isZoomed(),y0=-2.25,h=zoom?4.55:8.85;
  let s=`<svg id="sheet" viewBox="${-HALFW} ${y0} ${HALFW*2} ${h}" role="img" aria-label="Hrací plocha – kruhy a guard zone">`;
  s+=`<rect x="${-HALFW}" y="${y0}" width="${HALFW*2}" height="9" fill="var(--ice)"/>`;
  s+=`<rect x="${-HALFW}" y="0" width="${HALFW*2}" height="${HOG}" fill="var(--fgz)"/>`;
  const act=ruleActive(t);
  if(act&&FM.notick)s+=`<rect class="ntz" x="${-CL}" y="${R12}" width="${CL*2}" height="${HOG-R12}" fill="var(--accent)" opacity=".13"/>`;
  s+=`<circle r="${R12}" fill="var(--ring-blue)"/><circle r="${R8}" fill="var(--ring-white)"/><circle r="${R4}" fill="var(--ring-red)"/><circle r="${RB}" fill="var(--ring-white)"/>`;
  const ln=(x1,y1,x2,y2,w=1.2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--sheet-line)" stroke-width="${w}" vector-effect="non-scaling-stroke"/>`;
  s+=ln(0,y0,0,7)+ln(-HALFW,0,HALFW,0)+ln(-HALFW,BACK,HALFW,BACK)+ln(-HALFW,HOG,HALFW,HOG,4);
  s+=`<g class="lbls"><text x="${HALFW-.06}" y="${BACK-.07}" text-anchor="end">BACK LINE</text><text x="${HALFW-.06}" y="-.22" text-anchor="end">TEE</text><text x="${HALFW-.06}" y="-.07" text-anchor="end">LINE</text>`;
  if(!zoom)s+=`<text x="${HALFW-.06}" y="3.6" text-anchor="end">GUARD ZONE</text><text x="${HALFW-.06}" y="${HOG-.09}" text-anchor="end">HOG LINE</text>`;
  s+=`</g>`;
  // ghosts: stones removed or moved by current stone
  end.stones.forEach((st,k)=>{
    if(k>=t)return;
    if(st.removedBy===t){const p=posAt(end,k,t-1);if(p)s+=`<g opacity=".35" data-ghost="${k}">${stoneSVG(p.x,p.y,k,colorOf(g,teamOf(g,e,k)))}<path d="M${p.x-.15} ${p.y-.15}L${p.x+.15} ${p.y+.15}M${p.x+.15} ${p.y-.15}L${p.x-.15} ${p.y+.15}" stroke="var(--bad)" stroke-width="2.5" vector-effect="non-scaling-stroke"/></g>`}
    const mv=(st.moves||[]).find(m=>m.by===t);
    if(mv){const p=posAt(end,k,t-1);if(p)s+=`<g opacity=".3">${stoneSVG(p.x,p.y,k,colorOf(g,teamOf(g,e,k)))}</g><line x1="${p.x}" y1="${p.y}" x2="${mv.x}" y2="${mv.y}" stroke="var(--ink)" stroke-dasharray="4 3" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`}
  });
  vis.forEach(o=>{const d=canDrag(o.k);s+=stoneSVG(o.x,o.y,o.k,colorOf(g,teamOf(g,e,o.k)),d?`class="drg" data-k="${o.k}"`:'',d)});
  if(act){const pk=new Set(protectedBefore(g,e,t).map(o=>o.k));vis.filter(o=>pk.has(o.k)).forEach(o=>{s+=`<circle class="protring" cx="${o.x}" cy="${o.y}" r=".19" fill="none" stroke="var(--warn)" stroke-dasharray="3 2" stroke-width="2" vector-effect="non-scaling-stroke"/>`})}
  /* pulz je na kameni, se kterým se právě pracuje: posouvaný kámen, jinak zapisovaný */
  const c=vis.find(o=>o.k===(movingK!=null?movingK:t));
  if(c)s+=`<g class="curring" pointer-events="none" data-k="${c.k}" transform="translate(${c.x} ${c.y})"><circle class="cr-pulse" r=".19" fill="none" stroke="#000000" stroke-width="4" vector-effect="non-scaling-stroke"/><circle class="cr-pulse cr-pulse2" r=".19" fill="none" stroke="#000000" stroke-width="4" vector-effect="non-scaling-stroke"/></g>`;
  return s+`</svg>`;
}
function sheetPanel(g){
  const t=curStone,team=teamOf(g,curEnd,t),h=hammerFor(g,curEnd);
  const preset=t<FM.preset;
  const hint=preset?`Umístěný kámen ${lab(t)} je postavený podle pravidel. Když stojí jinde, přetáhněte ho.`
    :mode==='place'?`Klepněte do plochy, kde kámen ${lab(t)} skončil, a pak ho můžete přetáhnout na přesné místo. Nakonec zvolte hodnocení.`
    :mode==='move'?(movingK==null?`Přetáhněte kámen, který hod ${lab(t)} posunul, na jeho nové místo. Nebo na něj klepněte a pak klepněte na nové místo.`:`Klepněte, kam se kámen ${lab(movingK)} posunul.`)
    :`Klepněte na kameny, které hod ${lab(t)} vyrazil. Další klepnutí na přeškrtnutý kámen ho vrátí.`;
  const left=5-t;
  const rh=!ruleActive(t)?'':FM.rule==='md'
    ?`<div class="rulehint"><b>Upravené pravidlo free guard zone</b> platí ještě pro ${left} ${left===1?'kámen':'kameny'}: do 4. odehraného kamene nesmí být žádný kámen vyřazen ze hry. Chráněné kameny mají oranžový kroužek.</div>`
    :`<div class="rulehint"><b>Pravidlo pěti kamenů</b> platí ještě pro ${left} ${left===1?'kámen':left<5?'kameny':'kamenů'}: kameny soupeře ve free guard zone (oranžový kroužek) nesmí být vyřazeny ze hry. Kámen soupeře na středové čáře (modrý pruh) nesmí být posunut mimo ni.</div>`;
  return `<div class="sheethead"><h2>End ${curEnd+1} <button class="btn small nav ed undo" data-act="undo" ${undoStack.length?'':'disabled'} title="Vrátit poslední změnu (Ctrl+Z)"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg> Zpět</button></h2><span class="muted" style="font-size:.88rem">${hammerMark(g,h)} Výhoda: <b>${esc(g[h].name)}</b></span></div>
  <div class="seg ed" role="group" aria-label="Režim zápisu">
    <button class="${mode==='place'?'on':''}" data-act="mode" data-v="place">Umístit ${lab(t)}</button>
    <button class="${mode==='move'?'on':''}" data-act="mode" data-v="move" ${t===0||t<FM.preset?'disabled':''}>Posunout</button>
    <button class="${mode==='remove'?'on':''}" data-act="mode" data-v="remove" ${t===0||t<FM.preset?'disabled':''}>Vyřadit</button>
  </div>
  ${rh}
  <div class="sheetwrap">${sheetSVG(g)}<button class="zoombtn nav" data-act="view" aria-label="${isZoomed()?'Celá plocha':'Přiblížit kruhy'}" title="${isZoomed()?'Celá plocha':'Přiblížit kruhy'}"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/><path d="M7.5 10.5h6"/>${isZoomed()?'':'<path d="M10.5 7.5v6"/>'}</svg></button></div>
  <div class="hint ed">${hint}</div>
  <div class="legend"><span class="dot c-${colorOf(g,team)}" style="vertical-align:-2px"></span> Hází ${esc(g[team].name)}</div>`;
}

/* editor */
function editorHTML(g){
  const e=curEnd,end=g.ends[e],k=curStone,s=end.stones[k],team=teamOf(g,e,k),pn=stoneName(g,e,s,k,team);
  const lu=lineupFor(g,e,team),names=[...new Set([...lu,pn])];
  const opts=names.map(n=>{const i=lu.indexOf(n);return `<option value="${esc(n)}" ${pn===n?'selected':''}>${esc(n)}${i>=0?' ('+FM.pos[i]+')':''}</option>`}).join('');
  let pos;
  if(s.out)pos=`<span class="z">${outLabel(s)}</span>`;
  else if(s.x!=null)pos=`<span class="z">${zoneOf(s.x,s.y)}</span>`;
  else pos=`<span class="muted">Ještě nezapsán</span>`;
  const rem=end.stones.map((o,j)=>o.removedBy===k?lab(j):null).filter(Boolean);
  const mov=end.stones.map((o,j)=>(o.moves||[]).some(m=>m.by===k)?lab(j):null).filter(Boolean);
  const eff=[rem.length?`vyřadil ${rem.join(', ')}`:'',mov.length?`posunul ${mov.join(', ')}`:''].filter(Boolean).join(' · ');
  const by=s.removedBy!=null?`Vyřazen kamenem ${lab(s.removedBy)}.`:'';
  const stepper=`<div class="stepper">
      <button class="btn nav" data-act="prev" ${k===0?'disabled':''}>‹ Kámen ${k>0?lab(k-1):lab(0)}</button>
      <button class="btn nav" data-act="next" ${k===FM.stones-1?'disabled':''}>Kámen ${lab(Math.min(k+1,FM.stones-1))} ›</button>
    </div>`;
  if(k<FM.preset)return `<div class="panel" id="ed-panel">
    <div class="edhead"><span class="big">Umístěný kámen ${lab(k)}</span><span class="dot c-${colorOf(g,team)}"></span><span>${esc(g[team].name)}</span></div>
    <p class="effects" style="margin:0">${k===0?'Stráž na středu před domem. Tým s tímto kamenem hází v endu první.':'Kámen vzadu ve 4 ft. Patří týmu s výhodou (poslední kámen).'} Kde stojí: <b>${s.x!=null?zoneOf(s.x,s.y):'—'}</b>. Umístění pro power play nastavíte v bloku Rozestavení endu.</p>
    ${eff||by?`<div class="effects">${by}</div>`:''}
    ${stepper}
  </div>`;
  const vs=violations(g,e,k);
  let rbox='';
  if(s.rule&&s.rule.applied){rbox=`<div class="rulebox ok"><span><b>${RULE_NAME[s.rule.type]} uplatněno:</b> kámen ${lab(k)} je odstraněn ze hry${(()=>{const r=[...new Set([...s.rule.undo.removed,...s.rule.undo.moves.map(m=>m.j)])].map(lab);return !r.length?'':r.length===1?' a kámen '+r[0]+' je vrácený na původní místo':' a kameny '+r.join(', ')+' jsou vrácené na původní místo'})()}.</span><div class="confirm ed"><button class="btn small" data-act="rundo">Vrátit zpět</button></div></div>`}
  else if(vs.length&&s.rule&&s.rule.kept){rbox=`<div class="rulebox ok"><span>${vs.map(v=>violText(v,k)).join('<br>')} Stav kamenů byl ponechán.</span><div class="confirm ed"><button class="btn small" data-act="rclear">Zrušit volbu</button></div></div>`}
  else if(vs.length){rbox=`<div class="rulebox"><span>${vs.map(v=>violText(v,k)).join('<br>')}</span><div class="confirm ed"><button class="btn small primary" data-act="rapply" data-v="${vs[0].type}">Uplatnit pravidlo</button><button class="btn small" data-act="rkeep">Ponechat stav</button></div><span class="effects">Uplatnit pravidlo: kámen ${lab(k)} se odstraní ze hry a ostatní kameny se vrátí na původní místo. Ponechat stav: když se soupeř nebo rozhodčí rozhodli kameny nechat.</span></div>`}
  return `<div class="panel" id="ed-panel">
    <div class="edhead"><span class="big">Kámen ${lab(k)}</span><span class="dot c-${colorOf(g,team)}"></span><span>${esc(g[team].name)}</span></div>
    ${rbox}
    <div class="row2">
      <div class="field"><label class="lbl" for="s-player">Hráč</label><select id="s-player">${opts}</select></div>
      <div class="field"><span class="lbl">Rotace</span><div class="seg" role="group" aria-label="Rotace">${['In','Out'].map(v=>`<button class="${s.turn===v?'on':''}" data-act="turn" data-v="${v}">${v}-turn</button>`).join('')}</div></div>
    </div>
    <div class="field"><span class="lbl">Rána ${s.shotAuto&&s.shot?'<span class="sugg" title="Aplikace ránu odhadla podle toho, kde kámen skončil a co vyřadil nebo posunul. Klepnutím na jinou ránu ji opravíte.">✦ návrh podle hodu</span>':''}</span><div class="chips">${SHOTS.map(v=>`<button class="chip ${s.shot===v?'on':''} ${s.shot===v&&s.shotAuto?'auto':''}" data-act="shot" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div></div>
    <div class="field"><span class="lbl">Kde skončil</span><div class="posline">${pos}${thrown(s)?'<button class="btn small ed" data-act="clearpos">Smazat</button>':''}</div>
    <div class="chips ed" role="group" aria-label="Kde kámen skončil">${OUTS.map(([v,l])=>`<button class="chip ${(v==='out'?s.out===true:s.out===v)?'on':''}" data-act="out" data-v="${v}">${l}</button>`).join('')}</div>
    ${eff||by?`<div class="effects">${eff?'Tento hod '+eff+'.':''} ${by}</div>`:''}</div>
    <div class="field mhide"><span class="lbl">Hodnocení hodu</span><div class="rates ed" role="group" aria-label="Hodnocení hodu">${RATES.map(v=>`<button class="rb r${v} ${s.rating===v?'on':''}" data-act="rate" data-v="${v}">${rateLabel(v)}</button>`).join('')}</div></div>
    <div class="field"><label class="lbl" for="s-note">Poznámka k hodu</label><textarea id="s-note" placeholder="Co bylo zavoláno, co se stalo, sweeping…">${esc(s.note)}</textarea></div>
    <div class="mhide">${stepper}</div>
  </div>`;
}
/* mobil: lišta dole s hodnocením a posunem mezi kameny, aby se při zápisu nemuselo posouvat */
function mbarHTML(g){
  const e=curEnd,k=curStone,s=g.ends[e].stones[k],team=teamOf(g,e,k),pre=k<FM.preset;
  return `<div class="mbar" id="mbar" role="toolbar" aria-label="Rychlý zápis">
    <div class="mrow"><button class="btn nav" data-act="prev" ${k===0?'disabled':''} aria-label="Předchozí kámen">‹</button>
      <span class="mlabel"><span class="dot c-${colorOf(g,team)}"></span> ${pre?'Umístěný kámen ':'Kámen '}${lab(k)}<small>${esc(pre?'':stoneName(g,e,s,k,team))}</small></span>
      <button class="btn nav ed" data-act="undo" ${undoStack.length?'':'disabled'} aria-label="Zpět"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg> Zpět</button>
      <button class="btn nav" data-act="next" ${k===FM.stones-1?'disabled':''} aria-label="Další kámen">›</button></div>
    ${pre?'':`<div class="rates ed">${RATES.map(v=>`<button class="rb r${v} ${s.rating===v?'on':''}" data-act="rate" data-v="${v}">${rateLabel(v)}</button>`).join('')}</div>`}
  </div>`;
}
function listHTML(g){
  const e=curEnd,end=g.ends[e];
  const groups=stoneGroups().map(gr=>{
    const rows=gr.ks.map(k=>{const s=end.stones[k],team=teamOf(g,e,k);
      const pos=s.out?outLabel(s):(s.x!=null?zoneOf(s.x,s.y):'—');
      const removed=s.removedBy!=null?` · vyř. ${lab(s.removedBy)}`:'';
      const viol=ruleActive(k)&&!(s.rule&&s.rule.kept)&&violations(g,e,k).length?'<span class="pill bad" title="Porušení pravidla">Pravidlo!</span>':'';
      return `<button class="srow nav ${k===curStone?'on':''} ${thrown(s)?'':'empty'}" data-act="stone" data-v="${k}">
        <span class="n num">${lab(k)}</span><span class="dot c-${colorOf(g,team)}" style="width:12px;height:12px"></span>
        <span class="t">${esc(stoneName(g,e,s,k,team))}</span>
        <span class="t m">${esc(s.shot||'—')}${s.turn?' · '+s.turn:''}</span>
        <span class="t m zc">${pos}${removed}</span>
        <span class="pill ${viol?'bad':isRated(s)?'r'+s.rating:'none'}">${viol?'Pravidlo!':isRated(s)?rateLabel(s.rating):'—'}</span></button>`}).join('');
    return `<div class="sgroup"><span class="gl">${gr.l}</span>${rows}</div>`}).join('');
  const del=end.stones.filter((s,k)=>k>=FM.preset&&thrown(s)).length;
  return `<div class="panel" id="list-panel"><div class="sheethead"><h3>Pořadí kamenů · End ${e+1}</h3><span class="muted" style="font-size:.85rem">${del}/${FM.stones-FM.preset} zapsáno</span></div><div class="slist">${groups}</div></div>`;
}
function resultHTML(g){
  const e=curEnd,end=g.ends[e],a=autoScore(g,e),ah=autoHammer(g,e);
  const autoTxt=a?(a.us===0&&a.them===0?'nikdo neboduje (blank)':a.us?`${esc(g.us.name)} ${a.us}`:`${esc(g.them.name)} ${a.them}`):null;
  return `<div class="panel" id="result-panel">
    <h3>Výsledek endu ${e+1}</h3>
    <div class="scorein">
      <label class="tn" for="sc-us"><span class="dot c-${colorOf(g,'us')}"></span><span>${esc(g.us.name)}</span></label>
      <input type="number" inputmode="numeric" id="sc-us" min="0" max="8" value="${end.score.us??''}" placeholder="–">
      <span class="colon" style="font-weight:700">:</span>
      <input type="number" inputmode="numeric" id="sc-them" min="0" max="8" value="${end.score.them??''}" placeholder="–">
      <label class="tn r" for="sc-them"><span>${esc(g.them.name)}</span><span class="dot c-${colorOf(g,'them')}"></span></label>
    </div>
    ${autoTxt?`<div class="auto"><span>Podle poloh kamenů: <b>${autoTxt}</b></span><button class="btn small ed" data-act="useauto">Použít</button></div>`:''}
    <div class="field"><label class="lbl" for="hm-sel">Výhoda</label><select id="hm-sel"><option value="" ${!end.hammer?'selected':''}>Automaticky (${esc(g[ah].name)})</option><option value="us" ${end.hammer==='us'?'selected':''}>${esc(g.us.name)}</option><option value="them" ${end.hammer==='them'?'selected':''}>${esc(g.them.name)}</option></select></div>
  </div>`;
}
function tacticHTML(g){
  const e=curEnd,tc=g.ends[e].tactic;
  return `<div class="panel" id="tactic-panel">
    <h3>Taktika endu ${e+1}</h3>
    <div class="field"><span class="lbl">Cíl endu</span><div class="chips">${GOALS.map(v=>`<button class="chip ${tc.goal===v?'on':''}" data-act="goal" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div></div>
    <div class="field"><span class="lbl">Cíl</span><div class="seg" role="group" aria-label="Splnění cíle">${Object.entries(METS).map(([k,l])=>`<button class="${tc.met===k?'on':''}" data-act="met" data-v="${k}">${l}</button>`).join('')}</div></div>
    <div class="field"><span class="lbl">Hodnocení taktiky (1–5)</span><div class="dots" role="group" aria-label="Hodnocení taktiky">${[1,2,3,4,5].map(n=>`<button class="${tc.rating>=n?'on':''}" data-act="trate" data-v="${n}" aria-label="${n} z 5">${n}</button>`).join('')}</div></div>
    <div class="field"><label class="lbl" for="t-note">Klíčová rozhodnutí</label><textarea id="t-note" placeholder="Volba ran, co zahrát jinak, komunikace skipa…">${esc(tc.note)}</textarea></div>
  </div>`;
}

function subsText(g,t,sb){if(!sb)return'';if(sb.reorder)return'změna pořadí v sestavě';return sb.pairs.map(([o,i])=>`${esc(o)} → ${esc(i)}`).join(', ')}
function subsList(g){const items=[];g.ends.forEach((_,e)=>['us','them'].forEach(t=>{const sb=subsAt(g,e,t);if(sb)items.push(`<li><b>End ${e+1}</b> · ${esc(g[t].name)}: ${subsText(g,t,sb)}</li>`)}));return items.length?`<h3 style="margin-top:10px">Střídání</h3><ul style="margin:0;padding-left:18px">${items.join('')}</ul>`:''}
/* nabídka pro nastupujícího hráče: náhradníci podle rozpisky */
function altOpts(g,t){return Array.from({length:FM.alts},(_,i)=>i).map(i=>{const n=(g[t].alts[i]||'').trim();return{v:n||'Náhradník '+(i+1),l:n?`${n} (náhradník ${i+1})`:'Náhradník '+(i+1)}})}

/* stats */
function collect(g){
  const blank=()=>({n:0,sum:0,cnt:{},inN:0,inS:0,outN:0,outS:0,pos:{}});
  const acc={us:{},them:{}},shots={us:{},them:{}},team={us:blank(),them:blank()};
  const add=(o,v)=>{o.n++;o.sum+=v;o.cnt[v]=(o.cnt[v]||0)+1};
  g.ends.forEach((end,e)=>end.stones.forEach((s,k)=>{
    if(!isRated(s))return;const t=teamOf(g,e,k),pi=stoneName(g,e,s,k,t),v=s.rating;
    const p=acc[t][pi]||(acc[t][pi]=blank());add(p,v);p.pos[posOf(k)]=1;
    if(s.turn==='In'){p.inN++;p.inS+=v}if(s.turn==='Out'){p.outN++;p.outS+=v}
    if(s.shot){const q=shots[t][s.shot]||(shots[t][s.shot]=blank());add(q,v)}
    add(team[t],v);
  }));
  return{acc,shots,team};
}
const bar=(p)=>p==null?'<span class="muted">—</span>':`<span class="bar"><span class="num">${p} %</span><i><b style="transform:scaleX(${p / 100})"></b></i></span>`;
/* mapa poloh: kde kameny zastavily po hodu (před posunutím dalšími kameny), barva = hodnocení */
let mapF={team:'us',player:'',shot:''};
function mapPoints(list,team,player,shot){const pts=[];
  list.forEach(g=>{useFmt(g);g.ends.forEach((end,e)=>end.stones.forEach((s,k)=>{if(k<FM.preset||s.out||s.x==null)return;if(teamOf(g,e,k)!==team)return;
    const nm=stoneName(g,e,s,k,team);if(player&&nm!==player)return;if(shot&&s.shot!==shot)return;pts.push({x:s.x,y:s.y,r:isRated(s)?s.rating:null,nm,shot:s.shot,k,e})}))});
  useFmt(cur());return pts}
function mapSVG(pts){
  const dots=pts.map(p=>`<circle cx="${p.x.toFixed(3)}" cy="${p.y.toFixed(3)}" r="${RS*.82}" class="md ${p.r==null?'nr':'r'+p.r}"><title>${esc(p.nm||'')}${p.shot?' · '+esc(p.shot):''}${p.r!=null?' · '+p.r+' %':''}</title></circle>`).join('');
  return `<svg class="mapsvg" viewBox="${-HALFW} -2.25 ${HALFW*2} 8.85" role="img" aria-label="Mapa poloh kamenů">
    <rect x="${-HALFW}" y="-2.25" width="${HALFW*2}" height="8.85" fill="var(--ice)"/><rect x="${-HALFW}" y="${HOUSE}" width="${HALFW*2}" height="${HOG-HOUSE}" fill="var(--fgz)"/>
    <circle r="${R12}" fill="var(--ring-blue)"/><circle r="${R8}" fill="var(--ring-white)"/><circle r="${R4}" fill="var(--ring-red)"/><circle r="${RB}" fill="var(--ring-white)"/>
    <line x1="${-HALFW}" x2="${HALFW}" y1="0" y2="0" stroke="var(--sheet-line)" stroke-width=".02"/><line x1="0" x2="0" y1="-2.25" y2="${HOG+.2}" stroke="var(--sheet-line)" stroke-width=".02"/>
    <line x1="${-HALFW}" x2="${HALFW}" y1="${BACK}" y2="${BACK}" stroke="var(--sheet-line)" stroke-width=".02"/><line x1="${-HALFW}" x2="${HALFW}" y1="${HOG}" y2="${HOG}" stroke="var(--sheet-line)" stroke-width=".06"/>${dots}</svg>`}
function mapStats(pts){const n=pts.length,inH=pts.filter(p=>Math.hypot(p.x,p.y)<=HOUSE).length,g=pts.filter(p=>inFGZ(p.x,p.y)).length,c4=pts.filter(p=>Math.hypot(p.x,p.y)<=R4+RS).length;
  const pc=v=>n?Math.round(v/n*100)+' %':'—';
  return `<div class="mapkpi"><div><b>${n}</b><span>kamenů</span></div><div><b>${pc(inH)}</b><span>v kruzích</span></div><div><b>${pc(c4)}</b><span>ve 4 ft</span></div><div><b>${pc(g)}</b><span>v guard zone</span></div></div>`}
function mapPanel(list,teams,scope){
  const players=[...new Set(mapPoints(list,mapF.team,'','').map(p=>p.nm).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'cs'));
  if(mapF.player&&!players.includes(mapF.player))mapF.player='';
  const pts=mapPoints(list,mapF.team,mapF.player,mapF.shot);
  const sel=(id,opts,val)=>`<select id="${id}" class="nav">${opts.map(([v,l])=>`<option value="${esc(v)}" ${v===val?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
  return `<div class="panel mappanel"><h3>Mapa poloh kamenů</h3>
    <div class="mapctl">${teams.length>1?`<div class="field"><label class="lbl" for="map-team">Tým</label>${sel('map-team',teams,mapF.team)}</div>`:''}
      <div class="field"><label class="lbl" for="map-player">Hráč</label>${sel('map-player',[['','Všichni hráči'],...players.map(n=>[n,n])],mapF.player)}</div>
      <div class="field"><label class="lbl" for="map-shot">Rána</label>${sel('map-shot',[['','Všechny rány'],...SHOTS.map(v=>[v,v])],mapF.shot)}</div></div>
    <div class="mapbody"><div class="mapsheet">${mapSVG(pts)}</div><div class="mapside">${mapStats(pts)}
      <div class="maplegend">${RATES.map(v=>`<span><i class="md r${v}"></i>${rateLabel(v)}</span>`).join('')}<span><i class="md nr"></i>bez hodnocení</span></div>
      <p class="legend">Body ukazují, kde kámen zastavil hned po hodu (než ho posunuly další kameny). Kameny mimo hru se nezobrazují.${scope?' '+scope:''}</p></div></div></div>`}
function statsHTML(g){
  const {acc,shots,team}=collect(g);
  const cntHead=RATES.map(v=>`<th>${rateLabel(v)}</th>`).join('');
  const cntCells=o=>RATES.map(v=>`<td>${o.cnt[v]||0}</td>`).join('');
  const ptable=(t)=>{
    const T=g[t],role=n=>{const i=T.players.findIndex(x=>(x||'').trim()===n);if(i>=0&&i<FM.players)return'Rozpiska: '+FM.roster[i];const a=T.alts.findIndex(x=>(x||'').trim()===n);if(a>=0)return'Náhradník '+(a+1);return[...FM.roster,...FM.pos].includes(n)?'Jméno nezadáno':'Mimo rozpisku'};
    const roster=[...T.players.slice(0,FM.players).map((x,i)=>dispName(x,i)),...T.alts.slice(0,FM.alts).map(x=>(x||'').trim()).filter(Boolean)];
    const order=[...new Set([...roster.filter((n,i)=>i<FM.players||acc[t][n]),...Object.keys(acc[t]).sort((a,b)=>a.localeCompare(b,'cs'))])];
    const rows=order.map(i=>{const p=acc[t][i]||{n:0,sum:0,cnt:{},inN:0,outN:0,pos:{}};const pp=Object.keys(p.pos).filter(x=>x>=0).map(x=>FM.pos[x]).join(', ');
      return `<tr><td class="name"><b>${esc(i)}</b><br><span class="muted" style="font-size:.8rem">${role(i)}${pp?' · házel/a jako '+pp:''}</span></td><td>${p.n}</td>${cntCells(p)}<td>${p.inN?Math.round(p.inS/p.inN)+' %':'—'}</td><td>${p.outN?Math.round(p.outS/p.outN)+' %':'—'}</td><td>${bar(pctOf(p))}</td></tr>`}).join('');
    return `<div class="panel"><div class="sheethead"><h2><span class="dot c-${colorOf(g,t)}" style="vertical-align:1px"></span> ${esc(g[t].name)}</h2><span class="muted">Tým ${pctOf(team[t])??'—'} %</span></div>
    <div class="tblwrap"><table><thead><tr><th>Hráč</th><th>Hody</th>${cntHead}<th>In</th><th>Out</th><th>Úspěšnost</th></tr></thead><tbody>${rows}</tbody></table></div></div>`};
  const stable=(t)=>{const rows=SHOTS.filter(s=>shots[t][s]).map(s=>{const q=shots[t][s];return `<tr><td>${esc(s)}</td><td>${q.n}</td>${cntCells(q)}<td>${bar(pctOf(q))}</td></tr>`}).join('');
    return `<div class="panel"><h3>Rány – ${esc(g[t].name)}</h3>${rows?`<div class="tblwrap"><table><thead><tr><th>Rána</th><th>Počet</th>${cntHead}<th>Úspěšnost</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<p class="muted">Zatím žádné ohodnocené rány s typem.</p>'}</div>`};
  return `<div style="display:flex;flex-direction:column;gap:14px">
    <div class="grid2">${subPanel(g,'us')}${subPanel(g,'them')}</div>
    <p class="legend">Úspěšnost je průměr hodnocení hodů (100, 75, 50, 25 nebo 0 %). Sloupce 100 % až 0 % ukazují, kolik hodů dostalo které hodnocení. Počítají se jen ohodnocené kameny ze všech endů.</p>
    ${mapPanel([g],[['us',g.us.name],['them',g.them.name]],'')}
    ${ptable('us')}${stable('us')}
    ${ptable('them')}${stable('them')}</div>`;
}

/* sestava a jedno střídání týmu */
function subPanel(g,t){
  const T=g[t],sb=g.subs[t],n=g.ends.length,ids=Array.from({length:FM.players},(_,i)=>i);
  const rows=ids.map(p=>`<dt>${FM.roster[p]}</dt><dd>${esc(dispName(T.players[p],p))}${sb&&sb.pos===p?` <span class="in">→ ${esc(sb.in)} od endu ${sb.end+1}</span>`:''}</dd>`).join('');
  const alts=Array.from({length:FM.alts},(_,i)=>(T.alts[i]||'').trim()).filter(Boolean);
  let box;
  if(!FM.alts){box=`<div class="subbox"><span class="effects">V mixed doubles nejsou náhradníci povoleni, střídání proto není možné.</span></div>`}
  else if(sb&&FM.nosub){box=`<div class="subbox"><b>Zapsané střídání: ${esc(dispName(T.players[sb.pos],sb.pos))} → ${esc(sb.in)}</b><span class="effects">V triples se během zápasu střídat nesmí, jen mezi zápasy. Pokud jde o chybu v zápisu, střídání zrušte.</span>
      <div class="confirm ed"><button class="btn small danger" data-act="subdel" data-t="${t}">Zrušit střídání</button></div></div>`}
  else if(FM.nosub){box=`<div class="subbox"><span class="effects">V triples se během zápasu střídat nesmí. Náhradníci mohou nastoupit až v dalším zápase: v něm je zapište do rozpisky místo hráče, kterého nahrazují.</span></div>`}
  else if(sb){box=`<div class="subbox"><b>Střídání: ${esc(dispName(T.players[sb.pos],sb.pos))} → ${esc(sb.in)}</b><span class="effects">Od endu ${sb.end+1} hraje ${esc(sb.in)} místo ${esc(dispName(T.players[sb.pos],sb.pos))}. Další střídání už pravidla nedovolují.</span>
      <div class="confirm ed"><button class="btn small danger" data-act="subdel" data-t="${t}">Zrušit střídání</button></div></div>`}
  else if(n<2){box=`<div class="subbox"><span class="effects">Střídání je možné až od 2. endu.</span></div>`}
  else{const ao=altOpts(g,t);
    box=`<div class="subbox ed"><b>Zapsat střídání</b><span class="effects">Každý tým může za zápas vystřídat jen jednou. Náhradník hraje na místě hráče, kterého střídá${FM.rotate?', a posouvá se s ním po pozicích':''}.</span>
      <div class="subform">
        <div class="field"><label class="lbl" for="sub-${t}-end">Od endu</label><select id="sub-${t}-end">${Array.from({length:n-1},(_,i)=>`<option value="${i+1}" ${i+1===Math.min(Math.max(curEnd,1),n-1)?'selected':''}>${i+2}</option>`).join('')}</select></div>
        <div class="field"><label class="lbl" for="sub-${t}-out">Odchází</label><select id="sub-${t}-out">${ids.map(p=>`<option value="${p}">${esc(dispName(T.players[p],p))}${FM.rotate?'':' ('+FM.roster[p]+')'}</option>`).join('')}</select></div>
        <div class="field"><label class="lbl" for="sub-${t}-in">Přichází</label><select id="sub-${t}-in">${ao.map(o=>`<option value="${esc(o.v)}">${esc(o.l)}</option>`).join('')}<option value="__custom">Jiné jméno…</option></select>
          <input type="text" id="sub-${t}-inx" autocomplete="off" placeholder="Napište jméno" hidden></div>
      </div>
      <div class="confirm"><button class="btn small primary" data-act="subadd" data-t="${t}">Zapsat střídání</button><span class="effects" id="sub-${t}-msg" aria-live="polite"></span></div></div>`}
  return `<div class="panel"><div class="sheethead"><h2><span class="dot c-${colorOf(g,t)}" style="vertical-align:1px"></span> Sestava – ${esc(T.name)}</h2>${T.coach?`<span class="muted">Trenér: ${esc(T.coach)}</span>`:''}</div>
    <dl class="lu-list">${rows}${FM.alts?`<dt>${FM.alts>1?'Náhradníci':'Náhradník'}</dt><dd>${alts.length?alts.map(esc).join(', '):'<span class="muted">nezadán</span>'}</dd>`:''}</dl>
    <span class="legend">Jména měníte v části Zápas a rozpiska nahoře.${FM.rotate?' V triples se pozice posouvají po každých dvou endech: v 1.–2. endu hraje Hráč 1 Lead, Hráč 2 Middle a Hráč 3 Skip.':''}${FM.key==='md'?' Kdo hází 1. a 5. kámen, volíte u každého endu v bloku Rozestavení endu.':''}</span>
    ${box}</div>`;
}

/* počet porušení pravidel podle týmu, který hod hodil */
function ruleCounts(g){const r={us:0,them:0};g.ends.forEach((end,e)=>end.stones.forEach((s,k)=>{if(!ruleActive(k))return;if((s.rule&&s.rule.applied)||violations(g,e,k).length)r[teamOf(g,e,k)]++}));return r}

/* summary */
function endStats(g,t){
  let hamN=0,hamConv=0,steals=0,forced=0,blanks=0;
  g.ends.forEach((end,e)=>{if(!endPlayed(end))return;const h=hammerFor(g,e),us=+end.score[t]||0,op=+end.score[other(t)]||0;
    if(us===0&&op===0){blanks++;return}
    if(h===t){hamN++;if(us>=2)hamConv++}else{if(us>0)steals++;if(op===1)forced++}});
  return{hamN,hamConv,steals,forced,blanks};
}
/* průběh skóre po endech (worm chart) */
function wormHTML(g){
  const ends=[];let cu=0,ct=0;g.ends.forEach((end,i)=>{if(!endPlayed(end))return;cu+=+end.score.us||0;ct+=+end.score.them||0;ends.push({i,us:cu,them:ct,h:hammerFor(g,i),su:+end.score.us||0,st:+end.score.them||0})});
  if(!ends.length)return'';
  const N=g.ends.length,max=Math.max(3,cu,ct),W=640,H=230,L=36,R=16,T=16,B=34,iw=W-L-R,ih=H-T-B;
  const X=i=>L+iw*(i/N),Y=v=>T+ih*(1-v/max);
  const line=t=>[[0,0],...ends.map(o=>[o.i+1,o[t]])].map(([i,v])=>`${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const grid=Array.from({length:max+1},(_,v)=>v).filter(v=>max<=10||v%2===0).map(v=>`<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" class="wg"/><text x="${L-8}" y="${Y(v)+4}" text-anchor="end" class="wl">${v}</text>`).join('');
  const xs=Array.from({length:N},(_,i)=>`<text x="${X(i+1)}" y="${H-12}" text-anchor="middle" class="wl">${i+1}</text>`).join('');
  const dots=t=>ends.map(o=>`<circle cx="${X(o.i+1)}" cy="${Y(o[t])}" r="${o['s'+(t==='us'?'u':'t')]>0?5.5:3.5}" class="wd c-${colorOf(g,t)}"><title>${esc(g[t].name)} po ${o.i+1}. endu: ${o[t]}</title></circle>`).join('');
  const ham=ends.map(o=>`<text x="${X(o.i+1)}" y="${H-1}" text-anchor="middle" class="wh c-${colorOf(g,o.h)}">●</text>`).join('');
  return `<div class="panel worm"><h3>Průběh skóre</h3>
    <div class="wormwrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Průběh skóre po endech">${grid}${xs}${ham}
      <polyline points="${line('them')}" class="wline c-${colorOf(g,'them')}"/><polyline points="${line('us')}" class="wline c-${colorOf(g,'us')}"/>${dots('them')}${dots('us')}</svg></div>
    <p class="legend"><span class="dot c-${colorOf(g,'us')}" style="width:10px;height:10px;vertical-align:-1px"></span> ${esc(g.us.name)} &nbsp; <span class="dot c-${colorOf(g,'them')}" style="width:10px;height:10px;vertical-align:-1px"></span> ${esc(g.them.name)} · Velký bod = tým v endu skóroval. Tečka pod číslem endu ukazuje, kdo měl výhodu.</p></div>`;
}
function summaryHTML(g){
  const sm=g.summary,t=totals(g),{team}=collect(g),su=endStats(g,'us'),st=endStats(g,'them'),rv=ruleCounts(g);
  const head=g.ends.map((_,i)=>`<th>${i+1}</th>`).join('');
  const row=(tm)=>`<tr><td><span class="dot c-${colorOf(g,tm)}" style="width:11px;height:11px;vertical-align:-1px"></span> ${esc(g[tm].name)}</td>${g.ends.map((end,i)=>`<td>${endPlayed(end)?(end.score[tm]??0):''}${hammerFor(g,i)===tm?' '+hammerMark(g,tm):''}</td>`).join('')}<td><b>${t[tm]}</b></td></tr>`;
  const tacs=g.ends.map((end,i)=>{const tc=end.tactic;if(!tc.rating&&!tc.goal&&!tc.note&&!endPlayed(end))return'';
    return `<div class="tacrow"><span class="e">E${i+1}</span><div><div class="line1">${tc.goal?`<b>${esc(tc.goal)}</b>`:'<span class="muted">Cíl nezadán</span>'}${tc.met?`<span class="pill ${tc.met==='ano'?'good':tc.met==='ne'?'bad':'B'}">${METS[tc.met]}</span>`:''}<span class="mini" aria-label="Taktika ${tc.rating} z 5">${[1,2,3,4,5].map(n=>`<i class="${tc.rating>=n?'f':''}"></i>`).join('')}</span><span class="muted num">${endPlayed(end)?(end.score.us??0)+':'+(end.score.them??0):''}</span></div>${tc.note?`<div style="margin-top:4px">${esc(tc.note)}</div>`:''}</div></div>`}).join('');
  const rated=g.ends.filter(e=>e.tactic.rating);const avg=rated.length?(rated.reduce((a,e)=>a+e.tactic.rating,0)/rated.length).toFixed(1).replace('.',','):'—';
  const stars=(f,l)=>`<div class="field"><span class="lbl">${l}</span><div class="dots" role="group" aria-label="${l}">${[1,2,3,4,5].map(n=>`<button class="${sm[f]>=n?'on':''}" data-act="srate" data-f="${f}" data-v="${n}" aria-label="${n} z 5">${n}</button>`).join('')}</div></div>`;
  const pu=pctOf(team.us),pt=pctOf(team.them);
  return `<div style="display:flex;flex-direction:column;gap:14px">
  <div class="panel"><h3>Výsledková tabule</h3><div class="tblwrap"><table class="sb"><thead><tr><th>Tým</th>${head}<th>Celkem</th></tr></thead><tbody>${row('us')}${row('them')}</tbody></table></div><p class="legend">Kladívko u skóre označuje tým s výhodou v daném endu.</p>${subsList(g)}</div>
  <div class="panel"><h3>Klíčová čísla – ${esc(g.us.name)}</h3><div class="kpis">
    <div class="kpi"><div class="v num">${pu??'—'}${pu!=null?' %':''}</div><div class="k">Úspěšnost hodů (soupeř ${pt??'—'}${pt!=null?' %':''})</div></div>
    <div class="kpi"><div class="v num">${su.hamConv}/${su.hamN}</div><div class="k">S výhodou za 2 a více</div></div>
    <div class="kpi"><div class="v num">${su.steals}</div><div class="k">Ukradené endy (soupeř ${st.steals})</div></div>
    <div class="kpi"><div class="v num">${rv.us}</div><div class="k">Porušení pravidel FGZ${FM.notick?' a no-tick':''} (soupeř ${rv.them})</div></div>
    <div class="kpi"><div class="v num">${su.forced}</div><div class="k">Soupeř vynucen na 1</div></div>
    <div class="kpi"><div class="v num">${su.blanks}</div><div class="k">Blank endy</div></div>
    <div class="kpi"><div class="v num">${avg}</div><div class="k">Průměr taktiky endů</div></div>
  </div></div>
  ${wormHTML(g)}
  <div class="grid2">
    <div class="panel"><h3>Taktika po endech</h3>${tacs||'<p class="muted">Zatím bez hodnocení endů.</p>'}</div>
    <div class="panel"><h3>Celkové hodnocení</h3>
      ${stars('tactic','Taktika')}${stars('exec','Provedení hodů')}${stars('mental','Komunikace a psychika')}
      <div class="field"><label class="lbl" for="sum-worked">Co fungovalo</label><textarea id="sum-worked">${esc(sm.worked)}</textarea></div>
      <div class="field"><label class="lbl" for="sum-improve">Co zlepšit</label><textarea id="sum-improve">${esc(sm.improve)}</textarea></div>
      <div class="field"><label class="lbl" for="sum-conclusion">Závěr a úkoly na trénink</label><textarea id="sum-conclusion">${esc(sm.conclusion)}</textarea></div>
    </div>
  </div>
  <div class="panel report"><h3>Shrnutí pro tým</h3>
    <p class="effects" style="margin:0">Hotový text se skóre, úspěšností hráčů, taktikou endů a závěrem. Zkopírujte ho do zprávy týmu, nebo stáhněte jako soubor.</p>
    <div class="confirm"><button class="btn small primary nav" data-act="rcopy">${icon('copy')}<span>Kopírovat shrnutí</span></button><button class="btn small nav" data-act="rdl">${icon('download')}<span>Stáhnout shrnutí (.txt)</span></button></div>
    <textarea id="report-text" class="nav" readonly rows="10">${esc(reportText(g))}</textarea>
  </div></div>`;
}
/* textové shrnutí zápasu pro hráče */
function reportText(g){
  const t=totals(g),{acc,team}=collect(g),su=endStats(g,'us'),L=[];
  const res=t.us>t.them?'Výhra':t.us<t.them?'Prohra':'Remíza';
  L.push(`${g.us.name} – ${g.them.name}  ${t.us}:${t.them}  (${res})`);
  L.push([fmtDate(g.date),g.event,FM.label].filter(Boolean).join(' · '));
  L.push('');
  const pl=g.ends.map((e,i)=>({e,i})).filter(o=>endPlayed(o.e));
  if(pl.length){L.push('Skóre po endech:');
    L.push(pl.map(({e,i})=>`E${i+1} ${e.score.us??0}:${e.score.them??0}${hammerFor(g,i)==='us'?'*':''}`).join('  '));
    L.push('(* = měli jsme kladívko)');L.push('')}
  const pu=pctOf(team.us),pt=pctOf(team.them);
  L.push('Klíčová čísla:');
  L.push(`- Úspěšnost hodů: ${pu??'—'} %  (soupeř ${pt??'—'} %)`);
  L.push(`- S kladivem za 2 a více: ${su.hamConv}/${su.hamN}`);
  L.push(`- Ukradené endy: ${su.steals}, soupeř vynucen na 1: ${su.forced}, blank endy: ${su.blanks}`);
  L.push('');
  const names=Object.keys(acc.us).sort((a,b)=>{const pa=Math.min(...Object.keys(acc.us[a].pos).map(Number)),pb=Math.min(...Object.keys(acc.us[b].pos).map(Number));return pa-pb});
  if(names.length){L.push('Hráči:');names.forEach(n=>{const p=acc.us[n],ps=Object.keys(p.pos).filter(x=>x>=0).map(x=>FM.pos[x]).join('/');
    L.push(`- ${n}${ps?' ('+ps+')':''}: ${pctOf(p)} %  (${p.n} hodů${p.inN?', In '+Math.round(p.inS/p.inN)+' %':''}${p.outN?', Out '+Math.round(p.outS/p.outN)+' %':''})`)});L.push('')}
  const tac=g.ends.map((e,i)=>{const tc=e.tactic;if(!tc.goal&&!tc.note&&!tc.rating)return'';
    return `- E${i+1}: ${tc.goal||'cíl nezadán'}${tc.met?' – '+METS[tc.met]:''}${tc.rating?' ('+tc.rating+'/5)':''}${tc.note?'. '+tc.note.replace(/\s+/g,' '):''}`}).filter(Boolean);
  if(tac.length){L.push('Taktika endů:');L.push(...tac);L.push('')}
  const sm=g.summary;
  if(sm.worked){L.push('Co fungovalo:');L.push(sm.worked.trim());L.push('')}
  if(sm.improve){L.push('Co zlepšit:');L.push(sm.improve.trim());L.push('')}
  if(sm.conclusion){L.push('Závěr a úkoly na trénink:');L.push(sm.conclusion.trim());L.push('')}
  if(g.us.coach)L.push('Trenér: '+g.us.coach);
  return L.join('\n').replace(/\n{3,}/g,'\n\n').trim();
}

/* sezóna: statistiky přes více zápasů jednoho týmu */
function seasonHTML(g){
  const all=Object.values(games).filter(x=>!x.sample);
  const teams=[...new Set(all.map(x=>(x.us.name||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'cs'));
  if(!seasonTeam||!teams.includes(seasonTeam))seasonTeam=teams.includes((g.us.name||'').trim())?(g.us.name||'').trim():teams[0]||null;
  let list=all.filter(x=>(x.us.name||'').trim()===seasonTeam).sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.created||0)-(b.created||0));
  if(seasonN)list=list.slice(-seasonN);
  const head=`<div class="panel seasonhead"><div class="field"><label class="lbl" for="season-team">Tým</label><select id="season-team" class="nav">${teams.map(n=>`<option ${n===seasonTeam?'selected':''}>${esc(n)}</option>`).join('')||'<option>—</option>'}</select></div>
    <div class="field"><span class="lbl">Období</span><div class="seg" role="group" aria-label="Období">${[[0,'Vše'],[10,'Posledních 10'],[5,'Posledních 5']].map(([n,l])=>`<button class="nav ${seasonN===n?'on':''}" data-act="sn" data-v="${n}">${l}</button>`).join('')}</div></div>
    <p class="effects" style="margin:0;flex-basis:100%">Souhrn všech zápisů týmu v tomto prohlížeči (bez ukázky). Hráči se párují podle jména, proto pište jména pokaždé stejně.</p></div>`;
  if(!list.length)return `<div style="display:flex;flex-direction:column;gap:14px">${head}<div class="empty-state"><h2>Zatím žádné zápasy</h2><p class="muted">Jakmile zapíšete zápasy, uvidíte tu vývoj úspěšnosti hráčů a ran přes celou sezónu.</p></div></div>`;
  const P={},S={},rows=[];let w=0,l=0,d=0,tSum=0,tN=0,oSum=0,oN=0;
  list.forEach((x,gi)=>{useFmt(x);const {acc,shots,team}=collect(x),t=totals(x),played=x.ends.some(endPlayed);
    if(played){if(t.us>t.them)w++;else if(t.us<t.them)l++;else d++}
    tSum+=team.us.sum;tN+=team.us.n;oSum+=team.them.sum;oN+=team.them.n;
    rows.push({x,t,played,pu:pctOf(team.us),pt:pctOf(team.them)});
    for(const n in acc.us){const a=acc.us[n],p=P[n]||(P[n]={n:0,sum:0,inN:0,inS:0,outN:0,outS:0,games:0,per:{},pos:{}});
      p.n+=a.n;p.sum+=a.sum;p.inN+=a.inN;p.inS+=a.inS;p.outN+=a.outN;p.outS+=a.outS;p.games++;p.per[gi]=pctOf(a);Object.keys(a.pos).forEach(k=>{if(k>=0)p.pos[FM.pos[k]]=1})}
    for(const k in shots.us){const a=shots.us[k],q=S[k]||(S[k]={n:0,sum:0,per:{}});q.n+=a.n;q.sum+=a.sum;q.per[gi]=pctOf(a)}
  });
  useFmt(cur());
  const pc=(sum,n)=>n?Math.round(sum/n):null;
  const spark=per=>`<span class="spark" aria-hidden="true">${list.map((_,i)=>per[i]==null?'<i class="na"></i>':`<i style="transform:scaleY(${Math.max(6, per[i]) / 100})" class="${per[i]>=75?'hi':per[i]>=50?'mid':'lo'}" title="${per[i]} %"></i>`).join('')}</span>`;
  const trend=per=>{const v=list.map((_,i)=>per[i]).filter(x=>x!=null);if(v.length<4)return'<span class="muted">—</span>';const h=Math.floor(v.length/2),a=v.slice(0,h),b=v.slice(-h),m=z=>z.reduce((s,x)=>s+x,0)/z.length,dd=Math.round(m(b)-m(a));
    return `<span class="trend ${dd>=3?'up':dd<=-3?'down':''}">${dd>=3?'▲ +':dd<=-3?'▼ ':'● '}${dd>=3||dd<=-3?dd+' %':'stabilní'}</span>`};
  const teamPer={};rows.forEach((r,i)=>teamPer[i]=r.pu);
  const prow=Object.keys(P).sort((a,b)=>P[b].n-P[a].n).map(n=>{const p=P[n];return `<tr><td class="name"><b>${esc(n)}</b><br><span class="muted" style="font-size:.8rem">${Object.keys(p.pos).join(', ')}</span></td><td>${p.games}</td><td>${p.n}</td><td>${p.inN?pc(p.inS,p.inN)+' %':'—'}</td><td>${p.outN?pc(p.outS,p.outN)+' %':'—'}</td><td>${bar(pc(p.sum,p.n))}</td><td>${spark(p.per)}</td><td>${trend(p.per)}</td></tr>`}).join('');
  const srow=SHOTS.filter(k=>S[k]).map(k=>{const q=S[k];return `<tr><td>${esc(k)}</td><td>${q.n}</td><td>${bar(pc(q.sum,q.n))}</td><td>${spark(q.per)}</td><td>${trend(q.per)}</td></tr>`}).join('');
  const mrow=rows.slice().reverse().map(r=>`<tr><td>${esc(fmtDate(r.x.date)||'—')}</td><td class="name"><b>${esc(r.x.them.name)}</b>${r.x.event?`<br><span class="muted" style="font-size:.8rem">${esc(r.x.event)}</span>`:''}</td><td><span class="pill ${!r.played?'':r.t.us>r.t.them?'good':r.t.us<r.t.them?'bad':'B'}">${r.played?(r.t.us>r.t.them?'V':r.t.us<r.t.them?'P':'R'):'—'}</span> <b class="num">${r.t.us}:${r.t.them}</b></td><td>${bar(r.pu)}</td><td>${r.pt==null?'—':r.pt+' %'}</td><td><button class="btn small nav" data-act="opengame" data-v="${r.x.id}">Otevřít</button></td></tr>`).join('');
  return `<div style="display:flex;flex-direction:column;gap:14px">${head}
  <div class="panel"><h3>${esc(seasonTeam)} – přehled</h3><div class="kpis">
    <div class="kpi"><div class="v num">${list.length}</div><div class="k">Zápasů</div></div>
    <div class="kpi"><div class="v num">${w}–${l}${d?'–'+d:''}</div><div class="k">Výhry–prohry${d?'–remízy':''}</div></div>
    <div class="kpi"><div class="v num">${pc(tSum,tN)??'—'}${tN?' %':''}</div><div class="k">Úspěšnost týmu (soupeři ${pc(oSum,oN)??'—'}${oN?' %':''})</div></div>
    <div class="kpi"><div class="v">${spark(teamPer)}</div><div class="k">Úspěšnost po zápasech ${trend(teamPer)}</div></div>
  </div></div>
  ${(()=>{const sv=mapF.team;mapF.team='us';const h=mapPanel(list,[],'Součet za vybrané zápasy týmu '+esc(seasonTeam)+'.');mapF.team=sv;return h})()}
  <div class="panel"><h3>Hráči přes zápasy</h3><div class="tblwrap"><table><thead><tr><th>Hráč</th><th>Zápasy</th><th>Hody</th><th>In</th><th>Out</th><th>Úspěšnost</th><th>Po zápasech</th><th>Trend</th></tr></thead><tbody>${prow||'<tr><td colspan="8" class="muted">Zatím žádné ohodnocené hody.</td></tr>'}</tbody></table></div>
    <p class="legend">Sloupečky ukazují úspěšnost v jednotlivých zápasech od nejstaršího vlevo. Trend porovnává první a druhou polovinu zápasů (od 4 zápasů).</p></div>
  <div class="grid2">
    <div class="panel"><h3>Rány přes zápasy</h3>${srow?`<div class="tblwrap"><table><thead><tr><th>Rána</th><th>Počet</th><th>Úspěšnost</th><th>Po zápasech</th><th>Trend</th></tr></thead><tbody>${srow}</tbody></table></div>`:'<p class="muted">Zatím žádné ohodnocené rány s typem.</p>'}</div>
    <div class="panel"><h3>Zápasy</h3><div class="tblwrap"><table><thead><tr><th>Datum</th><th>Soupeř</th><th>Výsledek</th><th>Úspěšnost</th><th>Soupeř</th><th></th></tr></thead><tbody>${mrow}</tbody></table></div></div>
  </div></div>`;
}

/* ---------- events ---------- */
function svgPoint(ev){const svg=$('#sheet');const pt=svg.createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;return pt.matrixTransform(svg.getScreenCTM().inverse())}
function hitStone(list,p){let best=null,bd=RS*1.25;list.forEach(o=>{const d=Math.hypot(o.x-p.x,o.y-p.y);if(d<bd){bd=d;best=o}});return best}
/* tažení kamene myší nebo prstem; po puštění se poloha uloží */
let drag=null,suppressClick=false;
const clampPos=p=>({x:Math.max(-HALFW+RS,Math.min(HALFW-RS,p.x)),y:Math.max(BACK-RS-.2,Math.min(HOG,p.y))});
function startDrag(ev,k,el){
  const svg=$('#sheet');drag={k,el,id:ev.pointerId,moved:false,start:svgPoint(ev),pos:null};
  /* pulz se přesune na tažený kámen a jede s ním */
  const ring=svg.querySelector('.curring');if(ring){const tr=el.getAttribute('transform');if(tr)ring.setAttribute('transform',tr);svg.appendChild(ring)}
  svg.classList.add('dragging');try{svg.setPointerCapture(ev.pointerId)}catch(e){}
}
document.getElementById('app').addEventListener('pointerdown',ev=>{
  const svg=ev.target.closest('#sheet');if(!svg||readOnly||ev.button>0)return;
  const g=ev.target.closest('.drg');
  if(g){ev.preventDefault();startDrag(ev,+g.dataset.k,g);return}
  /* myší nebo perem: stisk do prázdné plochy kámen umístí a hned ho jde táhnout */
  if(mode==='place'&&ev.pointerType!=='touch'){
    const c=clampPos(svgPoint(ev)),r=v=>Math.round(v*1000)/1000,s=cur().ends[curEnd].stones[curStone];
    s.x=r(c.x);s.y=r(c.y);s.out=false;touch();renderWork();renderEndbar();suppressClick=true;
    const el=$(`#sheet .drg[data-k="${curStone}"]`);if(el){ev.preventDefault();startDrag(ev,curStone,el);drag.moved=true}
  }
});
/* na dotykové obrazovce tažení kamene nesmí posouvat stránku */
document.addEventListener('touchstart',ev=>{if(ev.target.closest&&ev.target.closest('#sheet .drg'))ev.preventDefault()},{passive:false});
window.addEventListener('pointermove',ev=>{
  if(!drag||ev.pointerId!==drag.id)return;
  const p=svgPoint(ev);if(!drag.moved&&Math.hypot(p.x-drag.start.x,p.y-drag.start.y)<.04)return;
  drag.moved=true;const c=clampPos(p);drag.pos=c;drag.el.setAttribute('transform',`translate(${c.x} ${c.y})`);
  const ring=$('#sheet .curring');if(ring)ring.setAttribute('transform',`translate(${c.x} ${c.y})`);
});
function endDrag(ev,cancel){
  if(!drag||(ev&&ev.pointerId!==drag.id))return;
  const d=drag;drag=null;const svg=$('#sheet');if(svg)svg.classList.remove('dragging');
  if(!d.moved){if(!cancel&&ev&&ev.pointerType==='touch')sheetClick(ev);return}
  suppressClick=true;setTimeout(()=>{suppressClick=false},0);
  if(cancel||!d.pos){renderWork();return}
  const g=cur(),end=g.ends[curEnd],t=curStone,r=v=>Math.round(v*1000)/1000,x=r(d.pos.x),y=r(d.pos.y);
  if(d.k===t){const s=end.stones[t];s.x=x;s.y=y;s.out=false}
  else{const s=end.stones[d.k];s.moves=(s.moves||[]).filter(m=>m.by!==t);s.moves.push({by:t,x,y});movingK=null}
  touch();renderWork();renderEndbar();
}
window.addEventListener('pointerup',ev=>endDrag(ev,false));
window.addEventListener('pointercancel',ev=>endDrag(ev,true));
function sheetClick(ev){
  if(readOnly)return;const g=cur();const end=g.ends[curEnd],t=curStone;
  const p=svgPoint(ev);
  const x=Math.max(-HALFW+RS,Math.min(HALFW-RS,p.x)),y=Math.max(BACK-RS-.2,Math.min(HOG,p.y));
  const r=v=>Math.round(v*1000)/1000;
  if(mode==='place'){const s=end.stones[t];s.x=r(x);s.y=r(y);s.out=false}
  else if(mode==='move'){
    const vis=stateAt(end,t).filter(o=>o.k<t);
    if(movingK==null){const h=hitStone(vis,p);if(!h)return;movingK=h.k}
    else{const s=end.stones[movingK];s.moves=(s.moves||[]).filter(m=>m.by!==t);s.moves.push({by:t,x:r(x),y:r(y)});movingK=null}
  }else if(mode==='remove'){
    const ghosts=end.stones.map((s,k)=>s.removedBy===t?{k,...(posAt(end,k,t-1)||{x:99,y:99})}:null).filter(Boolean);
    const gh=hitStone(ghosts,p);
    if(gh){end.stones[gh.k].removedBy=null}
    else{const h=hitStone(stateAt(end,t).filter(o=>o.k<t),p);if(!h)return;end.stones[h.k].removedBy=t}
  }
  touch();renderWork();renderEndbar();
}
document.getElementById('app').addEventListener('click',ev=>{
  if(ev.target.closest('#sheet')){if(suppressClick){suppressClick=false;return}sheetClick(ev);return}
  const b=ev.target.closest('[data-act]');if(!b||b.disabled)return;mergeNext=false;
  const a=b.dataset.act,v=b.dataset.v,g=cur();
  const end=g?g.ends[curEnd]:null,s=end?end.stones[curStone]:null;
  switch(a){
    case'rjump':{const q=$('#rules-q');if(q&&q.value){q.value='';filterRules('')}const t=document.getElementById('rule-'+v);if(t)t.scrollIntoView({block:'start'});return}
    case'focus-toggle':focusMode=!focusMode;focusHeaderOpen=false;focusDrawer=null;tab='ends';syncFocusLayout();render();return;
    case'focus-exit':focusMode=false;focusHeaderOpen=false;focusDrawer=null;syncFocusLayout();render();return;
    case'focus-header':focusHeaderOpen=!focusHeaderOpen;syncFocusLayout();renderBody();return;
    case'focus-drawer':focusDrawer=focusDrawer===v?null:v;renderWork();return;
    case'focus-close':focusDrawer=null;renderWork();return;
    case'undo':doUndo();return;
    case'theme':setTheme(isDark()?'light':'dark');return;
    case'rcopy':{const ta=$('#report-text');if(!ta)return;ta.value=reportText(g);const fb=()=>{ta.focus();ta.select();setStatus('Text je označený, zkopírujte ho (Ctrl+C).')};
      try{navigator.clipboard.writeText(ta.value).then(()=>setStatus('Shrnutí zkopírováno. Vložte ho do zprávy týmu.'),fb)}catch(e){fb()}return}
    case'rdl':{const ta=$('#report-text');if(!ta)return;ta.value=reportText(g);saveFile('curling-shrnuti-'+(g.date||todayISO())+'.txt',ta.value).then(r=>setStatus(r==='saved'?'Shrnutí staženo.':r==='declined'?'Stažení bylo zrušeno.':'Soubor se tady nedá stáhnout. Použijte Kopírovat shrnutí.'));return}
    case'sn':seasonN=Number(v);renderBody();return;
    case'opengame':if(games[v]){curId=v;lsSet('curl.cur',curId);confirmDel=false;resetEndPos(0);tab='summary';render()}return;
    case'metatoggle':metaOpen=!metaOpen;confirmDel=false;renderMeta();renderBoard();applyRO();return;
    case'bmore':moreOpen=!moreOpen;renderTabs();return;
    case'tab':moreOpen=false;tab=v;if(focusMode&&v!=='ends'){focusMode=false;focusDrawer=null;focusHeaderOpen=false;renderHeader();}syncFocusLayout();renderTabs();renderBody();applyRO();
      /* na mobilu a tabletu začít každou záložku od začátku stránky */
      try{if(matchMedia('(max-width:1180px), (pointer:coarse)').matches){document.scrollingElement.scrollTop=0;window.scrollTo(0,0)}}catch(e){}
      return;
    case'end':resetEndPos(+v);renderEndbar();if(tab==='order')renderOrder();else renderWork();return;
    case'addend':g.ends.push(newEnd());touch();resetEndPos(g.ends.length-1);renderBoard();renderMeta();renderEndbar();if(tab==='order')renderOrder();else renderWork();return;
    case'stone':curStone=Number(v);movingK=null;if(mode!=='place'&&curStone===0)mode='place';
      if(tab!=='ends'){tab='ends';renderTabs();renderBody();applyRO();window.scrollTo({top:0})}else renderWork();return;
    case'prev':if(curStone>0){curStone--;movingK=null;if(curStone===0)mode='place'}renderWork();return;
    case'next':if(curStone<FM.stones-1){curStone++;movingK=null}renderWork();return;
    case'view':view=isZoomed()?'full':'house';renderWork();return;
    case'mode':mode=v;movingK=null;renderWork();return;
    case'shot':s.shot=s.shot===v?'':v;s.shotManual=true;s.shotAuto=false;break;
    case'turn':s.turn=s.turn===v?'':v;break;
    case'rate':{const nv=Number(v),was=isRated(s);s.rating=s.rating===nv?'':nv;
      if(!was&&isRated(s)&&thrown(s)&&curStone<FM.stones-1&&curStone===lastThrown(end)&&!thrown(end.stones[curStone+1])){touch();curStone++;mode='place';movingK=null;renderWork();return}
      break}
    case'out':{const val=v==='out'?true:v;s.out=s.out===val?false:val;if(s.out){s.x=null;s.y=null;s.moves=[];}break}
    case'clearpos':s.x=null;s.y=null;s.out=false;break;
    case'useauto':{const r=autoScore(g,curEnd);if(r){end.score={us:r.us,them:r.them}}touch();renderBoard();renderEndbar();renderWork();return}
    case'fmt':{if(g.format===v)return;
      const used=g.ends.some(en=>endPlayed(en)||en.stones.some((st,k)=>k>=FM.preset&&(thrown(st)||isRated(st)||st.shot)));
      if(used){setStatus('Formát hry nejde změnit, když už jsou v zápase zapsané kameny nebo skóre.');const n=$('#fmt-note');if(n)n.textContent='Formát hry nejde změnit, když už jsou v zápase zapsané kameny nebo skóre. Založte nový zápas.';return}
      const old=FM,nf=FORMATS[v];g.format=v;useFmt(g);
      const cnt=g.ends.length===old.ends?nf.ends:g.ends.length;g.ends=Array.from({length:cnt},()=>newEnd(nf));
      ['us','them'].forEach(t=>{while(g[t].players.length<nf.players)g[t].players.push('');while(g[t].alts.length<nf.alts)g[t].alts.push('');const sb=g.subs[t];if(sb&&(!nf.alts||sb.pos>=nf.players||sb.end>=cnt))g.subs[t]=null});
      touch();resetEndPos(0);render();setStatus('Formát hry: '+nf.label+'.');return}
    case'rapply':{applyRule(end,curStone,v);touch();renderWork();renderEndbar();setStatus('Pravidlo uplatněno, kameny jsou vrácené.');return}
    case'rkeep':{s.rule={type:(violations(g,curEnd,curStone)[0]||{}).type||'fgz',kept:true};touch();renderWork();return}
    case'rundo':{undoRule(end,curStone);touch();renderWork();renderEndbar();return}
    case'rclear':{delete s.rule;touch();renderWork();return}
    case'pp':{const h=hammerFor(g,curEnd);
      if(v&&(curEnd>=8||ppUsedBy(g,h,curEnd)>=0)){setStatus('Power play už tým s výhodou použil, nebo jde o extra end.');return}
      end.pp=v||null;presetPos(end.pp).forEach((q,i)=>{if(end.stones[i]){end.stones[i].x=q.x;end.stones[i].y=q.y;end.stones[i].out=false}});
      touch();renderWork();return}
    case'subadd':{const t=b.dataset.t,T=g[t];if(g.subs[t])return;
      const eS=$(`#sub-${t}-end`),oS=$(`#sub-${t}-out`),iS=$(`#sub-${t}-in`),xI=$(`#sub-${t}-inx`),msg=$(`#sub-${t}-msg`);
      const inn=(iS.value==='__custom'?(xI.value||''):iS.value).trim(),pos=Number(oS.value),se=Number(eS.value);
      if(!inn){if(msg)msg.textContent='Napište jméno nastupujícího hráče.';if(xI)xI.focus();return}
      if(Array.from({length:FM.players},(_,p)=>p).some(p=>dispName(T.players[p],p)===inn)){if(msg)msg.textContent=inn+' už v sestavě hraje. Vyberte náhradníka.';return}
      g.subs[t]={end:se,pos,in:inn};touch();renderBody();renderEndbar();applyRO();setStatus(`Střídání zapsáno: ${T.name}, od endu ${se+1}.`);return}
    case'subdel':{const t=b.dataset.t;g.subs[t]=null;touch();renderBody();applyRO();setStatus('Střídání zrušeno.');return}
    case'goal':end.tactic.goal=end.tactic.goal===v?'':v;break;
    case'met':end.tactic.met=end.tactic.met===v?'':v;break;
    case'trate':end.tactic.rating=end.tactic.rating===Number(v)?0:Number(v);break;
    case'srate':{const f=b.dataset.f;g.summary[f]=g.summary[f]===Number(v)?0:Number(v);touch();renderBody();applyRO();return}
    case'newgame':{const n=newGame((cur()&&cur().format)||'classic');games[n.id]=n;curId=n.id;lsSet('curl.cur',curId);tab='ends';metaOpen=true;confirmDel=false;resetEndPos(0);scheduleSave(n.id);render();
      setTimeout(()=>{const el=$('#m-us-name');if(el){el.focus();el.select()}},50);return}
    case'loadsample':{const n=sampleGame();games[n.id]=n;curId=n.id;resetEndPos(0);scheduleSave(n.id);render();return}
    case'bkdl':{const txt=JSON.stringify({app:'curlingovy-zapisnik',v:1,saved:new Date().toISOString(),games},null,1);
      const msg=t=>{const m=$('#bk-msg');if(m)m.textContent=t};const name='curling-zaloha-'+todayISO()+'.txt';
      const copyFb=why=>{try{navigator.clipboard.writeText(txt).then(()=>msg(why+' Záloha je místo toho zkopírovaná do schránky, vložte ji do poznámek nebo e-mailu.'),()=>{bkOpen=true;const d=$('#bkd');if(d)d.open=true;const ta=$('#bk-text');if(ta){ta.value=txt;ta.focus();ta.select()}msg(why+' Text zálohy je označený v poli, zkopírujte ho (Ctrl+C).')})}catch(e){msg(why)}};
      saveFile(name,txt).then(r=>{if(r==='saved'){lsSet('curl.lastBackup',String(Date.now()));updDue();msg('Záloha stažena: '+name+' ('+Object.keys(games).length+' zápasů).')}
        else if(r==='declined')msg('Stažení zálohy bylo zrušeno.');else copyFb('Tady se soubor nedá stáhnout.')});
      return}
    case'bkrestore':{const ta=$('#bk-text');restoreFrom(ta?ta.value:'');return}
    case'delgame':confirmDel=true;metaOpen=true;renderMeta();applyRO();return;
    case'delno':confirmDel=false;renderMeta();applyRO();return;
    case'delyes': {
      void deleteCloudGame(curId).catch(e => setStatus('Smazání selhalo: ' + e.message, 20000));
      return
    }
    default:return;
  }
  touch();renderWork();
});
document.getElementById('app').addEventListener('toggle',ev=>{if(ev.target.id==='metad'&&!ev.target.open){metaOpen=false;setTimeout(()=>{renderMeta();renderBoard()},0)}if(ev.target.id==='bkd')bkOpen=ev.target.open},true);
document.getElementById('app').addEventListener('input',ev=>{
  if(ev.target.id==='rules-q'){filterRules(ev.target.value);return}
  const el=ev.target,id=el.id,g=cur();if(!g||readOnly)return;mergeNext=true;
  const end=g.ends[curEnd],s=end&&end.stones[curStone];
  const m=/^m-(us|them)-(name|coach|p(\d)|a(\d))$/.exec(id);
  if(m){const T=g[m[1]];if(m[2]==='name')T.name=el.value;else if(m[2]==='coach')T.coach=el.value;else if(m[3]!=null)T.players[+m[3]]=el.value;else T.alts[+m[4]]=el.value;touch();renderBoard();refreshPicker();return}
  if(id==='m-event'){g.event=el.value;touch();renderBoard();return}
  if(id==='m-date'){g.date=el.value;touch();renderBoard();refreshPicker();return}
  if(id==='s-note'){s.note=el.value;touch();return}
  if(id==='t-note'){end.tactic.note=el.value;touch();return}
  if(id==='sc-us'||id==='sc-them'){const k=id==='sc-us'?'us':'them';end.score[k]=el.value===''?null:Math.max(0,Math.min(8,parseInt(el.value,10)||0));touch();renderBoard();renderEndbar();if(g.ends.every(endPlayed)&&backupDue())setStatus('Zápas je dohraný. Stáhněte si zálohu v nabídce Záloha.',8000);return}
  const sm=/^sum-(worked|improve|conclusion)$/.exec(id);if(sm){g.summary[sm[1]]=el.value;touch()}
});
document.getElementById('app').addEventListener('change',ev=>{
  const el=ev.target,id=el.id,g=cur();
  if(id==='bk-file'){const f=el.files&&el.files[0];if(!f)return;const r=new FileReader();r.onload=()=>restoreFrom(String(r.result||''));r.onerror=()=>{const m=$('#bk-msg');if(m)m.textContent='Soubor se nepodařilo načíst.'};r.readAsText(f);return}
  if(id==='season-team'){seasonTeam=el.value;renderBody();return}
  if(id==='map-team'){mapF.team=el.value;mapF.player='';renderBody();return}
  if(id==='map-player'){mapF.player=el.value;renderBody();return}
  if(id==='map-shot'){mapF.shot=el.value;renderBody();return}
  if(id==='gamesel'){curId=el.value;lsSet('curl.cur',curId);confirmDel=false;resetEndPos(0);render();return}
  if(!g||readOnly)return;
  const end=g.ends[curEnd];
  if(id==='m-color'){g.us.color=el.value;touch();render();return}
  if(id==='m-hammer'){g.hammerStart=el.value;touch();render();return}
  if(id==='m-ends'){const n=Math.max(1,Math.min(12,parseInt(el.value,10)||g.ends.length));while(g.ends.length<n)g.ends.push(newEnd());
    if(n<g.ends.length){const cut=g.ends.slice(n);if(cut.some(e=>endPlayed(e)||lastThrown(e)>=0)){el.value=g.ends.length;setStatus('Endy s daty nelze ubrat. Nejprve je vymažte.');return}
      if(['us','them'].some(t=>g.subs[t]&&g.subs[t].end>=n)){el.value=g.ends.length;setStatus('V endech, které chcete ubrat, je zapsané střídání. Nejprve ho zrušte v záložce Hráči.');return}g.ends.length=n}
    if(curEnd>=n)resetEndPos(n-1);touch();render();return}
  if(id==='s-player'){const k=curStone,t=teamOf(g,curEnd,k),p=posOf(k);if(p<0)return;end.stones[k].pname=el.value===lineupFor(g,curEnd,t)[p]?null:el.value;touch();renderWork();return}
  const mf=/^mdf-(us|them)$/.exec(id);
  if(mf){end.mdFirst[mf[1]]=Number(el.value);touch();renderWork();return}
  const si=/^sub-(us|them)-in$/.exec(id);
  if(si){const x=$(`#sub-${si[1]}-inx`);if(x){x.hidden=el.value!=='__custom';if(!x.hidden)x.focus()}return}
  if(id==='hm-sel'){end.hammer=el.value||null;touch();renderEndbar();renderWork()}
});
function refreshPicker(){const sel=$('#gamesel');if(!sel)return;const g=cur();const o=sel.querySelector(`option[value="${curId}"]`);if(o&&g){o.textContent=gameLabel(g);}}
document.addEventListener('keydown',ev=>{
  if((ev.ctrlKey||ev.metaKey)&&!ev.shiftKey&&ev.key.toLowerCase()==='z'&&cur()&&!ev.target.closest('input,textarea,select')){ev.preventDefault();doUndo();return}
  if(tab!=='ends'||!cur())return;if(ev.target.closest('input,textarea,select'))return;
  if(ev.key==='ArrowRight'&&curStone<FM.stones-1){curStone++;movingK=null;renderWork()}
  else if(ev.key==='ArrowLeft'&&curStone>0){curStone--;movingK=null;if(curStone===0)mode='place';renderWork()}
});

try{matchMedia(PHONE_MQ).addEventListener('change',()=>{if(view==='house'&&cur()&&tab==='ends')renderWork()})}catch(e){}
/* mobil: posunutím prstu doleva/doprava přes editor nebo spodní lištu přejdete na další/předchozí kámen */
(function(){let sx=0,sy=0,st=0,on=false;
  document.addEventListener('touchstart',e=>{on=false;if(tab!=='ends'||e.touches.length!==1)return;try{if(!matchMedia(PHONE_MQ).matches)return}catch(_){return}
    const t=e.target;if(!t.closest('#ed-panel,#mbar')||t.closest('input,textarea,select,.tblwrap'))return;
    const p=e.touches[0];sx=p.clientX;sy=p.clientY;st=Date.now();on=true},{passive:true});
  document.addEventListener('touchend',e=>{if(!on)return;on=false;const p=e.changedTouches[0],dx=p.clientX-sx,dy=p.clientY-sy;
    if(Date.now()-st>700||Math.abs(dx)<60||Math.abs(dy)>Math.abs(dx)*.6)return;
    const b=document.querySelector(`#mbar [data-act="${dx<0?'next':'prev'}"]`);if(!b||b.disabled)return;b.click();
    const ed=document.getElementById('ed-panel');try{ed&&ed.animate([{transform:`translateX(${dx<0?28:-28}px)`,opacity:.35},{transform:'none',opacity:1}],{duration:200,easing:'ease-out'})}catch(_){}},{passive:true});
})();
/* výška přichycené horní lišty pro odsazení plochy a skoků v pravidlech */
(function(){const h=document.getElementById('hdr');if(!h)return;const set=()=>document.documentElement.style.setProperty('--hdr',(matchMedia('(min-width:721px)').matches?h.offsetHeight:0)+'px');
  try{new ResizeObserver(set).observe(h)}catch(e){}addEventListener('resize',set);set();
  const st=()=>h.classList.toggle('stuck',scrollY>4);addEventListener('scroll',st,{passive:true});st();})();
/* ---------- boot ---------- */
document.getElementById('app').hidden=true;
render();
function restoreFrom(text){let n=0;const imported=[];
  try{const o=JSON.parse(text||'');const src=o&&o.games?o.games:o;if(!src||typeof src!=='object'){n=-1}
    else for(const id in src){const gg=src[id];if(gg&&gg.ends){games[id]=normalize(Object.assign(clone(gg),{id}));imported.push(id);n++}}}catch(e){n=-1}
  const msg=t=>{const m=$('#bk-msg');if(m)m.textContent=t};
  if(n<=0){msg('Záloha se nedá přečíst. Nahrajte soubor stažený v nabídce Záloha.');return}
  for(const id of imported)scheduleSave(id);if(!curId||!games[curId])pickDefault();bkOpen=false;undoFor=null;render();msg('Importováno zápasů: '+n+'. Ukládají se na server.');}
/* úvodní obrazovka: krátce při otevření, pak se rozplyne */
(function(){const sp=document.getElementById('splash');if(!sp)return;let reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
  setTimeout(()=>{sp.classList.add('out');setTimeout(()=>sp.remove(),450)},reduce?250:1150)})();
(async()=>{
  const login=await CurlCloud.boot();
  if(!login||login.role!=='team')return;
  try{
    await loadCloudGames();pickDefault();loaded=true;document.getElementById('app').hidden=false;
    setStatus('Zápasy načteny z Cloudflare D1.');render();
  }catch(e){setStatus('Chyba načítání: '+e.message,120000);document.getElementById('app').hidden=true;alert('Nepodařilo se načíst zápasy z databáze. Obnovte stránku: '+e.message)}
})();
})();
