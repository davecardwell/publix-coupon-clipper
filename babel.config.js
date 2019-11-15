const pkg = require("./package.json");
const semver = require("semver");

const nodeTarget = semver.minVersion(pkg.engines.node).toString();

module.exports = {
  presets: [["@babel/preset-env", { targets: { node: nodeTarget } }]],
  plugins: [
    "@babel/plugin-proposal-nullish-coalescing-operator",
    "@babel/plugin-proposal-optional-chaining",
  ],
  sourceMaps: true,
  inputSourceMap: true,
};
