// ═══════════════════════════════════════════════════════════════
//  ELITE 2D  –  v2  (dokování, market, palivo, lodě)
// ═══════════════════════════════════════════════════════════════

const AU = 2000;

// ─── LODĚ ───────────────────────────────────────────────────────
const SHIP_TYPES = {
    sidewinder: {
        id: 'sidewinder', name: 'Sidewinder',
        maxFuel: 100, maxCargo: 10,
        speed: 1.0, price: 0,
        description: 'Lehká průzkumná loď. Malý náklad, velmi rychlá.',
        color: '#00ff88',
        draw(ctx, thrusting) {
            if (thrusting) drawFlame(ctx, -10, 0, 14);
            ctx.beginPath();
            ctx.moveTo(18, 0); ctx.lineTo(-10, -7); ctx.lineTo(-5, 0); ctx.lineTo(-10, 7);
            ctx.closePath();
            ctx.fillStyle = '#0a0a0a'; ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 1.5;
            ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(7, 0, 2.5, 0, Math.PI*2);
            ctx.fillStyle = '#00ff88'; ctx.fill();
        }
    },
    cobra: {
        id: 'cobra', name: 'Cobra Mk III',
        maxFuel: 220, maxCargo: 40,
        speed: 0.82, price: 120000,
        description: 'Všestranná obchodní loď. Ideální pro trading.',
        color: '#4fc3f7',
        draw(ctx, thrusting) {
            if (thrusting) { drawFlame(ctx, -16, -5, 18); drawFlame(ctx, -16, 5, 18); }
            ctx.beginPath();
            ctx.moveTo(22, 0); ctx.lineTo(8, -12); ctx.lineTo(-14, -10);
            ctx.lineTo(-18, 0); ctx.lineTo(-14, 10); ctx.lineTo(8, 12);
            ctx.closePath();
            ctx.fillStyle = '#0d1a2a'; ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 1.5;
            ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(10, 0, 3, 0, Math.PI*2);
            ctx.fillStyle = '#4fc3f7'; ctx.fill();
        }
    },
    anaconda: {
        id: 'anaconda', name: 'Anaconda',
        maxFuel: 480, maxCargo: 120,
        speed: 0.6, price: 650000,
        description: 'Masivní nákladní loď. Obrovský náklad, pomalejší.',
        color: '#ff9800',
        draw(ctx, thrusting) {
            if (thrusting) { drawFlame(ctx, -26, -8, 22); drawFlame(ctx, -26, 0, 16); drawFlame(ctx, -26, 8, 22); }
            ctx.beginPath();
            ctx.moveTo(30, 0); ctx.lineTo(15, -8); ctx.lineTo(0, -16);
            ctx.lineTo(-20, -14); ctx.lineTo(-28, -6); ctx.lineTo(-28, 6);
            ctx.lineTo(-20, 14); ctx.lineTo(0, 16); ctx.lineTo(15, 8);
            ctx.closePath();
            ctx.fillStyle = '#1a1000'; ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 2;
            ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-25, 0); ctx.lineTo(28, 0);
            ctx.strokeStyle = '#ff980033'; ctx.lineWidth = 1; ctx.stroke();
            ctx.beginPath(); ctx.arc(18, 0, 4, 0, Math.PI*2);
            ctx.fillStyle = '#ff9800'; ctx.fill();
        }
    }
};

function drawFlame(ctx, x, y, len) {
    const fl = len + Math.random() * 8;
    const g = ctx.createLinearGradient(x - fl, y, x, y);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, 'rgba(255,120,0,0.7)');
    g.addColorStop(1, 'rgba(255,255,200,0.9)');
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - fl, y - 3 - Math.random()*3);
    ctx.lineTo(x - fl, y + 3 + Math.random()*3);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
}

