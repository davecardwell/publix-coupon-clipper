const addShebang = require("rollup-plugin-add-shebang");
const babel = require("rollup-plugin-babel");
const sourcemaps = require("rollup-plugin-sourcemaps");

const outputFile = "dist/index.node.js";

module.exports = {
  input: "dist/index.js",
  output: {
    file: outputFile,
    format: "cjs",
    sourcemap: true,
  },
  external: ["events", "inquirer", "puppeteer", "url"],
  plugins: [sourcemaps(), babel(), addShebang({ include: outputFile })],
  watch: {
    clearScreen: false,
  },
};
