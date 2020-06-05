import EventEmitter from "events";
import type TypedEmitter from "typed-emitter";
import inquirer from "inquirer";
import puppeteer, { Browser, Request, Page } from "puppeteer";
import { URL } from "url"; // not added to `global` until Node.js v10

/**
 * If we’re being run directly and not imported as a package then call the
 * `main()` function.
 */
if (require.main === module) {
  (async (): Promise<void> => {
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
 * Filter `puppeteer.Request`s so we only complete publix.com and CDN requests,
 * and we only fetch documents, JavaScript, and API requests.
 */
function filterRequests(request: Request): void {
  const url = new URL(request.url());
  if (!/(?:^|\.)publix\.com$/.test(url.hostname)) {
    request.abort();
    return;
  }

  switch (request.resourceType()) {
    case "document":
      events.emit(
        "info",
        `New document request: ${request.method()} ${request.url()}`,
      );
      request.continue();
      break;

    case "fetch":
    case "script":
    case "xhr":
      request.continue();
      break;

    default:
      request.abort();
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

  const couponUrl = "https://www.publix.com/savings/digital-coupons";

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
  await Promise.all([page.waitForNavigation(), page.click("a.sign-in-button")]);

  // Fill out the login form
  await page.type("#tmpUserNameInput", publixEmail);
  await page.type("#passwordInput", publixPassword);

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
    new Promise((resolve, reject): void => {
      let didNavigate = false;

      const navigationListener = (): void => {
        if (page.url() === couponUrl) {
          page.removeListener("framenavigated", navigationListener);
          didNavigate = true;
          resolve();
        }
      };

      page.on("framenavigated", navigationListener);

      page
        .waitForSelector("#error", { visible: true })
        .then(
          async (elementHandle): Promise<void> => {
            const formError = await elementHandle.evaluate(
              (element): string =>
                element.textContent?.trim() ?? "Unknown error",
            );

            await elementHandle.dispose();

            page.removeListener("framenavigated", navigationListener);

            reject(new Error(`Login failed: ${formError}`));
          },
        )
        .catch((err): void => {
          /* Ignore errors if we have already navigated */
          if (!didNavigate) {
            reject(err);
          }
        });
    }),

    page.click("#submitButton"),
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

  // Click the “Show all” button and wait for them to appear
  await page.waitForSelector(".show-all-link button", { visible: true });
  await page.click(".show-all-link button");
  await Promise.all([
    page.waitForSelector(".show-all-link button", { hidden: true }),
    page.waitForSelector(".card.savings .buttons-area button", {
      visible: true,
    }),
  ]);

  const buttonHandles = await page.$$(
    ".savings-container .card.savings .buttons-area button:not(.clipped)",
  );

  const couponCount = buttonHandles.length;
  events.emit("info", `Found ${couponCount} coupon(s) to clip`);

  let clippedCount = 0,
    errorCount = 0;

  for (let i = 0; i < couponCount; ++i) {
    console.log(`Clipping coupon #${i + 1}`);

    const buttonHandle = buttonHandles[i];

    await buttonHandle.click();
    await page.waitForFunction(
      (button: Element): boolean => !button.classList.contains("loading"),
      { polling: "mutation" },
      buttonHandle,
    );

    const isClipped = await buttonHandle.evaluate((button): boolean =>
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
  const { argument } = await inquirer.prompt({
    type: isSecret ? "password" : "input",
    name: "argument",
    message: description,
    validate: (input: string): boolean | string =>
      input.length > 0 ? true : `This argument is required`,
  });

  return argument;
}