// ─── SOUSTAVA ───────────────────────────────────────────────────
const PLANETS = [
    { id:'merkur', name:'Merkur',  distanceAU:0.39, radius:14, color:'#9E9E9E', glowColor:'#BDBDBD', orbitAngle:0.8,  orbitSpeed:0.00047  },
    { id:'venuse', name:'Venuše',  distanceAU:0.72, radius:20, color:'#FFCC80', glowColor:'#FFB300', orbitAngle:2.1,  orbitSpeed:0.00018  },
    { id:'zeme',   name:'Země',    distanceAU:1.00, radius:22, color:'#42A5F5', glowColor:'#1565C0', orbitAngle:0.0,  orbitSpeed:0.00011  },
    { id:'mars',   name:'Mars',    distanceAU:1.52, radius:16, color:'#EF5350', glowColor:'#B71C1C', orbitAngle:3.5,  orbitSpeed:0.000059 },
];
const STATIONS = [
    { id:'st_gateway', name:'Gateway Station', angleAU:1.15, orbitAngle:1.2, orbitSpeed:0.00009,  color:'#00e5ff', type:'trade',    description:'Hlavní obchodní uzel poblíž Země.' },
    { id:'st_ceres',   name:'Ceres Outpost',   angleAU:1.35, orbitAngle:4.1, orbitSpeed:0.000075, color:'#69f0ae', type:'trade',    description:'Těžební stanice v pásu asteroidů.' },
    { id:'st_foundry', name:'Foundry Shipyard',angleAU:0.85, orbitAngle:5.5, orbitSpeed:0.00013,  color:'#ffd740', type:'shipyard', description:'⭐ Loděnice – zde koupíš nové lodě.' },
    { id:'st_frontier',name:'Frontier Dock',   angleAU:1.68, orbitAngle:2.8, orbitSpeed:0.000052, color:'#ff6e40', type:'shipyard', description:'⭐ Loděnice – zde koupíš nové lodě.' },
];

// ─── KOMODITY ───────────────────────────────────────────────────
const COMMODITIES = [
    { id:'food',      name:'Potraviny',     basePrice:120,  vol:0.15 },
    { id:'minerals',  name:'Minerály',      basePrice:340,  vol:0.20 },
    { id:'tech',      name:'Technologie',   basePrice:890,  vol:0.25 },
    { id:'fuel_ore',  name:'Palivová ruda', basePrice:210,  vol:0.18 },
    { id:'water',     name:'Voda',          basePrice:80,   vol:0.10 },
    { id:'weapons',   name:'Zbraně',        basePrice:1400, vol:0.30 },
    { id:'medicine',  name:'Léčiva',        basePrice:650,  vol:0.22 },
    { id:'luxuries',  name:'Luxusní zboží', basePrice:1100, vol:0.28 },
];
const LOC_BIAS = {
    merkur:      {food:1.3,minerals:0.6,tech:1.4,fuel_ore:0.8,water:1.5,weapons:1.0,medicine:1.1,luxuries:1.2},
    venuse:      {food:0.8,minerals:1.2,tech:0.9,fuel_ore:1.1,water:0.9,weapons:1.3,medicine:0.9,luxuries:1.4},
    zeme:        {food:0.6,minerals:1.0,tech:0.7,fuel_ore:1.0,water:0.7,weapons:0.9,medicine:0.6,luxuries:0.8},
    mars:        {food:1.4,minerals:0.8,tech:1.1,fuel_ore:0.9,water:1.6,weapons:1.1,medicine:1.3,luxuries:1.5},
    st_gateway:  {food:0.9,minerals:1.1,tech:0.8,fuel_ore:1.2,water:0.8,weapons:1.2,medicine:0.8,luxuries:0.9},
    st_ceres:    {food:1.5,minerals:0.5,tech:1.3,fuel_ore:0.7,water:1.4,weapons:0.9,medicine:1.2,luxuries:1.6},
    st_foundry:  {food:1.2,minerals:0.9,tech:0.6,fuel_ore:1.3,water:1.0,weapons:0.7,medicine:0.9,luxuries:1.1},
    st_frontier: {food:1.1,minerals:0.7,tech:1.5,fuel_ore:0.6,water:1.2,weapons:0.8,medicine:0.7,luxuries:0.9},
};

let marketPrices = {};
function initMarket() {
    const locs = [...PLANETS.map(p=>p.id), ...STATIONS.map(s=>s.id)];
    locs.forEach(loc => {
        marketPrices[loc] = {};
        COMMODITIES.forEach(c => {
            const b = LOC_BIAS[loc]?.[c.id] ?? 1.0;
            marketPrices[loc][c.id] = Math.round(c.basePrice * b * (0.9 + Math.random()*0.2));
        });
    });
}
function fluctuateMarket() {
    Object.keys(marketPrices).forEach(loc => {
        COMMODITIES.forEach(c => {
            const b = LOC_BIAS[loc]?.[c.id] ?? 1.0;
            const cur = marketPrices[loc][c.id];
            const tgt = c.basePrice * b;
            const d = (tgt - cur)*0.1 + (Math.random()-0.5)*c.basePrice*c.vol*0.3;
            marketPrices[loc][c.id] = Math.max(10, Math.round(cur + d));
        });
    });
}
setInterval(fluctuateMarket, 30000);

