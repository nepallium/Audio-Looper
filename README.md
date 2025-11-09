# Audio Looper (Work in Progress)

AudioLooper is a mobile-first web-based practice tool designed for musicians who want to slow down, loop, and transpose songs directly in their browser. Instead of usual tools that require users to upload an audio file, Audio Looper allows users to choose a song directly from the app's Youtube search integration.
Built with React and WaveSurfer.js, it provides a smooth, modern interface for focused practice sessions.

---

## Status

This project is currently in development.  
Core functionality (playback, looping, pitch shifting) is being implemented, and the UI design is still evolving.

---

## Features

- Interactive waveform display for visualizing and scrubbing through tracks
- Create, edit, and save multiple loops (stored locally)
- Slow down or speed up playback while preserving pitch
- Transpose songs by up to ±12 semitones
- Stem separation (planned): isolate or remove vocals, drums, or instruments
- Local persistence of loops and settings using `IndexedDB`
- Mobile-first design optimized for both mobile and desktop browsers

---

## Tech Stack

- React + Vite – frontend framework and dev environment
- WaveSurfer.js – waveform visualization and interaction
- Tailwind CSS – styling and responsive design
