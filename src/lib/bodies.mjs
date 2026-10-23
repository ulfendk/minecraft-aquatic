// Parametric body plans for fish, sharks, rays, whales, seals and penguins. Each returns
// { bones, at }: the model bones and key coordinates for species-specific extras.
// Sizes are in pixels (16 per block); the animal faces -z, +x is its left side.
import { eyes } from './parts.mjs';

const half = (n) => n / 2;

/**
 * Bony fish: a body box with a tail section, a caudal fin, dorsal fin(s), pectoral fins and
 * an optional anal fin; the head (with an optional lower jaw) sits in front. `lift` raises
 * the fish off the bottom of its box.
 * Bones: root, body, head, jaw (optional), tail, caudal_fin, dorsal_fin, fin_l, fin_r.
 * Materials: scales, head, fin (and teeth with `teeth`).
 * caudal: 'fork' (two angled lobes), 'round' (one flat paddle) or 'lunate' (tuna-like, wide fork).
 */
export function fishBody({
  bodyW = 4, bodyH = 5, bodyL = 10, headW = 3, headH = 4, headL = 4, jaw = false, teeth = false,
  tailW = 2, tailH = 3, tailL = 5, caudalH = 7, caudalL = 3, caudal = 'fork', dorsalH = 3, dorsalL = 4, dorsal2 = 0,
  dorsalAt = 0.25, anal = 0, pectoral = 3, lift = 1, eye = {},
} = {}) {
  const bottom = lift;
  const top = bottom + bodyH;
  const cy = bottom + bodyH / 2;
  const zf = -bodyL / 2, zb = bodyL / 2;
  const body = { origin: [-half(bodyW), bottom, zf], size: [bodyW, bodyH, bodyL], mat: 'scales' };
  const hy = Math.round(cy - headH / 2);
  const head = {
    origin: [-half(headW), hy + (jaw ? 1 : 0), zf - headL], size: [headW, headH - (jaw ? 1 : 0), headL], mat: 'head',
    marks: eyes(headL, { back: 1, down: 1, ...eye }),
  };
  const ty = Math.round(cy - tailH / 2);
  const tz = zb + tailL;
  const caudalCubes = {
    fork: [
      { origin: [-0.5, Math.round(cy), tz - 1], size: [1, Math.ceil(caudalH / 2), caudalL], mat: 'fin', rotation: [-30, 0, 0], pivot: [0, cy, tz - 1] },
      { origin: [-0.5, Math.round(cy) - Math.ceil(caudalH / 2), tz - 1], size: [1, Math.ceil(caudalH / 2), caudalL], mat: 'fin', rotation: [30, 0, 0], pivot: [0, cy, tz - 1] },
    ],
    lunate: [
      { origin: [-0.5, Math.round(cy), tz - 1], size: [1, Math.ceil(caudalH / 2), caudalL], mat: 'fin', rotation: [-45, 0, 0], pivot: [0, cy, tz - 1] },
      { origin: [-0.5, Math.round(cy) - Math.ceil(caudalH / 2), tz - 1], size: [1, Math.ceil(caudalH / 2), caudalL], mat: 'fin', rotation: [45, 0, 0], pivot: [0, cy, tz - 1] },
    ],
    round: [{ origin: [-0.5, Math.round(cy - caudalH / 2), tz - 1], size: [1, caudalH, caudalL], mat: 'fin' }],
  }[caudal];
  const dz = Math.round(zf + bodyL * dorsalAt);
  const bones = [
    { name: 'root', pivot: [0, cy, 0] },
    { name: 'body', parent: 'root', pivot: [0, cy, 0], cubes: [body] },
    { name: 'head', parent: 'body', pivot: [0, cy, zf], cubes: [head] },
    ...(jaw ? [{
      name: 'jaw', parent: 'head', pivot: [0, hy + 1, zf],
      cubes: [{ origin: [-(headW - 1) / 2, hy, zf - headL + 1], size: [headW - 1, 1, headL - 1], mat: teeth ? 'teeth' : 'head' }],
    }] : []),
    { name: 'tail', parent: 'body', pivot: [0, cy, zb], cubes: [{ origin: [-half(tailW), ty, zb], size: [tailW, tailH, tailL], mat: 'scales' }] },
    { name: 'caudal_fin', parent: 'tail', pivot: [0, cy, tz], cubes: caudalCubes },
    {
      name: 'dorsal_fin', parent: 'body', pivot: [0, top, dz],
      cubes: [
        ...(dorsalH ? [{ origin: [-0.5, top, dz], size: [1, dorsalH, dorsalL], mat: 'fin' }] : []),
        ...(dorsal2 ? [{ origin: [-0.5, top, Math.round(zf + bodyL * 0.72)], size: [1, dorsal2, 2], mat: 'fin' }] : []),
        ...(anal ? [{ origin: [-0.5, bottom - anal, Math.round(zf + bodyL * 0.7)], size: [1, anal, 2], mat: 'fin' }] : []),
      ],
    },
    { name: 'fin_l', parent: 'body', pivot: [half(bodyW), bottom + 1, zf + 1], rotation: [0, 0, -40], cubes: [{ origin: [half(bodyW), bottom + 1, zf + 1], size: [pectoral, 0, Math.max(2, pectoral - 1)], mat: 'fin' }] },
    { name: 'fin_r', parent: 'body', pivot: [-half(bodyW), bottom + 1, zf + 1], rotation: [0, 0, 40], cubes: [{ origin: [-half(bodyW) - pectoral, bottom + 1, zf + 1], size: [pectoral, 0, Math.max(2, pectoral - 1)], mat: 'fin' }] },
  ];
  return { bones, at: { bottom, top, cy, zf, zb, tz, body, head } };
}

