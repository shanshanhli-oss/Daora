# DAORA v2 — a gold sea of stars

- The landing and the night room sit in a deep starfield with gold nebulae and drifting gold dust. Motion eases off under `prefers-reduced-motion`. The tunnel remains a centred gold flight.
- Natal furnishings follow `natal-furnishings-v1` in `src/furnishings.js`: resource stars and 文昌文曲 add books, 食神 / 天同 / 太阴 add a qin, wealth a bowl or toad, office a seal, the travelling horse a map or globe, wood and water a plant and a basin. The strongest weighted element still sets the palette.
- Furniture can be hovered for a hint and dragged. It snaps to the floor or the shelves, and the place is kept in `daora-prop-layout-v1`. The qin plays a pentatonic phrase when sound is on. Books open a book of answers drawn from the I Ching.
- All 64 hexagrams now carry the received 卦辞, 彖传, 象传 and six 爻辞, plus original Chinese and English lines. The six-line cast, the daily figure and the lot read from that book.
- 「AI 解读」 is a local template unless the browser has an OpenAI-compatible endpoint. No key is shipped.
- Breathing, the five elements, tea and the chart are free. 风水 and 通灵 stay marked as not yet open.

# DAORA landing — black and gold

- The public entry is `index.html`. **开始起盘** and the 命盘 zone open `sanctuary.html`, the 起盘 flow: place cascade, 八字 and 紫微, the tunnel, and the five-element room.
- Hero: a cursor-responsive gold taiji and compass. Four schools, three steps, and a 3D room of four zones.
- Zone 1 casts a traditional six-line figure: three coins, six tosses, bottom-up, moving lines, changed hexagram. A lot can also be drawn from the sixty-four. Glosses are original and local. Full classical line texts are not in this page yet.
- Zones for 风水 and 通灵 are marked as not yet open.
- Interest in a master is stored only in the browser.

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
