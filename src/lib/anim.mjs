// Keyframed animation templates. Everything is plain keyframes (no Molang), so the same
// files work in Bedrock and in GeckoLib on Java.
//
// Rotation convention (Bedrock): +x pitches a bone's front (-z) downwards and swings a
// hanging limb backwards; +y turns it to the animal's left; +z rolls towards its right.

const r = (n) => Math.round(n * 100) / 100;
const TAU = Math.PI * 2;

/** Sample f(phase in [0,1)) into n keyframes over `length` seconds (looping). */
function cycle(length, n, f) {
  const out = {};
  for (let k = 0; k <= n; k++) {
    const t = (k / n) * length;
    out[r(t).toFixed(2)] = f((k % n) / n).map(r);
  }
  return out;
}

const sin = (phase, offset = 0) => Math.sin((phase + offset) * TAU);

/** Merge bone channels (later wins per channel). */
function bones(...parts) {
  const out = {};
  for (const p of parts) {
    for (const [bone, channels] of Object.entries(p)) {
      if (!bone || bone === 'undefined') continue;
      out[bone] = { ...(out[bone] ?? {}), ...channels };
    }
  }
  return out;
}

const loop = (length, b) => ({ loop: true, animation_length: length, bones: b });
const once = (length, b) => ({ animation_length: length, bones: b });
const hold = (b) => ({ loop: true, bones: b });

/** Lying still on its side (seals, whales, penguins): used for nothing but kept for completeness. */
export function deadPose(model) {
  let w = 1;
  for (const b of model.bones) for (const c of b.cubes ?? []) w = Math.max(w, Math.abs(c.origin[0]), Math.abs(c.origin[0] + c.size[0]));
  return { loop: 'hold_on_last_frame', animation_length: 0.5, bones: { root: {
    rotation: { '0.0': [0, 0, 0], '0.5': [0, 0, 90] },
    position: { '0.0': [0, 0, 0], '0.5': [0, Math.round(w * 0.8 * 10) / 10, 0] },
  } } };
}

export function animationFile(id, anims) {
  const out = {};
  for (const [name, a] of Object.entries(anims)) out[`animation.aquatic.${id}.${name}`] = a;
  return { format_version: '1.8.0', animations: out };
}

/** A fish stranded on land: lying on its side, bouncing and slapping its tail. */
function flop(o, len = 0.5) {
  const root = o.root ?? 'root', tail = o.tail ?? 'tail', lie = o.lie ?? 90;
  return loop(len, bones(
    { [root]: { rotation: cycle(len, 8, (p) => [0, 0, lie + 12 * sin(p)]), position: cycle(len, 8, (p) => [0, 1.5 * Math.abs(sin(p)) + (o.lift ?? 1), 0]) } },
    { [tail]: { rotation: cycle(len, 8, (p) => [0, 35 * sin(p, 0.25), 0]) } },
  ));
}

/**
 * Fish: side-to-side tail beat; the caudal fin and the body follow a little, pectoral fins
 * paddle. Also an attack lunge (with a jaw snap), belly-up `dead` (Realistic Hunting) and
 * `flop` for a fish out of water.
 */
export function fish(o = {}) {
  const body = o.body ?? 'body', tail = o.tail ?? 'tail', jaw = o.jaw, root = o.root ?? 'root';
  const caudal = 'caudal' in o ? o.caudal : 'caudal_fin', fins = o.fins ?? ['fin_l', 'fin_r'];
  const n = 8;
  const beat = (len, amp) => bones(
    { [tail]: { rotation: cycle(len, n, (p) => [0, amp * sin(p), 0]) } },
    caudal ? { [caudal]: { rotation: cycle(len, n, (p) => [0, amp * 0.6 * sin(p, -0.15), 0]) } } : {},
    { [body]: { rotation: cycle(len, n, (p) => [0, amp * 0.25 * sin(p, 0.5), 0]) } },
    Object.fromEntries(fins.map((f, i) => [f, { rotation: cycle(len, n, (p) => [0, (i % 2 ? -1 : 1) * amp * 0.5 * sin(p, 0.25), 0]) }])),
  );
  const swimLength = o.swimLength ?? 0.6;
  return {
    swim: loop(swimLength, beat(swimLength, o.amp ?? 25)),
    idle: loop(swimLength * 2.6, beat(swimLength * 2.6, (o.amp ?? 25) * 0.4)),
    dead: hold({ [root]: { rotation: [0, 0, 180], position: [0, o.deadLift ?? 2, 0] } }),
    flop: flop({ root, tail, lift: o.flopLift }),
    attack: once(0.4, bones(
      { [body]: { position: { '0.0': [0, 0, 0], '0.15': [0, 0, -2], '0.4': [0, 0, 0] } } },
      jaw ? { [jaw]: { rotation: { '0.0': [0, 0, 0], '0.1': [30, 0, 0], '0.25': [0, 0, 0], '0.4': [0, 0, 0] } } } : {},
    )),
  };
}

