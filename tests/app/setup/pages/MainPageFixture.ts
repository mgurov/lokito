import { test, Page, expect, Locator } from '@playwright/test';
import SourcePageFixture, { NewSourceRollover } from './SourcesPageFixture';
import { expectTexts } from '@tests/app/util/visualAssertions';

export const mainPageTest = test.extend<{ mainPage: MainPageFixture }>({
    mainPage: [async ({ page }, use) => {

        await use(new MainPageFixture(page));

    }, {}],
});


//TODO: decorate the fixture?
export default class MainPageFixture {
    constructor(readonly page: Page) { }

    async open({
        executeBefore,
        startFetch = false,
    }: {
        executeBefore?: () => Promise<void>,
        startFetch?: boolean,
    } = {}) {

        if (executeBefore) {
            await executeBefore();
        }
        await this.page.goto('/');
        if (startFetch === true) {
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

    get logMessage() {
        return this.page.getByTestId('log-message')
    }

    async expectLogMessages(...expected: string[]) {
        await test.step('expectLogMessages', () => expectTexts(this.logMessage, ...expected), {box: true})
    }

    async expandRow(message: string): Promise<RowLine> {
        const locator = this.logMessage.getByText(message)
        await locator.click()
        return new RowLine(this.page)
    }

    async selectSourceTab(source: {id: string}) {
        await this.page.getByTestId(`source-tab-${source.id}`).click();
    }

    async selectAllSourcesTab() {
        await this.page.getByTestId('all-sources-tab').click();
    }

    async expectSourceTabCount(source: {id: string}, count: number | undefined) {
        await test.step('expectSourceTabCount', async() => {
            const unackCountLocator = this.page.getByTestId(`source-tab-${source.id}`).getByTestId('source-unack-count')
            if (count === undefined) {
                await expect(unackCountLocator).not.toBeAttached()
            } else {
                await expect(unackCountLocator).toHaveText(`${count}`)
            }
        }, {box: true})        
    }
}

//NB: full-page ATM
class RowLine {
    constructor(public page: Page) {}

    get ackTillThis() {
        return this.page.getByTestId('ack-till-this')
    }
}