/**
 * Sharks: a long body with a pointed snout, a lower jaw full of teeth, a tall first dorsal,
 * a small second dorsal, big angled pectorals and a heterocercal tail (the upper lobe is
 * the long one). Bones: root, body, head, jaw, tail, caudal_fin, dorsal_fin, fin_l, fin_r.
 * Materials: skin, head, fin, teeth, gill (marks), eye (marks).
 */
export function sharkBody({
  bodyW = 6, bodyH = 6, bodyL = 18, headW = 5, headH = 5, headL = 6, snout = 2,
  tailW = 3, tailH = 3, tailL = 8, upper = 9, lower = 4, dorsalH = 5, dorsalL = 4, pectoral = 6, lift = 1, jawOpen = 0,
} = {}) {
  const bottom = lift;
  const top = bottom + bodyH;
  const cy = bottom + bodyH / 2;
  const zf = -bodyL / 2, zb = bodyL / 2;
  const hy = bottom + Math.max(0, Math.floor((bodyH - headH) / 2));
  const tz = zb + tailL;
  const gills = ['right', 'left'].flatMap((face) => [0, 2].map((k) => ({ face, x: face === 'right' ? k : headL - 1 - k, y: 1, h: headH - 3, color: '#3a3f44' })));
  const bones = [
    { name: 'root', pivot: [0, cy, 0] },
    { name: 'body', parent: 'root', pivot: [0, cy, 0], cubes: [{ origin: [-half(bodyW), bottom, zf], size: [bodyW, bodyH, bodyL], mat: 'skin' }] },
    {
      name: 'head', parent: 'body', pivot: [0, cy, zf],
      cubes: [
        { origin: [-half(headW), hy + 1, zf - headL], size: [headW, headH - 1, headL], mat: 'head', marks: [...eyes(headL, { back: 1, down: 0 }), ...gills] },
        { origin: [-half(headW - 2), hy + 2, zf - headL - snout], size: [headW - 2, headH - 2, snout], mat: 'head' },
      ],
    },
    {
      name: 'jaw', parent: 'head', pivot: [0, hy + 1, zf], rotation: [jawOpen, 0, 0],
      cubes: [{ origin: [-half(headW - 1), hy, zf - headL + 1], size: [headW - 1, 1, headL - 1], mat: 'teeth' }],
    },
    { name: 'tail', parent: 'body', pivot: [0, cy, zb], cubes: [{ origin: [-half(tailW), Math.round(cy - tailH / 2), zb], size: [tailW, tailH, tailL], mat: 'skin' }] },
    {
      name: 'caudal_fin', parent: 'tail', pivot: [0, cy, tz],
      cubes: [
        { origin: [-0.5, Math.round(cy), tz - 2], size: [1, upper, 3], mat: 'fin', rotation: [-50, 0, 0], pivot: [0, cy, tz - 2] },
        { origin: [-0.5, Math.round(cy) - lower, tz - 2], size: [1, lower, 2], mat: 'fin', rotation: [40, 0, 0], pivot: [0, cy, tz - 2] },
      ],
    },
    {
      name: 'dorsal_fin', parent: 'body', pivot: [0, top, zf + bodyL * 0.35],
      cubes: [
        { origin: [-0.5, top, Math.round(zf + bodyL * 0.3)], size: [1, dorsalH, dorsalL], mat: 'fin', rotation: [-25, 0, 0], pivot: [0, top, Math.round(zf + bodyL * 0.3)] },
        { origin: [-0.5, top, Math.round(zf + bodyL * 0.8)], size: [1, Math.max(1, Math.round(dorsalH / 3)), 2], mat: 'fin' },
      ],
    },
    { name: 'fin_l', parent: 'body', pivot: [half(bodyW), bottom + 1, zf + 2], rotation: [0, -20, -30], cubes: [{ origin: [half(bodyW), bottom + 1, zf + 2], size: [pectoral, 0, Math.ceil(pectoral * 0.6)], mat: 'fin' }] },
    { name: 'fin_r', parent: 'body', pivot: [-half(bodyW), bottom + 1, zf + 2], rotation: [0, 20, 30], cubes: [{ origin: [-half(bodyW) - pectoral, bottom + 1, zf + 2], size: [pectoral, 0, Math.ceil(pectoral * 0.6)], mat: 'fin' }] },
  ];
  return { bones, at: { bottom, top, cy, zf, zb, tz, hy, headL, headH } };
}

