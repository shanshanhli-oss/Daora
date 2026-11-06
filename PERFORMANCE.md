# Performance notes

DAORA favors inspectable actual geometry over image-only impostors. The sanctuary uses actual modelled furniture and doors, canvas-generated PBR-like materials, a 2,048px soft shadow map and capped pixel ratio. The Journey Memory update adds higher-detail doors, fifteen local artwork textures and a 1,536px floor texture. Exact current scene counters are captured by `journey:test` and `window.daoraDiagnostics()`, so no unverified fps assertion is used.

- Static room meshes are batched by exact material + compatible geometry attributes/index state; individual mesh world transforms are baked, while animated/Journey Memory/hotspot/candle/lantern-tassel hierarchies are explicitly excluded and remain live.
- The helix rotates as a whole, while each of 15 fragments gets an independent small vertical float/tilt.
- Only 66 rising points are GPU-drawn together; there is no per-frame canvas regeneration or new texture allocation in the animation loop.
- Floor reflection is a lightweight metallic/clearcoat material with drawn reflection accents, **not** a second live scene-reflection render.
- Reduced-motion holds the helix, individual floating, pulsing, floor emission and particles still; camera transitions shorten and walking remains unchanged.
- Thin memory artwork and painted threshold-light planes do not cast shadows; solid doors, jambs, panels and frames remain real geometry.
- The final optimized production-room counter is recorded in `JOURNEY-VERIFICATION.log`; software-WebGL counter timings are not real-device FPS measurements.

- Capped device pixel ratio: 1.65 desktop, 1.45 on narrow screens.
- Do not equate headless software-WebGL timings with hardware FPS. Profile mid-range devices on real GPUs; the current test records WebGL/draw-call/triangle/texture counts rather than claiming hardware performance not measured.
- All meshes are local and stable, so no asset network delay or streaming complexity exists.
- Static merge failure leaves the originals in place. Only exact compatible-material geometry batches are replaced; all interactive/animated objects remain outside the merge.
- For low-power devices, start by setting the `devicePixelRatio` cap in `scene.js` to `1`, then use a `1024` shadow map in `room.js`. Disabling shadow auto-update after scene construction is a further optimization to profile before adopting.
- Batched furniture remains editable as source groups; rebuilding regenerates merged static pieces. The animated orb, lantern tassels, interactive hotspots, candles and journey particles remain unbatched.
