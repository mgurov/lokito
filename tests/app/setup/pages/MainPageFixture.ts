import { test, Page } from '@playwright/test';

export default class MainPageFixture {
    constructor(readonly page: Page) { }
}

export const appStateTest = test.extend<{ mainPage: MainPageFixture }>({
    mainPage: [async ({ page }, use) => {
        await use(new MainPageFixture(page));
    }, {}],
});