/**
 * Rays: a flat body with a broad wing on each side that flaps up and down, two cephalic
 * horns in front and a thin tail. Bones: root, body, wing_l, wing_r, horn_l, horn_r, tail.
 * Materials: back, wing, belly (underside layer), horn, tail.
 */
export function rayBody({ bodyW = 10, bodyH = 3, bodyL = 12, wing = 14, wingL = 9, hornL = 3, tailL = 10, lift = 2 } = {}) {
  const bottom = lift;
  const cy = bottom + bodyH / 2;
  const zf = -bodyL / 2, zb = bodyL / 2;
  const wingZ = zf + 1;
  const steps = [[wing * 0.5, wingL], [wing * 0.3, Math.round(wingL * 0.7)], [wing * 0.2, Math.round(wingL * 0.4)]];
  const wingCubes = (side) => {
    let x = 0;
    return steps.map(([w, l], i) => {
      const width = Math.max(1, Math.round(w));
      const cube = {
        origin: [side > 0 ? half(bodyW) + x : -half(bodyW) - x - width, bottom + (i ? 1 : 0), wingZ + (wingL - l)],
        size: [width, i ? 1 : 2, l], mat: 'wing', noHit: true,
      };
      x += width;
      return cube;
    });
  };
  const bones = [
    { name: 'root', pivot: [0, cy, 0] },
    { name: 'body', parent: 'root', pivot: [0, cy, 0], cubes: [{ origin: [-half(bodyW), bottom, zf], size: [bodyW, bodyH, bodyL], mat: 'back', marks: eyes(bodyL, { back: 1, down: 1 }) }] },
    { name: 'wing_l', parent: 'body', pivot: [half(bodyW), cy, 0], cubes: wingCubes(1) },
    { name: 'wing_r', parent: 'body', pivot: [-half(bodyW), cy, 0], cubes: wingCubes(-1) },
    { name: 'horn_l', parent: 'body', pivot: [half(bodyW) - 1, cy, zf], cubes: [{ origin: [half(bodyW) - 2, bottom, zf - hornL], size: [2, bodyH - 1, hornL], mat: 'horn' }] },
    { name: 'horn_r', parent: 'body', pivot: [-half(bodyW) + 1, cy, zf], cubes: [{ origin: [-half(bodyW), bottom, zf - hornL], size: [2, bodyH - 1, hornL], mat: 'horn' }] },
    { name: 'tail', parent: 'body', pivot: [0, cy, zb], cubes: [{ origin: [-0.5, cy - 0.5, zb], size: [1, 1, tailL], mat: 'tail' }] },
  ];
  return { bones, at: { bottom, cy, zf, zb } };
}

