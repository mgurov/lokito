import { ConsoleMessage, expect, test } from "@playwright/test";

class ConsoleLoggingFixture {
  public messages: ConsoleMessage[] = [];
  public failImmediately: boolean = false;
  public ignoreErrorMessagesContainingStrings: string[] = [];
  ignoreErrorMessagesContaining(substring: string) {
    this.ignoreErrorMessagesContainingStrings.push(substring);
  }
}

export const consoleLoggingTest = test.extend<{ consoleLogging: ConsoleLoggingFixture }>({
  consoleLogging: [async ({ page }, use) => {
    const consoleLogging = new ConsoleLoggingFixture();

    consoleLogging.ignoreErrorMessagesContaining("error fetching logs");
    consoleLogging.ignoreErrorMessagesContaining("Failed to load resource:");
    consoleLogging.ignoreErrorMessagesContaining(
      "React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7.",
    );
    consoleLogging.ignoreErrorMessagesContaining(
      "React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7.",
    );

    let consoleErrorDetected: string | null = null;

    page.on("console", msg => {
      consoleLogging.messages.push(msg);
      if (msg.type() === "error" || msg.type() === "warning") {
        if (consoleLogging.ignoreErrorMessagesContainingStrings.some(ignoredText => msg.text().includes(ignoredText))) {
          return;
        }

        if (consoleLogging.failImmediately) {
          throw new Error(`Console ${msg.type()} detected: ${msg.text()}`);
        } else {
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
