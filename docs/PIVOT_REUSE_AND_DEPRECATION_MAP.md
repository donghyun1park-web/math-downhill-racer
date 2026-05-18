# Pivot Reuse And Deprecation Map

| System | Current File/Area | Reuse? | New Role in Sky Math Tower | Notes |
|---|---|---|---|---|
| PWA manifest | manifest.webmanifest | Yes | 그대로 사용 | 이름/아이콘은 추후 변경 |
| Service Worker | sw.js | Yes | 새 에셋 캐시 | MTB 에셋은 추후 제거 |
| Math generation | src/stageLogic.js | Yes | 문제 출제 | 유지 |
| Learning stats | src/stageLogic.js/main.js | Yes | 학습 기록 | 유지 |
| Addition/Subtraction settings | main.js/settings | Yes | 유지 | 기본 ON |
| Multiplication/Division settings | main.js/settings | Yes | 유지 | 기본 OFF |
| Stage system | main.js/stageLogic | Partial | 높이 기반 스테이지로 전환 | 재사용 |
| Star rewards | main.js/stageLogic | Yes | 클리어 보상 | 유지 |
| Progress storage | src/stageLogic.js/main.js | Yes | unlockedStage/bestScores 저장 | 유지 |
| Tutorial completion | src/stageLogic.js/main.js | Partial | 다음 튜토리얼 재작성까지 유지 | 기존 값 보존 |
| Audio/haptic | src/audioFeedback.js | Yes | 점프/정답/오답/클리어 효과 | 재사용 |
| Settings panel | index.html/src/main.js | Yes | 연산/사운드/진동/저효과 설정 | 유지 |
| MTB track | src/main.js | No | deprecated | 제거 예정 |
| MTB rider/cockpit | assets/sprites | No | deprecated | 제거 예정 |
| Racing feel | src/main.js | No | deprecated | 사용하지 않음 |
| BOOST/TEMP HUD | src/main.js | No | deprecated | tower HUD로 교체 |
| debugMtbRead/debugRaceFeel | src/main.js | No | deprecated | tower 기본 UI에서는 표시하지 않음 |
