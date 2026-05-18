# Graphics Skill Reference

This document is the standing visual reference for future graphics work on the Phaser 3 PWA math downhill game.

## 1.1 Visual North Star

This game should look like a downhill MTB racing game first, and a math learning game second.

이 게임은 수학 게임처럼 보이면 안 된다. MTB 다운힐 게임처럼 보이고, 수학 문제는 부스터를 얻는 레이스 장치처럼 보여야 한다.

The core visual sentence is:

```text
Do not put MTB on top of a math runner. Put math boost mechanics inside an MTB downhill game.
```

## 1.2 Phaser Sprite State System

The rider should be displayed primarily with Phaser Sprite/Image assets instead of Phaser Graphics. Graphics fallback is allowed, but the default visual target is asset-driven.

Rules:

- Rider visuals are controlled by gameplay state and texture changes.
- Texture changes must not change scoring, math correctness, collision rules, stage progress, learning stats, or tutorial logic.
- If a generated or SVG asset is missing, use the existing SVG or Graphics fallback.
- Keep rider state naming stable so future assets can be swapped without rewriting gameplay logic.

Required rider states:

```text
rider_normal
rider_lean_left
rider_lean_right
rider_boost
rider_jump
rider_land
rider_slide or rider_crash
```

State meanings:

- `rider_normal`: low, aggressive default downhill stance.
- `rider_lean_left`: visible lean for left cornering or left lane movement.
- `rider_lean_right`: visible lean for right cornering or right lane movement.
- `rider_boost`: lower tuck, visible back turbo, blue/orange flames, stronger speed lines.
- `rider_jump`: front wheel raised, balanced mid-air body position.
- `rider_land`: compressed landing posture after impact.
- `rider_slide` / `rider_crash`: sliding posture for ice, collision, or warning feedback without harsh game-over framing.

## 1.3 Rider Visual Identity Rules

The rider and bike must read as downhill MTB on a mobile portrait screen.

Required visual elements:

- full-face helmet
- reflective goggles
- wide handlebar
- thick front and rear tires
- visible front suspension fork
- full-suspension frame impression
- gloves
- knee pads
- aggressive downhill posture
- small fictional grill-turbo device on the rider's back

Screen size rule:

- In the actual gameplay screen, rider plus bike should occupy roughly 16-22% of screen height.
- If the rider looks like a small icon, the visual pass has failed.
- Both wheels and the handlebar must remain identifiable on a 390x844 mobile portrait viewport.

Prohibitions:

- Do not use real UCI logos.
- Do not copy real rider faces, uniforms, teams, or sponsor designs.
- Do not use specific bike, helmet, or apparel brand logos.

## 1.4 Pseudo-3D Perspective Track

The game should imply a 2.5D third-person rear downhill camera without adding a 3D engine.

Core rules:

- The rider is large and centered near the bottom of the screen.
- The track stretches upward into the distance as a trapezoid.
- Bottom track width is wide; top track width is narrow.
- Objects scale up as their y coordinate moves down the screen.
- Near objects move faster and exit through the side edges.

Example:

```js
const t = y / screenHeight;
const perspectiveScale = Phaser.Math.Linear(0.35, 1.25, t);
const trackWidth = Phaser.Math.Linear(topWidth, bottomWidth, t);
```

Apply perspective to:

- course tape
- pine trees
- rocks
- snow banks
- jump ramps
- gate frames
- tire tracks
- course arrows

## 1.5 MTB Course Object System

The track should look like an MTB race course, not a generic snow runner lane.

Required objects:

- course tape
- directional arrows
- jump ramp
- tire tracks
- snow bank
- pine trees
- rock obstacles
- ice patches
- banked curve hints
- course markers

Object categories:

Decorative objects:

- No collision.
- Used for MTB identity, depth, and speed.
- Examples: course tape, far trees, banners, tire tracks, banked curve hints.

Gameplay objects:

- Affect collision, route choice, jump reward, or math selection.
- Examples: rocks, ice patches, jump ramps, answer gates.

Course tape and jump ramps are the fastest way to make the game read as MTB downhill.

## 1.6 Parallax Background System

Use layered motion to make the downhill course feel fast.

Layer example:

```text
Layer 1: far mountains
Layer 2: mid forest
Layer 3: near trees and fences
Layer 4: track surface
Layer 5: snow particles and speed lines
Layer 6: gameplay gates and rider
```

Motion rules:

- Far mountains move slowly.
- Mid forest moves faster than mountains.
- Near trees, fences, and course tape move quickly.
- Track lines accelerate toward the player.
- During boost, foreground layers and speed lines intensify.

## 1.7 HUD Visual Priority Rule

The HUD must support the MTB fantasy, not bury it.

Target visual balance:

```text
MTB rider / track / speed feeling: 70%
Math gate / HUD: 30%
```

HUD rules:

- Speed, BOOST, TEMP, and COMBO must remain readable.
- HUD fails if it covers the rider or makes the course feel secondary.
- JUMP must be easy to hit, but it should not cover the main track read.
- The problem banner must be clear, but it should not dominate the full screen.

## 1.8 Math Gate Integration Rule

Math gates should feel like course devices inside a downhill race.

Rules:

- Show the problem as a banner or checkpoint sign over the forward course.
- Answer gates should read like left/right route choices, not separate quiz panels.
- Correct/wrong color feedback must always follow live problem logic.
- Do not copy incorrect answer colors or gate positions from concept images.
- Answer position can be randomized, but collision and reward must use the real answer.

## 1.9 Generated Image Asset Pipeline

Generated images can become production assets when used as parts, not as entire static game screens.

Recommended pipeline:

1. Generate rider states or background layers with image-2 or an equivalent approved image tool.
2. Clean transparent-background assets when needed.
3. Save assets under `assets/sprites/generated` or `assets/backgrounds/generated`.
4. Compress files before runtime use.
5. Load assets in Phaser preload.
6. Prefer generated assets when present; fall back to SVG or Graphics when absent.
7. Add only runtime-required assets to `sw.js`.

Prohibitions:

- Do not use a generated full gameplay screenshot as a fixed game background.
- Do not replace dynamic UI text with text baked into images.
- Do not cache large PNG files without a clear runtime need.

## 1.10 Mobile Performance Budget

Mobile portrait play is the target. Visual richness must stay within a small-device budget.

Rules:

- Do not read or write `localStorage` every frame.
- Do not query the DOM every frame.
- Do not create many new Graphics objects every frame.
- Reuse SVG/PNG Sprite objects where possible.
- Low Effects Mode should reduce snow particles, speed lines, boost sparks, and background decoration count.
- The 390x844 portrait layout must not crop the rider, JUMP button, problem banner, HUD, or settings panel.
