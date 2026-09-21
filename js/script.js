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
    const p = audio.play();
    if (p !== undefined) p.catch(() => initWebAudioSynthesizer());
    else initWebAudioSynthesizer();
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
      setTimeout(playNextNote, note.d * 1000 + 140);
    }
    playNextNote();
  } catch (e) {
    console.log("Audio no soportado", e);
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
   TALLOS Y HOJAS CON NERVADURA BOTÁNICA
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

    const grad = ctx.createLinearGradient(0, 0, 50, 0);
    grad.addColorStop(0, '#193f21');
    grad.addColorStop(0.5, '#2d6d37');
    grad.addColorStop(1, '#478f53');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(15, -20, 38, -16, 58, 0);
    ctx.bezierCurveTo(38, 20, 15, 20, 0, 0);
    ctx.fill();

    // Nervadura central y laterales
    ctx.strokeStyle = '#5cb86b';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.quadraticCurveTo(28, -2, 54, 0);
    ctx.stroke();

    for (let i = 12; i < 45; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 8, -6);
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 8, 6);
      ctx.stroke();
    }
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
        this.leaves.push(new Leaf(0, 0, -0.65, isMobile ? 0.7 : 0.95, -1));
        this.leaves.push(new Leaf(0, 0, 0.55, isMobile ? 0.8 : 1.05, 1));
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
    const grad = ctx.createLinearGradient(this.startX, this.startY, curTargetX, curTargetY);
    grad.addColorStop(0, '#15351a');
    grad.addColorStop(0.5, '#295b31');
    grad.addColorStop(1, '#3d7e48');

    ctx.strokeStyle = grad;
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
   RENDERIZADOR BOTÁNICO DETALLADO
   ========================================== */
class BotanicalFlower {
  constructor(x, y, radius, delay, swayOffset, type) {
    this.x = x;
    this.y = y;
    this.targetRadius = radius;
    this.delay = delay;
    this.swayOffset = swayOffset;
    this.type = type;
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

      // Resplandor áureo compartido
      const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, this.targetRadius * 1.4);
      aura.addColorStop(0, 'rgba(255, 215, 0, 0.28)');
      aura.addColorStop(0.7, 'rgba(255, 180, 0, 0.08)');
      aura.addColorStop(1, 'rgba(255, 140, 0, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, this.targetRadius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      switch (this.type) {
        case 'tulip':
          this.renderDetailedTulip();
          break;
        case 'daffodil':
          this.renderDetailedDaffodil();
          break;
        case 'daisy':
          this.renderDetailedDaisy();
          break;
        case 'chamomile':
          this.renderDetailedChamomile();
          break;
        default:
          this.renderDetailedSunflower();
      }

