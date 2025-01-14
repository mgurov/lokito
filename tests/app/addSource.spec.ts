import { Locator, Page } from '@playwright/test';
import { test, expect } from '@tests/app/setup/testExtended';


test('add a source from the sourceless main screen', async ({ page, appState }) => {
    await page.goto('/');

    await page.getByTestId('new-source-button').getByText('create a new one').click();

    const newSourceRollover = new NewSourceRollover(page);

    await expect(newSourceRollover.locator).toBeVisible();

    await newSourceRollover.fillSourceForm({ name: 'Test Source'});
    await newSourceRollover.saveSource();

    await expect(page.getByText(/Test Source/)).toBeVisible();

    expect(await appState.sourceNames()).toEqual(['Test Source']);
});

test('add a source to an existing list from main page', async ({ page, appState }) => {

    await appState.givenSources({name: 'existing'});

    await page.goto('/');

    await page.getByTestId('new-source-button').getByText('New Source').click();

    const newSourceRollover = new NewSourceRollover(page);

    await newSourceRollover.fillSourceForm({ name: 'new'});
    await newSourceRollover.saveSource();

    expect(await appState.sourceNames()).toEqual(['existing', 'new']);
});

test('add a source to an existing list from sources page', async ({ page, appState }) => {

    await appState.givenSources({name: 'existing'});

    await page.goto('/');

    await page.getByTestId('sources-button').click(); 

    await page.getByTestId('new-source-button').getByText('New Source').click();

    const newSourceRollover = new NewSourceRollover(page);

    await newSourceRollover.fillSourceForm({ name: 'new'});
    await newSourceRollover.saveSource();

    expect(await appState.sourceNames()).toEqual(['existing', 'new']);
});


class NewSourceRollover {
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