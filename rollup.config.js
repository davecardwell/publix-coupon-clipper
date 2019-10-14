import addShebang from "rollup-plugin-add-shebang";
import babel from "rollup-plugin-babel";
import sourcemaps from "rollup-plugin-sourcemaps";

const outputFile = "dist/index.node.js";

export default {
  input: "dist/index.js",
  output: {
    file: outputFile,
    format: "cjs",
    sourcemap: true,
  },
  external: ["events", "inquirer", "puppeteer"],
  plugins: [sourcemaps(), babel(), addShebang({ include: outputFile })],
  watch: {
    clearScreen: false,
  },
};
