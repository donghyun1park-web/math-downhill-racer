# Sky Math Tower Concept

## Core Idea

Sky Math Tower is a vertical math climbing game for mobile portrait play. The player stands on a floating block, reads a math problem, taps the answer block, and jumps upward one step at a time. 정답은 위로 올라가는 보상이다.

## Why The MTB Concept Stops Here

The MTB downhill prototype proved the Phaser 3 PWA, settings, learning stats, stages, audio, haptics, and deployment pipeline. The visual and feel requirements for convincing mountain biking were heavier than the learning loop needed: realistic track motion, rider/cockpit polish, racing pacing, and math gates all competed for attention.

Sky Math Tower keeps the strongest parts of the project and removes the weakest pressure points. Floating answer blocks make the math choice the natural action, not a layer on top of racing.

## Game Loop

1. The player stands on a floating block.
2. A math problem appears at the top of the screen.
3. Two or three answer blocks float above.
4. The player taps one answer block.
5. Correct answer: the character jumps to that block, gains score/combo, and currentHeight increases.
6. Wrong answer: the block shakes/cracks, a heart is lost, combo resets, and the player stays put.
7. Reaching targetHeight clears the stage.
8. Losing all lives shows Try Again.

## First-Run Behavior

Sky Math Tower uses its own tutorial completion key: `sky-math-tower-tutorial-complete`.

- If the key is missing, the first run opens the Sky Tower tutorial intro.
- If the key exists, the first run opens the Sky Tower menu and stage selection.
- The menu always keeps a TUTORIAL button so practice can be replayed.
- Skipping the tutorial stores the same completion structure as finishing practice.

## Tutorial Flow

The tutorial teaches one idea at a time:

1. Look at the problem and pick the correct block.
2. See the character jump upward after a correct answer.
3. Pick the correct answer from slowly moving blocks.
4. Learn that wrong blocks shake and hearts matter.

Tutorial problems use `source: "tutorial"` and are excluded from learning stats by `shouldRecordLearningResult()`.

## Stage Flow And Unlock Rules

Stage 1 is unlocked by default. Each cleared stage unlocks the next one through the existing progress structure.

- Stage start resets height, lives, combo, score, current problem, and current blocks.
- Stage clear happens when `currentHeight` reaches `targetHeight`.
- Game over happens when lives reach 0.
- Results show score, accuracy, best combo, and height reached.

## Vertical Climb Feel

Correct answers should feel like climbing one floor, not sliding sideways on one screen.

- The current safe block sits near the lower play area.
- Answer blocks appear higher on the screen.
- A correct tap sends the character upward in an arc.
- On landing, the world briefly shifts downward as if the camera climbed with the player.
- Old blocks fade and fall below the screen.
- New answer blocks descend from above for the next floor.
- Height feedback pulses with `+1 STEP!` or `FLOOR UP!`.

Wrong answers do not move the tower upward. They keep the player on the current floor, shake or crack the selected block, and reduce hearts only outside tutorial mode.

Stars keep the existing reward logic:

- 1 star: clear the stage
- 2 stars: 70% accuracy or higher
- 3 stars: 85% accuracy or higher plus best combo 5 or higher

## Math Connection

The math problem is the reason to choose a platform. The answer block is not a quiz panel; it is the next safe step in the tower. Correct answers should feel like climbing higher.

## Grade 2 Math Scope

- Addition and subtraction are ON by default.
- Stage difficulty still follows the existing elementary-friendly ranges in `src/stageLogic.js`.
- Multiplication and division remain optional.
- 곱셈/나눗셈 기본 OFF 원칙은 반드시 유지한다.

## Visual Direction

Sky Math Tower should read as a bright vertical adventure before it reads as a quiz screen.

- bright sky
- clouds
- floating stone or crystal blocks
- distant tower
- deep cliff below
- soft fantasy adventure style
- clear answer numbers on blocks
- friendly but slightly tense height feeling

Art asset direction:

- Answer blocks use lightweight SVG platform art for normal, selected, correct, wrong, cracked, and locked states.
- Numbers are always Phaser Text layered above the block art so math content stays editable and readable.
- The player uses simple SVG states for idle, jump, land, wrong, and celebrate, with Phaser Graphics as fallback.
- Background art uses far/near cloud layers, a distant tower silhouette, floating islands, and depth fog.
- Correct answers add sparkle, landing dust, and floor-up glow; wrong answers add a crack flash and block shake.

Forbidden direction:

- MTB graphics should not be reused in the default tower mode.
- Racing HUD panels, speedometers, BOOST/TEMP race UI, cockpit art, and downhill track visuals should not appear in the Sky Tower play screen.
- The background should not be too dark.
- Decorative detail must never make answer numbers hard to read.

## Altitude Background Progression

The climb should visibly move from ground to sky to space as the player gains height. The background should not cut between scenes; it should softly interpolate color, cloud density, and distant elements based on `currentHeight / targetHeight`.

Altitude zones:

- Ground / Low Sky: green hills, low clouds, bright beginner-friendly sky.
- Bright Sky: clearer blue sky with the ground fading below.
- Cloud Layer: larger cloud bands and floating islands make the tower feel high.
- Upper Sky / Stratosphere: deeper blue, fewer clouds, subtle glow.
- Space Edge: friendly navy/purple sky, small stars, and a distant moon or planet. It must stay playful, not scary.

The purpose of altitude background progression is to make every correct answer feel like a real climb, not just a number changing.

## Translucent 3D Glass Block Direction

Answer blocks should look like translucent 3D glass block platforms rather than flat panels. Each block should show a top face, front face, side face, rim highlight, and soft shadow/glow underneath.

Rules:

- Numbers remain Phaser Text, never baked into SVG art.
- The text must stay readable before and after state changes.
- Normal blocks use light cyan/mint/purple glass.
- Selected blocks gain bright white or gold rim light.
- Correct blocks glow green/gold with sparkle effects.
- Wrong and cracked blocks show red warning tint and crack lines.
- Existing flat block SVGs remain fallback assets.

## Graphics Direction

The first playable pass uses Phaser Graphics:

- Bright sky gradient
- Clouds
- Floating stone/cloud blocks
- A small jump character
- A visible current platform
- A deep drop below
- Light tower/island silhouettes in the distance

The visual target is readable, cheerful, and immediate. It should not look like MTB, racing, cockpit, or downhill track UI.

## Stage Structure

Stages become height goals:

| Stage | Name | Goal |
|---|---|---|
| 1 | Cloud Steps | Learn 2-block choices |
| 2 | Windy Blocks | Slightly faster moving blocks |
| 3 | Sky Bridge | Introduce 3 answer blocks |
| 4 | Star Tower | Longer climb with faster blocks |
| 5 | Storm Top | Highest target and most movement |

## Failure And Reward

- Correct: jump, land, score, combo, height +1.
- Wrong: shake/crack, lives -1, combo reset.
- Stage clear: stars, score, accuracy, best combo.
- Game over: hearts reach 0.

The game should be forgiving. Wrong answers should not instantly throw the child off the tower.
