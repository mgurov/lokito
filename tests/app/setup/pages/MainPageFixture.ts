import { test, Page, expect, Locator } from '@playwright/test';
import SourcePageFixture, { NewSourceRollover } from './SourcesPageFixture';
//TODO: hide expect from the default visibility. ?

type MainPageOpenProps = {
    executeBefore?: () => Promise<void>,
    startFetch?: boolean, //TODO: default to true?
}

//TODO: decorate the fixture?
export default class MainPageFixture {
    constructor(readonly page: Page) { }

    async open(preOpts: (() => Promise<void>) | MainPageOpenProps = {}) {

        const opts: MainPageOpenProps = typeof(preOpts) === 'function' ? {executeBefore: preOpts} : preOpts;

        if (opts.executeBefore) {
            await opts.executeBefore();
        }
        await this.page.goto('/');
        if (opts.startFetch === true) {
            await this.page.getByTestId('start-fetching-button').click(); 
        }
    }

    get startFetchingButton() {
        return this.page.getByTestId('start-fetching-button');
    }

    async expectAckMessages(count: number) {
        const ackedMessagesCounter = this.page.getByTestId('acked-messages-count')
        await expect(ackedMessagesCounter).toHaveText(`${count} ACK'ed`)
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

    get ackAllButton(): Locator {
        return this.page.getByTestId('ack-all-button')
    }

    async clickAckAll(props: {expectedCount?: number} = {}) {
        if (props.expectedCount) {
            await expect(this.ackAllButton).toHaveText(`ACK ${props.expectedCount}`)
        }
        await this.ackAllButton.click();
    }
}

export const mainPageTest = test.extend<{ mainPage: MainPageFixture }>({
    mainPage: [async ({ page }, use) => {

        await use(new MainPageFixture(page));

    }, {}],
});
