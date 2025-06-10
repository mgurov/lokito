import { FiltersLocalStorage } from '@/data/filters/filter';
import { test, expect } from '@tests/app/setup/testExtended';

test('created filter should be visible and show acked elements', async ({ mainPage, logs }) => {

    logs.givenRecords('yes1', 'yes2', 'xxx');

    await mainPage.open();

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

    logs.givenRecords('yes1', 'yes2', 'xxx');
    await appState.givenFilters('yes')

    await mainPage.open();

    await mainPage.expectLogMessages('xxx');

    const filtersPage = await mainPage.openFiltersPage()
    const yesFilterCard = filtersPage.getFilterCard({regex: 'yes'})
    await expect(yesFilterCard.currentHitCount).toHaveText('2')
});


test('filter with TTL should show such', async ({ appState, filtersPage }) => {

    await appState.givenFilters(
        {messageRegex: 'yes', autoAckTillDate: '2025-05-28'},
        {messageRegex: 'no', autoAckTillDate: undefined},
    )
    await filtersPage.open()
    
    const yesFilterCard = filtersPage.getFilterCard({regex: 'yes'})
    await expect(yesFilterCard.ttl).toHaveText('till 2025-05-28')

    const noFilterCard = filtersPage.getFilterCard({regex: 'no'})
    await expect(noFilterCard.ttl).not.toBeAttached()

});

test('global stats should remain across the refreshes', async ({ appState, mainPage, logs }) => {

    await appState.givenFilters('yes', 'xxx')
    logs.givenRecords('yes1', 'yes2', 'xxx');

    await mainPage.open();

    await mainPage.expectAckMessages(3)

    const filtersPage = await mainPage.openFiltersPage()
    const yesFilterCard = filtersPage.getFilterCard({regex: 'yes'})
    await expect(yesFilterCard.currentHitCount).toHaveText('2')
    await expect(yesFilterCard.totalHitCount).toHaveText('2')

    //more logs and restart fetching
    logs.givenRecords('yes3');
    await mainPage.open();
    await mainPage.expectAckMessages(1)
    await mainPage.openFiltersPage()
    await expect(yesFilterCard.currentHitCount).toHaveText('1')
    await expect(yesFilterCard.totalHitCount).toHaveText('3')
});

test('stats updated on fetches when filters page is open', async ({ appState, mainPage, logs }) => {

    await mainPage.clock.install()

    await appState.givenFilters('yes')
    logs.givenRecords('yes1', 'yes2');

    await mainPage.open();

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

    logs.givenRecords('yes1', 'yes2', 'xxx');
    await appState.givenFilters('yes')

    await mainPage.open();

    await mainPage.expectLogMessages('xxx');

    const filtersPage = await mainPage.openFiltersPage()
    const yesFilterCard = filtersPage.getFilterCard({regex: 'yes'})
    await yesFilterCard.deleteButton.click()

    await expect(yesFilterCard.deleteButton).not.toBeAttached()

    await expect.poll(
        () => appState.storage.getLocalItem<Array<unknown>>(FiltersLocalStorage.filterStats.STORAGE_KEY)
        ).toStrictEqual({})


    await mainPage.homeLogo.click()
    await mainPage.expectLogMessages('xxx', 'yes2', 'yes1');

    await test.step('more logs fetched', async() => {
        logs.givenRecords('yes3')
        await mainPage.clock.runFor('01:01')
    })

    await mainPage.expectLogMessages('yes3', 'xxx', 'yes2', 'yes1');    
});

test('should show whether filter is acking', async ({ appState, filtersPage }) => {
    await appState.givenFilters(
        { messageRegex: 'yes', autoAck: true },
        { messageRegex: 'undefined', autoAck: undefined },
        { messageRegex: 'no', autoAck: false },
    )
    
    await filtersPage.open();

    await expect(
        filtersPage.getFilterCard({regex: 'yes'}).autoAckSign
    ).toContainText("Auto Ack");

    await expect(
        filtersPage.getFilterCard({regex: 'no'}).autoAckSign
    ).not.toBeAttached();

    await expect(
        filtersPage.getFilterCard({regex: 'undefined'}).autoAckSign
    ).toContainText("Auto Ack");


});