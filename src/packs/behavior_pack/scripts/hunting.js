// Realistic Hunting support: when the hunting add-on is installed, every fish and shark is
// game (seals, whales and penguins are protected). This sends each profile (game data and
// hit model, generated into hunting_targets.js) on world load and whenever the hunting add-on asks for them; the
// entity side (aquatic:hunt_state, the carcass events) is in the entity files.
import { system } from '@minecraft/server';
import { chunks, HELLO, REGISTER } from './hunting_protocol.js';
import { PROFILES } from './hunting_targets.js';

function sendProfiles() {
  system.runJob((function* () {
    for (const profile of PROFILES) {
      for (const message of chunks(profile)) {
        try {
          system.sendScriptEvent(REGISTER, message);
        } catch {
          return;
        }
        yield;
      }
    }
  })());
}

export function setupHunting() {
  system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id === HELLO) sendProfiles();
  });
  sendProfiles();
}
