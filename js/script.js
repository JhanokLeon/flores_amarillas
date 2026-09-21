const canvas = document.getElementById('gardenCanvas');
const ctx = canvas.getContext('2d');
const audio = document.getElementById('bgAudio');
const btnStart = document.getElementById('btnStart');
const welcomeScreen = document.getElementById('welcomeScreen');
const floatingHeader = document.getElementById('floatingHeader');

let width, height, isMobile;
let time = 0;
let gardenStarted = false;
let mouse = { x: -1000, y: -1000 };

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  isMobile = width < 768;
}
window.addEventListener('resize', resize);
resize();

window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
  }
});

/* ==========================================
   SINTETIZADOR NATIVO (CAJA MUSICAL)
   ========================================== */
let audioCtx = null;
function playMusicBoxTheme() {
  if (audio) {
    audio.volume = 0.65;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => initWebAudioSynthesizer());
    } else {
      initWebAudioSynthesizer();
    }
  } else {
    initWebAudioSynthesizer();
  }
}

function initWebAudioSynthesizer() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const melody = [
      { f: 392.00, d: 0.6 }, { f: 440.00, d: 0.6 }, { f: 493.88, d: 0.6 },
      { f: 587.33, d: 1.0 }, { f: 523.25, d: 0.8 }, { f: 493.88, d: 0.6 },
      { f: 440.00, d: 1.2 }, { f: 329.63, d: 0.6 }, { f: 392.00, d: 0.8 },
      { f: 440.00, d: 0.8 }, { f: 493.88, d: 1.4 }
    ];

    let noteIdx = 0;
    function playNextNote() {
      if (!gardenStarted) return;
      const note = melody[noteIdx];
      playBell(note.f, note.d);
      if (noteIdx % 3 === 0) playBell(note.f / 2, note.d * 1.5, 0.15);
      noteIdx = (noteIdx + 1) % melody.length;
      setTimeout(playNextNote, note.d * 1000 + 150);
    }
    playNextNote();
  } catch (e) {
    console.log("Web Audio no disponible", e);
  }
}

function playBell(freq, duration, gainVol = 0.25) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(gainVol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

/* ==========================================
   TALLOS Y HOJAS ORGÁNICAS
   ========================================== */
class Leaf {
  constructor(x, y, angle, scale, side) {
    this.x = x; this.y = y; this.angle = angle; this.scale = scale; this.side = side;
  }
  draw(sway) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + sway * 0.4);
    ctx.scale(this.scale * this.side, this.scale);

    const leafGrad = ctx.createLinearGradient(0, 0, 45, 0);
    leafGrad.addColorStop(0, '#1b4324');
    leafGrad.addColorStop(0.5, '#2d6a38');
    leafGrad.addColorStop(1, '#408a4f');

    ctx.fillStyle = leafGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(15, -18, 35, -15, 55, 0);
    ctx.bezierCurveTo(35, 18, 15, 18, 0, 0);
    ctx.fill();

    ctx.strokeStyle = '#4ea15f';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.quadraticCurveTo(25, -2, 50, 0);
    ctx.stroke();
    ctx.restore();
  }
}

class Stem {
  constructor(startX, startY, targetX, targetY, swayOffset) {
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.swayOffset = swayOffset;
    this.progress = 0;
    this.growthSpeed = 0.008 + Math.random() * 0.003;
    this.leaves = [];
    this.hasLeaves = false;
  }

  update() {
    if (this.progress < 1) {
      this.progress += this.growthSpeed;
      if (this.progress > 0.45 && !this.hasLeaves) {
        this.leaves.push(new Leaf(0, 0, -0.6, isMobile ? 0.7 : 0.95, -1));
        this.leaves.push(new Leaf(0, 0, 0.5, isMobile ? 0.8 : 1.05, 1));
        this.hasLeaves = true;
      }
    }
  }

