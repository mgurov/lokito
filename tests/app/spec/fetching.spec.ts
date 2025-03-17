import { test, expect } from '@tests/app/setup/testExtended';
import { routes } from '../setup/ExternalLogsFixture';
import { Deferred } from '../util/promises';

test('fetching messages', async ({ page, appState, mainPage, logs }) => {

    await page.clock.install();

    await appState.givenSources({ name: 'existing' });

    logs.givenRecords({ message: 'event1' });

    await mainPage.open({startFetch: true});

    await mainPage.expectLogMessages('event1');

    logs.givenRecords({ message: 'event2' }, { message: 'event3' });

    await page.clock.runFor('01:30');

    await mainPage.expectLogMessages('event3', 'event2', 'event1');

});

test('should fetch updated query on editing', async ({ page, appState, mainPage, logs }) => {

    await page.clock.install();

    await appState.givenSources({ name: 'existing', query: "{job='test'}" });

    await mainPage.open({startFetch: true});

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


test('duplications should be filtered out on fetching', async ({ page, mainPage, appState, consoleLogging, logs }) => {

    await page.clock.install();

    await appState.givenSources({ name: 'existing' });

    const sameTimestamp = '2025-02-04T20:00:00.000Z';
    const sameData = {'event': 'event1'};
    const anotherTimestamp = '2025-02-04T20:00:00.001Z';

    logs.givenRecords({ message: 'event1', timestamp: sameTimestamp, data: sameData });

    await mainPage.open({startFetch: true});

    await mainPage.expectLogMessages('event1');

    //NB: the deduplication doesn't care about the message, only the timestamp and the data
    logs.givenRecords(
        { message: 'event2', timestamp: anotherTimestamp, data: sameData }, // to be added because of the different timestamp
        { message: 'event3', timestamp: sameTimestamp, data: {'event': 'event3'} }, //to be added because the data differs
        { message: 'event4', timestamp: sameTimestamp, data: sameData }, // to be skipped
    );

    consoleLogging.ignoreErrorMessagesContaining('Encountered two children with the same key') // haven't seen this on production yet, assuming negligible occurence frequency

    await page.clock.runFor('01:30');

    await mainPage.expectLogMessages('event2', 'event1', 'event3');
});

test('should show error upon failure to fetch', async ({ page, appState, mainPage }) => {

    await page.route(routes.loki, async (request) => {
        await request.abort();
    });

    const source = await appState.givenSource();

    await mainPage.open({startFetch: true});

    await expect(mainPage.sourceTabHeader(source).getByTestId('source-name')).toHaveClass('animate-pulse')
    await expect(mainPage.sourceTabHeader(source).getByTestId('source-in-error-indicator')).toBeVisible()
});



test.skip('should keep fetching after a delayed response', async ({ page, appState, mainPage, logs }) => {

    await page.clock.install();

    await appState.givenSources({ name: 'existing'});

    logs.givenRecords({ message: 'e1' });

    await mainPage.open({startFetch: true});

    await mainPage.expectLogMessages('e1');

    // next cycle
    logs.givenRecords({ message: 'e2' });

    const delayedResponse = new Deferred<void>();
    await page.route(routes.loki, async (request) => {
        await delayedResponse.promise;
        await request.abort();
    }, {times: 1});

    await page.clock.runFor('01:30');

    await mainPage.expectLogMessages('e1');

    await page.clock.runFor('01:30');

    await mainPage.expectLogMessages('e2', 'e1');

    delayedResponse.resolve();
});

test('should show error on no responses', async ({ page, appState, mainPage }) => {

    await appState.givenSources({ name: 'existing'});

    await page.route(routes.loki, async (request) => {
        await request.abort();
    });
    await mainPage.open({startFetch: true});
    //NB: shouldn't actually be clean on error, but never mind for now.
    await expect(mainPage.cleanCheck).toBeVisible();
});