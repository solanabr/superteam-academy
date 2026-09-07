# Motion grammar for Academy videos

Paste into every HyperFrames brief alongside `frame.md`. frame.md says how a frame looks; this says how it moves.

Source: hyperframes.heygen.com/prompting/motion (the eight rules) + /prompting/capstone (world-camera).

Rules (each must be honoured, and the report must say where):

1. Nothing ever fully stops. Every hold carries ambient idle: 1–2% breathing scale, slow drift, shimmer. The final second must NOT be a freeze: consecutive frames must differ. Write "settles into a gentle ambient idle", never "holds".
2. The camera is an actor. One continuous camera move per scene: a 4–8% push-in, a slow orbit, or parallax (near layers travel further). Ease gently over a window slightly longer than the scene; never decay to a dead stop at the scene end.
3. Overlapping action. No two elements share a start or end time. Stagger at irregular offsets; each offset clearly shorter than the animation it offsets. Delay supporting elements, never the focal one. Stagger what is happening, not what was already present.
4. Compound properties only when they tell one story. Entrances ease OUT; exits ease IN; on-screen moves ease IN-OUT; impacts (stamp, press) ease IN.
5. Overshoot and follow-through on transforms only; dragged parts (shadow, trailing panel) resolve a beat after the mover. Never overshoot a number.
6. Depth planes. Background at a fraction of the camera rate, content at full, foreground at several times. One large blurred foreground element that actually OCCLUDES content proves the space; a second becomes decoration.
7. Pacing by genre: 1.5–4 s per idea for showreel cuts; narrated lesson primers dwell longer but never stretch a 2-second idea to 8.
8. Handmade imperfection stays reproducible: seed a PRNG once at composition start; step between held positions; no Math.random().

Avoiding the slideshow (world-camera method):

- Treat the film as one wide space the camera travels across. Name the persistent elements that survive scene boundaries (for us: the footage card, the code-rain ground, a rail/ruler that becomes the tick row).
- Arrivals instead of cuts: the next region is already at the edge of frame before the camera reaches it; the previous exits by parallax.
- Dwell: a genuine full stop of 1.5–2.5 s while the point lands (the alignment on "juntas", the tick snap on "ordena"), with ambient idle still running.
- Forbid the slideshow explicitly in the brief: "no region may fade up centered, sit, and fade out while the camera waits."

Test after render: extract the last 25 frames and confirm they are not bit-identical (ffmpeg -ss <end-1> … -frames:v 25, compare md5s).
