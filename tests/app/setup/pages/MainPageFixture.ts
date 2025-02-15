import { test, Page, expect } from '@playwright/test';
import SourcePageFixture, { NewSourceRollover } from './SourcesPageFixture';
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

    async clickToSources() {
        await this.page.getByTestId('sources-button').click();
        return new SourcePageFixture(this.page);
    }

    async clickNewSourceButton() {
        await this.page.getByTestId('new-source-button').getByText('New Source').click();

        const newSourceRollover = new NewSourceRollover(this.page);

        await expect(newSourceRollover.locator).toBeVisible();

        return newSourceRollover
    
    } 
}

export const mainPageTest = test.extend<{ mainPage: MainPageFixture }>({
    mainPage: [async ({ page }, use) => {

        await use(new MainPageFixture(page));

    }, {}],
});
