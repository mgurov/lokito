import { test, Page, expect } from '@playwright/test';
//TODO: hide expect from the default visibility.

//TODO: decorate the fixture?
export default class MainPageFixture {
    constructor(readonly page: Page) { }

    async open(preparation?: () => Promise<void>) {
        if (preparation) {
            await preparation();
        }
        await this.page.goto('/');
    }

    get startFetchingButton() {
        return this.page.getByTestId('start-fetching-button');
    }

    async expectAckMessages(count: number) {
        await expect(this.page.getByText(`${count} ACK messages`)).toBeVisible();
    }

    get cleanBacklogMessage() {
        return this.page.getByText('Clean ✅');
    }
}

export const mainPageTest = test.extend<{ mainPage: MainPageFixture }>({
    mainPage: [async ({ page }, use) => {

        await use(new MainPageFixture(page)); //TODO: fix the use hint to prod code only.

    }, {}],
});
