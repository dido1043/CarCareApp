/**
 * Renders the CarCare launcher/splash artwork as PNGs.
 *
 * The mark is three angular racing bands — brand red, dark red and a thin white
 * highlight — cut across a near-black field, which is the same geometry the
 * in-app <AppLogo /> draws.
 */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const RED = [0xff, 0x1f, 0x2d];
const DARK_RED = [0xa9, 0x00, 0x0b];
const WHITE = [0xff, 0xff, 0xff];
const FIELD = [0x0b, 0x0b, 0x0d];

/** Bands are constant along `x + y`, so they lean up-and-to-the-right. */
const BANDS = [
  { center: -0.34, half: 0.055, color: DARK_RED },
  { center: -0.14, half: 0.12, color: RED },
  { center: 0.14, half: 0.12, color: RED },
  { center: 0.36, half: 0.045, color: WHITE },
];

const EDGE = 0.012; // feathering, in the same normalised units as the bands

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Coverage of the mark at a pixel, 0..1, with soft edges. */
function markCoverage(band, k) {
  const d = Math.abs(k - band.center);
  return 1 - smoothstep(band.half - EDGE, band.half + EDGE, d);
}

/**
 * @param clip Half-width of the centred square the mark is cut to, in 0..1 of
 *   the canvas. The negative space around it is what makes the bands read as a
 *   mark rather than as a flag.
 */
function renderRgba(size, { background, scale = 1, clip = 0.34 }) {
  const data = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // k is 0 at the centre diagonal, ±1 at the corners.
      const k = ((x + y) / (size - 1) - 1) / scale;
      const nx = (x / (size - 1)) * 2 - 1;
      const ny = (y / (size - 1)) * 2 - 1;
      // Squircle-ish clip: p=4 keeps the corners fuller than a circle would.
      const radial = Math.pow(Math.abs(nx) ** 4 + Math.abs(ny) ** 4, 0.25);
      const inside = 1 - smoothstep(clip - 0.02, clip + 0.02, radial);

      let [r, g, b] = background ?? [0, 0, 0];
      let a = background ? 255 : 0;

      for (const band of BANDS) {
        const coverage = markCoverage(band, k) * inside;
        if (coverage <= 0) continue;
        const [br, bg, bb] = band.color;
        const outA = coverage + (a / 255) * (1 - coverage);
        r = Math.round((br * coverage + r * (a / 255) * (1 - coverage)) / outA);
        g = Math.round((bg * coverage + g * (a / 255) * (1 - coverage)) / outA);
        b = Math.round((bb * coverage + b * (a / 255) * (1 - coverage)) / outA);
        a = Math.round(outA * 255);
      }

      const offset = (y * size + x) * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = a;
    }
  }

  return data;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, body) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length);
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([length, typed, crc]);
}

function encodePng(size, rgba) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function solidPng(size, color) {
  const data = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i += 1) {
    data[i * 4] = color[0];
    data[i * 4 + 1] = color[1];
    data[i * 4 + 2] = color[2];
    data[i * 4 + 3] = 255;
  }
  return encodePng(size, data);
}

const outDir = path.join(__dirname, '..', 'assets');
const files = {
  'icon.png': encodePng(1024, renderRgba(1024, { background: FIELD, scale: 0.7, clip: 0.66 })),
  'splash-icon.png': encodePng(512, renderRgba(512, { scale: 0.7, clip: 0.66 })),
  'favicon.png': encodePng(64, renderRgba(64, { background: FIELD, scale: 0.7, clip: 0.66 })),
  'android-icon-background.png': solidPng(1024, FIELD),
  'android-icon-foreground.png': encodePng(1024, renderRgba(1024, { scale: 0.45, clip: 0.42 })),
  'android-icon-monochrome.png': encodePng(1024, renderRgba(1024, { scale: 0.45, clip: 0.42 })),
};

for (const [name, buffer] of Object.entries(files)) {
  fs.writeFileSync(path.join(outDir, name), buffer);
  console.log(`wrote assets/${name} (${buffer.length} bytes)`);
}
