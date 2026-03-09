// ─── ELITE 2D ────────────────────────────────────────────────────────────────
// Skutečné poměry vzdáleností (AU = astronomická jednotka)
// 1 AU = vzdálenost Země–Slunce = ~150 mil. km
// Herní měřítko: 1 AU = 2000px

const AU = 2000;  // pixelů na 1 AU

// Sluneční soustava – skutečné vzdálenosti od Slunce v AU
const SOLAR_SYSTEM = {
    star: { name: 'Sol', x: 0, y: 0, radius: 80, color: '#FFF176', glow: '#FFEB3B' },
    planets: [
        {
            id: 'merkur', name: 'Merkur', distanceAU: 0.39,
            radius: 14, color: '#9E9E9E', glowColor: '#BDBDBD',
            orbitAngle: 0.8, orbitSpeed: 0.00047,
            description: 'Nejbližší planeta k Slunci'
        },
        {
            id: 'venuse', name: 'Venuše', distanceAU: 0.72,
            radius: 20, color: '#FFCC80', glowColor: '#FFB300',
            orbitAngle: 2.1, orbitSpeed: 0.00018,
            description: 'Nejžhavější planeta'
        },
        {
            id: 'zeme', name: 'Země', distanceAU: 1.0,
            radius: 22, color: '#42A5F5', glowColor: '#1565C0',
            orbitAngle: 0.0, orbitSpeed: 0.00011,
            description: 'Kolébka lidstva'
        },
        {
            id: 'mars', name: 'Mars', distanceAU: 1.52,
            radius: 16, color: '#EF5350', glowColor: '#B71C1C',
            orbitAngle: 3.5, orbitSpeed: 0.000059,
            description: 'Rudá planeta'
        }
    ]
};

// ─── STAV HRY ────────────────────────────────────────────────────────────────
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let W = canvas.width = window.innerWidth;
let H = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
});

// Kamera (sleduje hráče)
const camera = { x: 0, y: 0 };

// Hráčova loď
const ship = {
    x: AU * 1.3,   // Začínáme u Země
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,       // radiány, 0 = doprava
    thrusting: false,
    // Exponenciální akcelerace: čím rychleji jedeš, tím víc přidáš
    thrustBase: 0.0003,       // základní tah (AU/s²)
    thrustExponent: 1.6,      // exponent pro rychlostní násobič
    rotSpeed: 0.045,          // rad/frame
    maxSpeed: 8.0,            // AU/s (bude se exponenciálně zvětšovat při tahu)
    braking: 0.985,
    landingRadius: 50,        // px – vzdálenost pro přistání
};

// Klávesy
const keys = {};
document.addEventListener('keydown', e => { keys[e.code] = true; });
document.addEventListener('keyup', e => { keys[e.code] = false; });

// Hvězdné pozadí – 2 vrstvy parallax
const STAR_LAYERS = [
    Array.from({length: 400}, () => ({
        x: (Math.random() - 0.5) * AU * 10,
        y: (Math.random() - 0.5) * AU * 10,
        r: Math.random() * 1.2 + 0.2,
        brightness: Math.random() * 0.6 + 0.2,
        parallax: 0.05
    })),
    Array.from({length: 150}, () => ({
        x: (Math.random() - 0.5) * AU * 10,
        y: (Math.random() - 0.5) * AU * 10,
        r: Math.random() * 0.6 + 0.1,
        brightness: Math.random() * 0.3 + 0.1,
        parallax: 0.02
    }))
];

// Multiplayer
let otherPlayers = [];
let myUsername = '';

// Přistávací overlay
let landingTimer = 0;
const landingEl = document.getElementById('landing-overlay');
const landingPlanetName = document.getElementById('landing-planet-name');

// HUD elementy
const speedDisplay = document.getElementById('speed-display');
const locationDisplay = document.getElementById('location-display');
const pilotName = document.getElementById('pilot-name');

