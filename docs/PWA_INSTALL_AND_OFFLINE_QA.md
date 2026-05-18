# PWA Install And Offline QA

## Android Chrome

1. Open the local or deployed URL in Chrome.
2. Confirm the title screen renders.
3. Use the browser menu or install prompt to install the app.
4. Launch from the home screen icon.
5. Confirm it opens in standalone mode.
6. Turn on airplane mode or block network access.
7. Relaunch the installed app.
8. Confirm the first screen appears.
9. Start Stage 1 and confirm the game can enter play.

## iPhone Safari

1. Open the URL in Safari.
2. Tap Share.
3. Choose Add to Home Screen.
4. Launch from the home screen icon.
5. Confirm the page appears as an app-like standalone screen.
6. Disable network access or use airplane mode.
7. Relaunch and confirm the first screen appears.

## Confirm During Real Device QA

- First-run tutorial appears.
- START, TUTORIAL RIDE, and SETTINGS are tappable.
- Sound unlocks after the first user input.
- JUMP button stays above safe-area/home indicator.
- Left/right movement works while holding the phone normally.
- Left/right plus JUMP multi-touch works.
- Sound Effects OFF prevents test and gameplay sound.
- Haptic Feedback OFF prevents test and gameplay vibration.
- Low Effects Mode reduces visual density without changing math logic.
- Settings remain saved after relaunch.
- Learning records remain saved after relaunch.
- Stage unlock progress remains saved after relaunch.

## Debug URLs

- `?debugTouch=1`: shows LEFT, RIGHT, and JUMP touch zones.
- `?debugPerf=1`: shows FPS, frame delta, object count, input mode, asset mode, low effects mode, and service worker status.
- `?debugStorage=1`: shows tutorial state, unlocked stage, math settings, feedback settings, low effects mode, and learning answer count.

Debug flags can also be enabled with localStorage:

```js
localStorage.setItem('math-downhill-debug-touch', '1')
localStorage.setItem('math-downhill-debug-perf', '1')
localStorage.setItem('math-downhill-debug-storage', '1')
```

## Offline Notes

- Runtime cache intentionally includes game code, Phaser, PWA manifest, icons, and lightweight SVG assets.
- Concept PNG files are style references and are not required for offline play.
- After changing cached files, bump the service worker cache version and reload the installed app once online.
