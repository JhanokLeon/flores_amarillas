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
   SINTETIZADOR NATIVO WEB AUDIO (CAJA MUSICAL)
   ========================================== */
let audioCtx = null;
function playMusicBoxTheme() {
  // Intenta reproducir el elemento HTML si existe un archivo real
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

    // Notas de la melodía (frecuencias en Hz)
    const melody = [
      { f: 392.00, d: 0.6 }, // G4
      { f: 440.00, d: 0.6 }, // A4
      { f: 493.88, d: 0.6 }, // B4
      { f: 587.33, d: 1.0 }, // D5
      { f: 523.25, d: 0.8 }, // C5
      { f: 493.88, d: 0.6 }, // B4
      { f: 440.00, d: 1.2 }, // A4
      { f: 329.63, d: 0.6 }, // E4
      { f: 392.00, d: 0.8 }, // G4
      { f: 440.00, d: 0.8 }, // A4
      { f: 493.88, d: 1.4 }, // B4
    ];

    let noteIdx = 0;
    function playNextNote() {
      if (!gardenStarted) return;
      const note = melody[noteIdx];
      playBell(note.f, note.d);
      // Acompañamiento en bajo suave
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
   MOTOR BOTÁNICO PROCEDURAL AVANZADO
   ========================================== */

class Leaf {
  constructor(x, y, angle, scale, side) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.scale = scale;
    this.side = side; // 1 o -1
  }

  draw(sway) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + sway * 0.4);
    ctx.scale(this.scale * this.side, this.scale);

    // Degradado orgánico de hoja
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

    // Nervadura central y secundarias
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
    this.growthSpeed = 0.007 + Math.random() * 0.003;
    this.leaves = [];
    this.hasLeaves = false;
  }

  update() {
    if (this.progress < 1) {
      this.progress += this.growthSpeed;
      if (this.progress > 0.45 && !this.hasLeaves) {
        this.leaves.push(new Leaf(0, 0, -0.6, isMobile ? 0.75 : 1, -1));
        this.leaves.push(new Leaf(0, 0, 0.5, isMobile ? 0.85 : 1.1, 1));
        this.hasLeaves = true;
      }
    }
  }

  draw(sway) {
    const t = Math.min(this.progress, 1);
    const cpX = (this.startX + this.targetX) / 2 + sway * 40;
    const cpY = (this.startY + this.targetY) / 2;

    const curTargetX = (1 - t) * (1 - t) * this.startX + 2 * (1 - t) * t * cpX + t * t * (this.targetX + sway * 30);
    const curTargetY = (1 - t) * (1 - t) * this.startY + 2 * (1 - t) * t * cpY + t * t * this.targetY;

    // Sombra del tallo
    ctx.save();
    ctx.strokeStyle = 'rgba(7, 20, 10, 0.4)';
    ctx.lineWidth = isMobile ? 7 : 11;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.startX + 3, this.startY);
    ctx.quadraticCurveTo(cpX + 3, cpY, curTargetX + 3, curTargetY);
    ctx.stroke();

    // Tallo principal con degradado botánico
    const stemGrad = ctx.createLinearGradient(this.startX, this.startY, curTargetX, curTargetY);
    stemGrad.addColorStop(0, '#1b3f20');
    stemGrad.addColorStop(0.5, '#2b5f33');
    stemGrad.addColorStop(1, '#43804d');

    ctx.strokeStyle = stemGrad;
    ctx.lineWidth = isMobile ? 5.5 : 8.5;
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.quadraticCurveTo(cpX, cpY, curTargetX, curTargetY);
    ctx.stroke();

    // Dibujar hojas ancladas
    if (this.hasLeaves && t > 0.5) {
      const leafPos1X = (1 - 0.45) ** 2 * this.startX + 2 * (1 - 0.45) * 0.45 * cpX + 0.45 ** 2 * (this.targetX + sway * 30);
      const leafPos1Y = (1 - 0.45) ** 2 * this.startY + 2 * (1 - 0.45) * 0.45 * cpY + 0.45 ** 2 * this.targetY;
      this.leaves[0].x = leafPos1X;
      this.leaves[0].y = leafPos1Y;
      this.leaves[0].draw(sway);

      const leafPos2X = (1 - 0.72) ** 2 * this.startX + 2 * (1 - 0.72) * 0.72 * cpX + 0.72 ** 2 * (this.targetX + sway * 30);
      const leafPos2Y = (1 - 0.72) ** 2 * this.startY + 2 * (1 - 0.72) * 0.72 * cpY + 0.72 ** 2 * this.targetY;
      this.leaves[1].x = leafPos2X;
      this.leaves[1].y = leafPos2Y;
      this.leaves[1].draw(sway);
    }
    ctx.restore();

    return { x: curTargetX, y: curTargetY };
  }
}

