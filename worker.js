/** Curling-track API: all access to D1 is authenticated and team-scoped. */
const json = (data, status=200, headers={}) => new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers}});
const fail=(message,status=400)=>json({error:message},status);
const id=()=>crypto.randomUUID();
const encoder=new TextEncoder();
function bytesHex(bytes){return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('')}
function hexBytes(hex){return new Uint8Array(hex.match(/.{2}/g).map(x=>parseInt(x,16)))}
async function digest(value){return bytesHex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))))}
async function passwordHash(password,salt){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return bytesHex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:hexBytes(salt),iterations:210000},key,256)))}
function randomHex(n){const bytes=crypto.getRandomValues(new Uint8Array(n));return bytesHex(bytes)}
function equal(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
async function credentials(name,password){if(typeof name!=='string'||! /^[a-z0-9_.-]{3,40}$/.test(name))throw new Error('Přihlašovací jméno: 3–40 znaků a-z, 0-9, _, -, .');if(typeof password!=='string'||password.length<12||password.length>128)throw new Error('Heslo musí mít 12–128 znaků.');const salt=randomHex(16);return {salt,hash:await passwordHash(password,salt)}}
function cookie(req){return (req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('curl_session='))?.slice(13)||''}
const setCookie=value=>`curl_session=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=1209600`;
const clearCookie='curl_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
async function current(req,db){const token=cookie(req);if(!/^[0-9a-f]{64}$/.test(token))return null;const hash=await digest(token);return await db.prepare('SELECT a.id, a.username, a.role, a.team_id, t.name AS team_name FROM sessions s JOIN accounts a ON a.id=s.account_id LEFT JOIN teams t ON t.id=a.team_id WHERE s.token_hash=? AND s.expires_at>?').bind(hash,Date.now()).first()}
async function body(req){if(!(req.headers.get('content-type')||'').startsWith('application/json'))throw new Error('Vyžadován JSON.');const length=Number(req.headers.get('content-length')||0);if(length>650000)throw new Error('Příliš velký požadavek.');const text=await req.text();if(text.length>650000)throw new Error('Příliš velký požadavek.');return JSON.parse(text)}
async function addAccount(db,username,password,role,teamId=null){const cr=await credentials(username,password);const uid=id();await db.prepare('INSERT INTO accounts (id,username,password_salt,password_hash,role,team_id) VALUES (?,?,?,?,?,?)').bind(uid,username,cr.salt,cr.hash,role,teamId).run();return uid}
const validName=v=>typeof v==='string'&&v.trim().length>=2&&v.trim().length<=100;
const cleanRoster=roster=>{if(!Array.isArray(roster)||roster.length>30||roster.some(x=>typeof x!=='string'||x.length>100))throw new Error('Soupiska smí obsahovat nejvýše 30 jmen.');return [...new Set(roster.map(x=>x.trim()).filter(Boolean))]};
async function route(req,env){
  if(!env.DB)return fail('Chybí D1 binding DB. Nastavte databázi v Cloudflare.',503);
  const url=new URL(req.url), path=url.pathname, method=req.method;
  if(!['GET','POST','PUT','DELETE'].includes(method))return fail('Metoda není podporována.',405);
  if(method!=='GET'){const origin=req.headers.get('origin');if(origin&&origin!==url.origin)return fail('Nepovolený původ požadavku.',403)}
  const db=env.DB;
  if(path==='/api/setup'&&method==='POST'){
    const existing=await db.prepare("SELECT id FROM accounts WHERE role='admin' LIMIT 1").first();if(existing)return fail('První správce již existuje.',409);
    const token=req.headers.get('x-setup-token');if(!env.BOOTSTRAP_TOKEN||!token||!equal(token,env.BOOTSTRAP_TOKEN))return fail('Neplatný inicializační token.',403);
    const data=await body(req);if(data.username!=='adam')return fail('Prvním správcem musí být adam.');try{await addAccount(db,data.username,data.password,'admin');return json({ok:true})}catch(e){return fail(e.message,400)}
  }
  if(path==='/api/login'&&method==='POST'){
    const data=await body(req),username=String(data.username||'').trim().toLowerCase(),password=String(data.password||'');
    if(!/^[a-z0-9_.-]{3,40}$/.test(username)||password.length>128)return fail('Neplatné přihlašovací údaje.',401);
    const key=await digest(`${req.headers.get('cf-connecting-ip')||'unknown'}:${username}`);
    const attempt=await db.prepare('SELECT count, last_at FROM login_attempts WHERE key=?').bind(key).first();
    if(attempt&&attempt.count>=8&&Date.now()-attempt.last_at<15*60*1000)return fail('Příliš mnoho pokusů. Zkuste to za 15 minut.',429);
    const account=await db.prepare('SELECT * FROM accounts WHERE username=?').bind(username).first();
    const dummySalt='00000000000000000000000000000000';const derived=await passwordHash(password,account?.password_salt||dummySalt);
    if(!account||!equal(derived,account.password_hash)){
      await db.prepare('INSERT INTO login_attempts(key,count,last_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN ?-last_at>900000 THEN 1 ELSE count+1 END,last_at=?').bind(key,Date.now(),Date.now(),Date.now()).run();
      return fail('Nesprávné jméno nebo heslo.',401)
    }
    await db.prepare('DELETE FROM login_attempts WHERE key=?').bind(key).run();
    const token=randomHex(32);await db.prepare('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES (?,?,?)').bind(await digest(token),account.id,Date.now()+14*86400000).run();
    return json({ok:true},200,{'set-cookie':setCookie(token)});
  }
  const user=await current(req,db);if(!user)return fail('Přihlaste se.',401);
  if(path==='/api/me'&&method==='GET')return json({id:user.id,username:user.username,role:user.role,teamId:user.team_id,teamName:user.team_name});
  if(path==='/api/logout'&&method==='POST'){const token=cookie(req);await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(token)).run();return json({ok:true},200,{'set-cookie':clearCookie})}
  if(path==='/api/password'&&method==='PUT'){
    const data=await body(req);const account=await db.prepare('SELECT password_salt,password_hash FROM accounts WHERE id=?').bind(user.id).first();
    if(!equal(await passwordHash(String(data.oldPassword||''),account.password_salt),account.password_hash))return fail('Aktuální heslo není správné.',403);
    try{const cr=await credentials(user.username,data.newPassword);await db.prepare('UPDATE accounts SET password_salt=?,password_hash=? WHERE id=?').bind(cr.salt,cr.hash,user.id).run();await db.prepare('DELETE FROM sessions WHERE account_id=? AND token_hash!=?').bind(user.id,await digest(cookie(req))).run();return json({ok:true})}catch(e){return fail(e.message)}
  }
  if(path==='/api/teams'&&method==='GET'&&user.role==='admin'){
    const {results}=await db.prepare('SELECT t.id,t.name,t.roster,a.username FROM teams t LEFT JOIN accounts a ON a.team_id=t.id ORDER BY t.name').all();return json({teams:results.map(x=>({...x,roster:JSON.parse(x.roster)}))});
  }
  if(path==='/api/teams'&&method==='POST'&&user.role==='admin'){
    const data=await body(req);if(!validName(data.name))return fail('Název týmu musí mít 2–100 znaků.');const teamId=id();const password=randomHex(12);
    try{const cr=await credentials(data.username,password);await db.batch([db.prepare('INSERT INTO teams(id,name,roster) VALUES (?,?,?)').bind(teamId,data.name.trim(),'[]'),db.prepare('INSERT INTO accounts(id,username,password_salt,password_hash,role,team_id) VALUES (?,?,?,?,?,?)').bind(id(),data.username,cr.salt,cr.hash,'team',teamId)]);return json({id:teamId,username:data.username,password},201)}catch(e){return fail('Tým nelze vytvořit. Možná je přihlašovací jméno již obsazené.',409)}
  }
  if(path==='/api/admins'&&method==='POST'&&user.role==='admin'){
    const data=await body(req);if(data.username!=='petr')return fail('Druhým správcem může být pouze petr.');try{await addAccount(db,data.username,data.password,'admin');return json({ok:true},201)}catch(e){return fail('Správce nelze přidat: '+e.message,409)}
  }
  const reset=path.match(/^\/api\/teams\/([0-9a-f-]+)\/password$/);
  if(reset&&method==='POST'&&user.role==='admin'){
    const account=await db.prepare("SELECT id FROM accounts WHERE team_id=? AND role='team'").bind(reset[1]).first();if(!account)return fail('Tým neexistuje.',404);
    const password=randomHex(12),cr=await credentials('team-temp',password);await db.batch([db.prepare('UPDATE accounts SET password_hash=?,password_salt=? WHERE id=?').bind(cr.hash,cr.salt,account.id),db.prepare('DELETE FROM sessions WHERE account_id=?').bind(account.id)]);return json({password});
  }
  if(path==='/api/roster'&&user.role==='team'){
    if(method==='GET'){const t=await db.prepare('SELECT name,roster FROM teams WHERE id=?').bind(user.team_id).first();return json({name:t.name,players:JSON.parse(t.roster)})}
    if(method==='PUT'){const data=await body(req);try{const players=cleanRoster(data.players);await db.prepare('UPDATE teams SET roster=? WHERE id=?').bind(JSON.stringify(players),user.team_id).run();return json({players})}catch(e){return fail(e.message)}}
  }
  if(path==='/api/games'&&user.role==='team'&&method==='GET'){
    const {results}=await db.prepare('SELECT id,data,revision FROM games WHERE team_id=? AND deleted_at IS NULL ORDER BY game_date DESC,updated_at DESC').bind(user.team_id).all();return json({games:results.map(row=>({game:JSON.parse(row.data),revision:row.revision}))});
  }
  const match=path.match(/^\/api\/games\/([a-zA-Z0-9_-]{4,80})$/);
  if(match&&user.role==='team'){
    const gameId=match[1];
    if(method==='PUT'){
      const input=await body(req),game=input.game,revision=input.revision;
      if(!game||typeof game!=='object'||!Array.isArray(game.ends)||game.ends.length>20||game.id!==gameId||!['classic','triples','md'].includes(game.format)||!Number.isSafeInteger(revision)||revision<0)return fail('Neplatný zápas nebo revize.');
      const serialized=JSON.stringify(game);if(serialized.length>550000)return fail('Zápas je příliš velký.',413);
      if(revision===0){const result=await db.prepare('INSERT OR IGNORE INTO games(id,team_id,data,revision,team_name,opponent,game_date,updated_at) VALUES (?,?,?,?,?,?,?,?)').bind(gameId,user.team_id,serialized,1,user.team_name,String(game.them?.name||'').slice(0,100),/^\d{4}-\d{2}-\d{2}$/.test(game.date)?game.date:null,Date.now()).run();if(result.meta.changes===1)return json({revision:1})}
      else {const result=await db.prepare('UPDATE games SET data=?,revision=revision+1,team_name=?,opponent=?,game_date=?,updated_at=? WHERE id=? AND team_id=? AND revision=? AND deleted_at IS NULL').bind(serialized,user.team_name,String(game.them?.name||'').slice(0,100),/^\d{4}-\d{2}-\d{2}$/.test(game.date)?game.date:null,Date.now(),gameId,user.team_id,revision).run();if(result.meta.changes===1)return json({revision:revision+1})}
      return fail('Zápas byl mezitím změněn jinde. Obnovte data, aby nedošlo k přepsání.',409);
    }
    if(method==='DELETE'){
      const data=await body(req);if(!Number.isSafeInteger(data.revision))return fail('Chybí revize.');const result=await db.prepare('UPDATE games SET deleted_at=?,revision=revision+1 WHERE id=? AND team_id=? AND revision=? AND deleted_at IS NULL').bind(Date.now(),gameId,user.team_id,data.revision).run();if(!result.meta.changes)return fail('Zápas se nepodařilo smazat – data byla změněna.',409);return json({ok:true})
    }
  }
  return fail('Požadavek nebyl nalezen nebo není povolen.',404);
}
export default {async fetch(request,env){const path=new URL(request.url).pathname;if(!path.startsWith('/api/'))return env.ASSETS.fetch(request);try{return await route(request,env)}catch(e){console.error('API:',e);return fail(e instanceof SyntaxError?'Neplatný JSON.':'Serverová chyba. Zkontrolujte D1 a migrace.',e instanceof SyntaxError?400:500)}}};
