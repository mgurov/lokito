import { expect, Locator, test } from "@playwright/test";

export async function expectTexts(locator: Locator, ...expected: string[]) {
  await test.step("expectTexts", async () => {
    await expect.poll(() => locator.allTextContents()).toStrictEqual(expected);
  }, { box: true });
}
