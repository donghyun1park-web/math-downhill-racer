# Sky Tower Mobile Playtest

## Test Setup

| Device | OS | Browser | Viewport | Tester | Date |
|---|---|---|---|---|---|
| Desktop mobile view | Windows | Chrome/Headless | 390x844 |  |  |
| Android phone | Android | Chrome | Portrait |  |  |
| iPhone | iOS | Safari | Portrait |  |  |

## First 30 Seconds

| Check | Result | Notes |
|---|---|---|
| User understands the goal |  | Goal: reach the top by choosing answer blocks. |
| User can read the problem |  | Problem banner should stay short and high contrast. |
| User can read answer blocks |  | Answer text should dominate block decoration. |
| User can tap answer blocks |  | Touch area is larger than the visible platform. |
| User understands correct = jump up |  | Correct answer triggers jump, landing, and +1 STEP. |
| User understands wrong = heart loss |  | Wrong block cracks, shakes, and removes a heart. |

## Balance Notes

| Area | Issue | Fix |
|---|---|---|
| Block size |  | Keep visual blocks large enough for 390x844 portrait. |
| Touch area |  | Hit zones should remain at least 72px and follow moving blocks. |
| Jump timing |  | Keep jump around 400-500ms so it feels responsive. |
| Floor transition |  | Keep transition visible without delaying the next question too long. |
| Stage 1 difficulty |  | Cloud Steps should use 2 slow blocks and a short target height. |
| Tutorial wording |  | Keep each line short: pick block, jump up, protect hearts. |

## QA URLs

Use the deployed page with these query parameters when testing:

| URL Parameter | Purpose |
|---|---|
| `?resetTowerTutorial=1` | Clears only the Sky Tower tutorial completion flag. |
| `?resetTowerProgress=1` | Clears stage progress/unlocks for repeat testing. |
| `?resetTowerAll=1` | Clears tutorial and tower progress together. |
| `?quickStageClear=1` | Shortens the stage target height for fast result-screen checks. |
| `?easyPlaytest=1` | Slows blocks and shortens the stage for first-play usability checks. |
| `?debugTowerState=1` | Shows current tower state, stage, lives, block speed, and answers. |
