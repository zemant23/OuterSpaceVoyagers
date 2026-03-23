// ═══════════════════════════════════════════════════════════════
//  ELITE 2D  v3  – procedurální svět, dokovací minihra, nákladová tabulka
// ═══════════════════════════════════════════════════════════════
const AU = 2000;

// ─── LODĚ ───────────────────────────────────────────────────────
const SHIP_TYPES = {
    sidewinder: {
        id:'sidewinder', name:'Sidewinder', maxFuel:100, maxCargo:10, speed:1.0, price:0,
        description:'Lehká průzkumná loď. Malý náklad, velmi rychlá.',
        draw(ctx, thrust) {
            if (thrust) drawFlame(ctx,-10,0,14);
            ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(-10,-7); ctx.lineTo(-5,0); ctx.lineTo(-10,7);
            ctx.closePath(); ctx.fillStyle='#000'; ctx.strokeStyle='#000'; ctx.lineWidth=1.5; ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(7,0,2.5,0,Math.PI*2); ctx.fillStyle='#000'; ctx.fill();
        }
    },
    cobra: {
        id:'cobra', name:'Cobra Mk III', maxFuel:220, maxCargo:40, speed:0.82, price:120000,
        description:'Všestranná obchodní loď. Ideální pro trading.',
        draw(ctx, thrust) {
            if (thrust) { drawFlame(ctx,-16,-5,18); drawFlame(ctx,-16,5,18); }
            ctx.beginPath(); ctx.moveTo(22,0); ctx.lineTo(8,-12); ctx.lineTo(-14,-10);
            ctx.lineTo(-18,0); ctx.lineTo(-14,10); ctx.lineTo(8,12);
            ctx.closePath(); ctx.fillStyle='#000'; ctx.strokeStyle='#000'; ctx.lineWidth=1.5; ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(10,0,3,0,Math.PI*2); ctx.fillStyle='#000'; ctx.fill();
        }
    },
    anaconda: {
        id:'anaconda', name:'Anaconda', maxFuel:480, maxCargo:120, speed:0.6, price:650000,
        description:'Masivní nákladní loď. Obrovský náklad, pomalejší.',
        draw(ctx, thrust) {
            if (thrust) { drawFlame(ctx,-26,-8,22); drawFlame(ctx,-26,0,16); drawFlame(ctx,-26,8,22); }
            ctx.beginPath(); ctx.moveTo(30,0); ctx.lineTo(15,-8); ctx.lineTo(0,-16);
            ctx.lineTo(-20,-14); ctx.lineTo(-28,-6); ctx.lineTo(-28,6);
            ctx.lineTo(-20,14); ctx.lineTo(0,16); ctx.lineTo(15,8);
            ctx.closePath(); ctx.fillStyle='#000'; ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(18,0,4,0,Math.PI*2); ctx.fillStyle='#000'; ctx.fill();
        }
    }
};
function drawFlame(ctx,x,y,len){
    const fl=len+Math.random()*8;
    const g=ctx.createLinearGradient(x-fl,y,x,y);
    g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(0.5,'rgba(80,80,80,0.7)'); g.addColorStop(1,'rgba(0,0,0,0.85)');
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-fl,y-3-Math.random()*3); ctx.lineTo(x-fl,y+3+Math.random()*3);
    ctx.closePath(); ctx.fillStyle=g; ctx.fill();
}

// ─── KOMODITY ───────────────────────────────────────────────────
const COMMODITIES = [
    {id:'food',     name:'Potraviny',     basePrice:120,  vol:0.15},
    {id:'minerals', name:'Minerály',      basePrice:340,  vol:0.20},
    {id:'tech',     name:'Technologie',   basePrice:890,  vol:0.25},
    {id:'fuel_ore', name:'Palivová ruda', basePrice:210,  vol:0.18},
    {id:'water',    name:'Voda',          basePrice:80,   vol:0.10},
    {id:'weapons',  name:'Zbraně',        basePrice:1400, vol:0.30},
    {id:'medicine', name:'Léčiva',        basePrice:650,  vol:0.22},
    {id:'luxuries', name:'Luxusní zboží', basePrice:1100, vol:0.28},
];

// ─── ZÁKLADNÍ SOUSTAVY (AU od Sol = 0,0) ────────────────────────
// Sol (Sluneční soustava) = střed [0, 0]
// Alpha Centauri ~ 4.37 LY  = 276 000 AU  → mapujeme na 4.37 * světelný rok faktor
// Barnardova hvězda ~ 5.96 LY → 6.0x faktor
// Epsilon Eridani ~ 10.5 LY

const LY = AU * 63241; // 1 světelný rok v herních pixelech (1 LY = 63241 AU)
// To je příliš velké – použijeme zmenšený mezisvězdný prostor
// Na mezisvězdné úrovni: 1 LY = AU * 8  (aby byly dosažitelné při zrychlení)
const ILY = AU * 8;

const SYSTEMS_DATA = [
    {
        id:'sol', name:'Sol', x:0, y:0,
        starColor:'#FFF176', starRadius:80,
        starType:'G', discovered:true,
        planets:[
            {id:'merkur', name:'Merkur', distanceAU:0.39, radius:14, color:'#9E9E9E', orbitAngle:0.8,  orbitSpeed:0.00047},
            {id:'venuse', name:'Venuše', distanceAU:0.72, radius:20, color:'#FFCC80', orbitAngle:2.1,  orbitSpeed:0.00018},
            {id:'zeme',   name:'Země',   distanceAU:1.00, radius:22, color:'#42A5F5', orbitAngle:0.0,  orbitSpeed:0.00011},
            {id:'mars',   name:'Mars',   distanceAU:1.52, radius:16, color:'#EF5350', orbitAngle:3.5,  orbitSpeed:0.000059},
        ],
        stations:[
            {id:'st_gateway', name:'Gateway Station', angleAU:1.15, orbitAngle:1.2, orbitSpeed:0.00009,  type:'trade',    description:'Hlavní obchodní uzel poblíž Země.'},
            {id:'st_ceres',   name:'Ceres Outpost',   angleAU:1.35, orbitAngle:4.1, orbitSpeed:0.000075, type:'trade',    description:'Těžební stanice v pásu asteroidů.'},
            {id:'st_foundry', name:'Foundry Shipyard',angleAU:0.85, orbitAngle:5.5, orbitSpeed:0.00013,  type:'shipyard', description:'⭐ Loděnice – zde koupíš nové lodě.'},
            {id:'st_frontier',name:'Frontier Dock',   angleAU:1.68, orbitAngle:2.8, orbitSpeed:0.000052, type:'shipyard', description:'⭐ Loděnice – zde koupíš nové lodě.'},
        ],
        infoSat:{id:'sol_infosat', name:'Sol Info Beacon', angleAU:2.0, orbitAngle:0.5, orbitSpeed:0.00004}
    },
    {
        // Alpha Centauri – 4.37 LY od Slunce, směr ~přibližně jih-západ
        id:'alpha_centauri', name:'Alpha Centauri',
        x: ILY * -2.8, y: ILY * 3.3,
        starColor:'#FFE0B2', starRadius:55, starType:'G', discovered:false,
        planets:[
            {id:'proxima_b',  name:'Proxima b',   distanceAU:0.05, radius:12, color:'#EF9A9A', orbitAngle:0.4,  orbitSpeed:0.0008},
            {id:'centauri_c', name:'Centauri C',  distanceAU:0.38, radius:16, color:'#CE93D8', orbitAngle:2.0,  orbitSpeed:0.00050},
            {id:'centauri_d', name:'Centauri D',  distanceAU:0.82, radius:14, color:'#80CBC4', orbitAngle:4.5,  orbitSpeed:0.00016},
        ],
        stations:[
            {id:'ac_hub',   name:'Centauri Hub',    angleAU:0.55, orbitAngle:1.0, orbitSpeed:0.00012, type:'trade',    description:'Obchodní centrum soustavy Alpha Centauri.'},
            {id:'ac_yard',  name:'New Hope Shipyard',angleAU:1.0,  orbitAngle:3.0, orbitSpeed:0.00008, type:'shipyard', description:'⭐ Loděnice – vzdálená od Sol.'},
        ],
        infoSat:{id:'ac_infosat', name:'Centauri Info Beacon', angleAU:1.4, orbitAngle:2.0, orbitSpeed:0.00006}
    },
    {
        // Barnardova hvězda – 5.96 LY, směr sever
        id:'barnard', name:"Barnard's Star",
        x: ILY * 0.4, y: ILY * -5.9,
        starColor:'#EF9A9A', starRadius:35, starType:'M', discovered:false,
        planets:[
            {id:'barnard_b', name:"Barnard b",  distanceAU:0.10, radius:10, color:'#BDBDBD', orbitAngle:1.0,  orbitSpeed:0.00090},
            {id:'barnard_c', name:"Barnard c",  distanceAU:0.40, radius:18, color:'#A5D6A7', orbitAngle:3.2,  orbitSpeed:0.00045},
        ],
        stations:[
            {id:'bs_outpost', name:'Red Outpost', angleAU:0.7, orbitAngle:2.0, orbitSpeed:0.00011, type:'trade', description:'Odlehlá obchodní stanice u červeného trpaslíka.'},
        ],
        infoSat:{id:'bs_infosat', name:"Barnard Info Beacon", angleAU:1.0, orbitAngle:4.5, orbitSpeed:0.00009}
    }
];

// ─── WORLD STATE ─────────────────────────────────────────────────
// Procedurálně generované soustavy (kromě SYSTEMS_DATA)
let generatedSystems = [];
const PROC_GEN_DIST = ILY * 1.5; // každých ~1.5 LY se může generovat nová soustava
const PROC_GEN_RADIUS = ILY * 2;  // jak daleko hledáme

// Načteme z API při initu
async function loadGeneratedSystems() {
    try {
        const r = await fetch('/api/gen-systems');
        if (r.ok) { const d = await r.json(); if (Array.isArray(d)) generatedSystems = d; }
    } catch(e){}
}
async function saveGeneratedSystem(sys) {
    try {
        await fetch('/api/gen-systems', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify(sys)
        });
    } catch(e){}
}

