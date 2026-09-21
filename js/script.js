const canvas = document.getElementById('gardenCanvas');
const ctx = canvas.getContext('2d');
const audio = document.getElementById('bgAudio');
const btnStart = document.getElementById('btnStart');
const welcomeScreen = document.getElementById('welcomeScreen');
const floatingHeader = document.getElementById('floatingHeader');

let width, height, isMobile;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  isMobile = width < 650;
}
window.addEventListener('resize', resize);
resize();

// Generador de tallos dinámicos
class Stem {
  constructor(startX, startY, targetX, targetY) {
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.cpX = (startX + targetX) / 2 + (Math.random() - 0.5) * (isMobile ? 40 : 80);
    this.cpY = (startY + targetY) / 2;
    this.progress = 0;
    this.growthSpeed = isMobile ? 0.009 : 0.007;
  }

  draw() {
    if (this.progress < 1) this.progress += this.growthSpeed;
    const t = Math.min(this.progress, 1);

    const curX = (1 - t) * (1 - t) * this.startX + 2 * (1 - t) * t * this.cpX + t * t * this.targetX;
    const curY = (1 - t) * (1 - t) * this.startY + 2 * (1 - t) * t * this.cpY + t * t * this.targetY;

    ctx.save();
    ctx.strokeStyle = '#2d5a27';
    ctx.lineWidth = isMobile ? 4.5 : 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.quadraticCurveTo(this.cpX, this.cpY, curX, curY);
    ctx.stroke();

    if (t > 0.45) {
      this.drawLeaf(this.startX + (this.cpX - this.startX) * 0.7, this.startY + (this.cpY - this.startY) * 0.7, -0.6);
    }
    if (t > 0.75) {
      this.drawLeaf(this.cpX + (this.targetX - this.cpX) * 0.6, this.cpY + (this.targetY - this.cpY) * 0.6, 0.5);
    }
    ctx.restore();
  }

  drawLeaf(x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = '#1e4d2b';
    ctx.beginPath();
    ctx.ellipse(0, 0, isMobile ? 16 : 24, isMobile ? 6 : 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Flor procedural multicapa
class Flower {
  constructor(x, y, size, delay) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.delay = delay;
    this.age = 0;
    this.petalCount = 14;
    this.stem = new Stem(x + (Math.random() - 0.5) * 30, height + 30, x, y);
  }

  update() {
    if (this.delay > 0) {
      this.delay--;
      return;
    }
    this.stem.draw();
    if (this.stem.progress >= 0.92) {
      this.age += 0.025;
      this.drawBlossom();
    }
  }

  drawBlossom() {
    const scale = Math.min(this.age, 1);
    ctx.save();
    ctx.translate(this.x, this.y);

    // Pétalos capa exterior
    this.drawPetalRing(this.petalCount, this.size * scale, '#ffd214', '#f39c12');

    // Pétalos capa interior alternada
    ctx.rotate(Math.PI / this.petalCount);
    this.drawPetalRing(this.petalCount, this.size * 0.75 * scale, '#ffe135', '#e67e22');

    // Botón central con textura radial
    ctx.beginPath();
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, this.size * 0.32 * scale);
    grad.addColorStop(0, '#5a381e');
    grad.addColorStop(0.7, '#3b2210');
    grad.addColorStop(1, '#1e1108');
    ctx.fillStyle = grad;
    ctx.arc(0, 0, this.size * 0.32 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawPetalRing(count, length, cInner, cOuter) {
    const step = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      ctx.save();
      ctx.rotate(step * i);

      const grad = ctx.createLinearGradient(0, 0, 0, -length);
      grad.addColorStop(0, cInner);
      grad.addColorStop(1, cOuter);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-length * 0.22, -length * 0.5, 0, -length);
      ctx.quadraticCurveTo(length * 0.22, -length * 0.5, 0, 0);
      ctx.fill();
      ctx.restore();
    }
  }
}

// Luciérnagas flotantes
class Spark {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * width;
    this.y = height + Math.random() * 50;
    this.vx = (Math.random() - 0.5) * 0.7;
    this.vy = -(0.5 + Math.random() * 1.1);
    this.size = 1 + Math.random() * 2.2;
    this.alpha = 0.2 + Math.random() * 0.8;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.y < -10) this.reset();
  }
  draw() {
    ctx.save();
    ctx.fillStyle = `rgba(255, 235, 120, ${this.alpha})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffd700';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

let flowers = [];
let sparks = [];
let gardenStarted = false;

function setupGarden() {
  flowers = [];
  sparks = Array.from({ length: isMobile ? 25 : 50 }, () => new Spark());

  // Adaptación de flores: 3 para móviles, 5 para PC
  const count = isMobile ? 3 : 5;
  const spacing = width / (count + 1);

  for (let i = 1; i <= count; i++) {
    const x = spacing * i + (Math.random() - 0.5) * (isMobile ? 15 : 40);
    // En celular quedan a buena altura visual
    const y = isMobile ? (height * 0.55 + ((i % 2 === 0) ? -35 : 25)) : (height * 0.56 + (Math.random() - 0.5) * 70);
    const size = isMobile ? (48 + Math.random() * 14) : (68 + Math.random() * 22);
    flowers.push(new Flower(x, y, size, i * 18));
  }
}

// Loop de animación
function animate() {
  ctx.fillStyle = 'rgba(7, 11, 20, 0.22)';
  ctx.fillRect(0, 0, width, height);

  sparks.forEach(s => { s.update(); s.draw(); });
  if (gardenStarted) {
    flowers.forEach(f => f.update());
  }

  requestAnimationFrame(animate);
}

// Inicializar partículas antes de florecer
sparks = Array.from({ length: 30 }, () => new Spark());
animate();

// Evento al presionar el botón
btnStart.addEventListener('click', () => {
  // 1. Iniciar música
  audio.volume = 0.7;
  audio.play().catch(() => console.log("Audio esperando permisos"));

  // 2. Ocultar pantalla de bienvenida y mostrar título
  welcomeScreen.classList.add('hidden');
  floatingHeader.classList.add('visible');

  // 3. Crear y germinar las flores
  setupGarden();
  gardenStarted = true;
});