/** Flatfish (plaice) lie on the bottom and swim with a wave along their flat body. */
export function flatfish(o = {}) {
  const body = o.body ?? 'body', tail = o.tail ?? 'tail', root = o.root ?? 'root';
  const wave = (len, amp) => bones(
    { [body]: { rotation: cycle(len, 8, (p) => [amp * 0.3 * sin(p), 0, 0]) } },
    { [tail]: { rotation: cycle(len, 8, (p) => [amp * sin(p, -0.2), 0, 0]) } },
  );
  return {
    swim: loop(0.8, wave(0.8, 20)),
    idle: loop(3, wave(3, 3)),
    dead: hold({ [root]: { rotation: [0, 0, 180], position: [0, 2, 0] } }),
    flop: loop(0.5, bones(
      { [root]: { position: cycle(0.5, 8, (p) => [0, 1.5 * Math.abs(sin(p)), 0]) } },
      { [tail]: { rotation: cycle(0.5, 8, (p) => [35 * sin(p), 0, 0]) } },
    )),
  };
}

/** Rays: the wings beat up and down like a bird's in slow motion. */
export function ray(o = {}) {
  const wl = o.wingL ?? 'wing_l', wr = o.wingR ?? 'wing_r', body = o.body ?? 'body', tail = o.tail ?? 'tail', root = o.root ?? 'root';
  const flap = (len, amp) => bones(
    { [wl]: { rotation: cycle(len, 8, (p) => [0, 0, -amp * sin(p)]) } },
    { [wr]: { rotation: cycle(len, 8, (p) => [0, 0, amp * sin(p)]) } },
    { [body]: { position: cycle(len, 8, (p) => [0, -amp * 0.04 * sin(p), 0]) } },
    { [tail]: { rotation: cycle(len, 8, (p) => [4 * sin(p, 0.3), 6 * sin(p, 0.5), 0]) } },
  );
  return {
    swim: loop(o.swimLength ?? 2.2, flap(o.swimLength ?? 2.2, o.amp ?? 30)),
    idle: loop(4, flap(4, 12)),
    dead: hold({ [root]: { rotation: [0, 0, 180], position: [0, 3, 0] } }),
    flop: loop(0.8, bones(
      { [wl]: { rotation: cycle(0.8, 8, (p) => [0, 0, -20 * Math.abs(sin(p))]) } },
      { [wr]: { rotation: cycle(0.8, 8, (p) => [0, 0, 20 * Math.abs(sin(p))]) } },
    )),
  };
}

/** Long bodies made of a chain of segments (eels): a travelling wave. */
export function serpent(o) {
  const segs = o.segments; // head first
  const n = 8;
  const wave = (len, amp) => Object.fromEntries(segs.map((s, i) => [s, { rotation: cycle(len, n, (p) => [0, amp * sin(p, -i * 0.18), 0]) }]));
  return {
    swim: loop(1.2, wave(1.2, (o.amp ?? 18) * 1.4)),
    idle: loop(4, wave(4, 4)),
    walk: loop(1.4, wave(1.4, o.amp ?? 18)),
    flop: loop(0.9, wave(0.9, (o.amp ?? 18) * 2)),
    dead: hold({ [o.root ?? 'root']: { rotation: [0, 0, 180], position: [0, 2, 0] } }),
    attack: once(0.6, bones(
      { [segs[0]]: { rotation: { '0.0': [0, 0, 0], '0.15': [-25, 0, 0], '0.3': [15, 0, 0], '0.6': [0, 0, 0] }, position: { '0.0': [0, 0, 0], '0.2': [0, 1, -4], '0.6': [0, 0, 0] } } },
      o.jaw ? { [o.jaw]: { rotation: { '0.0': [0, 0, 0], '0.15': [40, 0, 0], '0.35': [0, 0, 0] } } } : {},
    )),
  };
}

/**
 * Whales, dolphins and porpoises: up-and-down strokes of the tail stock and flukes, the
 * flippers steer and the head nods a little. o.slow stretches everything for the giants.
 */
