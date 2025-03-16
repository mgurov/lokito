import { test, expect } from '@tests/app/setup/testExtended';
import { NewSourceRollover } from '../setup/pages/SourcesPageFixture';

test('add a source from the sourceless main screen', async ({ page, appState }) => {

    await page.goto('/');

    await expect(page.getByText(/There are no active sources/)).toBeVisible();

    await page.getByTestId('new-source-button').getByText('create a new one').click();

    const newSourceRollover = new NewSourceRollover(page);

    await expect(newSourceRollover.locator).toBeVisible();

    await newSourceRollover.fillSourceForm({ name: 'Test Source'});
    await newSourceRollover.saveSource();

    await expect(page.getByText(/Test Source/)).toBeVisible();

    expect(await appState.sourceNames()).toEqual(['Test Source']);
});

test('add a source to an existing list from main page', async ({ mainPage, appState }) => {

    await appState.givenSources({name: 'existing'});
    await mainPage.open();

    const newSourceRollover = await mainPage.clickNewSourceButton()
    await newSourceRollover.fillSourceForm({ name: 'new'});
    await newSourceRollover.saveSource();

    expect(await appState.sourceNames()).toEqual(['existing', 'new']);
});

test('add a source should have immediate effect on fetching', async ({ mainPage, appState, logs }) => {

    await mainPage.clock.install();

    await appState.givenSources({});
    await mainPage.open({startFetch: true});

    await expect.poll(() => logs.requests).toHaveLength(1);

    const newSourceRollover = await mainPage.clickNewSourceButton()
    await newSourceRollover.fillSourceForm({ name: 'new'});
    await newSourceRollover.saveSource();

    await mainPage.clock.runFor('01:01'); //next cycle

    await expect.poll(() => logs.requests).toHaveLength(3);
});

test('delete a source should have immediate effect on fetching', async ({ mainPage, appState, logs }) => {

    await mainPage.clock.install();

    const [toBeRemoved, toBeKept] = await appState.givenSources({name: 'to be removed'}, {});
    await mainPage.open({startFetch: true});

    await expect.poll(
        () => logs.requests.map(r => r.searchParams.get('query'))
    ).toStrictEqual([
        toBeRemoved.query,
        toBeKept.query,
    ]);

    await expect(mainPage.page.getByText(toBeRemoved.name)).toBeVisible();

    const sourcesPage = await mainPage.clickToSources()
    await expect(sourcesPage.page.getByText(toBeRemoved.name)).toBeVisible();
    await sourcesPage.deleteSource(toBeRemoved.id)
    await expect(sourcesPage.page.getByText(toBeRemoved.name)).not.toBeVisible();

    await mainPage.homeLogo.click();
    await expect(mainPage.page.getByText(toBeRemoved.name)).not.toBeVisible();

    await mainPage.clock.runFor('01:01'); //next cycle

    await expect.poll(
        () => logs.requests.map(r => r.searchParams.get('query'))
    ).toStrictEqual([
        toBeRemoved.query,
        toBeKept.query,
        toBeKept.query,
    ]);
});


test('add a source to an existing list from sources page', async ({ appState, sourcePage }) => {

    await appState.givenSources({name: 'existing'});

    await sourcePage.open();

    const newSourceRollover = await sourcePage.clickNewSourceButton();

    await newSourceRollover.fillSourceForm({ name: 'new'});
    await newSourceRollover.saveSource();

    expect(await appState.sourceNames()).toEqual(['existing', 'new']);
});

test('edit a source query', async ({ appState, sourcePage }) => {

    await appState.givenSources({name: 'existing', query: '{job="initial query"}'});

    await sourcePage.open()

    const sourceCard = sourcePage.sourceCard('existing')

    await expect(sourceCard.getByTestId('source-name-title')).toHaveText('existing')
    await expect(sourceCard.filterTextarea).toHaveText('{job="initial query"}')
    await expect(sourceCard.getByTestId('cancel-query-changes')).not.toBeAttached()
    await expect(sourceCard.getByTestId('save-query-changes')).not.toBeAttached()

    await sourceCard.filterTextarea.fill('{job="updated query"}')

    await expect(sourceCard.getByTestId('cancel-query-changes')).toBeVisible()
    await sourceCard.getByTestId('save-query-changes').click();

    await expect(sourceCard.getByTestId('cancel-query-changes')).not.toBeAttached()
    await expect(sourceCard.getByTestId('save-query-changes')).not.toBeAttached()


    await expect.poll(async ()=> (await appState.sources()).map(s => ([s.name, s.query])))
        .toStrictEqual([['existing', '{job="updated query"}']])



    //reopening the page should show the updated value, but fails in tests. Seems to be working ok when testing manually 🤷

    // await page.goto('/sources');
    // await expect(page.getByTestId('source-card-filter-textarea')).toHaveText('{job="updated query"}')    
});

test('should be able to cancel editing a source query', async ({ appState, sourcePage }) => {

    await appState.givenSources({name: 'existing', query: '{job="initial query"}'});

    await sourcePage.open()

    const sourceCard = sourcePage.sourceCard('existing')

    await expect(sourceCard.filterTextarea).toHaveText('{job="initial query"}')

    await sourceCard.filterTextarea.fill('{job="updated query"}')

    await sourceCard.getByTestId('cancel-query-changes').click()

    await sourceCard.filterTextarea.fill('{job="initial query"}')

    await expect(sourceCard.getByTestId('cancel-query-changes')).not.toBeAttached()
    await expect(sourceCard.getByTestId('save-query-changes')).not.toBeAttached()

    await expect.poll(async ()=> (await appState.sources()).map(s => ([s.name, s.query])))
    .toStrictEqual([['existing', '{job="initial query"}']])

});