function getAllSystems() {
    return [...SYSTEMS_DATA, ...generatedSystems];
}

// Generuj novou soustavu poblíž bodu
function tryGenerateSystem(px, py) {
    const all = getAllSystems();
    // Neber Sol oblast
    const distFromSol = Math.sqrt(px*px+py*py);
    if (distFromSol < ILY * 0.8) return;

    // Zkontroluj jestli nějaká existující soustava není příliš blízko
    for (const s of all) {
        const d = Math.sqrt((s.x-px)**2+(s.y-py)**2);
        if (d < PROC_GEN_DIST) return; // příliš blízko
    }

    // Generuj
    const id = 'gen_' + Date.now() + '_' + Math.floor(Math.random()*9999);
    const starTypes = [
        {type:'G', color:'#FFF176', radius:60},
        {type:'K', color:'#FFB74D', radius:45},
        {type:'M', color:'#EF9A9A', radius:30},
        {type:'F', color:'#E3F2FD', radius:70},
    ];
    const st = starTypes[Math.floor(Math.random()*starTypes.length)];
    const planetColors = ['#EF9A9A','#CE93D8','#80CBC4','#A5D6A7','#FFE082','#BDBDBD','#90CAF9','#FFAB91'];
    const numPlanets = 2 + Math.floor(Math.random()*4);
    const planets = [];
    for (let i=0; i<numPlanets; i++) {
        planets.push({
            id:`${id}_p${i}`, name:`${String.fromCharCode(65+i)}`,
            distanceAU: 0.3 + i*0.5 + Math.random()*0.3,
            radius: 10 + Math.floor(Math.random()*14),
            color: planetColors[Math.floor(Math.random()*planetColors.length)],
            orbitAngle: Math.random()*Math.PI*2,
            orbitSpeed: 0.0001 + Math.random()*0.0004
        });
    }
    const sysName = generateStarName();
    const newSys = {
        id, name:sysName, x:px + (Math.random()-0.5)*ILY*0.3, y:py + (Math.random()-0.5)*ILY*0.3,
        starColor:st.color, starRadius:st.radius, starType:st.type, discovered:true,
        planets,
        stations:[{
            id:`${id}_st0`, name:`${sysName} Station`,
            angleAU:planets[0].distanceAU+0.2+Math.random()*0.3,
            orbitAngle:Math.random()*Math.PI*2, orbitSpeed:0.00008+Math.random()*0.0001,
            type:'trade', description:`Vzdálená obchodní stanice v soustavě ${sysName}.`
        }],
        infoSat:{id:`${id}_infosat`, name:`${sysName} Beacon`, angleAU:planets[planets.length-1].distanceAU+0.5, orbitAngle:Math.random()*Math.PI*2, orbitSpeed:0.00003+Math.random()*0.00003}
    };
    generatedSystems.push(newSys);
    saveGeneratedSystem(newSys);
    return newSys;
}

const STAR_NAMES_A = ['Proxima','Nova','Sigma','Delta','Omega','Alpha','Vega','Lyra','Cygni','Orionis','Pegasi','Aquilae'];
const STAR_NAMES_B = ['Prime','Minor','Magna','Station','Reach','Drift','Haven','Nexus','Crossing','Deep'];
function generateStarName() {
    return STAR_NAMES_A[Math.floor(Math.random()*STAR_NAMES_A.length)] + ' ' + STAR_NAMES_B[Math.floor(Math.random()*STAR_NAMES_B.length)];
}

// Zkontroluj generaci při pohybu
let lastGenCheck = 0;
function checkWorldGen() {
    if (Date.now() - lastGenCheck < 3000) return;
    lastGenCheck = Date.now();
    const distFromSol = Math.sqrt(ship.x**2+ship.y**2);
    if (distFromSol > ILY * 0.5) {
        tryGenerateSystem(ship.x + (Math.random()-0.5)*PROC_GEN_RADIUS, ship.y + (Math.random()-0.5)*PROC_GEN_RADIUS);
    }
}

// ─── MARKET PRICES ──────────────────────────────────────────────
let marketPrices = {};
function initMarket() {
    getAllSystems().forEach(sys => {
        [...sys.planets, ...(sys.stations||[])].forEach(loc => {
            if (!marketPrices[loc.id]) initLocMarket(loc.id);
        });
    });
}
function initLocMarket(locId) {
    marketPrices[locId] = {};
    COMMODITIES.forEach(c => {
        const bias = 0.7 + Math.random()*0.8;
        marketPrices[locId][c.id] = Math.round(c.basePrice * bias * (0.9+Math.random()*0.2));
    });
}
function getMarketPrice(locId, comId) {
    if (!marketPrices[locId]) initLocMarket(locId);
    return marketPrices[locId][comId] || COMMODITIES.find(c=>c.id===comId)?.basePrice || 100;
}
function fluctuateMarket() {
    Object.keys(marketPrices).forEach(loc => {
        COMMODITIES.forEach(c => {
            const cur = marketPrices[loc][c.id];
            const d = (c.basePrice - cur)*0.08 + (Math.random()-0.5)*c.basePrice*c.vol*0.25;
            marketPrices[loc][c.id] = Math.max(10, Math.round(cur + d));
        });
    });
}
setInterval(fluctuateMarket, 30000);

// ─── PLAYER STATE ────────────────────────────────────────────────
let player = {money:10000, shipType:'sidewinder', fuel:100, cargo:{}};

// ─── CANVAS ──────────────────────────────────────────────────────
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = canvas.width = window.innerWidth;
let H = canvas.height = window.innerHeight;
window.addEventListener('resize', ()=>{ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; });
const camera = {x:0, y:0};

const ship = {
    x:AU*1.05, y:0, vx:0, vy:0, angle:0, thrusting:false,
    thrustBase:0.0003, thrustExp:1.6, rotSpeed:0.045,
    landRadius:55, fuelBurn:0.0012,
};

// ─── INPUT ───────────────────────────────────────────────────────
const keys = {};
document.addEventListener('keydown', e=>{
    keys[e.code]=true;
    if (e.code==='KeyE') tryDock();
    if (e.code==='Tab') { e.preventDefault(); toggleShipCard(); }
    if (e.code==='Escape') closeAll();
});
document.addEventListener('keyup', e=>{ keys[e.code]=false; });

// ─── STARS (background dots) ─────────────────────────────────────
const STARS = Array.from({length:600}, ()=>({
    x:(Math.random()-.5)*AU*20, y:(Math.random()-.5)*AU*20,
    r:Math.random()*1.2+0.1, b:Math.random()*0.5+0.08, p:0.01+Math.random()*0.04
}));

// ─── MULTIPLAYER ─────────────────────────────────────────────────
let otherPlayers = [];
let myUsername = '';
setInterval(async()=>{ try{const r=await fetch('/api/players');if(r.ok)otherPlayers=await r.json();}catch(e){} },600);
setInterval(async()=>{ try{
    await fetch('/api/position',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({x:ship.x,y:ship.y,angle:ship.angle,shipType:player.shipType})});
}catch(e){} },250);

// ─── PANELS ──────────────────────────────────────────────────────
let activePanel = null;
let dockedAt = null;
let dockTab = 'market';
let cargoTableVisible = false;


// ═══════════════════════════════════════════════════════════════
//  HVĚZDNÁ MAPA
// ═══════════════════════════════════════════════════════════════
let starMapOpen = false;
let smDrag = null; // pro posun mapy
let smOffset = {x:0, y:0};
let smScale = 1;

function openStarMap() {
    starMapOpen = true;
    const overlay = document.getElementById('star-map-overlay');
    overlay.classList.add('open');
    renderStarMap();
}

function closeStarMap() {
    starMapOpen = false;
    document.getElementById('star-map-overlay').classList.remove('open');
}

