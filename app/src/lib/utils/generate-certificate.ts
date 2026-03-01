/**
 * Generates a certificate PNG image (1200x630) using the Canvas API and
 * triggers a browser download. Zero external dependencies.
 */

interface CertificateData {
  courseName: string;
  recipientWallet: string;
  issueDate: string;
  trackId?: number;
}

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 630;

const TRACK_COLORS: Record<number, { start: string; end: string }> = {
  0: { start: '#10b981', end: '#0d9488' }, // emerald -> teal
  1: { start: '#3b82f6', end: '#4f46e5' }, // blue -> indigo
  2: { start: '#a855f7', end: '#7c3aed' }, // purple -> violet
  3: { start: '#f97316', end: '#f59e0b' }, // orange -> amber
  4: { start: '#f43f5e', end: '#ec4899' }, // rose -> pink
};

function getTrackColors(trackId?: number): { start: string; end: string } {
  if (trackId === undefined) return { start: '#7c3aed', end: '#6366f1' };
  const keys = Object.keys(TRACK_COLORS);
  return TRACK_COLORS[trackId % keys.length] ?? { start: '#7c3aed', end: '#6366f1' };
}

function truncateWallet(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function formatCertificateDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawVerificationBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const radius = 18;

  // Outer glow
  ctx.save();
  ctx.shadowColor = 'rgba(34, 197, 94, 0.4)';
  ctx.shadowBlur = 12;

  // Green circle
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();
  ctx.restore();

  // White checkmark
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy);
  ctx.lineTo(cx - 2, cy + 6);
  ctx.lineTo(cx + 8, cy - 5);
  ctx.stroke();
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function generateCertificateImage(data: CertificateData): void {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  const { start, end } = getTrackColors(data.trackId);

  // -- Background gradient --
  const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  bgGrad.addColorStop(0, start);
  bgGrad.addColorStop(1, end);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // -- Subtle pattern overlay (diagonal lines) --
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  for (let i = -CANVAS_HEIGHT; i < CANVAS_WIDTH + CANVAS_HEIGHT; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + CANVAS_HEIGHT, CANVAS_HEIGHT);
    ctx.stroke();
  }
  ctx.restore();

  // -- Inner card --
  const cardMargin = 40;
  const cardX = cardMargin;
  const cardY = cardMargin;
  const cardW = CANVAS_WIDTH - cardMargin * 2;
  const cardH = CANVAS_HEIGHT - cardMargin * 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 8;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fill();
  ctx.restore();

  // Card border glow
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // -- Branding top-left --
  ctx.save();
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.textAlign = 'left';
  ctx.fillText('SUPERTEAM ACADEMY', cardX + 36, cardY + 44);
  ctx.restore();

  // -- "Certificate of Completion" label --
  ctx.save();
  ctx.font = '600 14px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '4px';
  ctx.fillText('CERTIFICATE OF COMPLETION', CANVAS_WIDTH / 2, cardY + 100);
  ctx.restore();

  // -- Decorative line --
  const lineY = cardY + 116;
  const lineGrad = ctx.createLinearGradient(
    CANVAS_WIDTH / 2 - 120,
    lineY,
    CANVAS_WIDTH / 2 + 120,
    lineY,
  );
  lineGrad.addColorStop(0, 'rgba(255,255,255,0)');
  lineGrad.addColorStop(0.5, 'rgba(255,255,255,0.5)');
  lineGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH / 2 - 120, lineY);
  ctx.lineTo(CANVAS_WIDTH / 2 + 120, lineY);
  ctx.stroke();

  // -- Course name (main title, wrapped) --
  ctx.save();
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';

  const titleLines = wrapText(ctx, data.courseName, cardW - 120);
  const titleStartY = 180;
  for (let i = 0; i < titleLines.length; i++) {
    ctx.fillText(titleLines[i]!, CANVAS_WIDTH / 2, cardY + titleStartY + i * 46);
  }
  ctx.restore();

  // -- "Awarded to" label --
  const awardedY = cardY + titleStartY + titleLines.length * 46 + 20;
  ctx.save();
  ctx.font = '500 14px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.textAlign = 'center';
  ctx.fillText('AWARDED TO', CANVAS_WIDTH / 2, awardedY);
  ctx.restore();

  // -- Wallet address --
  ctx.save();
  ctx.font = '600 20px "SF Mono", "Fira Code", "Cascadia Code", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.textAlign = 'center';
  ctx.fillText(truncateWallet(data.recipientWallet), CANVAS_WIDTH / 2, awardedY + 32);
  ctx.restore();

  // -- Bottom row: date + verified badge --
  const bottomY = cardY + cardH - 48;

  // Date (left-aligned within card)
  ctx.save();
  ctx.font = '500 14px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.textAlign = 'left';
  ctx.fillText('ISSUED', cardX + 36, bottomY - 16);

  ctx.font = '600 16px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(formatCertificateDate(data.issueDate), cardX + 36, bottomY + 6);
  ctx.restore();

  // Verification badge + label (right-aligned)
  const verifiedLabelX = cardX + cardW - 36;
  ctx.save();
  ctx.font = '600 14px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.textAlign = 'right';
  ctx.fillText('VERIFIED ON-CHAIN', verifiedLabelX - 30, bottomY);
  ctx.restore();

  drawVerificationBadge(ctx, verifiedLabelX - 8, bottomY - 5);

  // -- Corner decorations --
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  const cornerLen = 30;
  const cornerOff = 56;

  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH - cornerOff - cornerLen, cornerOff);
  ctx.lineTo(CANVAS_WIDTH - cornerOff, cornerOff);
  ctx.lineTo(CANVAS_WIDTH - cornerOff, cornerOff + cornerLen);
  ctx.stroke();

  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(cornerOff, CANVAS_HEIGHT - cornerOff - cornerLen);
  ctx.lineTo(cornerOff, CANVAS_HEIGHT - cornerOff);
  ctx.lineTo(cornerOff + cornerLen, CANVAS_HEIGHT - cornerOff);
  ctx.stroke();

  ctx.restore();

  // -- Export as PNG download --
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `superteam-certificate-${Date.now()}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
