# MTB Visual Rework Plan

This plan fixes the visual direction so the game reads as an MTB downhill racing game with math boost mechanics, not as a math runner with bike decoration.

## 2.1 Current Problem Diagnosis

The current game systems are strong, but the visual hierarchy can still read too much like an arcade math runner.

Observed risks:

- The rider may not look enough like a downhill MTB athlete.
- Thick tires, wide handlebar, suspension fork, and full-suspension frame need to be visible on mobile.
- The track can read as a generic snow lane instead of an MTB downhill race course.
- Course tape, jump ramps, tire tracks, trees, rocks, and banked turns need stronger presence.
- HUD and math gates can dominate the first impression if they are too large or too central.
- Generated concept art established the right mood, but the game needs asset-level translation rather than full-screen static image use.

## 2.2 Rework Priority

```text
Priority 1: Rider and bike visibility
Priority 2: Pseudo-3D downhill track
Priority 3: MTB course objects
Priority 4: Math gate integration
Priority 5: HUD size and placement
Priority 6: Generated asset pipeline
```

The first two priorities matter most. If the rider is readable and the course has a convincing downhill camera, the game will immediately feel more MTB.

## 2.3 TASK_012 Proposal

Title:

```text
TASK_012_RIDER_AND_BIKE_VISUAL_REWORK
```

Goal:

```text
Make the rider and bike large, clear, and unmistakably MTB.
```

Major work:

- Add `rider_mtb_large.svg`.
- Add `rider_mtb_lean_left.svg`.
- Add `rider_mtb_lean_right.svg`.
- Add `rider_mtb_boost.svg`.
- Add `rider_mtb_jump.svg`.
- Add `rider_mtb_land.svg`.
- Switch rider textures in `src/main.js` according to visual rider state.
- Keep rider plus bike at roughly 16-22% of gameplay screen height.
- Preserve existing SVG/Graphics fallback behavior.

Acceptance notes:

- Mobile users should identify both wheels, handlebar, helmet, and goggles without zooming.
- Boost and jump should change rider posture, not only add effects.

## 2.4 TASK_013 Proposal

Title:

```text
TASK_013_PSEUDO_3D_DOWNHILL_TRACK
```

Goal:

```text
Rework the track into a perspective-driven MTB downhill course.
```

Major work:

- Draw the track as a trapezoid.
- Scale course objects by y coordinate.
- Add repeated course tape.
- Add directional arrows.
- Add jump ramps.
- Add tire tracks.
- Make near objects move faster through foreground parallax.

Acceptance notes:

- The game should look like a rear-camera downhill race, not a top-down lane runner.
- The course should feel steep and fast even before boost.

## 2.5 TASK_014 Proposal

Title:

```text
TASK_014_MTB_COURSE_OBJECTS_AND_PARALLAX
```

Goal:

```text
Add course objects and layered backgrounds that strengthen MTB race identity.
```

Major work:

- Repeat course tape along both sides.
- Place trees, rocks, snow banks, ice patches, and jump ramps.
- Separate decorative objects from gameplay objects.
- Structure background layers as far, mid, near, track, particles, gameplay.
- Support Low Effects Mode by reducing decoration count and particle intensity.

Acceptance notes:

- Course tape and jump ramps must be visible during normal play.
- Decorative objects should never interfere with math gate readability or collision clarity.

## 2.6 TASK_015 Proposal

Title:

```text
TASK_015_HUD_AND_MATH_GATE_VISUAL_BALANCE
```

Goal:

```text
Adjust HUD and math gates so they support the race without overpowering MTB visuals.
```

Major work:

- Tune problem banner size and position.
- Make answer gates feel like route choices on the course.
- Compress HUD vertical footprint.
- Keep JUMP reachable without covering the course.
- Review the target balance: MTB 70%, Math/HUD 30%.

Acceptance notes:

- Problems and answers remain readable.
- The rider and course must still be the first visual read.

## 2.7 Acceptance Criteria

1. The first screen feels like an MTB downhill game.
2. Rider and bike are clear on mobile.
3. Two wheels, handlebar, helmet, and goggles are identifiable.
4. The track reads as a perspective downhill course.
5. Course tape and jump ramps are visible.
6. Math gates feel like race-course devices.
7. HUD is readable but does not dominate the screen.
8. Existing math, stage, tutorial, sound, haptic, PWA, and progress features keep working.

## Implementation Guardrails

- Do not turn multiplication/division on by default.
- Do not change problem generation policy unless a later learning task explicitly asks for it.
- Do not add a 3D engine.
- Do not use real UCI logos, team names, sponsor logos, or copied uniforms.
- Do not use generated full-screen gameplay art as a fixed background.
