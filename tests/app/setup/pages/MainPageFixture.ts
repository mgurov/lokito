import { test, Page, expect, Locator } from '@playwright/test';
import SourcePageFixture, { NewSourceRollover, SourceCardFixture } from './SourcesPageFixture';
import { expectTexts } from '@tests/app/util/visualAssertions';
import FiltersPageFixture from './FiltersPageFixture';

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
            await this.page.getByTestId('fetch-option').getByText('now').click(); 
        }
    }

    startFetchingButton(from: string = 'now') {
        return this.page.getByTestId('fetch-option').getByText(from);
    }

    get ackedMessagesCount() {
        return this.page.getByTestId('acked-messages-count')
    }

    async expectAckMessages(count: number) {
        const ackedMessagesCounter = this.ackedMessagesCount
        await expect(ackedMessagesCounter).toHaveText(`ACK'ed ${count}`)
    }

    get cleanBacklogMessage() {
        return this.page.getByText('Clean ✅');
    }

    async clickToSources() {
        await this.page.getByTestId('sources-button').click();
        return new SourcePageFixture(this.page);
    }

    async openFiltersPage() {
        await this.page.getByTestId('filters-button').click();
        return new FiltersPageFixture(this.page);
    }

    get homeLogo() {
        return this.page.getByTestId('home-page-logo');
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

    get cleanCheck(): Locator {
        return this.page.getByText('Clean ✅')
    }

    async clickAckAll(props: {expectedCount?: number} = {}) {
        await test.step('clickAckAll', async () => {
            if (props.expectedCount) {
                await expect(this.ackAllButton).toHaveText(`ACK ${props.expectedCount}`)
            }
            await this.ackAllButton.click();
        }, {box: true})
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

    sourceTabHeader(source: {id: string}) {
        return this.page.getByTestId(`source-tab-${source.id}`)
    }

    async selectSourceTab(source: {id: string}) {
        await this.sourceTabHeader(source).click();
    }

    async selectAllSourcesTab() {
        await this.page.getByTestId('all-sources-tab').click();
    }

    async expectSourceTabCount(source: {id: string}, count: number | undefined) {
        await test.step('expectSourceTabCount', async() => {
            const unackCountLocator = this.sourceTabHeader(source).getByTestId('source-unack-count')
            if (count === undefined) {
                await expect(unackCountLocator).not.toBeAttached()
            } else {
                await expect(unackCountLocator).toHaveText(`${count}`)
            }
        }, {box: true})        
    }

    get clock() {
        return this.page.clock
    }

    getByTestId(testId: string) {
        return this.page.getByTestId(testId)
    }

    get showSourceButton() {
        return this.page.getByTestId('show-source-button')
    }

    async showSource() {
        await this.showSourceButton.click()
        return new SourceCardFixture(this.page)
    }
}

//NB: full-page ATM
class RowLine {
    constructor(public page: Page) {}

    get ackTillThis() {
        return this.page.getByTestId('ack-till-this')
    }
}