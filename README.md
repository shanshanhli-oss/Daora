# DAORA · 我的迷你道场

**A quiet, interactive 3D sanctuary inspired by Chinese spatial and five-element aesthetics.**
一方属于自己的数字静境。以木材、织物、纸灯、茶器与五行意象，让片刻觉察成为可以进入的空间。

Built with **Vite + vanilla JavaScript + Three.js**. The room, textures, calligraphy, journey screens, bagua floor, city view, and ambient audio are all generated locally. Birth time and the Four Pillars are calculated in the browser with `lunar-javascript` and IANA timezone data. No remote models, API keys, accounts, cloud storage, or paid services are needed. Static room detail is batched by material while the wall door, hotspots and animated props retain their live hierarchies.

## Run it — three options

### Option 1: development in Cursor (recommended)

Requires **Node.js 20.19+** or **22.12+**.

```bash
cd /workspace/daora
npm install
npm run dev
```

Open **http://localhost:5173**. Vite supports hot reloading while you edit the source. The server binds `0.0.0.0`; use `--port 3000` if your environment expects that port.

### Option 2: double-click one standalone HTML file

A ready-to-open copy is included at the path below; the generator also writes `dist/daora-standalone.html`:

```text
/workspace/daora/daora-standalone.html
```

Open it directly in a modern WebGL-capable browser. **No Node.js or HTTP server is needed to run that generated file.** All CSS, JavaScript, Three.js, UI, and procedural scene code are bundled in it. Local storage works per browser/file path.

To regenerate after making source edits:

```bash
npm run build:file
```

If double-clicking via a managed browser restricts WebGL or local storage, serve the file using `npx serve dist` or run Option 1.

### Option 3: ordinary production build

```bash
cd /workspace/daora
npm install
npm run build
npm run preview
```

- `dist/index.html` is the modular production output.
- `npm run preview` serves it at **http://localhost:4173**.
- Deploy the whole `dist/` folder to any static host.
- `npm run build:all` creates both the ordinary build and standalone file.
- No server environment variables are required.

## v1.2 · Welcome, Four Pillars, Inner Self Journey

The room centre is calm again: a low bagua disc on the floor. One ivory door sits on the back wall, slightly ajar, with warm light around the frame. Click the door, or walk into it, and a short fade opens **内在旅程 / Inner Self Journey** — a separate space of memory doors and screens along a gentle spiral. There is no QR code and no promotional text.

- The welcome page shows the Chinese oath exactly, plus an English translation when the language is EN.
- Date, time and place of birth. Search a bundled list of major cities (London, Brighton, Manchester, Edinburgh, Chinese cities, and others), or enter latitude, longitude and an IANA timezone by hand.
- Local civil time is converted to Beijing time (`Asia/Shanghai`), including historical daylight saving. True solar time is shown as well. The Four Pillars change at 立春 and the 节气, not at midnight on the lunar new year or the Gregorian new year.
- Element counts come from the eight characters. The strongest element tints the room.
- Milestones (journal, ritual, reading, note) can be added in the journey and stay in `localStorage` under `daora-sanctuary-v1`. The return door and the **回到房间** button both lead back.

Screenshots: `screenshots/welcome.png`, `screenshots/wall-door.png`, `screenshots/inner-journey.png`, `screenshots/pillars.png`.

## What is implemented

### Arrival

- Welcome page with the BaZi oath, bilingual, over a live 3D room.
- Birth date, birth time, and a searchable worldwide city, or manual coordinates and timezone.
- No registration. Inputs stay in local browser storage.
- Clear prototype and cultural-exploration disclaimer.
- English / 中文 toggle for core UI, services, about, element explanations, and journals.

### A materially detailed 3D room

- Dark burgundy plaster, timber-frame architecture, beams, posts, baseboards, pegged joints, a carved frieze, and individually toned wood floor boards.
- Large geometric lattice window, layered curtains, brass rod, chimes, and an illustrated evening landscape/city with lit windows.
- A velvet/linen lounge with cushions, seams, buttons, feet, brass caps, and a woven throw with fringe.
- Foreground tea corner with carved low table, slatted bamboo tea tray, Yixing teapot, celadon cups with liquid surfaces, folded linen, tea scoop, fruit, and a reading chair.
- Study with joined timber desk, drawers and handles, inkstone, brushes, chart, stitched journal, ceramic cup, blackened-brass lamp, and matching spindle-back chair.
- Bookshelf with modeled books, folios, ceramics, and foliage; entry screen; garden stool; floor books; cushions.
- A singing bowl sits beside a low bagua floor disc in the centre of the room. The disc is walkable.
- Individually rendered **金 / 木 / 水 / 火 / 土** plaques and an original shanshui-inspired scroll.
- Rotating celestial rings around a softly glowing orb, bamboo branches, a ficus, paper lanterns with ribs and tassels, candle flames, sparse dust, and drifting incense wisps.
- Procedural wood grain, plaster, woven fabric, embroidered rug, rice-paper fibers, lantern ribs, ink landscape, and city sky. PBR materials, high-resolution soft shadow map, environment reflections, ACES tone mapping, cool window light, and warm lamps.

### Interaction

