# Sky Tower Real Phone Feedback

## Test Matrix

| ID | Device | OS | Browser | Viewport | Mode | Date | Tester |
|---|---|---|---|---|---|---|---|
| A1 | Android phone |  | Chrome |  | Browser/PWA |  |  |
| I1 | iPhone |  | Safari |  | Browser/Home Screen |  |  |
| D1 | Desktop mobile view | Windows | Chrome/Headless | 390x844 | Browser |  | Codex |

## First 3-Minute Flow

| Check | Result | Notes |
|---|---|---|
| First screen is understandable | Pending real-device check | Use the normal Pages URL first, then reset tutorial if needed. |
| Tutorial starts correctly | Pending real-device check | Confirm first-run routing and TUTORIAL button replay. |
| Correct block is readable | Pending real-device check | Check 390x844 portrait and smaller Android widths. |
| Blocks are easy to tap | Pending real-device check | Verify finger coverage and moving block hit zones. |
| Jump-up feeling is clear | Pending real-device check | Watch for jump, landing, floor transition, and +1 STEP feedback. |
| Wrong answer feedback is understandable | Pending real-device check | Confirm crack/shake plus heart loss is clear but not harsh. |
| Stage 1 clear is achievable | Pending real-device check | Cloud Steps should feel easy with 2 slow blocks. |
| Stage 2 unlock is visible | Pending real-device check | Confirm `Stage 2 Unlocked! Windy Blocks` is easy to notice. |

## Issue Log

| ID | Severity | Device | Screen | Symptom | Cause | Fix | Status |
|---|---|---|---|---|---|---|---|
| RF-001 | P3 | Desktop/mobile static check | No real-phone issue recorded yet | Actual Android/iPhone hands-on testing has not been completed in this environment. | Keep this document ready for field feedback before changing gameplay. | Open |

## Severity

- P0: 실행 불가
- P1: 진행 불가 / 터치 불가 / 문제 읽기 불가
- P2: 플레이 가능하지만 불편함 큼
- P3: 문구/시각/간격 미세 조정

## QA URLs

| URL | Purpose |
|---|---|
| https://donghyun1park-web.github.io/math-downhill-racer/ | Normal deployed game. |
| https://donghyun1park-web.github.io/math-downhill-racer/?easyPlaytest=1&debugTowerState=1 | Easier quick playtest with state overlay. |
| https://donghyun1park-web.github.io/math-downhill-racer/?resetTowerTutorial=1 | Re-run first-launch tutorial. |
| https://donghyun1park-web.github.io/math-downhill-racer/?resetTowerProgress=1 | Reset stage unlock progress. |
| https://donghyun1park-web.github.io/math-downhill-racer/?resetTowerAll=1 | Reset tutorial and progress together. |
| https://donghyun1park-web.github.io/math-downhill-racer/?quickStageClear=1 | Reach Stage Clear quickly for result/unlock QA. |

## Current Notes

- No Android/iPhone-specific defect has been reproduced inside this workspace.
- Do not make further balance changes until a tester records a specific issue in the Issue Log.
- Keep multiplication and division OFF by default during all QA passes.
