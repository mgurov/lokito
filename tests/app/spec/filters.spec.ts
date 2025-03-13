
import { test, expect } from '@tests/app/setup/testExtended';

test('find a line create a filter on it', async ({ page, appState, mainPage, logs }) => {
    
    await mainPage.open({
        executeBefore: async () => {
            await appState.givenSources({ name: 'existing' });
            logs.givenRecords({ message: 'Some<thing> 👻 (H)appened' });
        },
        startFetch: true
    });

    await page.getByText('Some<thing> 👻 (H)appened').click();
    await page.getByTestId('new-rule-button').click();
    await page.getByTestId('save-rule-button').click();

    await expect(page.getByText('Some<thing> 👻 (H)appened')).not.toBeVisible();
    await mainPage.expectAckMessages(1);
    await expect(mainPage.cleanBacklogMessage).toBeVisible();
});

test('a saved filter should be applied to existing and following messages ', async ({ page, appState, mainPage, logs }) => {

    await mainPage.open({
        executeBefore: async () => {
            await page.clock.install();
    
            await appState.givenSources({ name: 'existing' });

            logs.givenRecords('this_message 1', 'unrelated 1');
        },
        startFetch: true,
    })

    await mainPage.expectLogMessages('unrelated 1', 'this_message 1');

    await page.getByText('this_message 1').click();
    await page.getByTestId('new-rule-button').click();
    await page.getByTestId('rule_regex').fill('this_message');
    await page.getByTestId('save-rule-button').click();

    await mainPage.expectLogMessages('unrelated 1');
    await mainPage.expectAckMessages(1);

    //two more new messages should be captured
    logs.givenRecords('this_message 2', 'unrelated 2', 'this_message 3');

    await page.clock.runFor('01:30');

    await mainPage.expectLogMessages('unrelated 2', 'unrelated 1');
    await mainPage.expectAckMessages(3);

});

test('should be able to see messages acked by a filter', async ({ appState, mainPage, logs }) => {

    await appState.givenSources({ name: 'existing' });

    await appState.givenFilter('1');

    logs.givenRecords('m 1', 'm 2');

    await mainPage.open({startFetch: true})

    await mainPage.expectLogMessages('m 2');
    await mainPage.expectAckMessages(1)

    await mainPage.ackedMessagesCount.click();
    await mainPage.expectLogMessages('m 1');
});


test('a non-saved filter should be applied to existing but not following messages ', async ({ page, appState, mainPage, logs }) => {

    await page.clock.install();

    await appState.givenSources({ name: 'existing' });

    logs.givenRecords('this_message 1', 'unrelated 1');

    await page.goto('/');

    await page.getByTestId('start-fetching-button').click();

    await mainPage.expectLogMessages('unrelated 1', 'this_message 1');

    await page.getByText('this_message 1').click();
    await page.getByTestId('new-rule-button').click();
    await page.getByTestId('rule_regex').fill('this_message');
    await page.getByTestId('apply-rule-button').click();

    await mainPage.expectLogMessages('unrelated 1');
    await mainPage.expectAckMessages(1);

    // new messages should NOT be captured
    logs.givenRecords('this_message 2', 'unrelated 2');

    await page.clock.runFor('01:30');

    await mainPage.expectLogMessages('unrelated 2', 'this_message 2', 'unrelated 1');
    await mainPage.expectAckMessages(1);

});

