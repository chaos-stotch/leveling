import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Instalar canvas: npm install canvas
// Este script gera os ícones PWA necessários

const sizes = [192, 512];

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fundo gradiente
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#0a0e27');
  gradient.addColorStop(1, '#0f1629');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Círculo externo com brilho
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;

  // Brilho externo
  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
  glowGradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
  glowGradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.1)');
  glowGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Círculo principal
  ctx.fillStyle = '#00D4FF';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Símbolo "L" no centro
  ctx.fillStyle = '#0a0e27';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('L', centerX, centerY);

  return canvas.toBuffer('image/png');
}

// Criar diretório public se não existir
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Gerar ícones
sizes.forEach(size => {
  const icon = generateIcon(size);
  const filename = path.join(publicDir, `pwa-${size}x${size}.png`);
  fs.writeFileSync(filename, icon);
  console.log(`Ícone gerado: ${filename}`);
});

console.log('Todos os ícones foram gerados com sucesso!');

