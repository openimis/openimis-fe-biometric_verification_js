import babel from "@rollup/plugin-babel";
import json from "@rollup/plugin-json";
import pkg from "./package.json";

export default {
  input: "src/index.js",
  output: [
    {
      file: pkg.module,
      format: "es",
      sourcemap: true,
    },
    {
      file: "dist/index.js",
      format: "cjs",
      sourcemap: true,
    },
  ],
  external: [
    /^@babel.*/,
    /^@material-ui\/.*/,
    /^@openimis.*/,
    "prop-types",
    /^react.*/,
  ],
  plugins: [
    json(),
    babel({
      exclude: "node_modules/**",
      babelHelpers: "runtime",
    }),
  ],
};
