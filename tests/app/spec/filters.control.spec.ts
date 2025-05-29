import { FILTERS_STATS_STORAGE_KEY } from '@/data/filters/filter';
import { test, expect } from '@tests/app/setup/testExtended';

test('created filter should be visible and show acked elements', async ({ appState, mainPage, logs }) => {

    const [source] = await appState.givenSources({});
    logs.givenSourceRecords(source, 'yes1', 'yes2', 'xxx');

    await mainPage.open({startFetch: true});

    await mainPage.createFilter({logLineText: 'yes1', filterRegex: 'yes'})

    await mainPage.expectLogMessages('xxx');

    await mainPage.createFilter({logLineText: 'xxx', stepName: 'create another filter'})

    await mainPage.expectLogMessages(...[]);

    const filtersPage = await mainPage.openFiltersPage()
    const yesFilterCard = filtersPage.getFilterCard({regex: 'yes'})
    await expect(yesFilterCard.currentHitCount).toHaveText('2')
    await expect(yesFilterCard.totalHitCount).toHaveText('2')

    const xxxFilterCard = filtersPage.getFilterCard({regex: 'xxx'})
    await expect(xxxFilterCard.currentHitCount).toHaveText('1')

    await test.step('should preserve the total counts on reload', async() => {
        await filtersPage.open()
        await expect(yesFilterCard.currentHitCount).toHaveText('0')
        await expect(yesFilterCard.totalHitCount).toHaveText('2')    
    })
});

test('existing filter should be visible and show acked elements', async ({ appState, mainPage, logs }) => {

    const [source] = await appState.givenSources({});
    logs.givenSourceRecords(source, 'yes1', 'yes2', 'xxx');
    await appState.givenFilter('yes')

    await mainPage.open({startFetch: true});

    await mainPage.expectLogMessages('xxx');

    const filtersPage = await mainPage.openFiltersPage()
    const yesFilterCard = filtersPage.getFilterCard({regex: 'yes'})
    await expect(yesFilterCard.currentHitCount).toHaveText('2')
});

test('global stats should remain across the refreshes', async ({ appState, mainPage, logs }) => {

    await appState.givenSources({});
    await appState.givenFilters('yes', 'xxx')
    logs.givenRecords('yes1', 'yes2', 'xxx');

    await mainPage.open({startFetch: true});

    await mainPage.expectAckMessages(3)

    const filtersPage = await mainPage.openFiltersPage()
    const yesFilterCard = filtersPage.getFilterCard({regex: 'yes'})
    await expect(yesFilterCard.currentHitCount).toHaveText('2')
    await expect(yesFilterCard.totalHitCount).toHaveText('2')

    //more logs and restart fetching
    logs.givenRecords('yes3');
    await mainPage.open({startFetch: true});
    await mainPage.expectAckMessages(1)
    await mainPage.openFiltersPage()
    await expect(yesFilterCard.currentHitCount).toHaveText('1')
    await expect(yesFilterCard.totalHitCount).toHaveText('3')
});

test('stats updated on fetches when filters page is open', async ({ appState, mainPage, logs }) => {

    await mainPage.clock.install()

    await appState.givenSource();
    await appState.givenFilters('yes')
    logs.givenRecords('yes1', 'yes2');

    await mainPage.open({startFetch: true});

    const filtersPage = await mainPage.openFiltersPage()
    const yesFilterCard = filtersPage.getFilterCard({regex: 'yes'})
    await expect(yesFilterCard.currentHitCount).toHaveText('2')
    await expect(yesFilterCard.totalHitCount).toHaveText('2')

    await test.step('more logs fetched', async() => {
        logs.givenRecords('yes3', 'yes4')
        await mainPage.clock.runFor("01:01")
    })

    await expect(yesFilterCard.currentHitCount).toHaveText('4')
    await expect(yesFilterCard.totalHitCount).toHaveText('4')
});

test('should allow filter deletion', async ({ appState, mainPage, logs }) => {

    await mainPage.clock.install()

    await appState.givenSource();
    logs.givenRecords('yes1', 'yes2', 'xxx');
    await appState.givenFilter('yes')

    await mainPage.open({startFetch: true});

    await mainPage.expectLogMessages('xxx');

    const filtersPage = await mainPage.openFiltersPage()
    const yesFilterCard = filtersPage.getFilterCard({regex: 'yes'})
    await yesFilterCard.deleteButton.click()

    await expect(yesFilterCard.deleteButton).not.toBeAttached()

    await expect.poll(
        () => appState.storage.getLocalItem<Array<unknown>>(FILTERS_STATS_STORAGE_KEY)
        ).toStrictEqual({})


    await mainPage.homeLogo.click()
    await mainPage.expectLogMessages('xxx', 'yes2', 'yes1');

    await test.step('more logs fetched', async() => {
        logs.givenRecords('yes3')
        await mainPage.clock.runFor('01:01')
    })

    await mainPage.expectLogMessages('yes3', 'xxx', 'yes2', 'yes1');    
});