export function cetacean(o = {}) {
  const tail = o.tail ?? 'tail', fluke = o.fluke ?? 'fluke', body = o.body ?? 'body', head = o.head ?? 'head';
  const fl = 'flipper_l', fr = 'flipper_r';
  const k = o.slow ?? 1;
  const stroke = (len, amp) => bones(
    { [tail]: { rotation: cycle(len, 8, (p) => [amp * sin(p), 0, 0]) } },
    { [fluke]: { rotation: cycle(len, 8, (p) => [amp * 0.9 * sin(p, -0.15), 0, 0]) } },
    { [body]: { rotation: cycle(len, 8, (p) => [amp * 0.12 * sin(p, 0.5), 0, 0]) } },
    { [head]: { rotation: cycle(len, 8, (p) => [-amp * 0.1 * sin(p, 0.5), 0, 0]) } },
    { [fl]: { rotation: cycle(len, 8, (p) => [0, 0, amp * 0.3 * sin(p, 0.25)]) } },
    { [fr]: { rotation: cycle(len, 8, (p) => [0, 0, -amp * 0.3 * sin(p, 0.25)]) } },
  );
  return {
    swim: loop(1.0 * k, stroke(1.0 * k, o.amp ?? 20)),
    idle: loop(2.6 * k, stroke(2.6 * k, (o.amp ?? 20) * 0.35)),
    // Beached or in shallow water: slow, heavy tail slaps.
    walk: loop(1.6 * k, stroke(1.6 * k, (o.amp ?? 20) * 0.6)),
    ...(o.jaw ? { attack: once(0.6, bones(
      { [head]: { rotation: { '0.0': [0, 0, 0], '0.2': [-12, 0, 0], '0.4': [6, 0, 0], '0.6': [0, 0, 0] } } },
      { [o.jaw]: { rotation: { '0.0': [0, 0, 0], '0.2': [35, 0, 0], '0.4': [0, 0, 0] } } },
    )) } : {}),
  };
}

/**
 * Seals and walruses. On land they hump along on their bellies (the body rocks and the
 * front flippers push); in the water the hind flippers sweep side to side like a fish tail.
 */
export function pinniped(o = {}) {
  const body = o.body ?? 'body', neck = o.neck ?? 'neck', head = o.head ?? 'head';
  const ffl = 'flipper_fl', ffr = 'flipper_fr', fbl = 'flipper_bl', fbr = 'flipper_br';
  const hump = (len, amp) => bones(
    { [body]: { rotation: cycle(len, 8, (p) => [amp * 0.25 * sin(p), 0, 0]), position: cycle(len, 8, (p) => [0, amp * 0.06 * Math.max(0, sin(p)), 0]) } },
    { [neck]: { rotation: cycle(len, 8, (p) => [-amp * 0.3 * sin(p, 0.25), 0, 0]) } },
    { [ffl]: { rotation: cycle(len, 8, (p) => [amp * sin(p, 0.5), 0, 0]) } },
    { [ffr]: { rotation: cycle(len, 8, (p) => [amp * sin(p, 0.5), 0, 0]) } },
    { [fbl]: { rotation: cycle(len, 8, (p) => [-amp * 0.4 * sin(p), 0, 0]) } },
    { [fbr]: { rotation: cycle(len, 8, (p) => [-amp * 0.4 * sin(p), 0, 0]) } },
  );
  const sweep = (len, amp) => bones(
    { [body]: { rotation: cycle(len, 8, (p) => [0, amp * 0.15 * sin(p, 0.5), 0]) } },
    { [fbl]: { rotation: cycle(len, 8, (p) => [0, amp * sin(p), 0]) } },
    { [fbr]: { rotation: cycle(len, 8, (p) => [0, amp * sin(p), 0]) } },
    { [ffl]: { rotation: [0, -10, -10] } },
    { [ffr]: { rotation: [0, 10, 10] } },
    { [neck]: { rotation: cycle(len, 8, (p) => [0, -amp * 0.15 * sin(p, 0.5), 0]) } },
  );
  return {
    walk: loop(0.9, hump(0.9, 20)),
    run: loop(0.55, hump(0.55, 28)),
    swim: loop(0.8, sweep(0.8, o.amp ?? 30)),
    idle: loop(6, bones(
      { [head]: { rotation: cycle(6, 8, (p) => [4 * sin(p), 25 * sin(p, 0.2), 0]) } },
      { [neck]: { rotation: cycle(6, 8, (p) => [-15 + 5 * sin(p), 0, 0]) } },
      // The banana pose: head and hind flippers up.
      { [fbl]: { rotation: cycle(6, 8, (p) => [-15 - 10 * Math.max(0, sin(p)), 0, 0]) } },
      { [fbr]: { rotation: cycle(6, 8, (p) => [-15 - 10 * Math.max(0, sin(p)), 0, 0]) } },
    )),
    sleep: hold(bones(
      { [neck]: { rotation: [12, 20, 0] } },
      { [head]: { rotation: [10, 10, 0] } },
      { [ffl]: { rotation: [0, -30, 0] } },
      { [ffr]: { rotation: [0, 30, 0] } },
    )),
    sit: hold(bones(
      { [body]: { rotation: [-12, 0, 0] } },
      { [neck]: { rotation: [-40, 0, 0] } },
      { [head]: { rotation: [25, 0, 0] } },
      { [fbl]: { rotation: [-25, 0, 0] } },
      { [fbr]: { rotation: [-25, 0, 0] } },
    )),
    attack: once(0.6, bones(
      { [neck]: { rotation: { '0.0': [0, 0, 0], '0.2': [-35, 0, 0], '0.4': [25, 0, 0], '0.6': [0, 0, 0] } } },
    )),
  };
}

