import {Locator, Page, test} from '@playwright/test'

export default class SourcePageFixture {
    constructor(public page: Page) {}
 
    async open() {
        await this.page.goto('/sources');
    }

    sourceCard(_sourceName: string) {
        return new SourceCard(this.page) // NB: need to isolate from other sources eventually
    }

    async clickNewSourceButton() {
        await this.page.getByTestId('new-source-button').getByText('New Source').click();
        return new NewSourceRollover(this.page)
    }

    async deleteSource(sourceId: string) {
        await this.page.getByTestId(`delete-source-${sourceId}`).click();
    }
}

export const sourcePageTest = test.extend<{ sourcePage: SourcePageFixture }>({
    sourcePage: [async ({ page }, use) => {

        await use(new SourcePageFixture(page));

    }, {}],
});


class SourceCard {
    constructor(public page: Page) {}

    getByTestId(testId: string|RegExp): Locator {
        return this.page.getByTestId(testId)
    }

    get filterTextarea() {
        return this.page.getByTestId('source-card-filter-textarea')
    }

    async changeQuery(queryText: string) {
        await this.filterTextarea.fill(queryText)
        await this.page.getByTestId('save-query-changes').click();
    }
}


export class NewSourceRollover {
    public locator: Locator;

    constructor(page: Page) {
        this.locator = page.getByTestId('new-source-sheet')
    }

    async fillSourceForm(opts: { name?: string; query?: string } = {}) {
        await this.locator.getByLabel('Name').fill(opts.name ?? 'a source');
        await this.locator.getByLabel('Loki query').fill(opts.query ?? '{job="test"}');
    }

    async saveSource() {
        await this.locator.getByTestId('save-source-button').click();
    }
}