function renderStarMap() {
    const canvas = document.getElementById('sm-canvas');
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width  = rect.width;
    canvas.height = rect.height - 52; // minus header

    const ctx2 = canvas.getContext('2d');
    const cw = canvas.width, ch = canvas.height;
    const cx = cw/2 + smOffset.x, cy = ch/2 + smOffset.y;

    // Zjisti rozsah všech soustav pro auto-fit
    const allSys = getAllSystems();
    if (allSys.length === 0) return;
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    allSys.forEach(s=>{ minX=Math.min(minX,s.x); maxX=Math.max(maxX,s.x); minY=Math.min(minY,s.y); maxY=Math.max(maxY,s.y); });
    const rangeX = Math.max(maxX-minX, ILY*0.5);
    const rangeY = Math.max(maxY-minY, ILY*0.5);
    const autoScale = Math.min((cw-80)/rangeX, (ch-80)/rangeY) * smScale;
    const mapCX = (minX+maxX)/2;
    const mapCY = (minY+maxY)/2;

    function wx(x) { return cx + (x - mapCX) * autoScale; }
    function wy(y) { return cy + (y - mapCY) * autoScale; }

    // Pozadí
    ctx2.fillStyle = '#fff';
    ctx2.fillRect(0, 0, cw, ch);

    // Jemná mřížka
    ctx2.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx2.lineWidth = 1;
    for (let gx = 0; gx < cw; gx+=40) { ctx2.beginPath(); ctx2.moveTo(gx,0); ctx2.lineTo(gx,ch); ctx2.stroke(); }
    for (let gy = 0; gy < ch; gy+=40) { ctx2.beginPath(); ctx2.moveTo(0,gy); ctx2.lineTo(cw,gy); ctx2.stroke(); }

    // Spojovací čáry vzdáleností (k nejbližším sousedům)
    ctx2.strokeStyle = 'rgba(0,0,0,0.07)';
    ctx2.lineWidth = 1;
    ctx2.setLineDash([3,6]);
    allSys.forEach(a => {
        allSys.forEach(b => {
            if (a.id >= b.id) return;
            const d = Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2);
            if (d < ILY * 3) {
                ctx2.beginPath();
                ctx2.moveTo(wx(a.x), wy(a.y));
                ctx2.lineTo(wx(b.x), wy(b.y));
                ctx2.stroke();
            }
        });
    });
    ctx2.setLineDash([]);

    // Soustavy
    allSys.forEach(sys => {
        const sx = wx(sys.x), sy = wy(sys.y);
        if (sx < -20 || sx > cw+20 || sy < -20 || sy > ch+20) return;

        // Info satelit na hvězdné mapě – čtvereček
        if (sys.infoSat) {
            const pa = sys.infoSat.orbitAngle || 0;
            const orbitR = sys.infoSat.angleAU * AU * autoScale;
            const ix = sx + Math.cos(pa)*orbitR;
            const iy = sy + Math.sin(pa)*orbitR;
            if (orbitR > 6) {
                ctx2.strokeStyle='rgba(0,0,0,0.5)'; ctx2.lineWidth=1;
                ctx2.strokeRect(ix-3, iy-3, 6, 6);
            }
        }

        // Hvězdička záře
        const starR = Math.max(4, (sys.starRadius||40) * autoScale * 0.008);
        const g = ctx2.createRadialGradient(sx,sy,0,sx,sy,starR*3);
        g.addColorStop(0,'rgba(0,0,0,0.15)'); g.addColorStop(1,'transparent');
        ctx2.beginPath(); ctx2.arc(sx,sy,starR*3,0,Math.PI*2); ctx2.fillStyle=g; ctx2.fill();

        // Hvězda
        ctx2.beginPath(); ctx2.arc(sx,sy,Math.max(3,starR),0,Math.PI*2);
        ctx2.fillStyle='#000'; ctx2.fill();

        // Název soustavy
        ctx2.fillStyle='rgba(0,0,0,0.7)';
        ctx2.font='bold 10px "Orbitron",sans-serif';
        ctx2.textAlign='center';
        ctx2.fillText(sys.name.toUpperCase(), sx, sy - Math.max(3,starR) - 7);

        // Planety (malé tečky s názvy)
        sys.planets.forEach((p, i) => {
            const orbitR = p.distanceAU * AU * autoScale;
            if (orbitR < 1) return; // příliš malé

            // Orbit kruh (jen pro blízké soustavy)
            if (orbitR > 8) {
                ctx2.beginPath(); ctx2.arc(sx, sy, orbitR, 0, Math.PI*2);
                ctx2.strokeStyle='rgba(0,0,0,0.06)'; ctx2.lineWidth=1; ctx2.stroke();
            }

            // Pozice planety
            const pa = p.orbitAngle || 0;
            const px2 = sx + Math.cos(pa)*orbitR;
            const py2 = sy + Math.sin(pa)*orbitR;

            // Jen pokud je orbit viditelný
            if (orbitR < 4) return;

            const pr = Math.max(2, (p.radius||12) * autoScale * 0.012);
            ctx2.beginPath(); ctx2.arc(px2, py2, Math.max(2, pr), 0, Math.PI*2);
            ctx2.fillStyle='#000'; ctx2.fill();

            // Název planety
            if (orbitR > 12) {
                ctx2.fillStyle='rgba(0,0,0,0.5)';
                ctx2.font='9px "Share Tech Mono",monospace';
                ctx2.textAlign='center';
                ctx2.fillText(p.name, px2, py2 - Math.max(2,pr) - 4);
            }
        });
    });

    // Hráčova pozice (křížek)
    const px = wx(ship.x), py = wy(ship.y);
    ctx2.strokeStyle='#000'; ctx2.lineWidth=1.5;
    ctx2.beginPath(); ctx2.moveTo(px-6,py); ctx2.lineTo(px+6,py); ctx2.stroke();
    ctx2.beginPath(); ctx2.moveTo(px,py-6); ctx2.lineTo(px,py+6); ctx2.stroke();
    ctx2.beginPath(); ctx2.arc(px,py,4,0,Math.PI*2);
    ctx2.strokeStyle='rgba(0,0,0,0.4)'; ctx2.lineWidth=1; ctx2.stroke();

    // Legenda
    ctx2.fillStyle='rgba(0,0,0,0.25)';
    ctx2.font='9px "Share Tech Mono",monospace';
    ctx2.textAlign='left';
    ctx2.fillText('+ VAŠE POZICE', 12, ch-10);
    ctx2.textAlign='right';
    ctx2.fillText(`${allSys.length} SOUSTAV OBJEVENO`, cw-12, ch-10);

    // Scroll hint
    ctx2.fillStyle='rgba(0,0,0,0.15)';
    ctx2.textAlign='center';
    ctx2.fillText('SCROLL = ZOOM', cw/2, ch-10);
}

// Zoom + drag pro hvězdnou mapu
function initStarMapControls() {
    const smCanvas = document.getElementById('sm-canvas');
    if (!smCanvas) return;

    // Zoom
    smCanvas.addEventListener('wheel', e => {
        if (!starMapOpen) return;
        e.preventDefault();
        const rect = smCanvas.getBoundingClientRect();
        const mx = e.clientX - rect.left - smCanvas.width/2;
        const my = e.clientY - rect.top - smCanvas.height/2;
        const factor = e.deltaY < 0 ? 1.15 : 0.87;
        // Zoom ke kurzoru
        smOffset.x = mx + (smOffset.x - mx) * factor;
        smOffset.y = my + (smOffset.y - my) * factor;
        smScale = Math.max(0.2, Math.min(10, smScale * factor));
        renderStarMap();
    }, {passive:false});

    // Drag
    smCanvas.addEventListener('mousedown', e => {
        if (!starMapOpen) return;
        smDrag = {startX: e.clientX, startY: e.clientY, ox: smOffset.x, oy: smOffset.y};
        smCanvas.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', e => {
        if (!smDrag || !starMapOpen) return;
        smOffset.x = smDrag.ox + (e.clientX - smDrag.startX);
        smOffset.y = smDrag.oy + (e.clientY - smDrag.startY);
        renderStarMap();
    });
    window.addEventListener('mouseup', () => {
        smDrag = null;
        const smCanvas = document.getElementById('sm-canvas');
        if (smCanvas) smCanvas.style.cursor = 'grab';
    });
    smCanvas.style.cursor = 'grab';
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initStarMapControls, 400);
});

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

    document.getElementById('map-toggle').addEventListener('click', ()=>{
        if (starMapOpen) closeStarMap(); else openStarMap();
    });

    document.getElementById('cargo-toggle').addEventListener('click', ()=>{
        cargoTableVisible = !cargoTableVisible;
        document.getElementById('cargo-table-panel').style.display = cargoTableVisible ? 'block' : 'none';
        renderCargoTable();
    });

    try {
        const r = await fetch('/api/load-position');
        if (r.ok) {
            const d = await r.json();
            if (d && d.x!==undefined) {
                ship.x=d.x; ship.y=d.y; ship.angle=d.angle||0;
                if (d.player) Object.assign(player, d.player);
            }
        }
    } catch(e){}

    await loadGeneratedSystems();
    initMarket();

    // Init orbit positions
    getAllSystems().forEach(sys => initSystemPositions(sys));

    setInterval(savePlayer, 20000);
    updateHUD();
    requestAnimationFrame(gameLoop);
}

function initSystemPositions(sys) {
    sys.planets.forEach(p=>{
        p.currentX = sys.x + Math.cos(p.orbitAngle)*p.distanceAU*AU;
        p.currentY = sys.y + Math.sin(p.orbitAngle)*p.distanceAU*AU;
    });
    (sys.stations||[]).forEach(s=>{
        s.currentX = sys.x + Math.cos(s.orbitAngle)*s.angleAU*AU;
        s.currentY = sys.y + Math.sin(s.orbitAngle)*s.angleAU*AU;
    });
    if (sys.infoSat) {
        sys.infoSat.currentX = sys.x + Math.cos(sys.infoSat.orbitAngle)*sys.infoSat.angleAU*AU;
        sys.infoSat.currentY = sys.y + Math.sin(sys.infoSat.orbitAngle)*sys.infoSat.angleAU*AU;
    }
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
    ship.thrusting = (keys['KeyW']||keys['ArrowUp']) && player.fuel>0;
    if (ship.thrusting) {
        const spd = Math.sqrt(ship.vx**2+ship.vy**2);
        const mul = (1+Math.pow(spd*0.4,ship.thrustExp))*(SHIP_TYPES[player.shipType]?.speed??1);
        const thrust = ship.thrustBase*mul*dt;
        ship.vx += Math.cos(ship.angle)*thrust;
        ship.vy += Math.sin(ship.angle)*thrust;
        player.fuel = Math.max(0, player.fuel - ship.fuelBurn*dt);
        updateFuelBar();
    }
    if (keys['KeyS']||keys['ArrowDown']) { ship.vx*=0.97; ship.vy*=0.97; }

    // Gravitace nejbližší hvězdy
    getAllSystems().forEach(sys => {
        const dx=ship.x-sys.x, dy=ship.y-sys.y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if (d>50 && d<AU*3) {
            const g=0.00002*AU*AU/(d*d);
            ship.vx -= (dx/d)*g*dt; ship.vy -= (dy/d)*g*dt;
        }
    });

    ship.x+=ship.vx*dt; ship.y+=ship.vy*dt;

    // Aktualizuj orbity všech soustav
    getAllSystems().forEach(sys => {
        sys.planets.forEach(p=>{
            p.orbitAngle+=p.orbitSpeed*dt;
            p.currentX=sys.x+Math.cos(p.orbitAngle)*p.distanceAU*AU;
            p.currentY=sys.y+Math.sin(p.orbitAngle)*p.distanceAU*AU;
        });
        (sys.stations||[]).forEach(s=>{
            s.orbitAngle+=s.orbitSpeed*dt;
            s.currentX=sys.x+Math.cos(s.orbitAngle)*s.angleAU*AU;
            s.currentY=sys.y+Math.sin(s.orbitAngle)*s.angleAU*AU;
        });
        if (sys.infoSat) {
            sys.infoSat.orbitAngle+=sys.infoSat.orbitSpeed*dt;
            sys.infoSat.currentX=sys.x+Math.cos(sys.infoSat.orbitAngle)*sys.infoSat.angleAU*AU;
            sys.infoSat.currentY=sys.y+Math.sin(sys.infoSat.orbitAngle)*sys.infoSat.angleAU*AU;
        }
    });

    camera.x=ship.x-W/2; camera.y=ship.y-H/2;
    const spd2=Math.sqrt(ship.vx**2+ship.vy**2);
    document.getElementById('speed-display').textContent=spd2.toFixed(4);

    const nearby=getNearby();
    const el=document.getElementById('location-display');
    if (nearby && nearby._isInfoSat) { el.textContent=`[E] Info Beacon – ${nearby._sys.name}`; el.style.color='#000'; }
    else if (nearby) { el.textContent=`[E] Dokovat – ${nearby.name}`; el.style.color='#000'; }
    else { el.textContent='Hluboký vesmír'; el.style.color='#aaa'; }

    checkWorldGen();
    if (cargoTableVisible) renderCargoTable();
}