// Minimap
const minimapCanvas = document.getElementById('minimap-canvas');
const mctx = minimapCanvas.getContext('2d');
const MINIMAP_SCALE = 160 / (AU * 4);   // celý průměr Marsu vejde do minimapy

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
    // Zkontroluj přihlášení
    let me;
    try {
        const res = await fetch('/api/me');
        if (!res.ok) { window.location.href = '/login'; return; }
        me = await res.json();
        myUsername = me.username;
        pilotName.textContent = me.username;
    } catch(e) { window.location.href = '/login'; return; }

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login';
    });

    // Načti uloženou pozici
    try {
        const posRes = await fetch('/api/load-position');
        if (posRes.ok) {
            const pos = await posRes.json();
            if (pos && pos.x !== undefined) {
                ship.x = pos.x;
                ship.y = pos.y;
                ship.angle = pos.angle || 0;
            }
        }
    } catch(e) {}

    // Polling pro ostatní hráče (každých 500ms)
    setInterval(fetchOtherPlayers, 500);
    // Posílej svoji pozici (každých 200ms)
    setInterval(sendPosition, 200);

    requestAnimationFrame(gameLoop);
}

// ─── MULTIPLAYER ──────────────────────────────────────────────────────────────
async function fetchOtherPlayers() {
    try {
        const res = await fetch('/api/players');
        if (res.ok) otherPlayers = await res.json();
    } catch(e) {}
}

async function sendPosition() {
    try {
        await fetch('/api/position', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x: ship.x, y: ship.y, angle: ship.angle })
        });
    } catch(e) {}
}

// ─── FYZIKA ───────────────────────────────────────────────────────────────────
let lastTime = null;

function updatePhysics(dt) {
    // Rotace
    if (keys['KeyA'] || keys['ArrowLeft'])  ship.angle -= ship.rotSpeed;
    if (keys['KeyD'] || keys['ArrowRight']) ship.angle += ship.rotSpeed;

    // Tah – exponenciální akcelerace
    ship.thrusting = keys['KeyW'] || keys['ArrowUp'];
    if (ship.thrusting) {
        const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
        // Čím rychleji jedeš, tím víc se tah zvyšuje
        const thrustMultiplier = 1 + Math.pow(speed * 0.4, ship.thrustExponent);
        const thrust = ship.thrustBase * thrustMultiplier * dt;
        ship.vx += Math.cos(ship.angle) * thrust;
        ship.vy += Math.sin(ship.angle) * thrust;
    }

    // Brzda
    if (keys['KeyS'] || keys['ArrowDown']) {
        ship.vx *= 0.97;
        ship.vy *= 0.97;
    }

    // Gravitace Slunce (slabá, jen pro pocit)
    const distToSun = Math.sqrt(ship.x * ship.x + ship.y * ship.y);
    if (distToSun > AU * 0.2) {
        const gravStrength = 0.00002 * AU * AU / (distToSun * distToSun);
        ship.vx -= (ship.x / distToSun) * gravStrength * dt;
        ship.vy -= (ship.y / distToSun) * gravStrength * dt;
    }

    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    // Aktualizuj planety (orbita)
    SOLAR_SYSTEM.planets.forEach(p => {
        p.orbitAngle += p.orbitSpeed * dt;
        p.currentX = Math.cos(p.orbitAngle) * p.distanceAU * AU;
        p.currentY = Math.sin(p.orbitAngle) * p.distanceAU * AU;
    });

    // Kamera sleduje loď
    camera.x = ship.x - W / 2;
    camera.y = ship.y - H / 2;

    // HUD: rychlost
    const speedAU = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
    speedDisplay.textContent = speedAU.toFixed(4);

    // Přistání
    checkLanding();
}

function checkLanding() {
    for (const planet of SOLAR_SYSTEM.planets) {
        if (!planet.currentX) continue;
        const dx = ship.x - planet.currentX;
        const dy = ship.y - planet.currentY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const landDist = planet.radius + ship.landingRadius;

        if (dist < landDist) {
            // Přistání!
            if (landingTimer <= 0) {
                triggerLanding(planet);
            }
            locationDisplay.textContent = `U planety ${planet.name.toUpperCase()}`;
            return;
        }
    }
    // Zkontroluj vzdálenost od Slunce
    const dSun = Math.sqrt(ship.x * ship.x + ship.y * ship.y);
    if (dSun < 200) {
        locationDisplay.textContent = 'VAROVANI: BLIZKO HVEZDY!';
    } else {
        locationDisplay.textContent = 'Hluboký vesmír';
    }
}

function triggerLanding(planet) {
    landingTimer = 3000; // ms
    landingPlanetName.textContent = planet.name.toUpperCase() + ' – ' + planet.description;
    landingEl.style.display = 'block';
    // Zastav loď při přistání
    ship.vx *= 0.5;
    ship.vy *= 0.5;
    setTimeout(() => {
        landingEl.style.display = 'none';
        landingTimer = 0;
    }, 3000);
}