// ─── PLAYER STATE ────────────────────────────────────────────────
let player = { money:10000, shipType:'sidewinder', fuel:100, cargo:{} };

// ─── CANVAS ──────────────────────────────────────────────────────
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = canvas.width = window.innerWidth;
let H = canvas.height = window.innerHeight;
window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });
const camera = { x:0, y:0 };

const ship = {
    x: AU*1.05, y:0, vx:0, vy:0, angle:0,
    thrusting: false,
    thrustBase: 0.0003, thrustExp: 1.6, rotSpeed: 0.045,
    landRadius: 55, fuelBurn: 0.012,
};

// ─── INPUT ───────────────────────────────────────────────────────
const keys = {};
document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyE') tryDock();
    if (e.code === 'Tab') { e.preventDefault(); toggleShipCard(); }
    if (e.code === 'Escape') closeAll();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

// ─── STARS ───────────────────────────────────────────────────────
const STARS = Array.from({length:500}, () => ({
    x:(Math.random()-.5)*AU*12, y:(Math.random()-.5)*AU*12,
    r:Math.random()*1.3+0.1, b:Math.random()*0.7+0.15, p:0.02+Math.random()*0.06
}));

// ─── MULTIPLAYER ─────────────────────────────────────────────────
let otherPlayers = [];
let myUsername = '';
setInterval(async()=>{ try{const r=await fetch('/api/players');if(r.ok)otherPlayers=await r.json();}catch(e){} }, 600);
setInterval(async()=>{ try{
    await fetch('/api/position',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({x:ship.x,y:ship.y,angle:ship.angle,shipType:player.shipType})});
}catch(e){} }, 250);

// ─── PANELS ──────────────────────────────────────────────────────
let activePanel = null;
let dockedAt = null;
let dockTab = 'market';

// ─── INIT ────────────────────────────────────────────────────────
async function init() {
    try {
        const r = await fetch('/api/me');
        if (!r.ok) { window.location.href='/login'; return; }
        const me = await r.json();
        myUsername = me.username;
        document.getElementById('pilot-name').textContent = me.username;
    } catch(e) { window.location.href='/login'; return; }

    document.getElementById('logout-btn').addEventListener('click', async()=>{
        await savePlayer();
        await fetch('/api/logout',{method:'POST'});
        window.location.href='/login';
    });

    try {
        const r = await fetch('/api/load-position');
        if (r.ok) {
            const d = await r.json();
            if (d && d.x !== undefined) {
                ship.x=d.x; ship.y=d.y; ship.angle=d.angle||0;
                if (d.player) Object.assign(player, d.player);
            }
        }
    } catch(e){}

    initMarket();
    PLANETS.forEach(p => { p.currentX=Math.cos(p.orbitAngle)*p.distanceAU*AU; p.currentY=Math.sin(p.orbitAngle)*p.distanceAU*AU; });
    STATIONS.forEach(s => { s.currentX=Math.cos(s.orbitAngle)*s.angleAU*AU; s.currentY=Math.sin(s.orbitAngle)*s.angleAU*AU; });

    setInterval(savePlayer, 20000);
    updateHUD();
    requestAnimationFrame(gameLoop);
}

async function savePlayer() {
    try {
        await fetch('/api/position',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({x:ship.x,y:ship.y,angle:ship.angle,shipType:player.shipType,player})});
    } catch(e){}
}