function getNearby() {
    for (const sys of getAllSystems()) {
        for (const p of sys.planets) {
            if (!p.currentX) continue;
            if (Math.sqrt((ship.x-p.currentX)**2+(ship.y-p.currentY)**2) < p.radius+ship.landRadius) return p;
        }
        for (const s of (sys.stations||[])) {
            if (!s.currentX) continue;
            if (Math.sqrt((ship.x-s.currentX)**2+(ship.y-s.currentY)**2) < 65) return s;
        }
        if (sys.infoSat && sys.infoSat.currentX) {
            const d = Math.sqrt((ship.x-sys.infoSat.currentX)**2+(ship.y-sys.infoSat.currentY)**2);
            if (d < 55) return {_isInfoSat:true, _sys:sys, id:sys.infoSat.id, name:sys.infoSat.name};
        }
    }
    return null;
}

// ─── PANELS ──────────────────────────────────────────────────────
function tryDock() {
    if (activePanel==='docking') return;
    if (activePanel==='dock'||activePanel==='infosat') { closeAll(); return; }
    const loc=getNearby();
    if (!loc) return;
    if (loc._isInfoSat) { openInfoSat(loc._sys); return; }
    startDockingMinigame(loc);
}

function closeAll() {
    activePanel=null; dockedAt=null; docking.active=false;
    closeStarMap();
    closeInfoSat();
    document.getElementById('dock-panel').style.display='none';
    document.getElementById('ship-card').style.display='none';
    document.getElementById('dock-canvas').style.display='none';
    document.getElementById('dock-hint').style.display='none';
    dLastTime=null;
}

function toggleShipCard() {
    if (activePanel==='ship') { closeAll(); return; }
    if (activePanel==='dock'||activePanel==='docking') return;
    activePanel='ship';
    renderShipCard();
    document.getElementById('ship-card').style.display='flex';
}

function openDock(loc) {
    activePanel='dock';
    document.getElementById('dock-panel').style.display='flex';
    document.getElementById('dock-title').textContent=loc.name;
    document.getElementById('dock-desc').textContent=loc.description||'';
    document.getElementById('tab-shipyard').style.display=(loc.type==='shipyard')?'inline-block':'none';
    renderDockTab('market');
}

