# Real Device Visual QA

## Test Matrix

| Device | OS | Browser | Viewport | Install Type | Date | Result |
|---|---|---|---|---|---|---|
| Codex static review | Windows sandbox | Static file inspection | N/A | N/A | 2026-05-18 | Passed structural checks; no rendered-device proof |
| Codex in-app browser | Windows sandbox | Browser plugin | Intended 390x844 | GitHub Pages URL | 2026-05-18 | Blocked by browser URL policy before screenshot capture |
| Android phone | TBD | Chrome | 390x844 or similar | Browser / Installed PWA | TBD | Pending real-device test |
| iPhone | TBD | Safari | 390x844 or similar | Browser / Home Screen | TBD | Pending real-device test |

## Visual Issues

| ID | Severity | Screen | Symptom | Fix | Status |
|---|---|---|---|---|---|
| VQA-001 | P2 | QA environment | In-app browser could not capture the deployed GitHub Pages page due to a browser URL policy block, so this pass cannot honestly claim real-device visual confirmation. | Recorded limitation and added regression checks for existing safe-zone, HUD, banner, and debug-overlay structures. | Documented |
| VQA-002 | P3 | Gameplay | No confirmed overlap issue was observed from a rendered mobile screen in this environment. | No speculative layout or scale changes made. Real phone screenshots should drive the next micro-fix. | Deferred |

## Screens Checked

- Title / Menu: pending real-device visual confirmation.
- Tutorial: pending real-device visual confirmation.
- Stage Select: pending real-device visual confirmation.
- Gameplay: pending real-device visual confirmation.
- Result: pending real-device visual confirmation.
- Settings: pending real-device visual confirmation.
- Debug overlays: static code confirms `debugTouch`, `debugPerf`, and `debugStorage` paths exist; rendered confirmation is pending.

## Static Checks Completed

- `src/main.js` keeps `UI_SAFE_ZONES` for problem banner, HUD, jump button, and rider focus areas.
- `src/main.js` keeps `getProblemBannerLayout()` for mobile-scaled problem banner sizing.
- `src/main.js` keeps `createCompactHud()` and `updateCompactHud()` for compact HUD rendering.
- Debug overlays remain opt-in through `?debugTouch=1`, `?debugPerf=1`, and `?debugStorage=1`.
- Multiplication and division remain disabled by default through `OPS_DEFAULT`.
- `sw.js` is currently on `math-downhill-racer-v7`, matching the TASK_015 visual balance deployment.

## Manual Phone Checklist

Use the deployed URL:

```text
https://donghyun1park-web.github.io/math-downhill-racer/
```

Confirm these items on Android Chrome and iPhone Safari:

- Title screen fits inside the portrait viewport.
- START / TUTORIAL RIDE / SETTINGS buttons are visible and easy to tap.
- Gameplay first impression reads as MTB downhill.
- Rider, bike wheels, handlebar, and helmet remain visible.
- Problem banner and answer gates are readable.
- HUD and JUMP button do not cover the rider or answer gates.
- Decorative objects do not cover the problem, gates, rider, or HUD.
- Result and settings screens avoid the bottom safe area.
- `?debugTouch=1`, `?debugPerf=1`, and `?debugStorage=1` show overlays only when requested.
- Normal URL shows no debug overlay.

## Next Real-Device Fix Inputs

For each phone issue, capture:

- Device and browser.
- Exact URL, including debug query if used.
- Screen name.
- Short symptom.
- Screenshot if possible.
- Whether Low Effects Mode was ON or OFF.