/**
 * Whales, dolphins and porpoises: a long body, a head (blunt, beaked or box-shaped) with an
 * optional lower jaw, a tapering tail stock ending in horizontal flukes, two flippers and a
 * dorsal fin or hump. Bones: root, body, head, jaw (optional), tail, fluke, flipper_l,
 * flipper_r, dorsal_fin (optional), tusk (optional, narwhal).
 * Materials: skin, belly (underside layer), head, fin, mouth (jaw), eye (marks).
 */
export function cetaceanBody({
  bodyW = 8, bodyH = 8, bodyL = 20, headW = 7, headH = 7, headL = 8, beak = 0, beakW = 3, beakH = 2, jaw = false,
  tailW = 4, tailH = 4, tailL = 10, flukeW = 14, flukeL = 4, flipper = 6, flipperW = 2, flipperAngle = 40,
  dorsalH = 3, dorsalL = 4, dorsalAt = 0.55, lift = 1, tusk = 0, eye = {},
} = {}) {
  const bottom = lift;
  const top = bottom + bodyH;
  const cy = bottom + bodyH / 2;
  const zf = -bodyL / 2, zb = bodyL / 2;
  const hy = bottom + Math.round((bodyH - headH) / 3);
  const tz = zb + tailL;
  const hz = zf - headL;
  const bones = [
    { name: 'root', pivot: [0, cy, 0] },
    { name: 'body', parent: 'root', pivot: [0, cy, 0], cubes: [{ origin: [-half(bodyW), bottom, zf], size: [bodyW, bodyH, bodyL], mat: 'skin' }] },
    {
      name: 'head', parent: 'body', pivot: [0, cy, zf],
      cubes: [
        { origin: [-half(headW), hy + (jaw ? 1 : 0), hz], size: [headW, headH - (jaw ? 1 : 0), headL], mat: 'head', marks: eyes(headL, { back: 2, down: Math.max(1, headH - 3 - (jaw ? 1 : 0)), ...eye }) },
        ...(beak ? [{ origin: [-half(beakW), hy + (jaw ? 1 : 0), hz - beak], size: [beakW, beakH, beak], mat: 'head' }] : []),
      ],
    },
    ...(jaw ? [{
      name: 'jaw', parent: 'head', pivot: [0, hy + 1, zf],
      cubes: [{ origin: [-half(headW - 2), hy, hz + 1], size: [headW - 2, 1, headL - 1], mat: 'mouth' }],
    }] : []),
    ...(tusk ? [{
      name: 'tusk', parent: 'head', pivot: [0, hy + headH - 2, hz],
      cubes: [{ origin: [0.5, hy + headH - 3, hz - tusk], size: [1, 1, tusk], mat: 'tusk' }],
    }] : []),
    { name: 'tail', parent: 'body', pivot: [0, cy, zb], cubes: [{ origin: [-half(tailW), Math.round(cy - tailH / 2), zb], size: [tailW, tailH, tailL], mat: 'skin' }] },
    {
      name: 'fluke', parent: 'tail', pivot: [0, cy, tz],
      cubes: [
        { origin: [-half(flukeW), Math.round(cy) - 0.5, tz - 1], size: [flukeW, 1, flukeL], mat: 'fin', rotation: [0, 0, 0] },
      ],
    },
    { name: 'flipper_l', parent: 'body', pivot: [half(bodyW), bottom + 1, zf + 2], rotation: [0, -30, -flipperAngle], cubes: [{ origin: [half(bodyW), bottom + 1, zf + 2], size: [flipper, 1, flipperW], mat: 'fin' }] },
    { name: 'flipper_r', parent: 'body', pivot: [-half(bodyW), bottom + 1, zf + 2], rotation: [0, 30, flipperAngle], cubes: [{ origin: [-half(bodyW) - flipper, bottom + 1, zf + 2], size: [flipper, 1, flipperW], mat: 'fin' }] },
    ...(dorsalH ? [{
      name: 'dorsal_fin', parent: 'body', pivot: [0, top, Math.round(zf + bodyL * dorsalAt)],
      cubes: [{ origin: [-0.5, top, Math.round(zf + bodyL * dorsalAt)], size: [1, dorsalH, dorsalL], mat: 'fin', rotation: [-25, 0, 0], pivot: [0, top, Math.round(zf + bodyL * dorsalAt)] }],
    }] : []),
  ];
  return { bones, at: { bottom, top, cy, zf, zb, tz, hz, hy, headH } };
}