      ctx.restore();
    }
  }

  // 1. GIRASOL BOTÁNICO (Fermat + Multicapa 3D)
  renderDetailedSunflower() {
    const R = this.targetRadius;
    this.drawPetalRing(22, R * 1.15, R * 0.24, '#d35400', '#f39c12', '#ffd000', 0);
    this.drawPetalRing(20, R * 0.98, R * 0.22, '#e67e22', '#f1c40f', '#fff176', Math.PI / 20);
    this.drawPetalRing(16, R * 0.78, R * 0.20, '#b84500', '#ffa726', '#ffe082', Math.PI / 16);

    const seedCount = isMobile ? 120 : 190;
    const goldenAngle = 137.5077 * (Math.PI / 180);
    const c = (R * 0.42) / Math.sqrt(seedCount);

    for (let i = 0; i < seedCount; i++) {
      const r = c * Math.sqrt(i);
      const theta = i * goldenAngle;
      const sx = r * Math.cos(theta);
      const sy = r * Math.sin(theta);
      const ratio = r / (R * 0.42);

      ctx.fillStyle = `rgb(${45 + ratio * 160}, ${25 + ratio * 90}, ${10 + ratio * 15})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2 + ratio * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. TULIPÁN BOTÁNICO (3 Capas envolventes, luz cenital y pistilo interior)
  renderDetailedTulip() {
    const R = this.targetRadius;

    // Pistilo interior visible en la abertura
    ctx.fillStyle = '#ff8f00';
    ctx.beginPath();
    ctx.arc(0, -R * 0.75, 4, 0, Math.PI * 2);
    ctx.fill();

    // Capa trasera (2 pétalos posteriores oscuros)
    const backGrad = ctx.createLinearGradient(0, 0, 0, -R * 1.2);
    backGrad.addColorStop(0, '#c77800');
    backGrad.addColorStop(0.7, '#e69500');
    backGrad.addColorStop(1, '#ffc107');

    ctx.fillStyle = backGrad;
    [-0.32, 0.32].forEach(angle => {
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-R * 0.4, -R * 0.3, -R * 0.35, -R * 1.15, 0, -R * 1.25);
      ctx.bezierCurveTo(R * 0.35, -R * 1.15, R * 0.4, -R * 0.3, 0, 0);
      ctx.fill();
      ctx.restore();
    });

    // Pétalo lateral izquierdo
    const leftGrad = ctx.createLinearGradient(-R * 0.6, 0, 0, -R * 1.1);
    leftGrad.addColorStop(0, '#d87a00');
    leftGrad.addColorStop(0.5, '#ffb300');
    leftGrad.addColorStop(1, '#fff59d');

    ctx.fillStyle = leftGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-R * 0.65, -R * 0.25, -R * 0.6, -R * 0.95, -R * 0.15, -R * 1.15);
    ctx.bezierCurveTo(-R * 0.1, -R * 0.6, 0, -R * 0.2, 0, 0);
    ctx.fill();

    // Pétalo lateral derecho
    const rightGrad = ctx.createLinearGradient(R * 0.6, 0, 0, -R * 1.1);
    rightGrad.addColorStop(0, '#d87a00');
    rightGrad.addColorStop(0.5, '#ffb300');
    rightGrad.addColorStop(1, '#fff59d');

    ctx.fillStyle = rightGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(R * 0.65, -R * 0.25, R * 0.6, -R * 0.95, R * 0.15, -R * 1.15);
    ctx.bezierCurveTo(R * 0.1, -R * 0.6, 0, -R * 0.2, 0, 0);
    ctx.fill();

    // Pétalo frontal principal (central con relieve)
    const frontGrad = ctx.createLinearGradient(0, 0, 0, -R * 1.15);
    frontGrad.addColorStop(0, '#f57c00');
    frontGrad.addColorStop(0.4, '#fbc02d');
    frontGrad.addColorStop(0.9, '#fff176');
    frontGrad.addColorStop(1, '#ffffff');

    ctx.fillStyle = frontGrad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-R * 0.48, -R * 0.2, -R * 0.42, -R * 0.95, 0, -R * 1.18);
    ctx.bezierCurveTo(R * 0.42, -R * 0.95, R * 0.48, -R * 0.2, 0, 0);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Brillo longitudinal central
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -R * 0.1);
    ctx.quadraticCurveTo(R * 0.05, -R * 0.6, 0, -R * 1.05);
    ctx.stroke();
  }

  // 3. NARCISO (*DAFFODIL*) BOTÁNICO (6 tépalos cóncavos + corona rizada tridimensional)
  renderDetailedDaffodil() {
    const R = this.targetRadius;

    // 6 tépalos exteriores con forma romboidal natural
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((Math.PI / 3) * i);

      const pGrad = ctx.createLinearGradient(0, 0, 0, -R * 1.08);
      pGrad.addColorStop(0, '#fbc02d');
      pGrad.addColorStop(0.6, '#ffee58');
      pGrad.addColorStop(1, '#fffde7');

      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-R * 0.4, -R * 0.45, -R * 0.25, -R * 0.95, 0, -R * 1.08);
      ctx.bezierCurveTo(R * 0.25, -R * 0.95, R * 0.4, -R * 0.45, 0, 0);
      ctx.fill();

      // Pliegue central del tépalo
      ctx.strokeStyle = 'rgba(245, 127, 23, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -R * 0.98);
      ctx.stroke();
      ctx.restore();
    }

    // Corona / Trompeta central con efecto de copa profunda
    const cupR = R * 0.42;
    const cupGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, cupR);
    cupGrad.addColorStop(0, '#bf360c');
    cupGrad.addColorStop(0.5, '#e65100');
    cupGrad.addColorStop(0.85, '#ff9800');
    cupGrad.addColorStop(1, '#ffeb3b');

    ctx.fillStyle = cupGrad;
    ctx.beginPath();
    ctx.arc(0, 0, cupR, 0, Math.PI * 2);
    ctx.fill();

    // Borde ondeado / rizado (ruffles) de la trompeta
    ctx.strokeStyle = '#e65100';
    ctx.fillStyle = '#ffa726';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    const ruffleSteps = 24;
    for (let j = 0; j <= ruffleSteps; j++) {
      const angle = (Math.PI * 2 / ruffleSteps) * j;
      const wave = Math.sin(j * 3) * (cupR * 0.12);
      const r = cupR + wave;
      const rx = Math.cos(angle) * r;
      const ry = Math.sin(angle) * r;
      if (j === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.stroke();

    // Estambres centrales y polen
    for (let k = 0; k < 6; k++) {
      const sAngle = (Math.PI / 3) * k;
      const sx = Math.cos(sAngle) * (cupR * 0.45);
      const sy = Math.sin(sAngle) * (cupR * 0.45);

      ctx.fillStyle = '#ff6f00';
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. MARGARITA AMARILLA BOTÁNICA (24 pétalos largos con estrías + disco flósculo)
  renderDetailedDaisy() {
    const R = this.targetRadius;
    const petalCount = 24;

    for (let i = 0; i < petalCount; i++) {
      ctx.save();
      ctx.rotate((Math.PI * 2 / petalCount) * i);

      const dGrad = ctx.createLinearGradient(0, 0, 0, -R * 1.1);
      dGrad.addColorStop(0, '#f57f17');
      dGrad.addColorStop(0.4, '#fbc02d');
      dGrad.addColorStop(0.85, '#fff176');
      dGrad.addColorStop(1, '#fffde7');

      ctx.fillStyle = dGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-R * 0.11, -R * 0.35, -R * 0.13, -R * 0.9, 0, -R * 1.1);
      ctx.bezierCurveTo(R * 0.13, -R * 0.9, R * 0.11, -R * 0.35, 0, 0);
      ctx.fill();

      // Doble canaladura de la margarita
      ctx.strokeStyle = 'rgba(230, 126, 34, 0.3)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-1.5, -R * 0.2);
      ctx.lineTo(-1.5, -R * 0.9);
      ctx.moveTo(1.5, -R * 0.2);
      ctx.lineTo(1.5, -R * 0.9);
      ctx.stroke();

      ctx.restore();
    }

    // Botón central abombado con flósculos anulares
    const centerR = R * 0.32;
    const cGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, centerR);
    cGrad.addColorStop(0, '#5d4037');
    cGrad.addColorStop(0.65, '#f57f17');
    cGrad.addColorStop(1, '#fbc02d');

    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.arc(0, 0, centerR, 0, Math.PI * 2);
    ctx.fill();

    // Microsemillas de textura
    ctx.fillStyle = 'rgba(255, 238, 88, 0.8)';
    for (let a = 0; a < 36; a++) {
      const dist = (a / 36) * (centerR * 0.85);
      const rad = a * 2.4;
      ctx.beginPath();
      ctx.arc(Math.cos(rad) * dist, Math.sin(rad) * dist, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 5. MANZANILLA REALISTA (Pétalos recurvados caídos + cono floral abombado)
  renderDetailedChamomile() {
    const R = this.targetRadius * 0.85;
    const count = 18;

    // Pétalos caídos hacia atrás con efecto translúcido
    for (let i = 0; i < count; i++) {
      ctx.save();
      ctx.rotate((Math.PI * 2 / count) * i);

      const mGrad = ctx.createLinearGradient(0, 0, 0, -R * 0.95);
      mGrad.addColorStop(0, '#cfd8dc');
      mGrad.addColorStop(0.3, '#f5f5f5');
      mGrad.addColorStop(0.85, '#ffffff');
      mGrad.addColorStop(1, '#fffde7');

      ctx.fillStyle = mGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      // Curva convexa simulando inclinación hacia abajo
      ctx.bezierCurveTo(-R * 0.16, -R * 0.25, -R * 0.14, -R * 0.75, 0, -R * 0.95);
      ctx.bezierCurveTo(R * 0.14, -R * 0.75, R * 0.16, -R * 0.25, 0, 0);
      ctx.fill();

      // Sombra suave en la base del pétalo
      ctx.fillStyle = 'rgba(176, 190, 197, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, -R * 0.15, R * 0.08, R * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Cono floral central convexo (característico de la Matricaria chamomilla)
    const coneGrad = ctx.createRadialGradient(0, -4, 2, 0, 0, R * 0.38);
    coneGrad.addColorStop(0, '#fff59d');
    coneGrad.addColorStop(0.4, '#fbc02d');
    coneGrad.addColorStop(0.85, '#f57f17');
    coneGrad.addColorStop(1, '#e65100');

    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 0.36, R * 0.31, 0, 0, Math.PI * 2);
    ctx.fill();

    // Textura de poros de polen
    ctx.fillStyle = '#fff9c4';
    for (let p = 0; p < 28; p++) {
      const pr = Math.sqrt(p / 28) * (R * 0.28);
      const pa = p * 137.5 * (Math.PI / 180);
      ctx.beginPath();
      ctx.arc(Math.cos(pa) * pr, Math.sin(pa) * pr - 2, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPetalRing(count, length, width, colBase, colMid, colTip, offsetAngle) {
    const step = (Math.PI * 2) / count;
    ctx.save();
    ctx.rotate(offsetAngle);
    for (let i = 0; i < count; i++) {
      ctx.save();
      ctx.rotate(step * i);

      const pGrad = ctx.createLinearGradient(0, 0, 0, -length);
      pGrad.addColorStop(0, colBase);
      pGrad.addColorStop(0.4, colMid);
      pGrad.addColorStop(1, colTip);

      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-width * 0.6, -length * 0.3, -width * 0.8, -length * 0.75, 0, -length);
      ctx.bezierCurveTo(width * 0.8, -length * 0.75, width * 0.6, -length * 0.3, 0, 0);
      ctx.fill();

      ctx.strokeStyle = 'rgba(230, 126, 34, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -length * 0.1);
      ctx.lineTo(0, -length * 0.85);
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

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

  const yellowSpecies = ['sunflower', 'tulip', 'daffodil', 'daisy'];
  const hasChamomile = Math.random() < 0.15;
  const chamomileSlot = hasChamomile ? Math.floor(Math.random() * count) : -1;

  for (let i = 0; i < count; i++) {
    const x = spacing * (i + 1) + (Math.random() - 0.5) * (isMobile ? 12 : 30);
    const yOffset = isMobile 
      ? (i === 1 ? -40 : 25) 
      : ((i === 2) ? -50 : (i % 2 === 0 ? 30 : -15));
    const y = height * (isMobile ? 0.56 : 0.53) + yOffset;
    const flowerRadius = isMobile ? (44 + Math.random() * 8) : (60 + Math.random() * 12);

    let chosenType;
    if (i === chamomileSlot) {
      chosenType = 'chamomile';
    } else {
      chosenType = yellowSpecies[i % yellowSpecies.length];
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
   BOTÓN DE INICIO
   ========================================== */
btnStart.addEventListener('click', () => {
  playMusicBoxTheme();
  welcomeScreen.classList.add('hidden');
  floatingHeader.classList.add('visible');
  buildGarden();
  gardenStarted = true;
});