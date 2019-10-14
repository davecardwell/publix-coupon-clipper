# publix-coupon-clipper

[![Build Status](https://travis-ci.org/davecardwell/publix-coupon-clipper.svg?branch=master)](https://github.com/davecardwell/publix-coupon-clipper/workflows/Release/badge.svg)
[![npm latest version](https://img.shields.io/npm/v/publix-coupon-clipper/latest.svg)](https://www.npmjs.com/package/publix-coupon-clipper)

[Publix](https://www.publix.com/) is a grocery chain that operates throughout the Southeastern United States. This script uses [Puppeteer](https://developers.google.com/web/tools/puppeteer/) to automatically clip [digital coupons](https://www.publix.com/savings/coupons/digital-coupons) which can then be applied to your purchases in store if you provide your phone number at checkout.

<pre>🚨🚨🚨

I am not affiliated with Publix and offer no warranty for the use of this code.

🚨🚨🚨</pre>

## Command-line Usage

```sh
npx publix-coupon-clipper [email] [password]
```

If you do not provide your [Publix.com](https://www.publix.com/) email address and password the script will check the `PUBLIX_EMAIL` and `PUBLIX_PASSWORD` environment variables. If either of these are missing, you will be prompted for the value to use.

## Package Usage

`publix-coupon-clipper` can also installed from [NPM](https://www.npmjs.com/package/publix-coupon-clipper) and used in your own Node.js script.

```javascript
const { clipCoupons } = require("publix-coupon-clipper");

(async () => {
  const couponCount = await clipCoupons({
    publixEmail: "foobar@example.com",
    publixPassword: "letmein",
  });

  console.log(`Coupons clipped: ${couponCount}`);
})();
```

You can optionally provide your own Puppeteer `browser` instance to use:

```javascript
const { clipCoupons } = require("publix-coupon-clipper");
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });

  await clipCoupons({
    publixEmail: "foobar@example.com",
    publixPassword: "letmein",
    browser,
  });

  // Don’t forget to dispose of your browser!
  await browser.close();
})();
```

An `EventEmitter` called `events` is also exported which provides `info` messages that are useful for logging progress:

```javascript
const { clipCoupons, events } = require("publix-coupon-clipper");

(async () => {
  events.on("info", message => console.log(new Date(), message));

  await clipCoupons({
    publixEmail: "foobar@example.com",
    publixPassword: "letmein",
  });
})();

// 2019-07-29T02:52:34.830Z 'Setting up page'
// 2019-07-29T02:52:34.931Z 'Logging in to Publix.com'
// 2019-07-29T02:52:38.807Z 'Logged in successfully'
// 2019-07-29T02:52:38.807Z 'Clipping coupons'
// 2019-07-29T02:52:42.322Z 'Clipping coupon #1'
// 2019-07-29T02:52:43.458Z 'Clipping coupon #2'
// 2019-07-29T02:52:44.587Z 'Clipping coupon #3'
// …
// 2019-07-29T02:52:52.827Z  Clipped 10 coupon(s), failed to clip 0
```
