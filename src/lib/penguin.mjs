// Shared spec for the three penguins; each species changes size, colours and habits.
import { penguin } from './anim.mjs';
import { penguinBody } from './bodies.mjs';
import { PENGUIN_SOUNDS } from './skins.mjs';
import { fur, gradient, region } from './texture.mjs';

export function penguinSpec({ id, name, body: dims, size, health, swimSpeed, colors, spawn, extra = {}, sounds = {} }) {
  const body = penguinBody(dims);
  const { at } = body;
  const flat = Math.round((at.cy - (dims.bodyD ?? 5) / 2) * 10) / 10;
  // Ear patch: on the sides of the head (and down the neck for emperors and kings).
  const ear = ({ face: f, p }) => (f === 'left' || f === 'right') && p[1] < at.top + 3 && p[2] > at.hz + 1;
  return {
    id,
    name,
    group: 'penguin',
    role: 'prey',
    family: ['penguin'],
    size,
    health,
    speed: 0.1,
    movement: 'penguin',
    swimSpeed,
    breath: 600,
    sleeps: 'night',
    xp: 2,
    attack: { damage: 1, speed: 1.2 },
    hunts: ['small_fish'],
    huntInterval: 90,
    breed: ['aquatic:herring', 'cod'],
    tempt: ['aquatic:herring', 'cod'],
    properties: { 'aquatic:sliding': { type: 'bool', default: false, client_sync: true } },
    spawn,
    loot: [],
    sounds: { ...PENGUIN_SOUNDS, ...sounds },
    egg: [colors.back, colors.ear],
    model: { bones: body.bones },
    materials: {
      back: { base: colors.back, layers: [fur(0.04)] },
      front: { base: colors.front, layers: [gradient(colors.chest ?? colors.front, { axis: 1, from: at.top - 4, to: at.top - 1 }), fur(0.03)] },
      head: { base: colors.back, layers: [region(colors.ear, ear), ...(colors.brow ? [region(colors.brow, ({ face: f, p }) => f === 'top' && p[2] > at.hz + 1)] : [])] },
      beak: { base: colors.beak, layers: [region(colors.beakStripe ?? colors.beak, ({ face: f }) => f === 'left' || f === 'right')] },
      flipper: { base: colors.back, layers: [region(colors.front, ({ face: f }) => f === 'left' || f === 'right' ? false : f === 'bottom')] },
      foot: colors.foot,
    },
    anims: penguin({ flat }),
    ...extra,
  };
}
