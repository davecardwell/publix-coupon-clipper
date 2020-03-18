const pkg = require("./package.json");
const semver = require("semver");

const nodeTarget = semver.minVersion(pkg.engines.node).toString();

module.exports = {
  presets: [["@babel/preset-env", { targets: { node: nodeTarget } }]],
  sourceMaps: true,
  inputSourceMap: true,
};
