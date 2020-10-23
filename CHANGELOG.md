## [3.1.1](https://github.com/davecardwell/publix-coupon-clipper/compare/v3.1.0...v3.1.1) (2020-10-23)


### Bug Fixes

* emit “info” event upon coupon clipping ([96974e0](https://github.com/davecardwell/publix-coupon-clipper/commit/96974e0aed71ca61e4d4a9c1f500254ab2f2dc38))
* update to work with new sign in process ([5b2a93d](https://github.com/davecardwell/publix-coupon-clipper/commit/5b2a93d1f7c9bba7ae40a2e6d778011e7db1f875))

# [3.1.0](https://github.com/davecardwell/publix-coupon-clipper/compare/v3.0.2...v3.1.0) (2020-09-13)


### Features

* **deps:** support PUPPETEER_DOWNLOAD_PATH ([82fc24a](https://github.com/davecardwell/publix-coupon-clipper/commit/82fc24a7dd3afc079454b754088256a9b6d7c22c))

## [3.0.2](https://github.com/davecardwell/publix-coupon-clipper/compare/v3.0.1...v3.0.2) (2020-09-13)


### Performance Improvements

* only make necessary API requests ([88d148f](https://github.com/davecardwell/publix-coupon-clipper/commit/88d148f7095a77a7af2d274899655a326108b079))

## [3.0.1](https://github.com/davecardwell/publix-coupon-clipper/compare/v3.0.0...v3.0.1) (2020-09-02)


### Bug Fixes

* update to work with Publix website changes ([bc848d8](https://github.com/davecardwell/publix-coupon-clipper/commit/bc848d8d672a9ea6610369d74ea08cf6a45345c5))


### Performance Improvements

* **deps:** update puppeteer to v5.2.1 ([74cabe0](https://github.com/davecardwell/publix-coupon-clipper/commit/74cabe0b3e8385f85ac034f11ab521dd3f309204))
* **deps:** update rollup to v2.26.9 ([76ea7f6](https://github.com/davecardwell/publix-coupon-clipper/commit/76ea7f6382286b999b9777dd9fda79f6e9911194))

# [3.0.0](https://github.com/davecardwell/publix-coupon-clipper/compare/v2.1.2...v3.0.0) (2020-06-17)


### Bug Fixes

* allow “other” type network requests ([29ca24c](https://github.com/davecardwell/publix-coupon-clipper/commit/29ca24c447c9a1e399d62ea522691146edae4e0f))


### chore

* **deps:** update puppeteer to v4.0.0 ([e9ed95f](https://github.com/davecardwell/publix-coupon-clipper/commit/e9ed95fb9665da0c86097e0dd647c5b3bf70eb9e))


### BREAKING CHANGES

* **deps:** puppeteer now requires Node.js >=10.18.1 so we update
our minimum version to match.

## [2.1.2](https://github.com/davecardwell/publix-coupon-clipper/compare/v2.1.1...v2.1.2) (2020-06-05)


### Bug Fixes

* ensure URL is imported for node.js < v10 ([#4](https://github.com/davecardwell/publix-coupon-clipper/issues/4)) ([6b990a6](https://github.com/davecardwell/publix-coupon-clipper/commit/6b990a69c65de1eb18c6f30edddb49825b85ff95))

## [2.1.1](https://github.com/davecardwell/publix-coupon-clipper/compare/v2.1.0...v2.1.1) (2020-03-23)


### Bug Fixes

* **deps:** update babel to v7.9.0 ([4ef3d9b](https://github.com/davecardwell/publix-coupon-clipper/commit/4ef3d9bbadbc68358467144a4ee1f8574d3be5cd))

# [2.1.0](https://github.com/davecardwell/publix-coupon-clipper/compare/v2.0.2...v2.1.0) (2020-03-18)


### Bug Fixes

* **deps:** update inquirer to v7.1.0 ([dad6b3a](https://github.com/davecardwell/publix-coupon-clipper/commit/dad6b3aeaa1e63f5f10a6f47437ad99749e691dc))
* **deps:** update rollup to v2.1.0 ([67117b5](https://github.com/davecardwell/publix-coupon-clipper/commit/67117b5dc646941997f49df9a9e8daf6961bb1f3))


### Features

* **deps:** update puppeteer to v2.1.1 ([d56ea7e](https://github.com/davecardwell/publix-coupon-clipper/commit/d56ea7e1a32df47c04ab99be583a8eb6ecb81139))

## [2.0.2](https://github.com/davecardwell/publix-coupon-clipper/compare/v2.0.1...v2.0.2) (2019-12-13)


### Bug Fixes

* **deps:** update @babel/plugin-proposal-nullish-coalescing-operator to v7.7.4 ([eaa1d22](https://github.com/davecardwell/publix-coupon-clipper/commit/eaa1d220fd65ab4b571b4baeb94a0643a7b1bf2b))

## [2.0.1](https://github.com/davecardwell/publix-coupon-clipper/compare/v2.0.0...v2.0.1) (2019-11-15)


### Bug Fixes

* **deps:** update @babel/core to v7.7.2 ([f8fcaf0](https://github.com/davecardwell/publix-coupon-clipper/commit/f8fcaf0e58a8464e87f86c851b4a31ac7fe0f999))

# [2.0.0](https://github.com/davecardwell/publix-coupon-clipper/compare/v1.1.0...v2.0.0) (2019-10-24)


### Features

* **deps:** update puppeteer to v2.0.0 ([10feb34](https://github.com/davecardwell/publix-coupon-clipper/commit/10feb34bedc2bbf0fcc087d2727457005e1c6686))


### BREAKING CHANGES

* **deps:** minimum Node.js version updated to v8.16.0
Puppeteer dropped support for Node.js v6 so this library follows suit.

# [1.1.0](https://github.com/davecardwell/publix-coupon-clipper/compare/v1.0.2...v1.1.0) (2019-10-22)


### Bug Fixes

* **deps:** update https-proxy-agent to v2.2.3 ([1ce8292](https://github.com/davecardwell/publix-coupon-clipper/commit/1ce829249572265743a204da34de9ecb9239133d))


### Features

* **deps:** update typed-emitter to v0.2.0 ([2176478](https://github.com/davecardwell/publix-coupon-clipper/commit/2176478974bd79a5d1cf2c93b2c27c66954c4c48))

## [1.0.2](https://github.com/davecardwell/publix-coupon-clipper/compare/v1.0.1...v1.0.2) (2019-10-14)


### Bug Fixes

* add node shebang to allow for npx usage ([1391f49](https://github.com/davecardwell/publix-coupon-clipper/commit/1391f496fa3d6e2ff47a0a25150fdb2798f5d74a))

## [1.0.1](https://github.com/davecardwell/publix-coupon-clipper/compare/v1.0.0...v1.0.1) (2019-10-14)


### Bug Fixes

* specify “bin” in package.json for npx usage ([490edb7](https://github.com/davecardwell/publix-coupon-clipper/commit/490edb7217fe6b570e170bffc84a8a775af1d3ea))

# 1.0.0 (2019-10-14)


### Features

* initial release ([6b8c685](https://github.com/davecardwell/publix-coupon-clipper/commit/6b8c685439b24519c4815c4c7d3abe86056fa322))
