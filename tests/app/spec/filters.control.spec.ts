import { test, expect } from '@tests/app/setup/testExtended';

test('created filter should be visible and show acked elements', async ({ page, appState, mainPage, logs }) => {

    const [source] = await appState.givenSources({});
    logs.givenSourceRecords(source, 'yes1', 'yes2', 'xxx');

    await mainPage.open({startFetch: true});

    await test.step('create a filter', async() => {
        await page.getByText('yes1').click();
        await page.getByTestId('new-rule-button').click();
        await page.getByTestId('rule_regex').fill('yes');
        await page.getByTestId('save-rule-button').click();
    })

    await mainPage.expectLogMessages('xxx');


    await test.step('create another filter', async() => {
        await page.getByText('xxx').click();
        await page.getByTestId('new-rule-button').click();
        await page.getByTestId('save-rule-button').click();
    })

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

//TODO: stats cleaned from local storage on filter deletion.
//TODO: actually, the filter deletion.