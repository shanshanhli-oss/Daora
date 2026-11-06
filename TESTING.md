# DAORA 1.1 · Journey Memory — verified build

Tested **Friday, 6 November 2026 (Europe/London, UTC+0)** with **Node.js 20.19.2** and headless **Chrome / WebGL2 / ANGLE SwiftShader**.

## Passed automation

### Centrepiece-specific (`npm run journey:test`)
- Five modelled paneled doors + ten local procedural memory frames, reflective-looking phase disc.
- Actual pointer click at projected **Journey Memory** Three.js hotspot, not merely a button/helper.
- Four explicitly demo bilingual milestones; save a personal journey reflection, its memory tag/kind, return to timeline and link to Records.
- English memory panel, orbit / float / warm door pulse and explicit reduced-motion stationary assertions.
- Valid first-person spawn; D movement in clear aisle, W approach and `canWalkTo()` at final position prove the centre is not walk-through. Escape returns to orbit.
- Local assets only; no remote requests, no page exceptions or browser console errors.
- Accepted whole-frame counter: **669 draw calls**, **327,470 triangles**, **517 geometries**, **35 generated textures**, **10 hotspots**. 27 static batches replace 781 individual static meshes. See `JOURNEY-VERIFICATION.log`.

### Existing desktop/mobile workflows
`CHROME_PATH=/usr/bin/google-chrome TEST_URL=http://127.0.0.1:4173 npm run test:ui`
- Desktop 1440 × 900: form → room, ten hotspots, four services, breathing, ordinary journal save/localStorage, Chinese → English, About, reset view, real W-key input and deterministic movement logic, Escape, five-element panel, opt-in audio on/off.
- Mobile emulation 390 × 844: responsive landing, room entry, service sheet and close, no horizontal overflow.
- 0 browser errors. See `VERIFICATION v1.1.log`.

### Exact direct-open file (`npm run test:standalone`)
- Tests `dist/daora-standalone.html` via **file://**, not Vite only.
- No external scripts, one embedded/accessor stylesheet, local WebGL entry, ten hotspots.
- Services, breathing, journal, room-header language switch, Journey Memory in English and all four demo milestones.
- Zero browser errors and zero non-file/blob/data network assets.
- Root `daora-standalone.html`, `dist/daora-standalone.html` and `deliverables/DAORA.html` are byte-identical. See `STANDALONE-VERIFICATION.log`.

### Source/build
- `npm audit` reports 0 known dependency vulnerabilities at test time; initial `npm install` also 0.
- All changed JavaScript passed `node --check`.
- `npm run build` and `npm run build:all` pass. Production preview: `http://localhost:4173` during this session.
- `npm run journey:screenshots`: six images are captured from the accepted production scene. Camera/overlay state is synchronized by the test harness.

## Test-harness disclosure and limits

The tests use fresh isolated browser profiles: they do not overwrite the user's real journal or browser session. CPU-only headless tests pause the render loop after a live frame while navigating DOM UI to avoid animation-dependent click stability waits. The actual shipped app retains its animation loop, controls and DOM event handlers. Motion assertions explicitly exercise `update()` for both normal and reduced-motion. Walk movement is directly stepped through the same method called by the frame loop after real keyboard events.

This is **not** a measured FPS, cross-browser, or hardware sweep. No physical mid-range mobile GPU, Firefox/Safari, or iOS/Android wrapper was tested. Headless rendering is CPU-bound here; a GPU browser is recommended. Low-device options and the conservative static batching are described in `PERFORMANCE.md`.

Prototype boundaries remain: demo milestones are not authenticated personal history, memories stay in this browser, no external models/remote data/accounts/payments/bookings are required or performed, and the reference QR/promotional overlay is excluded.