// ─── PHYSICS ─────────────────────────────────────────────────────
let lastTime = null;
function updatePhysics(dt) {
    if (activePanel) return;
    if (keys['KeyA']||keys['ArrowLeft'])  ship.angle -= ship.rotSpeed;
    if (keys['KeyD']||keys['ArrowRight']) ship.angle += ship.rotSpeed;
    ship.thrusting = (keys['KeyW']||keys['ArrowUp']) && player.fuel > 0;
    if (ship.thrusting) {
        const spd = Math.sqrt(ship.vx**2+ship.vy**2);
        const mul = (1+Math.pow(spd*0.4, ship.thrustExp)) * (SHIP_TYPES[player.shipType]?.speed??1.0);
        const thrust = ship.thrustBase * mul * dt;
        ship.vx += Math.cos(ship.angle)*thrust;
        ship.vy += Math.sin(ship.angle)*thrust;
        player.fuel = Math.max(0, player.fuel - ship.fuelBurn*dt);
        updateFuelBar();
    }
    if (keys['KeyS']||keys['ArrowDown']) { ship.vx*=0.97; ship.vy*=0.97; }
    const ds = Math.sqrt(ship.x**2+ship.y**2);
    if (ds > AU*0.2) {
        const g = 0.00002*AU*AU/(ds*ds);
        ship.vx -= (ship.x/ds)*g*dt; ship.vy -= (ship.y/ds)*g*dt;
    }
    ship.x += ship.vx*dt; ship.y += ship.vy*dt;
    PLANETS.forEach(p => { p.orbitAngle+=p.orbitSpeed*dt; p.currentX=Math.cos(p.orbitAngle)*p.distanceAU*AU; p.currentY=Math.sin(p.orbitAngle)*p.distanceAU*AU; });
    STATIONS.forEach(s => { s.orbitAngle+=s.orbitSpeed*dt; s.currentX=Math.cos(s.orbitAngle)*s.angleAU*AU; s.currentY=Math.sin(s.orbitAngle)*s.angleAU*AU; });
    camera.x=ship.x-W/2; camera.y=ship.y-H/2;
    const spd2 = Math.sqrt(ship.vx**2+ship.vy**2);
    document.getElementById('speed-display').textContent = spd2.toFixed(4);
    const nearby = getNearby();
    const el = document.getElementById('location-display');
    if (nearby) { el.textContent=`[E] Dokovat – ${nearby.name}`; el.style.color='#00ff88'; }
    else { el.textContent='Hluboký vesmír'; el.style.color='#00ff8855'; }
}

function getNearby() {
    for (const p of PLANETS) {
        if (!p.currentX) continue;
        if (Math.sqrt((ship.x-p.currentX)**2+(ship.y-p.currentY)**2) < p.radius+ship.landRadius) return p;
    }
    for (const s of STATIONS) {
        if (!s.currentX) continue;
        if (Math.sqrt((ship.x-s.currentX)**2+(ship.y-s.currentY)**2) < 65) return s;
    }
    return null;
}

// ─── DOCKING ─────────────────────────────────────────────────────
function tryDock() {
    if (activePanel === 'dock') { closeAll(); return; }
    const loc = getNearby();
    if (!loc) return;
    dockedAt = loc.id;
    openDock(loc);
}

function closeAll() {
    activePanel = null; dockedAt = null;
    document.getElementById('dock-panel').style.display = 'none';
    document.getElementById('ship-card').style.display = 'none';
}

function toggleShipCard() {
    if (activePanel === 'ship') { closeAll(); return; }
    if (activePanel === 'dock') return;
    activePanel = 'ship';
    renderShipCard();
    document.getElementById('ship-card').style.display = 'flex';
}

function openDock(loc) {
    activePanel = 'dock';
    document.getElementById('dock-panel').style.display = 'flex';
    document.getElementById('dock-title').textContent = loc.name;
    document.getElementById('dock-desc').textContent = loc.description || '';
    document.getElementById('tab-shipyard').style.display = (loc.type==='shipyard') ? 'inline-block' : 'none';
    renderDockTab('market');
}