// ─── KRESLENÍ ─────────────────────────────────────────────────────────────────
function draw() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    drawStars();
    drawOrbits();
    drawStar();
    drawPlanets();
    drawOtherShips();
    drawShip();

    ctx.restore();

    drawMinimap();
}

function drawStars() {
    STAR_LAYERS.forEach(layer => {
        layer.forEach(star => {
            // Parallax efekt
            const sx = star.x - camera.x * star.parallax + camera.x;
            const sy = star.y - camera.y * star.parallax + camera.y;
            // Opakuj hvězdy (tile)
            const wx = ((sx - camera.x) % W + W) % W + camera.x;
            const wy = ((sy - camera.y) % H + H) % H + camera.y;
            ctx.beginPath();
            ctx.arc(wx, wy, star.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${star.brightness})`;
            ctx.fill();
        });
    });
}

function drawOrbits() {
    ctx.save();
    SOLAR_SYSTEM.planets.forEach(p => {
        ctx.beginPath();
        ctx.arc(0, 0, p.distanceAU * AU, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
    });
    ctx.restore();
}

function drawStar() {
    const s = SOLAR_SYSTEM.star;
    // Záře
    const grd = ctx.createRadialGradient(s.x, s.y, s.radius * 0.5, s.x, s.y, s.radius * 3);
    grd.addColorStop(0, 'rgba(255,235,59,0.3)');
    grd.addColorStop(1, 'rgba(255,235,59,0)');
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius * 3, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    // Hvězda samotná
    const g2 = ctx.createRadialGradient(s.x - s.radius * 0.3, s.y - s.radius * 0.3, 0, s.x, s.y, s.radius);
    g2.addColorStop(0, '#FFFFFF');
    g2.addColorStop(0.4, '#FFF176');
    g2.addColorStop(1, '#FF8F00');
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = g2;
    ctx.fill();
}

function drawPlanets() {
    SOLAR_SYSTEM.planets.forEach(p => {
        if (!p.currentX) return;

        // Záře planety
        const grd = ctx.createRadialGradient(p.currentX, p.currentY, p.radius * 0.5, p.currentX, p.currentY, p.radius * 2.5);
        grd.addColorStop(0, p.glowColor + '44');
        grd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(p.currentX, p.currentY, p.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Planeta
        const pg = ctx.createRadialGradient(p.currentX - p.radius * 0.3, p.currentY - p.radius * 0.3, 0, p.currentX, p.currentY, p.radius);
        pg.addColorStop(0, lightenColor(p.color, 60));
        pg.addColorStop(1, darkenColor(p.color, 40));
        ctx.beginPath();
        ctx.arc(p.currentX, p.currentY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = pg;
        ctx.fill();

        // Přistávací kruh (pokud jsme blízko)
        const dx = ship.x - p.currentX;
        const dy = ship.y - p.currentY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < p.radius * 8) {
            ctx.beginPath();
            ctx.arc(p.currentX, p.currentY, p.radius + ship.landingRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0,255,136,${Math.max(0, 1 - dist / (p.radius * 8)) * 0.6})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([6, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Popisek planety
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '12px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.name.toUpperCase(), p.currentX, p.currentY - p.radius - 10);
    });
}

function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    // Plamen motoru při tahu
    if (ship.thrusting) {
        const flameLen = 18 + Math.random() * 12;
        const flameGrd = ctx.createLinearGradient(-flameLen, 0, 0, 0);
        flameGrd.addColorStop(0, 'rgba(0,0,0,0)');
        flameGrd.addColorStop(0.4, 'rgba(255,150,0,0.8)');
        flameGrd.addColorStop(1, 'rgba(255,255,255,0.9)');
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-10 - flameLen, -4 - Math.random() * 3);
        ctx.lineTo(-10 - flameLen, 4 + Math.random() * 3);
        ctx.closePath();
        ctx.fillStyle = flameGrd;
        ctx.fill();
    }

    // Loď – elegantní trojúhelník s detaily
    ctx.beginPath();
    ctx.moveTo(16, 0);          // nos
    ctx.lineTo(-10, -8);        // levé křídlo
    ctx.lineTo(-6, 0);          // střed zadku
    ctx.lineTo(-10, 8);         // pravé křídlo
    ctx.closePath();
    ctx.fillStyle = '#111';
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    // Cockpit
    ctx.beginPath();
    ctx.arc(6, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00ff88';
    ctx.fill();

    ctx.restore();

    // Jméno hráče nad lodí (ve světových souřadnicích)
    ctx.fillStyle = '#00ff88bb';
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(myUsername, ship.x, ship.y - 22);
}

function drawOtherShips(playersData) {
    otherPlayers.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        // Loď jiného hráče – červená
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fillStyle = '#111';
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(6, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4444';
        ctx.fill();

        ctx.restore();

        // Jméno
        ctx.fillStyle = '#ff4444bb';
        ctx.font = '11px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.username, p.x, p.y - 22);
    });
}

// ─── MINIMAP ──────────────────────────────────────────────────────────────────
function drawMinimap() {
    mctx.clearRect(0, 0, 160, 160);
    const cx = 80, cy = 80;

    // Pozadí
    mctx.fillStyle = 'rgba(0,0,0,0.8)';
    mctx.beginPath();
    mctx.arc(cx, cy, 80, 0, Math.PI * 2);
    mctx.fill();

    // Orbity
    SOLAR_SYSTEM.planets.forEach(p => {
        mctx.beginPath();
        mctx.arc(cx, cy, p.distanceAU * AU * MINIMAP_SCALE, 0, Math.PI * 2);
        mctx.strokeStyle = 'rgba(255,255,255,0.08)';
        mctx.lineWidth = 1;
        mctx.stroke();
    });

    // Planety
    SOLAR_SYSTEM.planets.forEach(p => {
        if (!p.currentX) return;
        const mx = cx + p.currentX * MINIMAP_SCALE;
        const my = cy + p.currentY * MINIMAP_SCALE;
        mctx.beginPath();
        mctx.arc(mx, my, 3, 0, Math.PI * 2);
        mctx.fillStyle = p.color;
        mctx.fill();
    });

    // Slunce
    mctx.beginPath();
    mctx.arc(cx, cy, 5, 0, Math.PI * 2);
    mctx.fillStyle = '#FFD600';
    mctx.fill();

    // Hráč
    const px = cx + ship.x * MINIMAP_SCALE;
    const py = cy + ship.y * MINIMAP_SCALE;
    mctx.beginPath();
    mctx.arc(px, py, 2.5, 0, Math.PI * 2);
    mctx.fillStyle = '#00ff88';
    mctx.fill();

    // Ostatní hráči
    otherPlayers.forEach(p => {
        const opx = cx + p.x * MINIMAP_SCALE;
        const opy = cy + p.y * MINIMAP_SCALE;
        mctx.beginPath();
        mctx.arc(opx, opy, 2, 0, Math.PI * 2);
        mctx.fillStyle = '#ff4444';
        mctx.fill();
    });

    // Kruhový ořez minimapy
    mctx.globalCompositeOperation = 'destination-in';
    mctx.beginPath();
    mctx.arc(cx, cy, 79, 0, Math.PI * 2);
    mctx.fillStyle = '#000';
    mctx.fill();
    mctx.globalCompositeOperation = 'source-over';

    // Okraj
    mctx.beginPath();
    mctx.arc(cx, cy, 79, 0, Math.PI * 2);
    mctx.strokeStyle = '#00ff8833';
    mctx.lineWidth = 1;
    mctx.stroke();
}

// ─── GAME LOOP ────────────────────────────────────────────────────────────────
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) * 60, 5); // normalizace na 60fps, max 5x
    lastTime = timestamp;

    // Init planet pozic pokud chybí
    SOLAR_SYSTEM.planets.forEach(p => {
        if (!p.currentX) {
            p.currentX = Math.cos(p.orbitAngle) * p.distanceAU * AU;
            p.currentY = Math.sin(p.orbitAngle) * p.distanceAU * AU;
        }
    });

    updatePhysics(dt);
    draw();
    requestAnimationFrame(gameLoop);
}

// ─── COLOR HELPERS ────────────────────────────────────────────────────────────
function lightenColor(hex, amount) {
    const r = Math.min(255, parseInt(hex.slice(1,3),16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3,5),16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5,7),16) + amount);
    return `rgb(${r},${g},${b})`;
}
function darkenColor(hex, amount) {
    const r = Math.max(0, parseInt(hex.slice(1,3),16) - amount);
    const g = Math.max(0, parseInt(hex.slice(3,5),16) - amount);
    const b = Math.max(0, parseInt(hex.slice(5,7),16) - amount);
    return `rgb(${r},${g},${b})`;
}

// ─── START ────────────────────────────────────────────────────────────────────
init();
