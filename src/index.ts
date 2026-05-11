// Application entry point — delegates to the HTTP server bootstrap.
// This file exists so that tsconfig rootDir points at `src/` consistently
// and the build output mirrors the source layout.
export { default as app } from './app.js';
export { default as server } from './server.js';
