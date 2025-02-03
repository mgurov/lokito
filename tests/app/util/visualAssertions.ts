import { Locator, expect } from '@playwright/test';

export async function expectTexts(locator: Locator, ...expected: string[]) {
    await expect(locator).toHaveCount(expected.length);
    expect(await locator.allTextContents()).toStrictEqual(expected);
  }
  