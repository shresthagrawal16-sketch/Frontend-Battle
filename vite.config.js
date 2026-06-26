import { defineConfig } from 'vite';

// Minimal Vite config. Vite is the ONLY build dependency — no plugins,
// no framework runtime. Keeps package.json clean for the zero-dependency rule.
export default defineConfig({
  build: {
    target: 'es2020',
    cssTarget: 'chrome100',
  },
});