/**
 * Penguins: a waddle on land (rolling side to side on short feet); in the water and when
 * tobogganing on ice they tip forward to lie flat on their bellies.
 */
export function penguin(o) {
  const root = 'root', body = 'body', head = 'head', fl = 'flipper_l', fr = 'flipper_r', ll = 'foot_l', lr = 'foot_r';
  const flat = o.flat; // how far the root drops when lying flat
  const waddle = (len, amp) => bones(
    { [root]: { rotation: cycle(len, 8, (p) => [0, 0, amp * sin(p)]) } },
    { [ll]: { rotation: cycle(len, 8, (p) => [-amp * 1.5 * Math.max(0, sin(p)), 0, 0]) } },
    { [lr]: { rotation: cycle(len, 8, (p) => [-amp * 1.5 * Math.max(0, sin(p, 0.5)), 0, 0]) } },
    { [fl]: { rotation: cycle(len, 8, (p) => [0, 0, -7 - 5 * sin(p)]) } },
    { [fr]: { rotation: cycle(len, 8, (p) => [0, 0, 7 - 5 * sin(p)]) } },
  );
  const lying = { rotation: [90, 0, 0], position: [0, -flat, 0] };
  return {
    walk: loop(0.6, waddle(0.6, 9)),
    run: loop(0.4, waddle(0.4, 12)),
    swim: loop(0.7, bones(
      { [root]: lying },
      { [fl]: { rotation: cycle(0.7, 8, (p) => [0, 0, -35 - 45 * sin(p)]) } },
      { [fr]: { rotation: cycle(0.7, 8, (p) => [0, 0, 35 + 45 * sin(p)]) } },
      { [ll]: { rotation: [60, 0, 0], position: [0, 0, 1] } },
      { [lr]: { rotation: [60, 0, 0], position: [0, 0, 1] } },
      { [head]: { rotation: [-80, 0, 0] } },
    )),
    // Tobogganing: on the belly, pushing with the feet.
    slide: loop(0.8, bones(
      { [root]: { rotation: cycle(0.8, 8, (p) => [90, 0, 4 * sin(p)]), position: [0, -flat, 0] } },
      { [fl]: { rotation: [0, 0, -60] } },
      { [fr]: { rotation: [0, 0, 60] } },
      { [ll]: { rotation: cycle(0.8, 8, (p) => [50 + 20 * sin(p), 0, 0]) } },
      { [lr]: { rotation: cycle(0.8, 8, (p) => [50 + 20 * sin(p, 0.5), 0, 0]) } },
      { [head]: { rotation: [-75, 0, 0] } },
    )),
    idle: loop(5, bones(
      { [head]: { rotation: cycle(5, 8, (p) => [6 * Math.max(0, sin(p, 0.6)), 30 * sin(p), 0]) } },
      { [fl]: { rotation: cycle(5, 8, (p) => [0, 0, -6 * Math.max(0, sin(p * 2))]) } },
      { [fr]: { rotation: cycle(5, 8, (p) => [0, 0, 6 * Math.max(0, sin(p * 2))]) } },
    )),
    sleep: hold(bones(
      { [head]: { rotation: [35, 0, 0], position: [0, -1, 0] } },
      { [fl]: { rotation: [0, 0, 6] } },
      { [fr]: { rotation: [0, 0, -6] } },
    )),
    attack: once(0.5, bones(
      { [body]: { rotation: { '0.0': [0, 0, 0], '0.2': [-10, 0, 0], '0.35': [20, 0, 0], '0.5': [0, 0, 0] } } },
      { [head]: { rotation: { '0.0': [0, 0, 0], '0.2': [-15, 0, 0], '0.35': [30, 0, 0], '0.5': [0, 0, 0] } } },
    )),
  };
}