/**
 * Seals and walruses: a plump torpedo body, a rounded head with a snout and whiskers, front
 * flippers under the chest and hind flippers pointing backwards. On land they lie on their
 * bellies. Bones: root, body, neck, head, flipper_fl, flipper_fr, flipper_bl, flipper_br,
 * tusks (optional).
 * Materials: fur, belly (layer), head, snout, flipper, tusk.
 */
export function pinnipedBody({
  bodyW = 8, bodyH = 7, bodyL = 18, neckW = 6, neckH = 6, neckL = 3, headW = 5, headH = 5, headL = 5,
  snoutW = 3, snoutH = 2, snoutL = 2, front = 4, hind = 5, tusks = 0,
} = {}) {
  const bottom = 0;
  const top = bottom + bodyH;
  const cy = bottom + bodyH / 2;
  const zf = -bodyL / 2, zb = bodyL / 2;
  // The neck is level with the top of the back and tilted up a little, so the head is held high.
  const ny = top - neckH;
  const nz = zf - neckL;
  const hy = ny + neckH - headH + 1;
  const hz = nz - headL + 1;
  const whiskers = [
    { face: 'front', x: 0, y: 1, color: '#d9d2c3' }, { face: 'front', x: snoutW - 1, y: 1, color: '#d9d2c3' },
  ];
  const bones = [
    { name: 'root', pivot: [0, cy, 0] },
    { name: 'body', parent: 'root', pivot: [0, cy, 0], cubes: [
      { origin: [-half(bodyW), bottom, zf], size: [bodyW, bodyH, bodyL], mat: 'fur' },
      { origin: [-half(bodyW - 2), bottom, zb], size: [bodyW - 2, bodyH - 2, 3], mat: 'fur' },
    ] },
    { name: 'neck', parent: 'body', pivot: [0, ny + neckH / 2, zf], rotation: [-15, 0, 0], cubes: [{ origin: [-half(neckW), ny, nz], size: [neckW, neckH, neckL], mat: 'fur' }] },
    {
      name: 'head', parent: 'neck', pivot: [0, hy + 1, nz + 1],
      cubes: [
        { origin: [-half(headW), hy, hz], size: [headW, headH, headL], mat: 'head', marks: [...eyes(headL, { back: 1, down: 1, w: 1, h: 1 })] },
        { origin: [-half(snoutW), hy, hz - snoutL], size: [snoutW, snoutH, snoutL], mat: 'snout', marks: [{ face: 'front', x: Math.floor(snoutW / 2) - 1, y: 0, w: snoutW % 2 ? 1 : 2, color: '#1b1b1b' }, ...whiskers] },
      ],
    },
    ...(tusks ? [{
      name: 'tusks', parent: 'head', pivot: [0, hy, hz - snoutL],
      cubes: [
        { origin: [-half(snoutW), hy - tusks, hz - snoutL + 1], size: [1, tusks, 1], mat: 'tusk' },
        { origin: [half(snoutW) - 1, hy - tusks, hz - snoutL + 1], size: [1, tusks, 1], mat: 'tusk' },
      ],
    }] : []),
    { name: 'flipper_fl', parent: 'body', pivot: [half(bodyW), bottom + 1, zf + 3], rotation: [0, -30, 0], cubes: [{ origin: [half(bodyW) - 1, bottom, zf + 2], size: [front, 1, 3], mat: 'flipper' }] },
    { name: 'flipper_fr', parent: 'body', pivot: [-half(bodyW), bottom + 1, zf + 3], rotation: [0, 30, 0], cubes: [{ origin: [-half(bodyW) - front + 1, bottom, zf + 2], size: [front, 1, 3], mat: 'flipper' }] },
    { name: 'flipper_bl', parent: 'body', pivot: [1, bottom + 1, zb + 3], rotation: [0, -15, 0], cubes: [{ origin: [0, bottom, zb + 3], size: [3, 1, hind], mat: 'flipper' }] },
    { name: 'flipper_br', parent: 'body', pivot: [-1, bottom + 1, zb + 3], rotation: [0, 15, 0], cubes: [{ origin: [-3, bottom, zb + 3], size: [3, 1, hind], mat: 'flipper' }] },
  ];
  return { bones, at: { bottom, top, cy, zf, zb, hy, hz, nz } };
}

