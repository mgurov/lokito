import { ConsoleMessage, expect, test } from "@playwright/test";

class ConsoleLoggingFixture {
  public messages: ConsoleMessage[] = [];
  public failImmediately: boolean = false;
  public ignoreErrorMessagesContainingStrings: string[] = [];
  ignoreErrorMessagesContaining(substring: string) {
    this.ignoreErrorMessagesContainingStrings.push(substring);
  }
}

// TODO: refactor as per example at https://dou.ua/forums/topic/54967/
export const consoleLoggingTest = test.extend<{ consoleLogging: ConsoleLoggingFixture }>({
  consoleLogging: [async ({ page }, use, testInfo) => {
    const consoleLogging = new ConsoleLoggingFixture();

    let consoleErrorDetected: string | null = null;

    page.on("console", async msg => {
      consoleLogging.messages.push(msg);
      if (msg.type() === "error" || msg.type() === "warning") {
        if (consoleLogging.ignoreErrorMessagesContainingStrings.some(ignoredText => msg.text().includes(ignoredText))) {
          return;
        }

        if (consoleLogging.failImmediately) {
          throw new Error(`Console ${msg.type()} detected: ${msg.text()}`);
        } else {
          await testInfo.attach(`console.${msg.type()}: ${msg.text()}`);
          if (consoleErrorDetected === null) {
            consoleErrorDetected = msg.text();
          }
          console.error(`Console ${msg.type()} detected: ${msg.text()}`);
        }
      }
    });

    await use(consoleLogging);

    expect(
      consoleErrorDetected,
      "Errors detected in the console. Check the browser console." + (consoleLogging.failImmediately
        ? ""
        : " Hint: use consoleLogging.failImmediately to stopping the test immediately."),
    ).toBe(null);
  }, { auto: true }],
});