function renderDockTab(tab) {
    dockTab = tab;
    document.querySelectorAll('.dtab').forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
    const cont = document.getElementById('dock-content');
    const maxCargo = SHIP_TYPES[player.shipType].maxCargo;
    const cargoW = Object.values(player.cargo).reduce((a,b)=>a+b,0);

    if (tab === 'market') {
        const prices = marketPrices[dockedAt] || {};
        let h = `<div class="mkt-hdr"><span>Náklad: <b>${cargoW}/${maxCargo} t</b></span><span>Peníze: <b id="money-live" style="color:#ffd740">${player.money.toLocaleString()} Cr</b></span></div>
        <table class="mkt-tbl"><thead><tr><th>Komodita</th><th>Cena/t</th><th>Mám</th><th colspan="2">Obchod</th></tr></thead><tbody>`;
        COMMODITIES.forEach(c => {
            const pr = prices[c.id]||c.basePrice;
            const own = player.cargo[c.id]||0;
            h += `<tr>
                <td>${c.name}</td>
                <td style="color:#ffd740">${pr} Cr</td>
                <td>${own} t</td>
                <td><button class="mb buy" onclick="buyCom('${c.id}',1)" ${cargoW>=maxCargo?'disabled':''}>+1</button>
                    <button class="mb buy" onclick="buyCom('${c.id}',10)" ${cargoW+10>maxCargo?'disabled':''}>+10</button></td>
                <td><button class="mb sell" onclick="sellCom('${c.id}',1)" ${own<1?'disabled':''}>-1</button>
                    <button class="mb sell" onclick="sellCom('${c.id}',10)" ${own<10?'disabled':''}>-10</button></td>
            </tr>`;
        });
        h += `</tbody></table><p id="dock-msg" style="color:#ff6;margin-top:8px;min-height:18px;font-size:.8em;"></p>`;
        cont.innerHTML = h;
    }

    if (tab === 'fuel') {
        const st = SHIP_TYPES[player.shipType];
        const miss = st.maxFuel - player.fuel;
        const FP = 8;
        cont.innerHTML = `<div class="fuel-panel">
            <p class="fp-label">Palivo</p>
            <div class="fp-bar"><div style="width:${(player.fuel/st.maxFuel*100).toFixed(1)}%;background:#00ff88;height:100%;border-radius:3px;transition:width .3s"></div></div>
            <p class="fp-val">${player.fuel.toFixed(1)} / ${st.maxFuel}</p>
            <p style="color:#00ff8888;margin:16px 0 8px">Cena: <b style="color:#00ff88">${FP} Cr / jednotka</b></p>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="mb buy" onclick="buyFuel(25)">+25 (${25*FP} Cr)</button>
                <button class="mb buy" onclick="buyFuel(50)">+50 (${50*FP} Cr)</button>
                <button class="mb buy" onclick="buyFuel(${Math.floor(miss)})">Plná nádrž (${Math.floor(miss)*FP} Cr)</button>
            </div>
            <p id="fuel-msg" style="color:#ffd740;margin-top:12px;min-height:18px;font-size:.8em;"></p>
        </div>`;
    }

    if (tab === 'shipyard') {
        let h = '<div class="yard-list">';
        Object.values(SHIP_TYPES).forEach(st => {
            const own = player.shipType===st.id;
            const can = player.money>=st.price;
            h += `<div class="yard-item${own?' owned':''}">
                <canvas id="yp_${st.id}" width="110" height="70" style="background:#000;border:1px solid ${st.color}33;border-radius:4px"></canvas>
                <div class="yard-info">
                    <h3 style="color:${st.color}">${st.name} ${own?'<span style="color:#00ff88">✓ VLASTNÍŠ</span>':''}</h3>
                    <p>${st.description}</p>
                    <p style="color:#aaa;font-size:.85em">Nádrž: ${st.maxFuel} &nbsp;|&nbsp; Náklad: ${st.maxCargo}t &nbsp;|&nbsp; Rychlost: ${Math.round(st.speed*100)}%</p>
                    <p class="yp">${st.price===0?'Startovací loď – zdarma':st.price.toLocaleString()+' Cr'}</p>
                </div>
                ${!own&&st.price>0?`<button class="mb buy ybtn" onclick="buyShip('${st.id}')" ${!can?'disabled':''}>${can?'Koupit':'Nedostatek Cr'}</button>`:''}
            </div>`;
        });
        h += '</div><p id="dock-msg" style="color:#ff6;margin-top:8px;min-height:18px;font-size:.8em;"></p>';
        cont.innerHTML = h;
        Object.values(SHIP_TYPES).forEach(st => {
            const c = document.getElementById(`yp_${st.id}`);
            if (!c) return;
            const cx = c.getContext('2d');
            cx.save(); cx.translate(55,35); st.draw(cx,false); cx.restore();
        });
    }
}

function buyCom(id, amt) {
    const pr = marketPrices[dockedAt]?.[id]||0;
    const cost = pr*amt;
    const cargoW = Object.values(player.cargo).reduce((a,b)=>a+b,0);
    const maxC = SHIP_TYPES[player.shipType].maxCargo;
    if (player.money<cost) { msg('dock-msg','Nedostatek peněz!'); return; }
    if (cargoW+amt>maxC) { msg('dock-msg','Nákladní prostor je plný!'); return; }
    player.money-=cost; player.cargo[id]=(player.cargo[id]||0)+amt;
    updateMoneyAll(); renderDockTab('market');
}

