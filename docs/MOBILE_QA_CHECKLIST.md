# Mobile QA Checklist

## Android Chrome

- First-run tutorial appears.
- Left/right touch movement works.
- JUMP button works.
- Left/right hold plus JUMP with a second finger works.
- Correct gate pass gives boost feedback.
- Boost sound and vibration fire after first touch when enabled.
- Settings changes save immediately.
- PWA install prompt or install flow works where supported.

## iPhone Safari

- Safe area does not hide the title, settings, HUD, or JUMP button.
- Bottom JUMP button stays above the home indicator.
- Sound unlock happens after START, TUTORIAL RIDE, stage selection, screen touch, keyboard input, settings, or JUMP.
- Haptic feedback is a safe no-op when vibration is unsupported.
- Address bar height changes do not make buttons unreachable.

## 390x844 Portrait

- Title screen fits without clipping.
- Tutorial intro fits and SKIP is easy to tap.
- Stage selection shows Stage 1 clearly.
- Play screen problem banner and answer gates are readable.
- Result screen is not blocked by race input controls.
- Settings panel scrolls if vertical space is tight.

## 360x780 Portrait

- START / TUTORIAL RIDE / SETTINGS remain tappable.
- JUMP remains at least 72px and visually distinct.
- Problem banner and gate answers remain legible.
- Settings labels and reset button remain inside the panel.

## 430x932 Portrait

- Title art remains centered.
- HUD stays anchored at the bottom.
- Touch zones still match the visible left/right/JUMP layout.
- Debug overlay stays readable when enabled.

## Math Settings

- Addition and subtraction are ON by default.
- Multiplication and division are OFF by default.
- Multiplication/division appear only after the user turns them ON.
- Learning record reset does not delete stage progress.

## Debug Touch Overlay

- Open with `?debugTouch=1`.
- Confirm LEFT, RIGHT, and JUMP zones match the intended touch areas.
- Confirm active pointer counts update during multi-touch.
- Confirm the overlay is absent during normal entry.
