const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const sessions = {};

function generateSessionId() { return crypto.randomBytes(32).toString('hex'); }
function parseCookies(req) {
    const list={};const h=req.headers.cookie;if(!h)return list;
    h.split(';').forEach(c=>{const[k,...v]=c.split('=');list[k.trim()]=v.join('=').trim();});return list;
}
function setSessionCookie(res,sid){res.setHeader('Set-Cookie',`sessionId=${sid}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`);}
function clearSessionCookie(res){res.setHeader('Set-Cookie',`sessionId=; HttpOnly; Path=/; Max-Age=0`);}
function getSession(req){const c=parseCookies(req);return c.sessionId&&sessions[c.sessionId]?sessions[c.sessionId]:null;}
function hashPw(pw){const salt=crypto.randomBytes(16).toString('hex');return salt+':'+crypto.pbkdf2Sync(pw,salt,100000,64,'sha512').toString('hex');}
function verifyPw(pw,stored){const[salt,hash]=stored.split(':');return hash===crypto.pbkdf2Sync(pw,salt,100000,64,'sha512').toString('hex');}

function sb(method, endpoint, body){
    return new Promise((resolve,reject)=>{
        const url=new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
        const bs=body?JSON.stringify(body):null;
        const opts={hostname:url.hostname,path:url.pathname+url.search,method,
            headers:{'Content-Type':'application/json','apikey':SUPABASE_SERVICE_KEY,
                'Authorization':'Bearer '+SUPABASE_SERVICE_KEY,'Prefer':'return=representation'}};
        if(bs)opts.headers['Content-Length']=Buffer.byteLength(bs);
        const req=https.request(opts,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{
            try{resolve({data:d?JSON.parse(d):[],status:res.statusCode});}catch(e){resolve({data:[],status:res.statusCode});}});});
        req.on('error',reject);if(bs)req.write(bs);req.end();
    });
}

function sendFile(res,fp,ct){fs.readFile(fp,(err,c)=>{if(err){res.writeHead(err.code==='ENOENT'?404:500,{'Content-Type':'text/plain'});res.end(err.code==='ENOENT'?'404 Not Found':'Server Error');}else{res.writeHead(200,{'Content-Type':ct});res.end(c,'utf-8');}});}
function readBody(req){return new Promise((res,rej)=>{let b='';req.on('data',c=>b+=c.toString());req.on('end',()=>{try{res(JSON.parse(b));}catch(e){rej(e);}});req.on('error',rej);});}
function json(res,code,obj){res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(obj));}

const server=http.createServer(async(req,res)=>{
    console.log(req.method,req.url);

    if(req.url==='/api/register'&&req.method==='POST'){
        try{
            const{username,password}=await readBody(req);
            if(!username||!password||username.length<3||password.length<6)return json(res,400,{message:'Jméno min. 3, heslo min. 6 znaků.'});
            const ex=await sb('GET',`users?username=eq.${encodeURIComponent(username)}&select=id`);
            if(ex.data&&ex.data.length>0)return json(res,409,{message:'Jméno je již obsazené.'});
            const r=await sb('POST','users',{username,password:hashPw(password)});
            if(r.status!==200&&r.status!==201)return json(res,500,{message:'Chyba registrace.'});
            json(res,201,{message:'OK'});
        }catch(e){json(res,400,{message:'Chyba.'});}
        return;
    }

    if(req.url==='/api/login'&&req.method==='POST'){
        try{
            const{username,password}=await readBody(req);
            const r=await sb('GET',`users?username=eq.${encodeURIComponent(username)}&select=id,password`);
            const u=r.data&&r.data[0];
            if(!u||!verifyPw(password,u.password))return json(res,401,{message:'Špatné jméno nebo heslo.'});
            const sid=generateSessionId();
            sessions[sid]={userId:u.id,username};
            setSessionCookie(res,sid);
            json(res,200,{message:'OK',username});
        }catch(e){json(res,400,{message:'Chyba.'});}
        return;
    }

    if(req.url==='/api/logout'&&req.method==='POST'){
        const c=parseCookies(req);if(c.sessionId)delete sessions[c.sessionId];
        clearSessionCookie(res);json(res,200,{message:'OK'});return;
    }

    if(req.url==='/api/me'&&req.method==='GET'){
        const s=getSession(req);if(!s)return json(res,401,{message:'Nepřihlášen.'});
        json(res,200,{username:s.username,userId:s.userId});return;
    }

    // Save position + player state
    if(req.url==='/api/position'&&req.method==='POST'){
        const s=getSession(req);if(!s)return json(res,401,{message:'Nepřihlášen.'});
        try{
            const body=await readBody(req);
            const{x,y,angle,shipType,player}=body;
            const now=new Date().toISOString();
            const data={x,y,angle,updated_at:now};
            if(player)data.player=player;
            if(shipType)data.ship_type=shipType;
            const patch=await sb('PATCH',`player_state?user_id=eq.${s.userId}`,data);
            if(patch.status===200&&(!patch.data||patch.data.length===0)){
                await sb('POST','player_state',{user_id:s.userId,...data});
            }
            json(res,200,{message:'OK'});
        }catch(e){json(res,400,{message:'Chyba.'});}
        return;
    }

    // Load position + player state
    if(req.url==='/api/load-position'&&req.method==='GET'){
        const s=getSession(req);if(!s)return json(res,401,{message:'Nepřihlášen.'});
        const r=await sb('GET',`player_state?user_id=eq.${s.userId}&select=x,y,angle,player,ship_type`);
        if(!r.data||r.data.length===0)return json(res,200,{});
        const d=r.data[0];
        json(res,200,{x:d.x,y:d.y,angle:d.angle,player:d.player,shipType:d.ship_type});
        return;
    }

    // Get other players (active last 10s)
    if(req.url==='/api/players'&&req.method==='GET'){
        const s=getSession(req);if(!s)return json(res,401,{message:'Nepřihlášen.'});
        try{
            const ago=new Date(Date.now()-10000).toISOString();
            const r=await sb('GET',`player_state?updated_at=gte.${ago}&select=x,y,angle,ship_type,user_id,users(username)`);
            const players=(r.data||[]).filter(p=>p.user_id!==s.userId).map(p=>({
                x:p.x,y:p.y,angle:p.angle,shipType:p.ship_type||'sidewinder',username:p.users?.username||'?'
            }));
            json(res,200,players);
        }catch(e){json(res,500,{message:'Chyba.'});}
        return;
    }

    // Static
    switch(req.url){
        case'/':sendFile(res,path.join(__dirname,'index.html'),'text/html');break;
        case'/login':case'/login.html':sendFile(res,path.join(__dirname,'login.html'),'text/html');break;
        case'/game.js':sendFile(res,path.join(__dirname,'game.js'),'application/javascript');break;
        default:res.writeHead(404,{'Content-Type':'text/plain'});res.end('404 Not Found');
    }
});

server.listen(PORT,'0.0.0.0',()=>console.log(`Server on http://0.0.0.0:${PORT}`));