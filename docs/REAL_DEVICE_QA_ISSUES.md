# Real Device QA Issues

Use this file to record only issues observed on real Android Chrome or iPhone Safari devices. Avoid speculative fixes; capture the device, steps, severity, and result first.

## Device Matrix

| ID | Device | OS | Browser | Install Type | Tester | Date |
|---|---|---|---|---|---|---|
| A1 | Android phone | Android xx | Chrome xx | Browser / Installed PWA |  |  |
| I1 | iPhone | iOS xx | Safari xx | Browser / Home Screen |  |  |

## Issue Log

| ID | Device ID | Severity | Area | Symptom | Steps to Reproduce | Expected | Actual | Status | Fix |
|---|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  | Open / Fixed / Deferred |  |

## Severity

- P0: Game cannot launch.
- P1: Core play is blocked.
- P2: Play is possible but meaningfully uncomfortable.
- P3: Visual, copy, or minor polish.

## Required Android Chrome Pass

- URL opens and title screen appears.
- PWA install prompt or Add to Home screen is available.
- Installed app launches.
- First-run tutorial appears.
- Stage 1 starts.
- Left/right touch movement works.
- Left/right hold plus JUMP works.
- Correct gate pass works.
- Boost sound plays after user input.
- Haptic feedback works when enabled.
- Sound Effects OFF prevents sound.
- Haptic Feedback OFF prevents vibration.
- Low Effects Mode visibly reduces effects.
- `?debugPerf=1` shows FPS.
- Offline relaunch shows the game screen.

## Required iPhone Safari Pass

- Safari opens the game URL.
- Share -> Add to Home Screen works.
- Home screen icon launches.
- Safe area does not clip the title, HUD, or JUMP button.
- JUMP button stays above the home indicator.
- Safari address bar height changes do not break layout.
- Sound plays after first user input.
- Unsupported vibration fails quietly.
- Offline relaunch shows the game screen.
- Settings remain saved after relaunch.

## Fix Priority

### P0 Fix Immediately

- First screen does not appear.
- Phaser fails to load.
- Service worker serves stale or broken files.
- Installed PWA opens to a blank screen.
- Fatal JavaScript error blocks launch.

### P1 Fix Immediately

- START or Stage button does not respond.
- Left/right movement does not work.
- JUMP does not work.
- Correct gate cannot be resolved.
- Settings do not save.
- Offline launch fails.

### P2 Fix If Feasible In This Task

- Touch latency is high.
- JUMP button is too small or intersects the home indicator.
- iPhone bottom UI is clipped.
- Sound unlock is unreliable.
- FPS is low.
- Low Effects Mode is not strong enough.

### P3 Record Or Defer

- Button color preference.
- Tiny logo size adjustment.
- Copy improvements.
- Requests for richer effects.

## Known Risk Checks

### Service Worker Cache

Symptom: a device keeps showing an older build.

Check:

- `CACHE_NAME` was bumped.
- `activate` deletes old cache names.
- `index.html`, `src/main.js`, `src/game.css`, `vendor/phaser.min.js`, and runtime assets are in cache.

### iPhone Safe Area

Symptom: JUMP or HUD is hidden by the home indicator.

Check:

- CSS uses `env(safe-area-inset-bottom)`.
- Phaser bottom UI has enough bottom offset.
- Resize events redraw HUD and button positions.

### Sound Unlock

Symptom: Test Sound works but gameplay sound does not.

Check:

- First `pointerdown` calls unlock.
- START/STAGE/JUMP input paths call unlock.
- AudioContext state is not suspended after user input.

### Touch State

Symptom: moving continues after finger release, or JUMP fails while holding direction.

Check:

- pointerId is removed from all active touch sets.
- `pointercancel`, `pointerout`, and input mode changes clear active touches.
- Settings/result screens disable race input.

### FPS

Symptom: boost or snow causes stutter.

Check:

- Low Effects Mode reduces snow, props, speed lines, sparks, and shake.
- `update()` does not create new display objects every frame.
- `localStorage` is not read/written every frame.
