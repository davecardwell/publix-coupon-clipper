import type { Browser, ElementHandle, HTTPRequest, Page } from "puppeteer";
import type TypedEmitter from "typed-emitter";

import { EventEmitter } from "events";
import inquirer from "inquirer";
import puppeteer from "puppeteer";

/**
 * If we’re being run directly and not imported as a package then call the
 * `main()` function.
 */
if (require.main === module) {
  void (async (): Promise<void> => {
    try {
      await main();
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}

/**
 * A list of events that can be emitted.
 */
interface Events {
  /**
   * @param message A progress update suitable for logging
   */
  info: (message: string) => void;
}

/**
 * An `EventEmitter` for keeping track of `PublixCouponClipper`’s progress.
 */
export const events = new EventEmitter() as TypedEmitter<Events>;

/**
 * Create a headless browser, log in to https://www.publix.com/, and clip any
 * available digital coupons.
 *
 * @param options
 * @param options.publixEmail The publix.com account email address.
 * @param options.publixPassword The publix.com account password.
 * @param options.browser Provide your own `puppeteer.Browser` to use. Note that
 *     in this case it is your responsibility to call `browser.close()` after
 *     this function completes.
 *
 * @returns The number of coupons successfully clipped.
 */
export const clipCoupons = async ({
  publixEmail,
  publixPassword,
  browser: browserArg,
}: {
  publixEmail: string;
  publixPassword: string;
  browser?: Browser;
}): Promise<number> => {
  const browser = browserArg ?? (await puppeteer.launch());

  try {
    const page = await createPage(browser);

    await logInToPublix(page, publixEmail, publixPassword);

    const clippedCouponCount = await processCoupons(page);
    return clippedCouponCount;
  } finally {
    // If we created the Puppeteer browser we need to close it
    if (browser !== browserArg) {
      await browser.close();
    }
  }
};

/**
 * Create a `puppeteer.Page` and set up request interception.
 */
async function createPage(browser: Browser): Promise<Page> {
  events.emit("info", "Setting up page");

  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on("request", filterRequests);

  return page;
}

/**
 * Filter `puppeteer.HTTPRequest`s so we only complete publix.com and CDN
 * requests, and we only fetch documents, JavaScript, and API requests.
 */
function filterRequests(request: HTTPRequest): void {
  const url = new URL(request.url());

  if (url.hostname === "cutpstorb2c.blob.core.windows.net") {
    void request.continue();
    return;
  }

  if (
    url.hostname !== "cutpcdnwimages.azureedge.net" &&
    !/(?:^|\.)publix\.com$/.test(url.hostname)
  ) {
    void request.abort();
    return;
  }

  switch (request.resourceType()) {
    case "document":
      events.emit(
        "info",
        `New document request: ${request.method()} ${request.url()}`,
      );
      void request.continue();
      break;

    case "other":
    case "script":
      void request.continue();
      break;

    case "fetch":
    case "xhr":
      // Only need to make API requests
      url.hostname === "services.publix.com" ||
      (url.hostname === "account.publix.com" &&
        url.searchParams.get("p") === "B2C_1A_PublixSignInMigration_Signin")
        ? void request.continue()
        : void request.abort();
      break;

    default:
      void request.abort();
  }
}

/**
 * Go through the publix.com login process.
 */
async function logInToPublix(
  page: Page,
  publixEmail: string,
  publixPassword: string,
): Promise<void> {
  events.emit("info", "Logging in to Publix.com");

  const couponUrl =
    "https://www.publix.com/savings/digital-coupons?sort=Newest";

  await page.goto(couponUrl);

  // Get rid of the instructional modal if it pops up
  const modalHandle = await page.$(".modal.instructional");

  if (modalHandle !== null) {
    if (await modalHandle.isIntersectingViewport()) {
      await page.click("button.cta-link");
    }

    await modalHandle.dispose();
  }

  // Click the login button and wait to navigate to the SSO site
  await Promise.all([
    page.waitForNavigation(),
    page
      .waitForSelector("#signInName", { visible: true })
      .then((handle) => handle?.dispose()),
    page.click("a.sign-in-button"),
  ]);

  // Fill out the login form
  await page.type("#signInName", publixEmail);
  await page.type("#password", publixPassword);

  // Click submit and wait until either we’re navigated back to the coupon page
  // or a login form error is made visible.
  //
  // Ideally here we would use a Promise.race() on page.waitForResponse() and
  // page.waitForSelector(), but if the form error appears first we’re going to
  // call browser.close() and that currently doesn’t abort waitForResponse() so
  // the process will hang until timeout [1]
  //
  // As a work-around for now we use page.on("framenavigated")
  //
  // [1] https://github.com/GoogleChrome/puppeteer/issues/4733
  await Promise.all([
    new Promise<void>((resolve, reject): void => {
      let didNavigate = false;

      const navigationListener = (): void => {
        if (page.url() === couponUrl) {
          page.off("framenavigated", navigationListener);
          didNavigate = true;
          resolve();
        }
      };

      page.on("framenavigated", navigationListener);

      page
        .waitForSelector(".error", { visible: true })
        .then(async (elementHandle): Promise<void> => {
          if (elementHandle === null) {
            throw new Error("Handle for `.error` element is null");
          }

          const formError = await elementHandle.evaluate(
            (element: Element): string =>
              element.textContent?.trim() ?? "Unknown error",
          );

          await elementHandle.dispose();

          page.off("framenavigated", navigationListener);

          reject(new Error(`Login failed: ${formError}`));
        })
        .catch((err): void => {
          /* Ignore errors if we have already navigated */
          if (!didNavigate) {
            reject(err);
          }
        });
    }),

    page.click("#next"),
  ]);

  events.emit("info", "Logged in successfully");
}

/**
 * Find any un-clipped coupons and clip them.
 *
 * @returns The number of coupons successfully clipped.
 */
async function processCoupons(page: Page): Promise<number> {
  events.emit("info", "Clipping coupons");

  let buttonHandles: ElementHandle[];
  {
    const loadMoreButton = await page.waitForXPath(
      "//div[contains(@class, 'card-loader')]//button[contains(., 'Load More')]",
      { visible: true },
    );

    if (loadMoreButton === null) {
      throw new Error("Handle for “Load More” button element is null");
    }

    // Keep clicking the “Load More” button until it is removed or the number of
    // unclipped coupons doesn’t change.
    let lastUnclippedCount = 0;
    while (
      (buttonHandles = await page.$$(
        ".savings-container .card.savings .buttons-area button:not(.clipped)",
      )).length !== lastUnclippedCount
    ) {
      lastUnclippedCount = buttonHandles.length;

      if ((await loadMoreButton.boundingBox()) === null) {
        // “Load More” button has been removed
        break;
      }

      await Promise.all([
        loadMoreButton.click(),
        ...buttonHandles.map((buttonHandle) => buttonHandle.dispose()),
      ]);
    }

    await loadMoreButton.dispose();
  }

  events.emit("info", `Found ${buttonHandles.length} coupon(s) to clip`);

  let couponCount = 0,
    clippedCount = 0,
    errorCount = 0;

  for (const buttonHandle of buttonHandles) {
    ++couponCount;
    events.emit("info", `Clipping coupon #${couponCount}`);

    await buttonHandle.click();
    await page
      .waitForFunction(
        (button: Element): boolean => !button.classList.contains("loading"),
        { polling: "mutation" },
        buttonHandle,
      )
      .then((handle) => handle.dispose());

    const isClipped = await buttonHandle.evaluate((button: Element): boolean =>
      button.classList.contains("clipped"),
    );

    if (isClipped) {
      ++clippedCount;
    } else {
      events.emit("info", "Failed to clip");
      ++errorCount;
    }

    await buttonHandle.dispose();
  }

  events.emit(
    "info",
    `Clipped ${clippedCount} coupon(s), failed to clip ${errorCount}`,
  );

  return clippedCount;
}

/**
 * If we’re running from the command line then grab the publix.com email
 * address and password and start clipping coupons.
 */
async function main(): Promise<void> {
  const publixEmail = await getArgument(
    2,
    "PUBLIX_EMAIL",
    "Publix.com email address",
  );
  const publixPassword = await getArgument(
    3,
    "PUBLIX_PASSWORD",
    "Publix.com password",
    true,
  );

  events.on("info", (message): void => console.log(message));

  await clipCoupons({ publixEmail, publixPassword });
}

/**
 * Try to fetch arguments from the command line, the environment variables, or
 * prompt for user input.
 *
 * @param argvIndex The index of the `process.argv` array to check.
 * @param envKey The key of `process.env` to check.
 * @param description The description to use when prompting for user input.
 * @param isSecret When true, don’t echo back user input (eg., for passwords).
 */
async function getArgument(
  argvIndex: number,
  envKey: string,
  description: string,
  isSecret = false,
): Promise<string> {
  return (
    process.argv[argvIndex] ??
    process.env[envKey] ??
    (await getArgumentFromPrompt(description, isSecret))
  );
}

/**
 * Prompt the user for a value.
 *
 * @param description The description to use.
 * @param isSecret When true, don’t echo back user input (eg., for passwords).
 */
async function getArgumentFromPrompt(
  description: string,
  isSecret: boolean,
): Promise<string> {
  const { argument } = await inquirer.prompt<{ argument: string }>({
    type: isSecret ? "password" : "input",
    name: "argument",
    message: description,
    validate: (input: string): boolean | string =>
      input.length > 0 ? true : `This argument is required`,
  });

  return argument;
}
