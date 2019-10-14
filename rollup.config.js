import babel from "rollup-plugin-babel";
import sourcemaps from "rollup-plugin-sourcemaps";

export default {
  input: "dist/index.js",
  output: {
    file: "dist/index.node.js",
    format: "cjs",
    sourcemap: true,
  },
  external: ["events", "inquirer", "puppeteer"],
  plugins: [sourcemaps(), babel()],
  watch: {
    clearScreen: false,
  },
};
