
import { test, expect } from '@tests/app/setup/testExtended';

test('non-acking filter on it', async ({ page, appState, mainPage, logs }) => {
    
    await mainPage.open({
        executeBefore: async () => {
            await appState.givenSources({ name: 'existing' });
            logs.givenRecords('stem 1', 'stem 2', 'unrelated');
        },
        startFetch: true
    });

    await page.getByText('stem 1').click();
    await page.getByTestId('new-rule-button').click();
    await page.getByTestId('rule_regex').fill('stem');
    await page.getByTestId('auto-ack').click(); // to uncheck
    await page.getByTestId('save-rule-button').click();

    //then initially the message is still visible
    await expect(page.getByText('stem 1')).toBeVisible();
    await mainPage.expectAckMessages(0);

    //but it is possible to ack all messages matching the filter
    await expect(page.getByTestId('matching-filter')).toHaveCount(2);
    await expect(page.getByTestId('new-rule-button')).toHaveCount(1);
    await page.getByTestId('matching-filter').first().click();
    //then
    await expect(page.getByText('stem 1')).not.toBeVisible();
    await mainPage.expectAckMessages(2);
    await expect(page.getByText('unrelated')).toBeVisible();
});

