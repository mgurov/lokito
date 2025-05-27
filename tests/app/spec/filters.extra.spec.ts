
import { test, expect } from '@tests/app/setup/testExtended';

test('non-acking filter on it', async ({ page, appState, mainPage, logs }) => {

    await appState.givenSources({ name: 'existing' });
    logs.givenRecords('stem 1', 'stem 2', 'unrelated');

    
    await mainPage.open({startFetch: true});

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

test('non-acking filter after refresh', async ({ page, appState, mainPage, logs }) => {

    await appState.givenSources({ name: 'existing' });
    logs.givenRecords('stem 1');
    
    await mainPage.open({startFetch: true});

    await page.getByText('stem 1').click();
    await page.getByTestId('new-rule-button').click();
    await page.getByTestId('rule_regex').fill('stem');
    await page.getByTestId('auto-ack').click(); // to uncheck
    await page.getByTestId('save-rule-button').click();

    //then initially the message is still visible
    await expect(page.getByText('stem 1')).toBeVisible();
    await mainPage.expectAckMessages(0);

    // open the window anew
    logs.givenRecords('stem 1', 'stem 2', 'unrelated');
    await mainPage.open({startFetch: true});

    await mainPage.expectLogMessages('unrelated', 'stem 2', 'stem 1')
});



test('should be possible to define a date for which a filter would be auto-acked', async ({ page, appState, mainPage, logs }) => {
    await page.clock.install({time: '2025-05-12T08:27:01Z'})
    await appState.givenSources({ name: 'existing' });
    logs.givenRecords({message: "stem 1", timestamp: '2025-05-20T08:27:01Z'},
        {message: "stem 2", timestamp: '2025-05-21T08:27:01Z'},
        {message: "stem 3", timestamp: '2025-05-22T08:27:01Z'});

    await mainPage.open({
        startFetch: true
    });

    await page.getByText('stem 1').click();
    await page.getByTestId('new-rule-button').click();
    await page.getByTestId('rule_regex').fill('stem');
    await page.getByTestId('auto-ack-ttl-trigger-button').click();
    await page.locator('//button[@name="day" and text()="22"]').click()
    await page.getByTestId('save-rule-button').click();

    await expect(page.getByText('stem 1')).not.toBeVisible();
    await expect(page.getByText('stem 2')).not.toBeVisible();
    await expect(page.getByText('stem 3')).toBeVisible();
    await mainPage.expectAckMessages(2);
    await expect(page.getByTestId('matching-filter')).toHaveCount(1);
});


test('a filter with a date should be autoapplied to the new messages', async ({ page, appState, mainPage, logs }) => {
    await page.clock.install({time: '2025-05-12T08:27:01Z'})
    await appState.givenSources({ name: 'existing' });
    logs.givenRecords({message: "stem 1", timestamp: '2025-05-20T08:27:01Z'});

    await mainPage.open({
        startFetch: true
    });

    await page.getByText('stem 1').click();
    await page.getByTestId('new-rule-button').click();
    await page.getByTestId('rule_regex').fill('stem');
    await page.getByTestId('auto-ack-ttl-trigger-button').click();
    await page.locator('//button[@name="day" and text()="22"]').click()
    await page.getByTestId('save-rule-button').click();

    logs.givenRecords(
        {message: "stem 2", timestamp: '2025-05-21T08:27:01Z'},
        {message: "stem 3", timestamp: '2025-05-22T08:27:01Z'}
    );
    await mainPage.open({
        startFetch: true
    });

    await mainPage.expectLogMessages('stem 3')

    await mainPage.expectAckMessages(1);
    await expect(page.getByTestId('matching-filter')).toHaveCount(1);
});


//TODO: applying to the new fetch.
//TODO: persistence.

//TODO: shouldn't be able to select previous date maybe.
//TODO: rename filters to rules?
//TODO: show TTL'ness on the rule.
//TODO: filter stats should be updated on new receilals.