/**
 * Penguins: an upright body with a white front, a head with a beak, two stiff flippers and
 * webbed feet. In the water (and when sliding on their bellies) the animations tip the
 * root forward to lie flat. Bones: root, body, head, beak, flipper_l, flipper_r, foot_l,
 * foot_r, tail. Materials: back, front, head, beak, flipper, foot, cheek.
 */
export function penguinBody({ bodyW = 6, bodyH = 10, bodyD = 5, headW = 4, headH = 4, headD = 4, beak = 2, flipper = 7, legH = 1 } = {}) {
  const bottom = legH;
  const top = bottom + bodyH;
  const cy = bottom + bodyH / 2;
  const zf = -half(bodyD);
  const hz = -half(headD) - 0.5;
  const bones = [
    { name: 'root', pivot: [0, cy, 0] },
    { name: 'body', parent: 'root', pivot: [0, bottom, 0], cubes: [
      { origin: [-half(bodyW), bottom, zf], size: [bodyW, bodyH, bodyD], mat: 'back' },
      { origin: [-half(bodyW - 2), bottom + 1, zf - 1], size: [bodyW - 2, bodyH - 2, 1], mat: 'front' },
    ] },
    { name: 'head', parent: 'body', pivot: [0, top, 0], cubes: [{ origin: [-half(headW), top, hz], size: [headW, headH, headD], mat: 'head', marks: eyes(headD, { back: 1, down: 1 }) }] },
    { name: 'beak', parent: 'head', pivot: [0, top + 1, hz], cubes: [{ origin: [-0.5, top + 1, hz - beak], size: [1, 1, beak], mat: 'beak' }] },
    { name: 'flipper_l', parent: 'body', pivot: [half(bodyW), top - 1, 0], rotation: [0, 0, -8], cubes: [{ origin: [half(bodyW), top - 1 - flipper, -1.5], size: [1, flipper, 3], mat: 'flipper' }] },
    { name: 'flipper_r', parent: 'body', pivot: [-half(bodyW), top - 1, 0], rotation: [0, 0, 8], cubes: [{ origin: [-half(bodyW) - 1, top - 1 - flipper, -1.5], size: [1, flipper, 3], mat: 'flipper' }] },
    { name: 'foot_l', parent: 'root', pivot: [1.5, bottom, 0], cubes: [{ origin: [0.5, 0, zf - 1], size: [2, legH, 3], mat: 'foot' }] },
    { name: 'foot_r', parent: 'root', pivot: [-1.5, bottom, 0], cubes: [{ origin: [-2.5, 0, zf - 1], size: [2, legH, 3], mat: 'foot' }] },
    { name: 'tail', parent: 'body', pivot: [0, bottom + 1, -zf], cubes: [{ origin: [-1, bottom, -zf], size: [2, 1, 2], mat: 'back' }] },
  ];
  return { bones, at: { bottom, top, cy, zf, hz } };
}