function sellCom(id, amt) {
    const own = player.cargo[id]||0;
    if (own<amt) return;
    player.money += (marketPrices[dockedAt]?.[id]||0)*amt;
    player.cargo[id]-=amt;
    if (player.cargo[id]<=0) delete player.cargo[id];
    updateMoneyAll(); renderDockTab('market');
}

function buyFuel(amt) {
    const st = SHIP_TYPES[player.shipType];
    const FP = 8;
    const can = Math.min(amt, st.maxFuel - player.fuel);
    const cost = Math.ceil(can*FP);
    if (player.money<cost) { msg('fuel-msg','Nedostatek peněz!'); return; }
    if (can<=0) { msg('fuel-msg','Nádrž je plná.'); return; }
    player.money-=cost; player.fuel=Math.min(st.maxFuel, player.fuel+can);
    updateMoneyAll(); updateFuelBar(); renderDockTab('fuel');
}

function buyShip(id) {
    const st = SHIP_TYPES[id];
    if (!st||player.money<st.price) return;
    player.money-=st.price; player.shipType=id;
    player.fuel=Math.min(player.fuel, st.maxFuel);
    const cw = Object.values(player.cargo).reduce((a,b)=>a+b,0);
    if (cw>st.maxCargo) player.cargo={};
    updateMoneyAll(); updateFuelBar();
    msg('dock-msg',`✓ Zakoupena loď ${st.name}!`);
    renderDockTab('shipyard');
}

function msg(id, text) {
    const el = document.getElementById(id);
    if (el) { el.textContent=text; setTimeout(()=>{ if(el)el.textContent=''; },2500); }
}

// ─── SHIP CARD ───────────────────────────────────────────────────
function renderShipCard() {
    const st = SHIP_TYPES[player.shipType];
    const cw = Object.values(player.cargo).reduce((a,b)=>a+b,0);
    const spd = Math.sqrt(ship.vx**2+ship.vy**2);
    document.getElementById('sc-name').textContent = st.name;
    document.getElementById('sc-fuel').textContent = `${player.fuel.toFixed(1)} / ${st.maxFuel}`;
    document.getElementById('sc-fbar').style.width = `${(player.fuel/st.maxFuel*100).toFixed(1)}%`;
    document.getElementById('sc-cargo').textContent = `${cw} / ${st.maxCargo} t`;
    document.getElementById('sc-money').textContent = player.money.toLocaleString()+' Cr';
    document.getElementById('sc-speed').textContent = spd.toFixed(4)+' AU/s';
    let ch = '';
    if (cw===0) ch='<p style="color:#00ff8833">Prázdný nákladní prostor</p>';
    else Object.entries(player.cargo).forEach(([id,a])=>{ const d=COMMODITIES.find(c=>c.id===id); ch+=`<div class="crow"><span>${d?.name||id}</span><span>${a} t</span></div>`; });
    document.getElementById('sc-clist').innerHTML = ch;
    const pc = document.getElementById('sc-preview');
    const pcx = pc.getContext('2d');
    pcx.clearRect(0,0,120,80); pcx.save(); pcx.translate(60,40); st.draw(pcx,false); pcx.restore();
}

// ─── HUD ─────────────────────────────────────────────────────────
function updateHUD() { updateMoneyAll(); updateFuelBar(); }
function updateMoneyAll() {
    document.getElementById('money-display').textContent = player.money.toLocaleString();
    const ml=document.getElementById('money-live'); if(ml) ml.textContent=player.money.toLocaleString();
}
function updateFuelBar() {
    const st=SHIP_TYPES[player.shipType];
    const pct=(player.fuel/st.maxFuel*100).toFixed(1);
    const b=document.getElementById('fuel-bar-fill'); if(b) b.style.width=pct+'%';
    document.getElementById('fuel-display').textContent=player.fuel.toFixed(0);
}

// ─── DRAW ────────────────────────────────────────────────────────
function draw() {
    ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
    ctx.save(); ctx.translate(-camera.x,-camera.y);
    drawBg(); drawOrbits(); drawSun(); drawPlanets(); drawStas(); drawOther(); drawMe();
    ctx.restore();
    drawMM();
}