class AdvancedSunflower {
  constructor(x, y, radius, delay, swayOffset) {
    this.x = x;
    this.y = y;
    this.targetRadius = radius;
    this.delay = delay;
    this.swayOffset = swayOffset;
    this.stem = new Stem(x + (Math.random() - 0.5) * 20, height + 40, x, y, swayOffset);
    this.bloomProgress = 0;
    this.headPos = { x, y };
  }

  update() {
    if (this.delay > 0) {
      this.delay--;
      return;
    }
    this.stem.update();
    if (this.stem.progress > 0.85) {
      this.bloomProgress = Math.min(1, this.bloomProgress + 0.02);
    }
  }

  draw(time) {
    if (this.delay > 0) return;
    const sway = Math.sin(time + this.swayOffset) * 0.15;
    this.headPos = this.stem.draw(sway);

    if (this.bloomProgress > 0) {
      this.renderFlowerHead(this.headPos.x, this.headPos.y, sway, this.bloomProgress);
    }
  }

  renderFlowerHead(x, y, sway, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sway * 0.7);
    ctx.scale(scale, scale);

    const R = this.targetRadius;

    // Resplandor cálido exterior (Aura dorada)
    const glowGrad = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 1.5);
    glowGrad.addColorStop(0, 'rgba(255, 215, 0, 0.35)');
    glowGrad.addColorStop(0.6, 'rgba(255, 170, 0, 0.12)');
    glowGrad.addColorStop(1, 'rgba(255, 140, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 1. Capa de Sépalos Verdes (Cáliz posterior)
    this.drawSepals(16, R * 0.65);

    // 2. Capa Exterior de Pétalos (Grandes, cálidos)
    this.drawPetalRing(20, R * 1.15, R * 0.26, '#f39c12', '#ffd000', '#fff385', 0);

    // 3. Capa Media de Pétalos (Desfasados, amarillos vivos)
    this.drawPetalRing(20, R * 0.98, R * 0.24, '#e67e22', '#ffdc14', '#fff9a6', Math.PI / 20);

    // 4. Capa Interna de Pétalos (Corta, texturizada)
    this.drawPetalRing(16, R * 0.75, R * 0.22, '#d35400', '#ffa500', '#ffeb3b', Math.PI / 16);

    // 5. Centro Botánico (Espiral de Fermat con cientos de floretes)
    this.drawFermatCenter(R * 0.42);

    ctx.restore();
  }

  drawSepals(count, length) {
    ctx.save();
    for (let i = 0; i < count; i++) {
      ctx.rotate((Math.PI * 2) / count);
      ctx.fillStyle = '#204d26';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-length * 0.18, -length * 0.5, 0, -length);
      ctx.quadraticCurveTo(length * 0.18, -length * 0.5, 0, 0);
      ctx.fill();
    }
    ctx.restore();
  }

  drawPetalRing(count, length, width, colBase, colMid, colTip, offsetAngle) {
    const angleStep = (Math.PI * 2) / count;
    ctx.save();
    ctx.rotate(offsetAngle);

    for (let i = 0; i < count; i++) {
      ctx.save();
      ctx.rotate(angleStep * i);

      // Sombra proyectada por pétalo
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;

      // Degradado longitudinal y tridimensional
      const pGrad = ctx.createLinearGradient(0, 0, 0, -length);
      pGrad.addColorStop(0, colBase);
      pGrad.addColorStop(0.35, colMid);
      pGrad.addColorStop(0.85, colMid);
      pGrad.addColorStop(1, colTip);

      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      // Forma acorazonada / ojival natural del pétalo
      ctx.bezierCurveTo(-width * 0.6, -length * 0.3, -width * 0.9, -length * 0.75, 0, -length);
      ctx.bezierCurveTo(width * 0.9, -length * 0.75, width * 0.6, -length * 0.3, 0, 0);
      ctx.fill();

      // Nervadura del pétalo
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(230, 126, 34, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -length * 0.1);
      ctx.lineTo(0, -length * 0.85);
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  // Patrón geométrico del girasol real (Fermat Spiral: r = c * sqrt(n), theta = n * 137.5 deg)
  drawFermatCenter(radius) {
    ctx.save();
    const seedCount = isMobile ? 120 : 190;
    const goldenAngle = 137.5077 * (Math.PI / 180);
    const c = radius / Math.sqrt(seedCount);

    for (let i = 0; i < seedCount; i++) {
      const r = c * Math.sqrt(i);
      const theta = i * goldenAngle;
      const sx = r * Math.cos(theta);
      const sy = r * Math.sin(theta);
      const seedSize = 1.2 + (r / radius) * 2.2;

      // Gradiente del centro: marrón oscuro en el medio a dorado en el borde
      const ratio = r / radius;
      const red = Math.floor(45 + ratio * 155);
      const green = Math.floor(25 + ratio * 85);
      const blue = Math.floor(10 + ratio * 10);

      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
      ctx.beginPath();
      ctx.arc(sx, sy, seedSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/* ==========================================
   PARTÍCULAS DE POLEN Y LUCIÉRNAGAS
   ========================================== */
class BioluminescentPollen {
  constructor() {
    this.reset(true);
  }

  reset(initial = false) {
    this.x = Math.random() * width;
    this.y = initial ? Math.random() * height : height + 20;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = -(0.4 + Math.random() * 0.9);
    this.size = 1.2 + Math.random() * 2.8;
    this.baseAlpha = 0.2 + Math.random() * 0.7;
    this.pulseSpeed = 0.02 + Math.random() * 0.04;
  }

  update(time) {
    this.x += this.vx + Math.sin(time + this.size) * 0.3;
    this.y += this.vy;

    // Reacción al puntero/toque
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 120) {
      const force = (120 - dist) / 120;
      this.x -= (dx / dist) * force * 3;
      this.y -= (dy / dist) * force * 3;
    }

    if (this.y < -30 || this.x < -30 || this.x > width + 30) {
      this.reset();
    }
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

let sunflowers = [];
let particles = [];

function buildGarden() {
  sunflowers = [];
  particles = Array.from({ length: isMobile ? 35 : 70 }, () => new BioluminescentPollen());

  // Composición armónica según pantalla
  const count = isMobile ? 3 : 5;
  const spacing = width / (count + 1);

  for (let i = 1; i <= count; i++) {
    const x = spacing * i + (Math.random() - 0.5) * (isMobile ? 12 : 30);
    // Altura escalonada tipo ramillete natural
    const yOffset = isMobile 
      ? (i === 2 ? -40 : 25) 
      : ((i === 3) ? -55 : (i % 2 === 0 ? 30 : -15));
    const y = height * (isMobile ? 0.56 : 0.53) + yOffset;
    const flowerRadius = isMobile ? (42 + Math.random() * 8) : (60 + Math.random() * 14);

    sunflowers.push(new AdvancedSunflower(x, y, flowerRadius, (i - 1) * 22, i * 1.5));
  }
}

/* ==========================================
   LOOP DE ANIMACIÓN PRINCIPAL (60 FPS)
   ========================================== */
function animate() {
  time += 0.016;

  // Fondo con persistencia sutil para estela de luz
  ctx.fillStyle = 'rgba(7, 11, 20, 0.26)';
  ctx.fillRect(0, 0, width, height);

  particles.forEach(p => {
    p.update(time);
    p.draw(time);
  });

  if (gardenStarted) {
    sunflowers.forEach(s => {
      s.update();
      s.draw(time);
    });
  }

  requestAnimationFrame(animate);
}

// Iniciar partículas ambientales desde el inicio
particles = Array.from({ length: 30 }, () => new BioluminescentPollen());
animate();

/* ==========================================
   INTERACCIÓN AL TOCAR EL BOTÓN
   ========================================== */
btnStart.addEventListener('click', () => {
  // Desencadenar audio
  playMusicBoxTheme();

  // Transición suave de la interfaz
  welcomeScreen.classList.add('hidden');
  floatingHeader.classList.add('visible');

  // Germinar el jardín
  buildGarden();
  gardenStarted = true;
});