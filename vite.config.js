import { defineConfig } from "vite";

export default defineConfig({
  server: {
    open: false,
  },
  build: {
    rollupOptions: {
      input: "./src/index.ts",
      output: {
        dir: "build",
        format: "esm",
        name: "gps-metadata-remover",
      },
    },
    sourcemap: true,
    minify: true,
    lib: {
      entry: "src/index.ts",
      name: "gps-metadata-remover",
      formats: ["es"],
      fileName: (format) => `index.js`,
    },
  },
});
