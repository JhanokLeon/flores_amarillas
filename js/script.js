const canvas = document.getElementById('gardenCanvas');
const ctx = canvas.getContext('2d');

let width, height;
function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Generador de tallos con curvas Bézier y hojas
class Stem {
  constructor(startX, startY, targetX, targetY) {
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.cpX = (startX + targetX) / 2 + (Math.random() - 0.5) * 80;
    this.cpY = (startY + targetY) / 2 + (Math.random() - 0.5) * 30;
    this.progress = 0;
    this.growthSpeed = 0.008 + Math.random() * 0.004;
  }

  draw() {
    if (this.progress < 1) this.progress += this.growthSpeed;
    const t = Math.min(this.progress, 1);

    // Ecuación cuadrática Bézier
    const curX = (1 - t) * (1 - t) * this.startX + 2 * (1 - t) * t * this.cpX + t * t * this.targetX;
    const curY = (1 - t) * (1 - t) * this.startY + 2 * (1 - t) * t * this.cpY + t * t * this.targetY;

    ctx.save();
    ctx.strokeStyle = '#2d5a27';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.quadraticCurveTo(this.cpX, this.cpY, curX, curY);
    ctx.stroke();

    // Hojas laterales
    if (t > 0.45) {
      this.drawLeaf(this.startX + (this.cpX - this.startX) * 0.7, this.startY + (this.cpY - this.startY) * 0.7, -0.6);
    }
    if (t > 0.75) {
      this.drawLeaf(this.cpX + (this.targetX - this.cpX) * 0.6, this.cpY + (this.targetY - this.cpY) * 0.6, 0.5);
    }
    ctx.restore();

    return curX;
  }

  drawLeaf(x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = '#1e4d2b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Flor procedural con múltiples capas y pétalos
class Flower {
  constructor(x, y, size, delay) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.delay = delay;
    this.age = 0;
    this.petalCount = 14;
    this.stem = new Stem(x + (Math.random() - 0.5) * 40, height + 20, x, y);
  }

  update() {
    if (this.delay > 0) {
      this.delay--;
      return;
    }
    this.stem.draw();
    if (this.stem.progress >= 0.95) {
      this.age += 0.02;
      this.drawBlossom();
    }
  }

  drawBlossom() {
    const scale = Math.min(this.age, 1);
    ctx.save();
    ctx.translate(this.x, this.y);

    // Capa exterior de pétalos
    this.drawPetalRing(this.petalCount, this.size * scale, '#ffd214', '#f39c12');
    // Capa interior desfasada
    ctx.rotate(Math.PI / this.petalCount);
    this.drawPetalRing(this.petalCount, this.size * 0.75 * scale, '#ffe135', '#e67e22');

    // Disco central
    ctx.beginPath();
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, this.size * 0.3 * scale);
    grad.addColorStop(0, '#5a381e');
    grad.addColorStop(0.7, '#3b2210');
    grad.addColorStop(1, '#1e1108');
    ctx.fillStyle = grad;
    ctx.arc(0, 0, this.size * 0.3 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawPetalRing(count, length, colorInner, colorOuter) {
    const step = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      ctx.save();
      ctx.rotate(step * i);

      const grad = ctx.createLinearGradient(0, 0, 0, -length);
      grad.addColorStop(0, colorInner);
      grad.addColorStop(1, colorOuter);

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

// Luciérnagas / polen brillante
class Spark {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * width;
    this.y = height + Math.random() * 50;
    this.vx = (Math.random() - 0.5) * 0.8;
    this.vy = -(0.6 + Math.random() * 1.2);
    this.size = 1 + Math.random() * 2.5;
    this.alpha = 0.2 + Math.random() * 0.8;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.y < -10) this.reset();
  }
  draw() {
    ctx.save();
    ctx.fillStyle = `rgba(255, 230, 100, ${this.alpha})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffd700';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Inicialización
let flowers = [];
const sparks = Array.from({ length: 45 }, () => new Spark());

function initGarden() {
  flowers = [];
  const count = 5;
  const spacing = width / (count + 1);
  for (let i = 1; i <= count; i++) {
    const x = spacing * i + (Math.random() - 0.5) * 30;
    const y = height * 0.52 + (Math.random() - 0.5) * 80;
    const size = 65 + Math.random() * 25;
    flowers.push(new Flower(x, y, size, i * 20));
  }
}

initGarden();

// Loop principal de animación
function animate() {
  ctx.fillStyle = 'rgba(5, 8, 17, 0.25)';
  ctx.fillRect(0, 0, width, height);

  sparks.forEach(s => { s.update(); s.draw(); });
  flowers.forEach(f => f.update());

  requestAnimationFrame(animate);
}
animate();

// Botón de re-florecer
document.getElementById('btnBloom').addEventListener('click', () => {
  ctx.clearRect(0, 0, width, height);
  initGarden();
});

// Efecto máquina de escribir
const phrase = "Un ramo digital eterno para iluminar este 21 de septiembre.";
const typewriterEl = document.getElementById('typewriter');
let charIdx = 0;

function typeText() {
  if (charIdx < phrase.length) {
    typewriterEl.textContent += phrase.charAt(charIdx);
    charIdx++;
    setTimeout(typeText, 45);
  }
}
setTimeout(typeText, 600);