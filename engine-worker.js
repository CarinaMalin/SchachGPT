// Stockfish 10, deliberately using its small, single-threaded asm.js build.
// Runs on static hosting without special cross-origin isolation headers.
// Upstream source/build instructions: https://github.com/nmrugg/stockfish.js/tree/Stockfish10
// License: GPL-3.0. Loaded unmodified from the pinned npm distribution.
importScripts('https://cdn.jsdelivr.net/npm/stockfish@10.0.2/src/stockfish.asm.js');
