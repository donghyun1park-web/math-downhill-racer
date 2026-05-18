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

## Math Connection

The math problem is the reason to choose a platform. The answer block is not a quiz panel; it is the next safe step in the tower. Correct answers should feel like climbing higher.

## Grade 2 Math Scope

- Addition and subtraction are ON by default.
- Stage difficulty still follows the existing elementary-friendly ranges in `src/stageLogic.js`.
- Multiplication and division remain optional.
- 곱셈/나눗셈 기본 OFF 원칙은 반드시 유지한다.

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
