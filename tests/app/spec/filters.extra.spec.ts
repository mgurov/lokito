
import { test, expect } from '@tests/app/setup/testExtended';

test('non-acking filter on it', async ({ page, appState, mainPage, logs }) => {
    await appState.givenSources({ name: 'existing' });
    logs.givenRecords('stem 1', 'stem 2', 'unrelated');
    
    await mainPage.open();

    await mainPage.createFilter({
        logLineText: 'stem 1',
        filterRegex: 'stem',
        customActions: async() => {
            await page.getByTestId('auto-ack').click(); // to uncheck
        }
    });

    //then initially the message is still visible
    await mainPage.expectLogMessages('unrelated', 'stem 2', 'stem 1');
    await mainPage.expectAckMessages(0);

    //but it is possible to ack all messages matching the filter
    await expect(page.getByTestId('matching-filter')).toHaveCount(2);
    await page.getByTestId('matching-filter').first().click();
    //then
    await mainPage.expectLogMessages('unrelated');
    await mainPage.expectAckMessages(2);

    await page.clock.install();

    await test.step.skip('new incoming messages should also be retained', async () => {
        logs.givenRecords('stem 3', 'unrelated 2');
        await page.clock.runFor('01:30');

        await mainPage.expectLogMessages('unrelated 2', 'stem 3', 'unrelated');
        await mainPage.expectAckMessages(2);
        await expect(page.getByTestId('matching-filter')).toHaveCount(1);
    })
});

test.skip('non-acking filter persisted', async ({appState, mainPage, logs }) => {

    await appState.givenSources({ name: 'existing' });
    await appState.givenFilters({messageRegex: 'stem', autoAck: false});
    logs.givenRecords('stem 1', 'stem 2', 'unrelated');

    await mainPage.open();

    //then initially the message is still visible
    await mainPage.expectLogMessages('unrelated', 'stem 2', 'stem 1');
    await mainPage.expectAckMessages(0);
});


