import { test, expect } from '@tests/app/setup/testExtended';
import { expectTexts } from '../util/visualAssertions';

test('fetching messages', async ({ page, appState, mainPage, logs }) => {

    await page.clock.install();

    await appState.givenSources({ name: 'existing' });

    logs.givenRecords({ message: 'event1' });

    await mainPage.open();

    await page.getByTestId('start-fetching-button').click();

    await expectTexts(page.getByTestId('log-message'), 'event1');

    logs.givenRecords({ message: 'event2' }, { message: 'event3' });

    await page.clock.runFor('01:30');

    await expectTexts(page.getByTestId('log-message'), 'event3', 'event2', 'event1');

});

test('should fetch updated query on editing', async ({ page, appState, mainPage, logs }) => {

    await page.clock.install();

    await appState.givenSources({ name: 'existing', query: "{job='test'}" });

    await mainPage.open();

    await page.getByTestId('start-fetching-button').click();

    await expect.poll(() => {
        return logs.requests.map(u => u.searchParams.get('query'))
    }).toStrictEqual(["{job='test'}"])

    const sourceCard = (await mainPage.clickToSources()).sourceCard('existing')

    await sourceCard.changeQuery('{job="updated query"}')

    await page.clock.runFor('01:30');

    await expect.poll(() => {
        return logs.requests.map(u => u.searchParams.get('query'))
    }).toStrictEqual([
        "{job='test'}", //from before
        '{job="updated query"}',    
    ])

});


test('duplications should be filtered out on fetching', async ({ page, appState, consoleLogging, logs }) => {

    await page.clock.install();

    await appState.givenSources({ name: 'existing' });

    const sameTimestamp = '2025-02-04T20:00:00.000Z';
    const sameData = {'event': 'event1'};
    const anotherTimestamp = '2025-02-04T20:00:00.001Z';

    logs.givenRecords({ message: 'event1', timestamp: sameTimestamp, data: sameData });

    await page.goto('/');

    await page.getByTestId('start-fetching-button').click();

    await expectTexts(page.getByTestId('log-message'), 'event1');

    //NB: the deduplication doesn't care about the message, only the timestamp and the data
    logs.givenRecords(
        { message: 'event2', timestamp: anotherTimestamp, data: sameData }, // to be added because of the different timestamp
        { message: 'event3', timestamp: sameTimestamp, data: {'event': 'event3'} }, //to be added because the data differs
        { message: 'event4', timestamp: sameTimestamp, data: sameData }, // to be skipped
    );

    consoleLogging.ignoreErrorMessagesContaining('Encountered two children with the same key') // haven't seen this on production yet, assuming negligible occurence frequency

    await page.clock.runFor('01:30');

    await expectTexts(page.getByTestId('log-message'), 'event2', 'event1', 'event3');
});

// TODO: show the date time message.
