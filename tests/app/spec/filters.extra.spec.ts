
import { test, expect } from '@tests/app/setup/testExtended';

test('non-acking filter on it', async ({ page, appState, mainPage, logs }) => {
    
    await mainPage.open({
        executeBefore: async () => {
            await appState.givenSources({ name: 'existing' });
            logs.givenRecords('stem 1', 'stem 2', 'unrelated');
        },
        startFetch: true
    });

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
});

