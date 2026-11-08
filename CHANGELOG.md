# DAORA prototype v1.3 — 起盘

- Birth place is a worldwide offline cascade: country, then province or state when the country has one, then city. Places come from GeoNames cities15000 (CC-BY 4.0) with the recorded IANA timezone, latitude and longitude. A country with no state tier skips that step. Manual coordinates still require an explicit timezone.
- Local civil time still becomes Beijing time, including historical daylight saving. True solar time is optional and applied once; the UTC instant stays the same.
- 八字 stays on `lunar-javascript` (MIT): four pillars, hidden stems, ten gods, NaYin, voids and luck cycles. 紫微 is `iztro` (MIT): twelve palaces, stars, brightness, four transformations, and a decadal or yearly view. 七政四余 and 奇门 are not in this build. No AGPL chart code is included.
- After the charts, the page shows 探索你的人生旅程 and a 心灵旅程 button. The button flies the camera down a centred gold-and-indigo tunnel into a dark core, then flashes into the room. It lasts about 3.6 seconds, can be skipped, and reduced motion fades instead.
- The room's suggested tint is the strongest weighted element (`wuxing-strength-v1`: stems, hidden stems, month-branch season). 金、木、水、火、土 can each be chosen by hand.
- The room has an 八字 desk and a 紫微 star disc. Each opens that chart, with offline guidance. A local note for a practitioner stays in the browser and is labelled 尚未发送 / 尚未预约.
- The wall door, inner journey, bilingual UI, mobile layout, standalone HTML and GitHub Pages build remain.

## Prototype v1.2 — Inner Self Journey

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
