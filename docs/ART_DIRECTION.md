# Art Direction

## Concept

Alpine downhill math racing: a mobile arcade racer where solving arithmetic gates triggers boost, jump, speed, and stage rewards. The game should feel like a high-energy mountain racing game first, with math as the engine for speed.

Reference concepts:

- `assets/concepts/title_screen_concept.png`
- `assets/concepts/gameplay_screen_concept.png`

These images are style references only. They are not required runtime backgrounds and should not be used as single-screen UI textures.

## Palette

- Icy blue: `#35d4ff`, `#9ee7ff`
- Deep navy: `#020815`, `#07111f`
- Snow white: `#f6fbff`, `#dff8ff`
- Steel gray: `#617386`, `#8799aa`
- Boost orange: `#ff7a18`, `#ffcf54`
- Warning red: `#ff375f`

## Title Screen

- Large arcade logo composition with a sharp ice badge silhouette.
- Main title: `GRILL MASTER`; subtitle: `MOUNTAIN DOWNHILL`.
- Small rule text: `MATH • SPEED • BOOST`.
- Layered alpine background: distant mountains, downhill track, snow particles, and subtle orange turbo glow.
- Rider preview should imply a downhill MTB athlete with a turbo grill pack, without copying any real rider, team, logo, or uniform.
- Buttons: orange primary `START`, neon blue `TUTORIAL RIDE`, dark navy `SETTINGS`.

## Gameplay Screen

- Third-person rear downhill perspective.
- Large readable problem banner at upper/mid screen.
- Two answer gates remain driven by live problem logic, not by concept art.
- Track edges should use flags, fences, arrows, pine trees, snow banks, rocks, ice patches, and ramps.
- HUD should feel like a supercar dashboard: large digital speed, RPM arc, BOOST, TEMP, COMBO, state color.

## HUD Rules

- Dark navy glass panels with neon blue outlines.
- Correct state flashes green.
- Wrong state uses red edge warnings.
- Boost state uses orange plus blue glow.
- Cold warning uses icy cyan; overheat uses red/orange.

## Gate Rules

- Gates are big, readable, and framed like metal/LED checkpoint gates.
- Correct and wrong feedback must follow game logic.
- The displayed answer positions must remain randomized by code.
- Tutorial gates can be friendlier and clearer.

## Button Rules

- Buttons are large enough for mobile thumbs.
- Primary action is boost orange.
- Tutorial action is neon blue.
- Settings is dark navy with blue outline.

## Rider Rules

- Generic downhill MTB silhouette only.
- Full-face helmet, goggles, pads, gloves, wide tires, low aggressive posture.
- Turbo grill pack is fictional and brand-neutral.

## Prohibitions

- Do not use real UCI marks, team names, rider names, sponsor logos, or copied kit designs.
- Do not flatten generated concept text into UI images.
- Do not change multiplication/division defaults.
- Do not alter math answer correctness to match concept art.