function drawBg() {
    STARS.forEach(s => {
        const sx=((s.x-camera.x*s.p)%(AU*12)+AU*12)%(AU*12)-AU*6+camera.x;
        const sy=((s.y-camera.y*s.p)%(AU*12)+AU*12)%(AU*12)-AU*6+camera.y;
        ctx.beginPath(); ctx.arc(sx,sy,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${s.b})`; ctx.fill();
    });
}

function drawOrbits() {
    [...PLANETS,...STATIONS].forEach(o => {
        ctx.beginPath(); ctx.arc(0,0,(o.distanceAU||o.angleAU)*AU,0,Math.PI*2);
        ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1; ctx.setLineDash([4,8]); ctx.stroke(); ctx.setLineDash([]);
    });
}

function drawSun() {
    const g=ctx.createRadialGradient(0,0,40,0,0,250);
    g.addColorStop(0,'rgba(255,235,59,.3)'); g.addColorStop(1,'transparent');
    ctx.beginPath(); ctx.arc(0,0,250,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    const g2=ctx.createRadialGradient(-24,-24,0,0,0,80);
    g2.addColorStop(0,'#fff'); g2.addColorStop(.4,'#fff176'); g2.addColorStop(1,'#ff8f00');
    ctx.beginPath(); ctx.arc(0,0,80,0,Math.PI*2); ctx.fillStyle=g2; ctx.fill();
}

function drawPlanets() {
    PLANETS.forEach(p => {
        if (!p.currentX) return;
        const g=ctx.createRadialGradient(p.currentX,p.currentY,p.radius*.5,p.currentX,p.currentY,p.radius*2.8);
        g.addColorStop(0,p.glowColor+'40'); g.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(p.currentX,p.currentY,p.radius*2.8,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        const pg=ctx.createRadialGradient(p.currentX-p.radius*.3,p.currentY-p.radius*.3,0,p.currentX,p.currentY,p.radius);
        pg.addColorStop(0,lighten(p.color,50)); pg.addColorStop(1,darken(p.color,40));
        ctx.beginPath(); ctx.arc(p.currentX,p.currentY,p.radius,0,Math.PI*2); ctx.fillStyle=pg; ctx.fill();
        dockRing(p.currentX,p.currentY,p.radius+ship.landRadius);
        ctx.fillStyle='rgba(255,255,255,.75)'; ctx.font='12px "Share Tech Mono",monospace'; ctx.textAlign='center';
        ctx.fillText(p.name.toUpperCase(),p.currentX,p.currentY-p.radius-10);
    });
}

function drawStas() {
    STATIONS.forEach(s => {
        if (!s.currentX) return;
        const isY=s.type==='shipyard';
        const g=ctx.createRadialGradient(s.currentX,s.currentY,5,s.currentX,s.currentY,55);
        g.addColorStop(0,s.color+'44'); g.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(s.currentX,s.currentY,55,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        ctx.save(); ctx.translate(s.currentX,s.currentY);
        ctx.rotate(Date.now()*0.0003*(isY?1.5:1));
        ctx.strokeStyle=s.color; ctx.lineWidth=2;
        if (isY) {
            ctx.strokeRect(-16,-16,32,32); ctx.rotate(Math.PI/4);
            ctx.strokeStyle=s.color+'88'; ctx.strokeRect(-12,-12,24,24);
        } else {
            ctx.beginPath();
            for(let i=0;i<6;i++){const a=i*Math.PI/3; i===0?ctx.moveTo(Math.cos(a)*18,Math.sin(a)*18):ctx.lineTo(Math.cos(a)*18,Math.sin(a)*18);}
            ctx.closePath(); ctx.stroke();
        }
        const bl=(Math.sin(Date.now()*.004)+1)/2;
        ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2);
        ctx.fillStyle=s.color; ctx.globalAlpha=.5+bl*.5; ctx.fill(); ctx.globalAlpha=1;
        ctx.restore();
        dockRing(s.currentX,s.currentY,65);
        ctx.fillStyle=s.color+'cc'; ctx.font='11px "Share Tech Mono",monospace'; ctx.textAlign='center';
        ctx.fillText(s.name.toUpperCase(),s.currentX,s.currentY-36);
        if (isY) { ctx.fillStyle='#ffd740cc'; ctx.font='9px "Share Tech Mono",monospace'; ctx.fillText('⭐ LODĚNICE',s.currentX,s.currentY-48); }
    });
}

function dockRing(x,y,r) {
    const d=Math.sqrt((ship.x-x)**2+(ship.y-y)**2);
    if (d>r*5) return;
    const a=Math.max(0,1-d/(r*5))*.5;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
    ctx.strokeStyle=`rgba(0,255,136,${a})`; ctx.lineWidth=1; ctx.setLineDash([5,5]); ctx.stroke(); ctx.setLineDash([]);
}

function drawMe() {
    ctx.save(); ctx.translate(ship.x,ship.y); ctx.rotate(ship.angle);
    SHIP_TYPES[player.shipType].draw(ctx, ship.thrusting);
    ctx.restore();
    ctx.fillStyle=SHIP_TYPES[player.shipType].color+'aa';
    ctx.font='11px "Share Tech Mono",monospace'; ctx.textAlign='center';
    ctx.fillText(myUsername,ship.x,ship.y-32);
}

function drawOther() {
    otherPlayers.forEach(p => {
        const st=SHIP_TYPES[p.shipType]||SHIP_TYPES.sidewinder;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle);
        ctx.filter='hue-rotate(120deg) brightness(.8)';
        st.draw(ctx,false); ctx.filter='none';
        ctx.restore();
        ctx.fillStyle='#ff4444aa'; ctx.font='11px "Share Tech Mono",monospace'; ctx.textAlign='center';
        ctx.fillText(p.username,p.x,p.y-32);
    });
}

// ─── MINIMAP ─────────────────────────────────────────────────────
const mmC=document.getElementById('minimap-canvas');
const mctx=mmC.getContext('2d');
const MM=160, MMS=MM/(AU*4);
function drawMM() {
    mctx.clearRect(0,0,MM,MM);
    const cx=MM/2,cy=MM/2;
    mctx.fillStyle='rgba(0,0,0,.85)';
    mctx.beginPath(); mctx.arc(cx,cy,MM/2,0,Math.PI*2); mctx.fill();
    [...PLANETS,...STATIONS].forEach(o=>{
        mctx.beginPath(); mctx.arc(cx,cy,(o.distanceAU||o.angleAU)*AU*MMS,0,Math.PI*2);
        mctx.strokeStyle='rgba(255,255,255,.07)'; mctx.lineWidth=1; mctx.stroke();
    });
    PLANETS.forEach(p=>{ if(!p.currentX)return; mctx.beginPath(); mctx.arc(cx+p.currentX*MMS,cy+p.currentY*MMS,3,0,Math.PI*2); mctx.fillStyle=p.color; mctx.fill(); });
    STATIONS.forEach(s=>{ if(!s.currentX)return; mctx.beginPath(); mctx.arc(cx+s.currentX*MMS,cy+s.currentY*MMS,2.5,0,Math.PI*2); mctx.fillStyle=s.color; mctx.fill(); });
    mctx.beginPath(); mctx.arc(cx,cy,4,0,Math.PI*2); mctx.fillStyle='#ffd600'; mctx.fill();
    mctx.beginPath(); mctx.arc(cx+ship.x*MMS,cy+ship.y*MMS,2.5,0,Math.PI*2); mctx.fillStyle='#00ff88'; mctx.fill();
    otherPlayers.forEach(p=>{ mctx.beginPath(); mctx.arc(cx+p.x*MMS,cy+p.y*MMS,2,0,Math.PI*2); mctx.fillStyle='#ff4444'; mctx.fill(); });
    mctx.globalCompositeOperation='destination-in';
    mctx.beginPath(); mctx.arc(cx,cy,MM/2-1,0,Math.PI*2); mctx.fillStyle='#000'; mctx.fill();
    mctx.globalCompositeOperation='source-over';
    mctx.beginPath(); mctx.arc(cx,cy,MM/2-1,0,Math.PI*2); mctx.strokeStyle='#00ff8833'; mctx.lineWidth=1; mctx.stroke();
}

// ─── LOOP ────────────────────────────────────────────────────────
function gameLoop(ts) {
    if (!lastTime) lastTime=ts;
    const dt=Math.min((ts-lastTime)*60/1000*60,5);
    lastTime=ts;
    updatePhysics(dt); draw();
    requestAnimationFrame(gameLoop);
}

function lighten(h,a){return `rgb(${Math.min(255,parseInt(h.slice(1,3),16)+a)},${Math.min(255,parseInt(h.slice(3,5),16)+a)},${Math.min(255,parseInt(h.slice(5,7),16)+a)})`;}
function darken(h,a){return `rgb(${Math.max(0,parseInt(h.slice(1,3),16)-a)},${Math.max(0,parseInt(h.slice(3,5),16)-a)},${Math.max(0,parseInt(h.slice(5,7),16)-a)})`;}

init();