  draw(sway) {
    const t = Math.min(this.progress, 1);
    const cpX = (this.startX + this.targetX) / 2 + sway * 35;
    const cpY = (this.startY + this.targetY) / 2;

    const curTargetX = (1 - t) ** 2 * this.startX + 2 * (1 - t) * t * cpX + t ** 2 * (this.targetX + sway * 25);
    const curTargetY = (1 - t) ** 2 * this.startY + 2 * (1 - t) * t * cpY + t ** 2 * this.targetY;

    ctx.save();
    const stemGrad = ctx.createLinearGradient(this.startX, this.startY, curTargetX, curTargetY);
    stemGrad.addColorStop(0, '#1b3f20');
    stemGrad.addColorStop(0.5, '#2b5f33');
    stemGrad.addColorStop(1, '#43804d');

    ctx.strokeStyle = stemGrad;
    ctx.lineWidth = isMobile ? 5 : 7.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.quadraticCurveTo(cpX, cpY, curTargetX, curTargetY);
    ctx.stroke();

    if (this.hasLeaves && t > 0.5) {
      const p1X = (1 - 0.45) ** 2 * this.startX + 2 * (1 - 0.45) * 0.45 * cpX + 0.45 ** 2 * (this.targetX + sway * 25);
      const p1Y = (1 - 0.45) ** 2 * this.startY + 2 * (1 - 0.45) * 0.45 * cpY + 0.45 ** 2 * this.targetY;
      this.leaves[0].x = p1X; this.leaves[0].y = p1Y;
      this.leaves[0].draw(sway);

      const p2X = (1 - 0.72) ** 2 * this.startX + 2 * (1 - 0.72) * 0.72 * cpX + 0.72 ** 2 * (this.targetX + sway * 25);
      const p2Y = (1 - 0.72) ** 2 * this.startY + 2 * (1 - 0.72) * 0.72 * cpY + 0.72 ** 2 * this.targetY;
      this.leaves[1].x = p2X; this.leaves[1].y = p2Y;
      this.leaves[1].draw(sway);
    }
    ctx.restore();

    return { x: curTargetX, y: curTargetY };
  }
}

/* ==========================================
   ESPECIES BOTÁNICAS AMARILLAS
   ========================================= */

class BotanicalFlower {
  constructor(x, y, radius, delay, swayOffset, type) {
    this.x = x;
    this.y = y;
    this.targetRadius = radius;
    this.delay = delay;
    this.swayOffset = swayOffset;
    this.type = type; // 'sunflower', 'tulip', 'daffodil', 'daisy', 'chamomile'
    this.stem = new Stem(x + (Math.random() - 0.5) * 20, height + 40, x, y, swayOffset);
    this.bloomProgress = 0;
    this.headPos = { x, y };
    this.easterTriggered = false;
  }

  update() {
    if (this.delay > 0) {
      this.delay--;
      return;
    }
    this.stem.update();
    if (this.stem.progress > 0.85) {
      this.bloomProgress = Math.min(1, this.bloomProgress + 0.025);
      if (this.type === 'chamomile' && this.bloomProgress > 0.85 && !this.easterTriggered) {
        this.spawnChamomileJoke(this.headPos.x, this.headPos.y);
        this.easterTriggered = true;
      }
    }
  }

  draw(time) {
    if (this.delay > 0) return;
    const sway = Math.sin(time + this.swayOffset) * 0.14;
    this.headPos = this.stem.draw(sway);

    if (this.bloomProgress > 0) {
      ctx.save();
      ctx.translate(this.headPos.x, this.headPos.y);
      ctx.rotate(sway * 0.65);
      ctx.scale(this.bloomProgress, this.bloomProgress);

      switch (this.type) {
        case 'tulip':
          this.renderTulip();
          break;
        case 'daffodil':
          this.renderDaffodil();
          break;
        case 'daisy':
          this.renderDaisy();
          break;
        case 'chamomile':
          this.renderChamomile();
          break;
        default:
          this.renderSunflower();
      }

      ctx.restore();
    }
  }