// ─── MARKET ──────────────────────────────────────────────────────
function renderDockTab(tab) {
    dockTab=tab;
    document.querySelectorAll('.dtab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    const cont=document.getElementById('dock-content');
    const maxCargo=SHIP_TYPES[player.shipType].maxCargo;
    const cargoW=Object.values(player.cargo).reduce((a,b)=>a+b,0);

    if (tab==='market') {
        let h=`<div class="mkt-hdr"><span>Náklad: <b>${cargoW}/${maxCargo} t</b></span><span>Peníze: <b id="money-live">${player.money.toLocaleString()} Cr</b></span></div>
        <table class="mkt-tbl"><thead><tr><th>Komodita</th><th>Cena/t</th><th>Mám</th><th colspan="2">Obchod</th></tr></thead><tbody>`;
        COMMODITIES.forEach(c=>{
            const pr=getMarketPrice(dockedAt,c.id);
            const own=player.cargo[c.id]||0;
            h+=`<tr><td>${c.name}</td><td style="color:#333;font-weight:bold">${pr} Cr</td><td>${own} t</td>
                <td><button class="mb buy" onclick="buyCom('${c.id}',1)" ${cargoW>=maxCargo?'disabled':''}>+1</button>
                    <button class="mb buy" onclick="buyCom('${c.id}',10)" ${cargoW+10>maxCargo?'disabled':''}>+10</button></td>
                <td><button class="mb sell" onclick="sellCom('${c.id}',1)" ${own<1?'disabled':''}>-1</button>
                    <button class="mb sell" onclick="sellCom('${c.id}',10)" ${own<10?'disabled':''}>-10</button></td>
            </tr>`;
        });
        h+=`</tbody></table><p id="dock-msg" style="margin-top:8px;min-height:18px;font-size:.8em;color:#c00"></p>`;
        cont.innerHTML=h;
    }
    if (tab==='fuel') {
        const st=SHIP_TYPES[player.shipType];
        const miss=st.maxFuel-player.fuel; const FP=8;
        cont.innerHTML=`<div class="fuel-panel">
            <p class="fp-label">PALIVO</p>
            <div class="fp-bar"><div style="width:${(player.fuel/st.maxFuel*100).toFixed(1)}%;background:#000;height:100%;border-radius:2px;transition:width .3s"></div></div>
            <p class="fp-val">${player.fuel.toFixed(1)} / ${st.maxFuel}</p>
            <p style="color:#555;margin:14px 0 8px">Cena: <b style="color:#000">${FP} Cr / j</b></p>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="mb buy" onclick="buyFuel(25)">+25 (${25*FP} Cr)</button>
                <button class="mb buy" onclick="buyFuel(50)">+50 (${50*FP} Cr)</button>
                <button class="mb buy" onclick="buyFuel(${Math.floor(miss)})">Plná nádrž (${Math.floor(miss)*FP} Cr)</button>
            </div>
            <p id="fuel-msg" style="color:#c00;margin-top:10px;min-height:18px;font-size:.8em;"></p>
        </div>`;
    }
    if (tab==='shipyard') {
        let h='<div class="yard-list">';
        Object.values(SHIP_TYPES).forEach(st=>{
            const own=player.shipType===st.id;
            const can=player.money>=st.price;
            h+=`<div class="yard-item${own?' owned':''}">
                <canvas id="yp_${st.id}" width="110" height="70" style="background:#fff;border:1px solid #ccc;border-radius:3px"></canvas>
                <div class="yard-info">
                    <h3>${st.name}${own?' <span style="color:#000">✓</span>':''}</h3>
                    <p>${st.description}</p>
                    <p style="color:#666;font-size:.85em">Nádrž: ${st.maxFuel} | Náklad: ${st.maxCargo}t | Rychlost: ${Math.round(st.speed*100)}%</p>
                    <p class="yp">${st.price===0?'Startovací loď':st.price.toLocaleString()+' Cr'}</p>
                </div>
                ${!own&&st.price>0?`<button class="mb buy ybtn" onclick="buyShip('${st.id}')" ${!can?'disabled':''}>${can?'Koupit':'Nedost. Cr'}</button>`:''}
            </div>`;
        });
        h+=`</div><p id="dock-msg" style="margin-top:8px;min-height:18px;font-size:.8em;color:#000"></p>`;
        cont.innerHTML=h;
        Object.values(SHIP_TYPES).forEach(st=>{
            const c=document.getElementById(`yp_${st.id}`); if(!c)return;
            const cx=c.getContext('2d'); cx.save(); cx.translate(55,35); st.draw(cx,false); cx.restore();
        });
    }
}

function buyCom(id,amt){
    const pr=getMarketPrice(dockedAt,id);
    const cargoW=Object.values(player.cargo).reduce((a,b)=>a+b,0);
    const maxC=SHIP_TYPES[player.shipType].maxCargo;
    if(player.money<pr*amt){msg('dock-msg','Nedostatek peněz!');return;}
    if(cargoW+amt>maxC){msg('dock-msg','Nákladní prostor je plný!');return;}
    player.money-=pr*amt; player.cargo[id]=(player.cargo[id]||0)+amt;
    updateMoneyAll(); renderDockTab('market');
}
function sellCom(id,amt){
    const own=player.cargo[id]||0; if(own<amt)return;
    player.money+=(getMarketPrice(dockedAt,id))*amt;
    player.cargo[id]-=amt; if(player.cargo[id]<=0)delete player.cargo[id];
    updateMoneyAll(); renderDockTab('market');
}
function buyFuel(amt){
    const st=SHIP_TYPES[player.shipType]; const FP=8;
    const can=Math.min(amt,st.maxFuel-player.fuel); const cost=Math.ceil(can*FP);
    if(player.money<cost){msg('fuel-msg','Nedostatek peněz!');return;}
    if(can<=0){msg('fuel-msg','Nádrž je plná.');return;}
    player.money-=cost; player.fuel=Math.min(st.maxFuel,player.fuel+can);
    updateMoneyAll(); updateFuelBar(); renderDockTab('fuel');
}
function buyShip(id){
    const st=SHIP_TYPES[id]; if(!st||player.money<st.price)return;
    player.money-=st.price; player.shipType=id;
    player.fuel=Math.min(player.fuel,st.maxFuel);
    const cw=Object.values(player.cargo).reduce((a,b)=>a+b,0);
    if(cw>st.maxCargo)player.cargo={};
    updateMoneyAll(); updateFuelBar(); msg('dock-msg',`✓ Zakoupena ${st.name}`); renderDockTab('shipyard');
}
function msg(id,text){const el=document.getElementById(id);if(el){el.textContent=text;setTimeout(()=>{if(el)el.textContent='';},2500);}}

// ─── SHIP CARD ───────────────────────────────────────────────────
function renderShipCard() {
    const st=SHIP_TYPES[player.shipType];
    const cw=Object.values(player.cargo).reduce((a,b)=>a+b,0);
    const spd=Math.sqrt(ship.vx**2+ship.vy**2);
    document.getElementById('sc-name').textContent=st.name;
    document.getElementById('sc-fuel').textContent=`${player.fuel.toFixed(1)} / ${st.maxFuel}`;
    document.getElementById('sc-fbar').style.width=`${(player.fuel/st.maxFuel*100).toFixed(1)}%`;
    document.getElementById('sc-cargo').textContent=`${cw} / ${st.maxCargo} t`;
    document.getElementById('sc-money').textContent=player.money.toLocaleString()+' Cr';
    document.getElementById('sc-speed').textContent=spd.toFixed(4)+' AU/s';
    let ch='';
    if(cw===0)ch='<p style="color:#aaa;font-size:.8em">Prázdný</p>';
    else Object.entries(player.cargo).forEach(([id,a])=>{
        const d=COMMODITIES.find(c=>c.id===id);
        ch+=`<div class="crow"><span>${d?.name||id}</span><span>${a} t</span></div>`;
    });
    document.getElementById('sc-clist').innerHTML=ch;
    const pc=document.getElementById('sc-preview');
    const pcx=pc.getContext('2d'); pcx.clearRect(0,0,120,80);
    pcx.save(); pcx.translate(60,40); st.draw(pcx,false); pcx.restore();
}

// ─── CARGO TABLE ─────────────────────────────────────────────────
function renderCargoTable() {
    const cw=Object.values(player.cargo).reduce((a,b)=>a+b,0);
    const maxC=SHIP_TYPES[player.shipType].maxCargo;
    const panel=document.getElementById('cargo-table-panel');
    let h=`<div class="ct-header">NÁKLAD <span>${cw}/${maxC} t</span></div>`;
    if (cw===0) { h+='<p class="ct-empty">Prázdný nákladní prostor</p>'; }
    else {
        h+='<table class="ct-tbl"><thead><tr><th>Komodita</th><th>Množství</th></tr></thead><tbody>';
        Object.entries(player.cargo).forEach(([id,amt])=>{
            const d=COMMODITIES.find(c=>c.id===id);
            const pct=Math.round(amt/maxC*100);
            h+=`<tr><td>${d?.name||id}</td><td>
                <div class="ct-bar-wrap"><div class="ct-bar" style="width:${pct}%"></div></div>
                <span class="ct-amt">${amt} t</span>
            </td></tr>`;
        });
        h+='</tbody></table>';
    }
    panel.innerHTML=h;
}

// ─── HUD ─────────────────────────────────────────────────────────
function updateHUD(){updateMoneyAll();updateFuelBar();}
function updateMoneyAll(){
    document.getElementById('money-display').textContent=player.money.toLocaleString();
    const ml=document.getElementById('money-live'); if(ml)ml.textContent=player.money.toLocaleString();
}
function updateFuelBar(){
    const st=SHIP_TYPES[player.shipType];
    const pct=(player.fuel/st.maxFuel*100).toFixed(1);
    const b=document.getElementById('fuel-bar-fill'); if(b)b.style.width=pct+'%';
    document.getElementById('fuel-display').textContent=player.fuel.toFixed(0);
}

// ─── DRAW ────────────────────────────────────────────────────────
function draw() {
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
    ctx.save(); ctx.translate(-camera.x,-camera.y);
    drawBg();
    // Kresli vzdálené soustavy jako hvězdičky pokud jsou daleko
    getAllSystems().forEach(sys => {
        const screenDist = Math.sqrt((sys.x-ship.x)**2+(sys.y-ship.y)**2);
        if (screenDist > AU*6) {
            drawDistantSystem(sys);
        } else {
            drawSystem(sys);
        }
    });
    drawOther(); drawMe();
    ctx.restore();
    drawMM();
}

function drawBg() {
    STARS.forEach(s=>{
        const sx=((s.x-camera.x*s.p)%(AU*20)+AU*20)%(AU*20)-AU*10+camera.x;
        const sy=((s.y-camera.y*s.p)%(AU*20)+AU*20)%(AU*20)-AU*10+camera.y;
        ctx.beginPath(); ctx.arc(sx,sy,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(0,0,0,${s.b})`; ctx.fill();
    });
}

function drawDistantSystem(sys) {
    // Vzdálená soustava – jen malá hvězdička + název
    const sx=sys.x, sy=sys.y;
    const g=ctx.createRadialGradient(sx,sy,0,sx,sy,12);
    g.addColorStop(0,sys.starColor); g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.arc(sx,sy,6,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    ctx.beginPath(); ctx.arc(sx,sy,2.5,0,Math.PI*2); ctx.fillStyle='#000'; ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.font='10px "Share Tech Mono",monospace'; ctx.textAlign='center';
    ctx.fillText(sys.name, sx, sy-12);
}

function drawSystem(sys) {
    // Orbity
    sys.planets.forEach(p=>{
        ctx.beginPath(); ctx.arc(sys.x,sys.y,p.distanceAU*AU,0,Math.PI*2);
        ctx.strokeStyle='rgba(0,0,0,0.06)'; ctx.lineWidth=1; ctx.setLineDash([4,8]); ctx.stroke(); ctx.setLineDash([]);
    });
    (sys.stations||[]).forEach(s=>{
        ctx.beginPath(); ctx.arc(sys.x,sys.y,s.angleAU*AU,0,Math.PI*2);
        ctx.strokeStyle='rgba(0,0,0,0.04)'; ctx.lineWidth=1; ctx.setLineDash([2,6]); ctx.stroke(); ctx.setLineDash([]);
    });

    // Hvězda
    const g=ctx.createRadialGradient(sys.x,sys.y,sys.starRadius*.5,sys.x,sys.y,sys.starRadius*3);
    g.addColorStop(0,'rgba(0,0,0,0.12)'); g.addColorStop(1,'transparent');
    ctx.beginPath(); ctx.arc(sys.x,sys.y,sys.starRadius*3,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    const g2=ctx.createRadialGradient(sys.x-20,sys.y-20,0,sys.x,sys.y,sys.starRadius);
    g2.addColorStop(0,'#555'); g2.addColorStop(0.4,'#111'); g2.addColorStop(1,'#000');
    ctx.beginPath(); ctx.arc(sys.x,sys.y,sys.starRadius,0,Math.PI*2); ctx.fillStyle=g2; ctx.fill();

    // Planety
    sys.planets.forEach(p=>{
        if(!p.currentX)return;
        const pg=ctx.createRadialGradient(p.currentX-p.radius*.3,p.currentY-p.radius*.3,0,p.currentX,p.currentY,p.radius);
        pg.addColorStop(0,'#444'); pg.addColorStop(1,'#000');
        ctx.beginPath(); ctx.arc(p.currentX,p.currentY,p.radius,0,Math.PI*2); ctx.fillStyle=pg; ctx.fill();
        dockRing(p.currentX,p.currentY,p.radius+ship.landRadius);
        ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.font='11px "Share Tech Mono",monospace'; ctx.textAlign='center';
        ctx.fillText(p.name.toUpperCase(),p.currentX,p.currentY-p.radius-8);
    });

    // Stanice
    (sys.stations||[]).forEach(s=>{
        if(!s.currentX)return;
        const isY=s.type==='shipyard';
        ctx.save(); ctx.translate(s.currentX,s.currentY);
        ctx.rotate(Date.now()*0.0003*(isY?1.5:1));
        ctx.strokeStyle='#000'; ctx.lineWidth=2;
        if(isY){
            ctx.strokeRect(-14,-14,28,28); ctx.rotate(Math.PI/4);
            ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.strokeRect(-10,-10,20,20);
        } else {
            ctx.beginPath();
            for(let i=0;i<6;i++){const a=i*Math.PI/3;i===0?ctx.moveTo(Math.cos(a)*16,Math.sin(a)*16):ctx.lineTo(Math.cos(a)*16,Math.sin(a)*16);}
            ctx.closePath(); ctx.stroke();
        }
        const bl=(Math.sin(Date.now()*.004)+1)/2;
        ctx.beginPath(); ctx.arc(0,0,2.5,0,Math.PI*2);
        ctx.fillStyle='#000'; ctx.globalAlpha=.4+bl*.6; ctx.fill(); ctx.globalAlpha=1;
        ctx.restore();
        dockRing(s.currentX,s.currentY,60);
        ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.font='10px "Share Tech Mono",monospace'; ctx.textAlign='center';
        ctx.fillText(s.name.toUpperCase(),s.currentX,s.currentY-30);
        if(isY){ ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.font='8px "Share Tech Mono",monospace'; ctx.fillText('⭐ LODĚNICE',s.currentX,s.currentY-40); }
    });

    // Název soustavy (jen pokud jsme v ní)
    const dSys=Math.sqrt((ship.x-sys.x)**2+(ship.y-sys.y)**2);
    if(dSys<AU*4){
        ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.font='bold 13px "Orbitron",sans-serif'; ctx.textAlign='center';
        ctx.fillText(sys.name.toUpperCase(), sys.x, sys.y - sys.starRadius - 20);
    }

    // Info satelit (čtvereček)
    if (sys.infoSat && sys.infoSat.currentX) {
        const sx=sys.infoSat.currentX, sy=sys.infoSat.currentY;
        // Orbit čára
        ctx.beginPath(); ctx.arc(sys.x,sys.y,sys.infoSat.angleAU*AU,0,Math.PI*2);
        ctx.strokeStyle='rgba(0,0,0,0.04)'; ctx.lineWidth=1; ctx.setLineDash([2,8]); ctx.stroke(); ctx.setLineDash([]);
        // Čtvereček – blikající
        const bl=(Math.sin(Date.now()*.003)+1)/2;
        ctx.save(); ctx.translate(sx,sy); ctx.rotate(Date.now()*0.0005);
        ctx.strokeStyle='#000'; ctx.lineWidth=1.5;
        ctx.globalAlpha=0.5+bl*0.5;
        ctx.strokeRect(-7,-7,14,14);
        // Vnitřní tečka
        ctx.beginPath(); ctx.arc(0,0,2,0,Math.PI*2);
        ctx.fillStyle='#000'; ctx.fill();
        ctx.globalAlpha=1;
        ctx.restore();
        // Dock ring
        dockRing(sx,sy,55);
        // Popisek
        ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.font='9px "Share Tech Mono",monospace'; ctx.textAlign='center';
        ctx.fillText('INFO', sx, sy-14);
        ctx.fillText('[E]', sx, sy+20);
    }
}

function dockRing(x,y,r){
    const d=Math.sqrt((ship.x-x)**2+(ship.y-y)**2);
    if(d>r*5)return;
    const a=Math.max(0,1-d/(r*5))*.4;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
    ctx.strokeStyle=`rgba(0,0,0,${a})`; ctx.lineWidth=1; ctx.setLineDash([5,5]); ctx.stroke(); ctx.setLineDash([]);
}

function drawMe(){
    ctx.save(); ctx.translate(ship.x,ship.y); ctx.rotate(ship.angle);
    SHIP_TYPES[player.shipType].draw(ctx,ship.thrusting);
    ctx.restore();
    ctx.fillStyle='rgba(0,0,0,0.65)'; ctx.font='11px "Share Tech Mono",monospace'; ctx.textAlign='center';
    ctx.fillText(myUsername,ship.x,ship.y-30);
}
function drawOther(){
    otherPlayers.forEach(p=>{
        const st=SHIP_TYPES[p.shipType]||SHIP_TYPES.sidewinder;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle);
        ctx.globalAlpha=0.5; st.draw(ctx,false); ctx.globalAlpha=1;
        ctx.restore();
        ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.font='11px "Share Tech Mono",monospace'; ctx.textAlign='center';
        ctx.fillText(p.username,p.x,p.y-30);
    });
}

// ─── MINIMAP ─────────────────────────────────────────────────────
const mmC=document.getElementById('minimap-canvas');
const mctx=mmC.getContext('2d');
const MM=160;

function drawMM(){
    mctx.clearRect(0,0,MM,MM);
    const cx=MM/2,cy=MM/2;

    // Adaptivní škála podle vzdálenosti od Sol
    const distFromSol=Math.sqrt(ship.x**2+ship.y**2);
    const MMS = distFromSol < AU*3 ? MM/(AU*4) : MM/(ILY*8);

    mctx.fillStyle='rgba(248,248,248,.97)';
    mctx.beginPath(); mctx.arc(cx,cy,MM/2,0,Math.PI*2); mctx.fill();

    // Soustavy na minimapě
    getAllSystems().forEach(sys=>{
        const sx=cx+sys.x*MMS, sy=cy+sys.y*MMS;
        if(Math.abs(sx-cx)>MM/2+10||Math.abs(sy-cy)>MM/2+10)return;
        mctx.beginPath(); mctx.arc(sx,sy,4,0,Math.PI*2);
        mctx.fillStyle='#000'; mctx.fill();
        // Planety při blízkém pohledu
        if (MMS > MM/(AU*6)) {
            sys.planets.forEach(p=>{ if(!p.currentX)return;
                mctx.beginPath(); mctx.arc(cx+p.currentX*MMS,cy+p.currentY*MMS,2,0,Math.PI*2);
                mctx.fillStyle='#555'; mctx.fill();
            });
        }
    });

    // Info satelity na minimapě – čtverečky
    getAllSystems().forEach(sys=>{
        if(!sys.infoSat||!sys.infoSat.currentX)return;
        const ix=cx+sys.infoSat.currentX*MMS, iy=cy+sys.infoSat.currentY*MMS;
        if(Math.abs(ix-cx)>MM/2+4||Math.abs(iy-cy)>MM/2+4)return;
        mctx.strokeStyle='rgba(0,0,0,0.7)'; mctx.lineWidth=1;
        mctx.strokeRect(ix-2.5,iy-2.5,5,5);
    });

    // Hráč
    mctx.beginPath(); mctx.arc(cx+ship.x*MMS,cy+ship.y*MMS,3,0,Math.PI*2);
    mctx.fillStyle='#000'; mctx.fill();
    otherPlayers.forEach(p=>{
        mctx.beginPath(); mctx.arc(cx+p.x*MMS,cy+p.y*MMS,2,0,Math.PI*2);
        mctx.fillStyle='#888'; mctx.fill();
    });

    // Clip + border
    mctx.globalCompositeOperation='destination-in';
    mctx.beginPath(); mctx.arc(cx,cy,MM/2-1,0,Math.PI*2); mctx.fillStyle='#000'; mctx.fill();
    mctx.globalCompositeOperation='source-over';
    mctx.beginPath(); mctx.arc(cx,cy,MM/2-1,0,Math.PI*2);
    mctx.strokeStyle='rgba(0,0,0,0.25)'; mctx.lineWidth=1; mctx.stroke();
}

// ─── GAME LOOP ───────────────────────────────────────────────────
function gameLoop(ts){
    if(!lastTime)lastTime=ts;
    const dt=Math.min((ts-lastTime)*60/1000*60,5);
    lastTime=ts;
    updatePhysics(dt); draw();
    if(starMapOpen) renderStarMap();
    requestAnimationFrame(gameLoop);
}

// ─── COLOR HELPERS ───────────────────────────────────────────────
function lighten(h,a){return`rgb(${Math.min(255,parseInt(h.slice(1,3),16)+a)},${Math.min(255,parseInt(h.slice(3,5),16)+a)},${Math.min(255,parseInt(h.slice(5,7),16)+a)})`;}
function darken(h,a){return`rgb(${Math.max(0,parseInt(h.slice(1,3),16)-a)},${Math.max(0,parseInt(h.slice(3,5),16)-a)},${Math.max(0,parseInt(h.slice(5,7),16)-a)})`;}

// ═══════════════════════════════════════════════════════════════
//  DOKOVACÍ MINIHRA  –  U-hangár styl (per obrázek)
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
//  DOKOVACÍ MINIHRA  v3  – vstup otvorem, NPC, 4 platformy
// ═══════════════════════════════════════════════════════════════
// Layout:
//   Velká černá zeď nahoře + dole s OTVOREM uprostřed (vstup)
//   Za otvorem 4 platformy (2 nahoře, 2 dole) – loď si vybere
//   NPC létají v dokovacím prostoru a musíš je obejít
//   Obsazená platforma = NPC na ní sedí

const DOCK_W = 900;   // šířka dokovacího prostoru
const DOCK_H = 600;   // výška
const WALL_T = 80;    // tloušťka zdi
const GATE_H = 130;   // výška vstupního otvoru
const PLAT_W = 160;   // šířka platformy
const PLAT_H = 14;    // tloušťka platformy
const PLAT_MARGIN = 60; // vzdálenost platformy od stěny

const docking = {
    active: false,
    loc: null,
    phase: 'approach', // 'approach' | 'inside' | 'landing' | 'success' | 'fail'
    timer: 0,
    crashMsg: '',

    // Loď v dokovacím prostoru (lokální souřadnice, střed = 0,0)
    sx: 0, sy: 0, svx: 0, svy: 0, sAngle: 0,

    // Platformy [{ id, x, y, occupied, landingTimer }]
    platforms: [],

    // NPC lodě [{ x, y, vx, vy, angle, timer }]
    npcs: [],
    npcSpawnTimer: 0,

    // Vybraná platforma (hover)
    hoveredPlat: null,
    landedPlat: null,
};

const dcv = document.getElementById('dock-canvas');
const dcc = dcv ? dcv.getContext('2d') : null;
let dLastTime = null;

// ── Pomocné – platformy layout ────────────────────────────────
function buildPlatforms(occupiedCount) {
    // 4 platformy: 2 nahoře (čísla 3,4), 2 dole (čísla 1,2)
    // x relativně ke středu prostoru, y od středu
    const halfW = DOCK_W / 2;
    const plats = [
        { id:0, label:'1', x: -halfW + PLAT_MARGIN + PLAT_W/2,  y:  DOCK_H/2 - WALL_T - PLAT_H },
        { id:1, label:'2', x:  halfW - PLAT_MARGIN - PLAT_W/2,  y:  DOCK_H/2 - WALL_T - PLAT_H },
        { id:2, label:'3', x: -halfW + PLAT_MARGIN + PLAT_W/2,  y: -DOCK_H/2 + WALL_T },
        { id:3, label:'4', x:  halfW - PLAT_MARGIN - PLAT_W/2,  y: -DOCK_H/2 + WALL_T },
    ];
    // Náhodně obsaď platforms podle ostatních hráčů
    let occ = Math.min(occupiedCount, 3);
    const indices = [0,1,2,3].sort(()=>Math.random()-.5);
    plats.forEach((p, i) => {
        p.occupied = indices.indexOf(i) < occ;
        p.landingTimer = 0;
    });
    return plats;
}

// ── Start ─────────────────────────────────────────────────────
function startDockingMinigame(loc) {
    const occupiedCount = otherPlayers.filter(p => {
        const dx = p.x - loc.currentX, dy = p.y - loc.currentY;
        return Math.sqrt(dx*dx+dy*dy) < 200;
    }).length;

    docking.active = true;
    docking.loc = loc;
    docking.phase = 'approach';
    docking.timer = 0;
    docking.crashMsg = '';
    docking.hoveredPlat = null;
    docking.landedPlat = null;
    docking.platforms = buildPlatforms(occupiedCount);
    docking.npcs = [];
    docking.npcSpawnTimer = 2.0;

    // Loď začíná vlevo od otvoru, uprostřed výšky
    docking.sx = -DOCK_W/2 - 120;
    docking.sy = 0;
    docking.svx = 0;
    docking.svy = 0;
    docking.sAngle = 0; // míří doprava

    activePanel = 'docking';
    dcv.style.display = 'block';
    document.getElementById('dock-hint').style.display = 'block';
    dLastTime = null;
    requestAnimationFrame(dockingLoop);
}

function showFullMsg(loc) {
    const el = document.getElementById('dock-full-msg');
    el.textContent = `${loc.name}: všechna místa obsazena.`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
}

// ── Loop ─────────────────────────────────────────────────────
function dockingLoop(ts) {
    if (!docking.active) return;
    if (!dLastTime) dLastTime = ts;
    const dt = Math.min((ts - dLastTime) / 1000, 0.05);
    dLastTime = ts;

    if (docking.phase === 'success' || docking.phase === 'fail') {
        docking.timer -= dt;
        if (docking.timer <= 0) {
            if (docking.phase === 'success') {
                docking.active = false;
                dcv.style.display = 'none';
                document.getElementById('dock-hint').style.display = 'none';
                dLastTime = null; activePanel = null;
                dockedAt = docking.loc.id;
                openDock(docking.loc);
            } else {
                docking.active = false; activePanel = null;
                dcv.style.display = 'none';
                document.getElementById('dock-hint').style.display = 'none';
                dLastTime = null;
            }
        }
        drawDockingScene();
        requestAnimationFrame(dockingLoop);
        return;
    }

    updateDockPhysics(dt);
    updateNPCs(dt);
    checkDockCollisions();
    drawDockingScene();
    requestAnimationFrame(dockingLoop);
}

// ── Fyzika lodi ───────────────────────────────────────────────
function updateDockPhysics(dt) {
    const ROT = 2.8, THRUST = 280, BRAKE = 0.97;
    if (keys['KeyA'] || keys['ArrowLeft'])  docking.sAngle -= ROT * dt;
    if (keys['KeyD'] || keys['ArrowRight']) docking.sAngle += ROT * dt;
    const thrusting = keys['KeyW'] || keys['ArrowUp'];
    if (thrusting) {
        docking.svx += Math.cos(docking.sAngle) * THRUST * dt;
        docking.svy += Math.sin(docking.sAngle) * THRUST * dt;
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
        docking.svx *= BRAKE;
        docking.svy *= BRAKE;
    }
    docking.sx += docking.svx * dt;
    docking.sy += docking.svy * dt;
}

// ── NPC lodě ─────────────────────────────────────────────────
function spawnNPC() {
    // Generuj NPC na vstupním otvoru nebo uvnitř
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? -DOCK_W/2 + 10 : DOCK_W/2 - 10;
    const y = (Math.random() - 0.5) * (GATE_H - 30);
    const spd = 60 + Math.random() * 80;
    const angle = fromLeft ? 0 : Math.PI;
    docking.npcs.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: (Math.random() - 0.5) * 40,
        angle,
        life: 6.0,
    });
}

function updateNPCs(dt) {
    docking.npcSpawnTimer -= dt;
    if (docking.npcSpawnTimer <= 0 && docking.phase === 'inside') {
        spawnNPC();
        docking.npcSpawnTimer = 1.5 + Math.random() * 2.0;
    }
    docking.npcs = docking.npcs.filter(n => {
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        n.life -= dt;
        // Odraz od stěn
        const innerH = DOCK_H/2 - WALL_T;
        if (Math.abs(n.y) > innerH - 10) { n.vy *= -1; n.y = Math.sign(n.y) * (innerH - 10); }
        if (Math.abs(n.x) > DOCK_W/2 - 10) { n.vx *= -1; }
        return n.life > 0;
    });
}

// ── Kolize ───────────────────────────────────────────────────
function checkDockCollisions() {
    const sx = docking.sx, sy = docking.sy;
    const halfW = DOCK_W / 2;
    const innerH = DOCK_H/2 - WALL_T; // vnitřní výška bez zdí

    // Vstupní otvor – je loď v oblasti otvoru nebo uvnitř?
    const inGate  = sx > -halfW - 20 && sx < -halfW + 60 && Math.abs(sy) < GATE_H/2;
    const inside  = sx > -halfW + 60;
    const outsideRight = sx > halfW - 20;

    if (inside || inGate) docking.phase = 'inside';

    // Náraz do horní/dolní zdi
    if (inside && Math.abs(sy) > innerH) {
        triggerDockCrash('NÁRAZ DO ZDI!'); return;
    }

    // Náraz do boční zdi (vpravo)
    if (inside && sx > halfW - 15) {
        triggerDockCrash('NÁRAZ DO ZDI!'); return;
    }

    // Náraz do zdi u vstupu (levá stěna vedle otvoru)
    if (sx > -halfW - 15 && sx < -halfW + 20 && Math.abs(sy) > GATE_H/2) {
        triggerDockCrash('NÁRAZ DO STĚNY VSTUPU!'); return;
    }

    // Náraz do NPC
    for (const n of docking.npcs) {
        const dx = sx - n.x, dy = sy - n.y;
        if (Math.sqrt(dx*dx+dy*dy) < 22) {
            triggerDockCrash('SRÁŽKA S NPC!'); return;
        }
    }

    // Platformy – přistání
    if (inside) {
        docking.hoveredPlat = null;
        for (const p of docking.platforms) {
            const px = p.x, py = p.y;
            const isBottom = py > 0; // dolní platformy
            const landY = isBottom ? py - 20 : py + PLAT_H + 20;
            const abovePlat = isBottom
                ? sy > py - 35 && sy < py - 5
                : sy < py + PLAT_H + 35 && sy > py + PLAT_H + 5;
            const overPlat = Math.abs(sx - px) < PLAT_W/2 + 5;

            if (overPlat && abovePlat) {
                if (p.occupied) {
                    // Jemné varování
                    docking.hoveredPlat = { ...p, blocked: true };
                } else {
                    docking.hoveredPlat = p;
                    // Přistání – musí mít malou rychlost
                    const spd = Math.sqrt(docking.svx**2 + docking.svy**2);
                    if (spd < 60) {
                        p.landingTimer = (p.landingTimer || 0) + 0.016;
                        if (p.landingTimer > 0.6) {
                            triggerDockSuccess(p);
                        }
                    } else {
                        p.landingTimer = 0;
                    }
                }
            } else {
                p.landingTimer = 0;
            }
        }
    }
}

function triggerDockCrash(msg) {
    if (docking.phase === 'fail') return;
    docking.phase = 'fail';
    docking.timer = 2.5;
    docking.crashMsg = msg;
    // Ztráta nákladu
    const cargoIds = Object.keys(player.cargo);
    if (cargoIds.length > 0) {
        let lost = 0;
        cargoIds.forEach(id => {
            const dmg = Math.ceil((player.cargo[id]||0) * 0.25);
            player.cargo[id] = (player.cargo[id]||0) - dmg; lost += dmg;
            if (player.cargo[id] <= 0) delete player.cargo[id];
        });
        docking.crashMsg += ` -${lost}t nákladu`;
    } else {
        player.money = Math.max(0, player.money - 300);
        docking.crashMsg += ' -300 Cr';
    }
    docking.svx *= -0.3; docking.svy *= -0.3;
}

function triggerDockSuccess(plat) {
    if (docking.phase === 'success') return;
    docking.phase = 'success';
    docking.timer = 0.8;
    docking.landedPlat = plat;
    plat.occupied = true;
}

// ── Kreslení ─────────────────────────────────────────────────
function drawDockingScene() {
    const cw = dcv.width, ch = dcv.height;
    const cx = cw/2, cy = ch/2;
    const dctx = dcc;

    dctx.fillStyle = '#fff';
    dctx.fillRect(0, 0, cw, ch);

    dctx.save();
    dctx.translate(cx, cy);

    const shake = docking.phase === 'fail'
        ? { x:(Math.random()-.5)*6, y:(Math.random()-.5)*6 }
        : { x:0, y:0 };
    dctx.translate(shake.x, shake.y);

    drawDockWalls(dctx);
    drawDockPlatforms(dctx);
    drawDockNPCs(dctx);
    drawDockShip(dctx);
    drawDockHUD(dctx, cw, ch);

    dctx.restore();
}

function drawDockWalls(dctx) {
    const halfW = DOCK_W/2, halfH = DOCK_H/2;
    dctx.fillStyle = '#000';

    // ── Horní zeď (celá) ──
    dctx.fillRect(-halfW, -halfH, DOCK_W, WALL_T);

    // ── Dolní zeď (celá) ──
    dctx.fillRect(-halfW, halfH - WALL_T, DOCK_W, WALL_T);

    // ── Levá stěna s otvorem uprostřed ──
    const gateTop = -GATE_H/2;
    const gateBot = GATE_H/2;
    // Část levé stěny nad otvorem
    dctx.fillRect(-halfW, -halfH + WALL_T, WALL_T, (gateTop) - (-halfH + WALL_T));
    // Část levé stěny pod otvorem
    dctx.fillRect(-halfW, gateBot, WALL_T, halfH - WALL_T - gateBot);

    // ── Pravá zeď ──
    dctx.fillRect(halfW - WALL_T, -halfH + WALL_T, WALL_T, halfH*2 - WALL_T*2);

    // ── Šipka u vstupu ──
    dctx.fillStyle = 'rgba(0,0,0,0.15)';
    dctx.font = '28px monospace';
    dctx.textAlign = 'center';
    dctx.textBaseline = 'middle';
    dctx.fillText('→', -halfW - 55, 0);
    dctx.textBaseline = 'alphabetic';
}

function drawDockPlatforms(dctx) {
    docking.platforms.forEach(p => {
        const isHovered = docking.hoveredPlat && docking.hoveredPlat.id === p.id;
        const isBottom = p.y > 0;

        // Platforma – obdélník
        dctx.fillStyle = p.occupied ? 'rgba(0,0,0,0.35)' : (isHovered ? '#000' : 'rgba(0,0,0,0.75)');
        dctx.fillRect(p.x - PLAT_W/2, p.y, PLAT_W, PLAT_H);

        // Nožičky platformy
        dctx.fillStyle = 'rgba(0,0,0,0.5)';
        const legH = 20;
        if (isBottom) {
            // Platforma při dolní zdi – nožičky dolů
            dctx.fillRect(p.x - PLAT_W/2 + 10, p.y + PLAT_H, 8, legH);
            dctx.fillRect(p.x + PLAT_W/2 - 18, p.y + PLAT_H, 8, legH);
        } else {
            // Platforma při horní zdi – nožičky nahoru
            dctx.fillRect(p.x - PLAT_W/2 + 10, p.y - legH, 8, legH);
            dctx.fillRect(p.x + PLAT_W/2 - 18, p.y - legH, 8, legH);
        }

        // Číslo platformy
        dctx.fillStyle = p.occupied ? 'rgba(255,255,255,0.5)' : '#fff';
        dctx.font = 'bold 18px "Orbitron",sans-serif';
        dctx.textAlign = 'center';
        const labelY = isBottom ? p.y - 12 : p.y + PLAT_H + 22;
        dctx.fillText(p.label, p.x, labelY);

        // Obsazeno – X
        if (p.occupied) {
            dctx.fillStyle = 'rgba(200,0,0,0.7)';
            dctx.font = '12px "Share Tech Mono",monospace';
            dctx.fillText('OBSAZENO', p.x, labelY + (isBottom ? -16 : 16));
        }

        // Progress přistání
        if (isHovered && !p.occupied && p.landingTimer > 0) {
            const pct = p.landingTimer / 0.6;
            dctx.fillStyle = 'rgba(0,0,0,0.2)';
            dctx.fillRect(p.x - PLAT_W/2, p.y - (isBottom ? 8 : -PLAT_H - 8), PLAT_W, 5);
            dctx.fillStyle = '#000';
            dctx.fillRect(p.x - PLAT_W/2, p.y - (isBottom ? 8 : -PLAT_H - 8), PLAT_W * pct, 5);
        }
    });
}

function drawDockNPCs(dctx) {
    docking.npcs.forEach(n => {
        dctx.save();
        dctx.translate(n.x, n.y);
        dctx.rotate(n.angle);
        // Jednoduchá NPC loď – malý trojúhelník
        dctx.beginPath();
        dctx.moveTo(12, 0); dctx.lineTo(-8, -5); dctx.lineTo(-8, 5);
        dctx.closePath();
        dctx.fillStyle = 'rgba(0,0,0,0.4)';
        dctx.strokeStyle = '#000';
        dctx.lineWidth = 1;
        dctx.fill(); dctx.stroke();
        dctx.restore();
    });
}

function drawDockShip(dctx) {
    dctx.save();
    dctx.translate(docking.sx, docking.sy);
    dctx.rotate(docking.sAngle);
    SHIP_TYPES[player.shipType].draw(dctx, keys['KeyW'] || keys['ArrowUp']);
    dctx.restore();
}

function drawDockHUD(dctx, cw, ch) {
    const halfW = DOCK_W/2, halfH = DOCK_H/2;
    const spd = Math.sqrt(docking.svx**2 + docking.svy**2);
    const tooFast = spd > 60 && docking.hoveredPlat && !docking.hoveredPlat.blocked;

    // Rychlost
    dctx.fillStyle = tooFast ? 'rgba(180,0,0,0.9)' : 'rgba(0,0,0,0.5)';
    dctx.font = '12px "Share Tech Mono",monospace';
    dctx.textAlign = 'left';
    dctx.fillText(`SPD: ${Math.round(spd)} ${tooFast ? '⚠ ZPOMAL' : ''}`, -halfW + 6, -halfH + 20);

    // Název lokace
    dctx.fillStyle = 'rgba(0,0,0,0.25)';
    dctx.font = '10px "Share Tech Mono",monospace';
    dctx.textAlign = 'right';
    dctx.fillText(docking.loc?.name?.toUpperCase() || '', halfW - 6, -halfH + 18);

    // Slot indikátor
    docking.platforms.forEach((p, i) => {
        const bx = -halfW + 10 + i*26;
        const by = halfH - 30;
        dctx.strokeStyle = 'rgba(0,0,0,0.5)'; dctx.lineWidth = 1;
        dctx.fillStyle = p.occupied ? 'rgba(180,0,0,0.2)' :
                        (docking.hoveredPlat?.id===p.id ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.04)');
        dctx.fillRect(bx, by, 20, 20); dctx.strokeRect(bx, by, 20, 20);
        dctx.fillStyle = 'rgba(0,0,0,0.7)';
        dctx.font = '10px monospace'; dctx.textAlign = 'center';
        dctx.fillText(p.occupied ? '✕' : p.label, bx+10, by+14);
    });

    // Zprávy
    if (docking.phase === 'success') {
        dctx.fillStyle = 'rgba(0,0,0,0.9)';
        dctx.font = 'bold 24px "Orbitron",sans-serif';
        dctx.textAlign = 'center';
        dctx.fillText('✓ PŘISTÁNÍ ÚSPĚŠNÉ', 0, -20);
    }
    if (docking.phase === 'fail') {
        dctx.fillStyle = 'rgba(160,0,0,0.9)';
        dctx.font = 'bold 18px "Orbitron",sans-serif';
        dctx.textAlign = 'center';
        dctx.fillText(docking.crashMsg, 0, -20);
    }
}

init();

// ═══════════════════════════════════════════════════════════════
//  INFO SATELIT – panel s cenami a průzkumem trhu
// ═══════════════════════════════════════════════════════════════
const SCAN_COST = 500; // Cr za průzkum top 10 cen jedné komodity

function openInfoSat(sys) {
    activePanel = 'infosat';
    const panel = document.getElementById('infosat-panel');
    panel.style.display = 'flex';
    document.getElementById('is-sysname').textContent = sys.name.toUpperCase();
    renderInfoSatMain(sys);
}

function closeInfoSat() {
    const p = document.getElementById('infosat-panel');
    const r = document.getElementById('is-scan-result');
    if (p) p.style.display = 'none';
    if (r) r.style.display = 'none';
}

// Tabulka cen všech planet soustavy
function renderInfoSatMain(sys) {
    const locs = [...sys.planets, ...(sys.stations||[])];
    let h = `<div class="is-section-title">// CENY V SOUSTAVĚ</div>`;
    h += `<table class="is-tbl"><thead><tr><th>Lokace</th>`;
    COMMODITIES.forEach(c => { h += `<th title="${c.name}">${c.name.slice(0,4).toUpperCase()}</th>`; });
    h += `</tr></thead><tbody>`;
    locs.forEach(loc => {
        h += `<tr><td class="is-locname">${loc.name}</td>`;
        COMMODITIES.forEach(c => {
            const pr = getMarketPrice(loc.id, c.id);
            const base = c.basePrice;
            const ratio = pr / base;
            const cls = ratio < 0.85 ? 'is-cheap' : ratio > 1.15 ? 'is-expensive' : '';
            h += `<td class="${cls}">${pr}</td>`;
        });
        h += `</tr>`;
    });
    h += `</tbody></table>`;

    // Průzkum trhu – výběr komodity za poplatek
    h += `<div class="is-section-title" style="margin-top:16px">// PRŮZKUM TRHU <span style="color:#aaa;font-size:.85em">(${SCAN_COST} Cr)</span></div>`;
    h += `<p style="font-size:.75em;color:#aaa;margin-bottom:10px">Vyber komoditu – zobrazíme TOP 10 nejlepších cen napříč celou galaxií.</p>`;
    h += `<div class="is-com-grid">`;
    COMMODITIES.forEach(c => {
        h += `<button class="is-com-btn" onclick="buyScan('${c.id}','${c.name}')">${c.name}</button>`;
    });
    h += `</div>`;
    h += `<p id="is-scan-msg" style="color:#c00;font-size:.78em;margin-top:8px;min-height:16px"></p>`;

    document.getElementById('is-content').innerHTML = h;
    document.getElementById('is-scan-result').style.display = 'none';
}

function buyScan(commodityId, commodityName) {
    if (player.money < SCAN_COST) {
        const el = document.getElementById('is-scan-msg');
        if (el) { el.textContent = `Nedostatek Cr! Potřebuješ ${SCAN_COST} Cr.`; }
        return;
    }
    player.money -= SCAN_COST;
    updateMoneyAll();

    // Sesbírej ceny ze všech lokací ve všech soustavách
    const results = [];
    getAllSystems().forEach(sys => {
        [...sys.planets, ...(sys.stations||[])].forEach(loc => {
            const pr = getMarketPrice(loc.id, commodityId);
            results.push({ locName: loc.name, sysName: sys.name, price: pr, locId: loc.id });
        });
    });

    // Seřaď od nejlevnějšího
    results.sort((a, b) => a.price - b.price);
    const top10 = results.slice(0, 10);

    // Zobraz výsledek
    const res = document.getElementById('is-scan-result');
    let h = `<div class="is-section-title">// TOP 10 – ${commodityName.toUpperCase()}</div>`;
    h += `<table class="is-tbl"><thead><tr><th>#</th><th>Lokace</th><th>Soustava</th><th>Cena/t</th></tr></thead><tbody>`;
    top10.forEach((r, i) => {
        const cls = i === 0 ? 'is-cheap' : i < 3 ? '' : 'is-expensive';
        h += `<tr class="${i===0?'is-best-row':''}">
            <td style="color:#aaa">${i+1}</td>
            <td>${r.locName}</td>
            <td style="color:#888">${r.sysName}</td>
            <td class="${cls}"><b>${r.price} Cr</b></td>
        </tr>`;
    });
    h += `</tbody></table>`;
    h += `<p style="font-size:.72em;color:#bbb;margin-top:8px">Ceny se mění každých 30s. Průzkum byl zaplacen.</p>`;
    res.innerHTML = h;
    res.style.display = 'block';

    // Skryj zprávu o nedostatku
    const el = document.getElementById('is-scan-msg');
    if (el) el.textContent = '';
}