- Drag to orbit; scroll or pinch to approach; touch-friendly controls.
- Nine interactive glowing hotspots: tea ritual, personal elements chart, sofa, orb, and five-element plaques. The wall door is a separate portal, not a floating hotspot.
- Selecting an object smoothly guides the camera and opens a genuinely populated information panel.
- First-person **W/A/S/D** or arrow-key walk mode with collision boundaries, Shift to move faster, drag to look, **Esc** to return.
- Reset room view and immersive mode (hide peripheral UI).
- Optional locally synthesized room ambience: filtered soft air, quiet harmonic tones, and an occasional bell. Sound starts only after an explicit click; no microphone access.
- Responsive desktop and mobile layouts and reduced-motion support.

### Services / Records / About

- All four original tabs remain: **我的房间 / 服务 / 记录 / 关于**.
- Services include breathing, elements exploration, tea pause, and the real Four Pillars chart. The demo prices never initiate payment or booking. The chart is a calendar, not advice.
- A working 60-second breathing ritual with a 4–4–6 breathing phase, changing light, countdown, and completion flow. Users can finish early.
- Local reflections with safe text handling, a 4,000-character limit, and up to 30 personal entries. Sample records are always marked.
- Ritual and reflection feedback uses demo **Inner Light** tokens; no monetary value or exchange mechanism.
- About contains the prototype boundary, privacy explanation, and no-professional-advice notice.

## Source map

```text
index.html                 Semantic landing, room HUD, overlays
src/main.js                App state, translation rendering, panels, journal, ritual
src/scene.js               Renderer, camera transitions, orbit/walk, raycasting
src/room.js                Room architecture, furniture, details, hotspots, lighting
src/materials.js           Deterministic local canvas textures and PBR materials
src/geometry.js            Reusable modeled prop and joinery helpers
src/bagua.js               Taiji/eight-trigram artwork for the floor disc
src/bazi.js                Timezone conversion, true solar time, Four Pillars, element theme
src/cities.js              Offline city gazetteer with latitude, longitude and IANA zones
src/wall-door.js           The single wall door and its warm threshold
src/inner-journey.js       Separate journey scene, spiral of milestones, return door
src/memory-art.js          Shared door and screen builders for the journey
src/audio.js               Optional Web Audio room ambience
src/i18n.js                Chinese and English copy and services
src/styles.css             Editorial interface and responsive layouts
scripts/standalone.mjs      Bundles every dependency into direct-open HTML
scripts/standalone-entry.js CSS bundling entry for the standalone build
tests/smoke.mjs            Automated Chromium workflow checks
tests/journey-smoke.mjs    Centrepiece, bilingual panel/journal/collision checks
tests/journey-visual.mjs   Deterministic desktop centrepiece captures
tests/standalone.mjs       Checks the exact file:// bundle
```

Change furniture layout in `room.js`, shared room textures in `materials.js`, the wall door in `wall-door.js`, the journey in `inner-journey.js`, pillar math in `bazi.js`, bilingual product text in `i18n.js`, and journal panels in `main.js`.

## Browser requirements and privacy

- Use a current Chrome, Edge, Firefox, or Safari with **WebGL 2 / hardware acceleration** enabled. A power-saving machine can reduce pixel ratio in `scene.js`.
- Browsers request permission for nothing: no microphone, location, camera, contacts, notifications, or payment data.
- Birth details, chosen language, demo tokens, and personal reflections are stored under `daora-sanctuary-v1` in browser local storage. They are never sent to an external server.
- If storage is blocked, the app remains usable and says that changes last only for the current page.
- The Four Pillars are computed offline from civil Beijing time and the solar terms. They are a calendar mirror, not a medical, psychological, or professional reading. No real payments, accounts, bookings, or cloud backups occur.

## Verification

```bash
npm install
npm run build
npm run dev -- --port 5173
# In a second terminal (development server must stay running):
npx playwright install chromium
# Use npm run preview instead of dev when testing the made production build in another terminal:
CHROME_PATH=/usr/bin/google-chrome TEST_URL=http://127.0.0.1:4173 npm run test:all
npm run journey:screenshots
```

Screenshot and error-cache scripts are also included in `tests/`. They require a locally installed Chromium or set `CHROME_PATH` to your Chrome executable. This environment uses `/usr/bin/google-chrome` with a software WebGL fallback for headless screenshots. Set `CHROME_PATH=/usr/bin/google-chrome` to reproduce that setup; otherwise Playwright looks for its Chromium. Use `TEST_URL=http://127.0.0.1:4173` to test the production preview.

## Reusing this brief outside the box

This path is inside the shared agent computer. To edit it on a personal computer, copy `/workspace/daora/` there, **excluding `node_modules/`, `dist/`, `screenshots/`, and test output**, then run `npm install && npm run dev`. To retain a one-click preview, copy `dist/daora-standalone.html` too. No original Lingguang export is required for this implementation; the project was built from the supplied visual/product brief.

## Included in this handoff

- `daora-standalone.html`: copy, double-click, and enter; no npm needed.
- `deliverables/DAORA-Cursor-project.zip`: the editable project (install dependencies with `npm install` after unpacking).
- `screenshots/`: Journey Memory room/detail/panel captures plus earlier sanctuary views; duplicate copies are also in the shared agent store under `daora/`.
- `TESTING.md` and `JOURNEY-VERIFICATION.log`: exactly which browser paths passed for v1.1 and the scope of the headless harness.
- `screenshots/journey-*.png`: six fresh centre/portal/panel/walk/mobile images.
- `CHANGELOG.md`: scope and product boundaries.

Nothing is deployed or published. The running local production preview is available at **http://localhost:4173** on this box for this session.