  // 1. GIRASOL (Fermat Spiral)
  renderSunflower() {
    const R = this.targetRadius;
    this.drawPetalRing(20, R * 1.15, R * 0.25, '#f39c12', '#ffd000', 0);
    this.drawPetalRing(18, R * 0.95, R * 0.23, '#e67e22', '#ffdc14', Math.PI / 18);

    // Centro con Espiral Áurea de Fermat
    const seedCount = isMobile ? 110 : 180;
    const goldenAngle = 137.5077 * (Math.PI / 180);
    const c = (R * 0.42) / Math.sqrt(seedCount);

    for (let i = 0; i < seedCount; i++) {
      const r = c * Math.sqrt(i);
      const theta = i * goldenAngle;
      const sx = r * Math.cos(theta);
      const sy = r * Math.sin(theta);
      const ratio = r / (R * 0.42);
      ctx.fillStyle = `rgb(${45 + ratio * 155}, ${25 + ratio * 85}, 15)`;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2 + ratio * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. TULIPÁN AMARILLO
  renderTulip() {
    const R = this.targetRadius * 0.9;
    // Pétalos traseros
    ctx.fillStyle = '#e6a100';
    ctx.beginPath();
    ctx.ellipse(-R * 0.35, -R * 0.4, R * 0.3, R * 0.6, -0.2, 0, Math.PI * 2);
    ctx.ellipse(R * 0.35, -R * 0.4, R * 0.3, R * 0.6, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Pétalo central
    const tGrad = ctx.createLinearGradient(0, 0, 0, -R * 1.1);
    tGrad.addColorStop(0, '#f39c12');
    tGrad.addColorStop(0.6, '#ffd214');
    tGrad.addColorStop(1, '#fff59d');
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.moveTo(0, R * 0.1);
    ctx.bezierCurveTo(-R * 0.6, -R * 0.2, -R * 0.5, -R, 0, -R * 1.1);
    ctx.bezierCurveTo(R * 0.5, -R, R * 0.6, -R * 0.2, 0, R * 0.1);
    ctx.fill();
  }

  // 3. NARCISO AMARILLO (Daffodil con trompeta)
  renderDaffodil() {
    const R = this.targetRadius * 0.95;
    // 6 tépalos exteriores en estrella
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((Math.PI / 3) * i);
      const pGrad = ctx.createLinearGradient(0, 0, 0, -R * 0.9);
      pGrad.addColorStop(0, '#f1c40f');
      pGrad.addColorStop(1, '#ffeb3b');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-R * 0.35, -R * 0.45, 0, -R * 0.9);
      ctx.quadraticCurveTo(R * 0.35, -R * 0.45, 0, 0);
      ctx.fill();
      ctx.restore();
    }

    // Corona / Trompeta central con bordes rizados
    const cupGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, R * 0.38);
    cupGrad.addColorStop(0, '#d35400');
    cupGrad.addColorStop(0.7, '#ff9800');
    cupGrad.addColorStop(1, '#ffc107');
    ctx.fillStyle = cupGrad;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 4. MARGARITA AMARILLA SILVESTRE
  renderDaisy() {
    const R = this.targetRadius * 0.85;
    this.drawPetalRing(16, R * 1.05, R * 0.18, '#f39c12', '#ffe600', 0);
    // Botón central abombado
    const cGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, R * 0.28);
    cGrad.addColorStop(0, '#795548');
    cGrad.addColorStop(0.6, '#ff8f00');
    cGrad.addColorStop(1, '#ffc107');
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. MANZANILLA (EASTER EGG - Pétalos blancos, botón amarillo convexo)
  renderChamomile() {
    const R = this.targetRadius * 0.75;
    // Pétalos caídos blancos/marfil
    for (let i = 0; i < 15; i++) {
      ctx.save();
      ctx.rotate(((Math.PI * 2) / 15) * i);
      const mGrad = ctx.createLinearGradient(0, 0, 0, -R * 0.9);
      mGrad.addColorStop(0, '#e0e0e0');
      mGrad.addColorStop(0.5, '#ffffff');
      mGrad.addColorStop(1, '#fffde7');
      ctx.fillStyle = mGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-R * 0.18, -R * 0.4, 0, -R * 0.9);
      ctx.quadraticCurveTo(R * 0.18, -R * 0.4, 0, 0);
      ctx.fill();
      ctx.restore();
    }

    // Botón amarillo muy pronunciado
    const cGrad = ctx.createRadialGradient(0, -3, 1, 0, 0, R * 0.38);
    cGrad.addColorStop(0, '#fff176');
    cGrad.addColorStop(0.7, '#fbc02d');
    cGrad.addColorStop(1, '#f57f17');
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 0.35, R * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPetalRing(count, length, width, colBase, colMid, offsetAngle) {
    const step = (Math.PI * 2) / count;
    ctx.save();
    ctx.rotate(offsetAngle);
    for (let i = 0; i < count; i++) {
      ctx.save();
      ctx.rotate(step * i);

      const pGrad = ctx.createLinearGradient(0, 0, 0, -length);
      pGrad.addColorStop(0, colBase);
      pGrad.addColorStop(0.5, colMid);
      pGrad.addColorStop(1, '#fff7a1');

      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-width * 0.6, -length * 0.3, -width * 0.8, -length * 0.75, 0, -length);
      ctx.bezierCurveTo(width * 0.8, -length * 0.75, width * 0.6, -length * 0.3, 0, 0);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // Genera el globo cómico de la manzanilla
  spawnChamomileJoke(x, y) {
    const jokes = [
      "¡Momento! ¿Eso es una manzanilla? 🫖 Un tecito para el estrés y a seguir brillando jaja",
      "¡Felicidades, desbloqueaste la Manzanilla legendaria! 🍵 (Probabilidad 15%)",
      "¿Manzanilla en el ramo? Es para calmar la emoción de este 21 de septiembre 🌼☕"
    ];
    const jokeText = jokes[Math.floor(Math.random() * jokes.length)];

    const bubble = document.createElement('div');
    bubble.className = 'easter-bubble';
    bubble.innerText = jokeText;
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y - 30}px`;

    document.body.appendChild(bubble);

    // Desaparece suavemente a los 9 segundos
    setTimeout(() => {
      bubble.style.transition = 'opacity 1s ease, transform 1s ease';
      bubble.style.opacity = '0';
      bubble.style.transform = 'translate(-50%, -140%) scale(0.8)';
      setTimeout(() => bubble.remove(), 1000);
    }, 9000);
  }
}

/* ==========================================
   PARTÍCULAS Y POLEN BIOLUMINISCENTE
   ========================================== */
class BioluminescentPollen {
  constructor() { this.reset(true); }
  reset(initial = false) {
    this.x = Math.random() * width;
    this.y = initial ? Math.random() * height : height + 20;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = -(0.4 + Math.random() * 0.9);
    this.size = 1.2 + Math.random() * 2.5;
    this.baseAlpha = 0.2 + Math.random() * 0.7;
  }
  update(time) {
    this.x += this.vx + Math.sin(time + this.size) * 0.3;
    this.y += this.vy;
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 120) {
      const force = (120 - dist) / 120;
      this.x -= (dx / dist) * force * 3;
      this.y -= (dy / dist) * force * 3;
    }
    if (this.y < -30 || this.x < -30 || this.x > width + 30) this.reset();
  }
  draw(time) {
    const alpha = this.baseAlpha + Math.sin(time * 3 + this.size * 10) * 0.2;
    ctx.save();
    ctx.fillStyle = `rgba(255, 225, 100, ${Math.max(0.1, alpha)})`;
    ctx.shadowColor = '#ffcf33';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

let flowers = [];
let particles = [];

function buildGarden() {
  flowers = [];
  particles = Array.from({ length: isMobile ? 35 : 70 }, () => new BioluminescentPollen());

  const count = isMobile ? 3 : 5;
  const spacing = width / (count + 1);

  // Pool de flores amarillas
  const yellowSpecies = ['sunflower', 'tulip', 'daffodil', 'daisy'];

  // Probabilidad de 15% para manzanilla
  const hasChamomile = Math.random() < 0.15;
  const chamomileSlot = hasChamomile ? Math.floor(Math.random() * count) : -1;

  for (let i = 0; i < count; i++) {
    const x = spacing * (i + 1) + (Math.random() - 0.5) * (isMobile ? 12 : 30);
    const yOffset = isMobile 
      ? (i === 1 ? -40 : 25) 
      : ((i === 2) ? -50 : (i % 2 === 0 ? 30 : -15));
    const y = height * (isMobile ? 0.56 : 0.53) + yOffset;
    const flowerRadius = isMobile ? (42 + Math.random() * 8) : (58 + Math.random() * 12);

    let chosenType;
    if (i === chamomileSlot) {
      chosenType = 'chamomile';
    } else {
      // Elegir especie asegurando variedad
      chosenType = yellowSpecies[(i + Math.floor(Math.random() * yellowSpecies.length)) % yellowSpecies.length];
    }

    flowers.push(new BotanicalFlower(x, y, flowerRadius, i * 20, i * 1.4, chosenType));
  }
}

/* ==========================================
   LOOP DE ANIMACIÓN
   ========================================== */
function animate() {
  time += 0.016;
  ctx.fillStyle = 'rgba(7, 11, 20, 0.26)';
  ctx.fillRect(0, 0, width, height);

  particles.forEach(p => { p.update(time); p.draw(time); });

  if (gardenStarted) {
    flowers.forEach(f => {
      f.update();
      f.draw(time);
    });
  }

  requestAnimationFrame(animate);
}

particles = Array.from({ length: 30 }, () => new BioluminescentPollen());
animate();

/* ==========================================
   ACTIVACIÓN AL PRESIONAR BOTÓN
   ========================================== */
btnStart.addEventListener('click', () => {
  playMusicBoxTheme();
  welcomeScreen.classList.add('hidden');
  floatingHeader.classList.add('visible');
  buildGarden();
  gardenStarted = true;
});