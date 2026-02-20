import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  plugins: [react()],

  build: {
    lib: {
      entry: "src/index.js",
      // Produce both ES module and CommonJS builds to match the old rollup output.
      formats: ["es", "cjs"],
      // Map format names to the file names expected by package.json.
      fileName: (format) => (format === "es" ? "index.es.js" : "index.js"),
    },

    rollupOptions: {
      // All peer dependencies must stay external so they are not bundled.
      external: [
        /^react(\/.*)?$/,
        /^react-dom(\/.*)?$/,
        /^react-intl(\/.*)?$/,
        /^react-helmet(\/.*)?$/,
        /^@openimis\/.*/,
        /^@mui\/.*/,
        /^@material-ui\/.*/,
        "prop-types",
      ],
    },

    sourcemap: true,
  },
});
