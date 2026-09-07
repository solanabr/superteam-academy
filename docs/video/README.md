# Academy video system

Course primers, lesson intros and social cuts are rendered locally with
[HyperFrames](https://hyperframes.heygen.com) (HTML compositions, deterministic MP4).
Two files define the look and the motion:

- `frame.md`: the platform design system for the camera (tokens, fonts, constructions, 3D).
- `MOTION.md`: the eight motion rules and the world-camera method, plus the frozen-frame test.

Setup: `npx skills add heygen-com/hyperframes` (core skills), then start a project with
`/hyperframes` and copy `frame.md` into its root. Gate every render with
`npx hyperframes check --snapshots`. Narration is the presenter's own clip (HeyGen avatar
export, landscape) or local TTS; captions come from a local Whisper transcript as an
on-screen rail plus a WebVTT sidecar per language.
