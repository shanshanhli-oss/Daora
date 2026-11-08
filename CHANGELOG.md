# DAORA landing — black and gold

- Added a public landing page at `index.html`. The sanctuary welcome, four pillars and inner journey stay at `sanctuary.html`.
- Hero: a cursor-responsive gold taiji and compass. Four schools, three steps, and a 3D room of four zones.
- Zone 1 casts a traditional six-line figure: three coins, six tosses, bottom-up, moving lines, changed hexagram. A lot can also be drawn from the sixty-four. Glosses are original and local. Full classical line texts are not in this page yet.
- Zone 2 opens the existing reading. Zones 3 and 4 are marked as not yet open.
- Interest in a master is stored only in the browser.

# DAORA prototype v1.2 — Inner Self Journey

- Removed the central Journey Memory tower. The room centre is a low bagua floor disc again.
- Added one wall door on the back wall. Warm light leaks around the leaf. Click it, or walk into it with WASD, to pass into a separate Inner Self Journey / 内在旅程.
- The journey shows journal entries, rituals, the current reading and personal notes as dated doors and screens along a gentle spiral. New milestones are saved in `localStorage`. A return door and a button lead back to the room.
- Replaced the landing with a welcome page. The Chinese oath is shown exactly, with an English translation in EN mode.
- Birth place accepts a bundled offline city list (hundreds of cities, including UK and Chinese cities, with latitude, longitude and IANA timezone) or manual coordinates and timezone.
- Local birth time converts to Beijing time (`Asia/Shanghai`) with historical daylight saving from IANA data. True solar time is shown beside it. Four Pillars come from `lunar-javascript`, changing year and month at the solar terms. The dominant element themes the room.
- London, 18 June 1998, 07:30 (BST) converts to 14:30 Beijing time. Pillars: 戊寅 戊午 丙申 乙未.

## Prototype v1.1 — Journey Memory

- Replaced the central bagua platform with a person-scale helix of five white paneled portals and ten locally drawn glowing memory frames.
- Added warm ajar thresholds, dark reflective-looking five-element disc, sparse orbital traces and slowly rising particles.
- Added the bilingual Journey Memory panel, four explicitly labelled demo milestones and user-authored memory reflections linked to Records.
- Batched immutable room geometry without swallowing live portal/hotspot hierarchies; measured desktop room draw calls fell from 1,423 to 669.
- Preserved orbit/zoom, collision-aware WASD, other objects, four tabs, bilingual UI and reduced-motion timing.
- Moved foreground tea and reading furniture to make room for the centrepiece; kept the side-orb altar and singing bowl.
- Original procedural memory artwork only: deliberately excludes the reference QR code and promotional overlay.

## Prototype v1.0 foundation


- Built the standalone, editable Vite/vanilla/Three.js sanctuary from the supplied prototype brief (no Lingguang code available or required).
- Added deterministic procedural PBR-style materials, timber architecture, lattice window/night landscape, crafted upholstery, study and tea props, plants, books, lanterns, five-element plaques, shanshui scroll, and a taiji/bagua floor pattern.
- Added animated orb, incense sprites, floating gold particles, lantern tassels, chimes, candle flicker, and layered night lighting.
- Added orbit controls, first-person collisions, object hotspots with camera focus, immersive view, sound opt-in, and responsive mobile UI.
- Added bilingual UI, four working sections, breathing ritual, local reflections, demo tokens, and complete service/about content and disclaimers.
- Added direct-open HTML packaging, npm scripts, README, source map, optional browser screenshots, and automated web/file-open checks.

## Explicitly not included

No external account, cloud persistence, booking or checkout, online deployment, native iOS/Android wrapper, or supplied Lingguang code integration is claimed. The Four Pillars are a calendar calculation from an offline library, not a professional reading.
