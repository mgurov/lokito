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

    const xxxFilterCard = filtersPage.getFilterCard({regex: 'xxx'})
    await expect(xxxFilterCard.currentHitCount).toHaveText('1')
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