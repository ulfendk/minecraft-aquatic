// Pack icon: a whale's tail rising out of the sea at sunset with fish below the surface,
// drawn at 32x32 and scaled up.
import { PNG } from 'pngjs';
import { hex, mix } from './texture.mjs';

export function packIcon(scale = 8) {
  const N = 32;
  const px = Array.from({ length: N }, () => new Array(N));
  const SEA = 14; // first row of water
  const sky = [hex('#1d3b6e'), hex('#4f7fb8'), hex('#f2a65a'), hex('#ffd98a')];
  for (let y = 0; y < SEA; y++) {
    const t = y / SEA;
    const c = t < 0.45 ? mix(sky[0], sky[1], t / 0.45) : t < 0.8 ? mix(sky[1], sky[2], (t - 0.45) / 0.35) : mix(sky[2], sky[3], (t - 0.8) / 0.2);
    for (let x = 0; x < N; x++) px[y][x] = c;
  }
  // Low sun on the horizon.
  for (let y = 0; y < SEA; y++) for (let x = 0; x < N; x++) {
    const d = Math.hypot(x - 23, y - 13);
    if (d < 4.5) px[y][x] = mix(hex('#fff4c2'), hex('#ffc65c'), d / 4.5);
  }
  // Sea: light at the top, deep blue below.
  for (let y = SEA; y < N; y++) {
    const t = (y - SEA) / (N - SEA);
    for (let x = 0; x < N; x++) px[y][x] = mix(hex('#2a8fb8'), hex('#0a2f5c'), t);
  }
  // Wave crests along the surface.
  for (let x = 0; x < N; x++) {
    if ((x + 1) % 6 < 3) px[SEA][x] = hex('#bfe8f2');
    if ((x + 4) % 6 < 2) px[SEA + 1][x] = hex('#6cc4dc');
  }
  // Sun glitter on the water.
  for (const [x, y] of [[22, 16], [24, 17], [21, 18], [25, 19], [23, 20]]) px[y][x] = hex('#ffe7a3');

  const dark = hex('#1a2433');
  const put = (x, y, c = dark) => { if (y >= 0 && y < N && x >= 0 && x < N) px[y][x] = c; };
  const fill = (x0, y0, x1, y1, c = dark) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, c); };

  // Whale fluke: a stock rising from the water, flukes spread in a V.
  fill(10, 8, 12, 14);
  fill(9, 10, 13, 13);
  for (let i = 0; i < 6; i++) {
    fill(4 + i, 3 + Math.floor(i / 2), 5 + i, 5 + Math.floor(i / 2));
    fill(16 - i, 3 + Math.floor(i / 2), 17 - i, 5 + Math.floor(i / 2));
  }
  fill(10, 6, 12, 8);
  // Notch in the middle of the flukes.
  put(11, 6, mix(sky[0], sky[1], 6 / SEA / 0.45));
  // Splash where the tail meets the water.
  for (const [x, y] of [[7, 13], [8, 12], [14, 12], [15, 13], [6, 14], [16, 14]]) put(x, y, hex('#e8f8ff'));

  // Fish below the surface.
  const fishAt = (x, y, body, fin) => {
    fill(x, y, x + 3, y + 1, body);
    put(x - 1, y, body); put(x - 1, y + 1, body);
    put(x + 4, y - 1, fin); put(x + 4, y + 2, fin); put(x + 4, y, fin); put(x + 4, y + 1, fin);
    put(x, y, hex('#0d1520'));
  };
  fishAt(5, 21, hex('#f28c28'), hex('#ffd0a0'));
  fishAt(20, 24, hex('#d9e3ea'), hex('#8fb3c9'));
  fishAt(12, 27, hex('#f2d13b'), hex('#ffeeaa'));
  // Bubbles.
  for (const [x, y] of [[3, 18], [4, 16], [27, 21], [28, 19]]) put(x, y, hex('#9fdcf0'));

  const png = new PNG({ width: N * scale, height: N * scale });
  for (let y = 0; y < N * scale; y++) for (let x = 0; x < N * scale; x++) {
    png.data.set(px[Math.floor(y / scale)][Math.floor(x / scale)], (y * N * scale + x) * 4);
  }
  return PNG.sync.write(png);
}
