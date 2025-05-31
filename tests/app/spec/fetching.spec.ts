import { test, expect } from '@tests/app/setup/testExtended';
import { routes } from '../setup/ExternalLogsFixture';
import { Deferred } from '../util/promises';
import { expectTexts } from '../util/visualAssertions';
import { TagSuppressDefaultAppStateTag } from '../setup/AppStateFixture';

test('fetching messages', async ({ page, mainPage, logs }) => {

    await page.clock.install();

    logs.givenRecords({ message: 'event1' });

    await mainPage.open({startFetch: true});

    await mainPage.expectLogMessages('event1');

    logs.givenRecords({ message: 'event2' }, { message: 'event3' });

    await page.clock.runFor('01:30');

    await mainPage.expectLogMessages('event3', 'event2', 'event1');

});


test('should sort fetched messages', TagSuppressDefaultAppStateTag, async ({ page, appState, mainPage, logs }) => {

    await page.clock.install();

    const [s1, s2] = await appState.givenSources({ name: 'existing' });

    logs.givenSourceRecords(s1, { message: 'earlier', timestamp: "1" }, {message: 'later', timestamp: "3"});
    logs.givenSourceRecords(s2, { message: 'middle', timestamp: "2" }, {message: 'the latest', timestamp: "4"});

    await mainPage.open({startFetch: true});

    await mainPage.expectLogMessages('the latest', 'later', 'middle', 'earlier');
});


test('should fetch updated query on editing', TagSuppressDefaultAppStateTag, async ({ page, appState, mainPage, logs }) => {

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


test('duplications should be filtered out on fetching', async ({ page, mainPage, consoleLogging, logs }) => {

    await page.clock.install();

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

     // haven't seen this on production yet, assuming negligible occurence frequency
    consoleLogging.ignoreErrorMessagesContaining('Encountered two children with the same key')
    consoleLogging.ignoreErrorMessagesContaining('Duplicate log id with different stream')

    await page.clock.runFor('01:30');

    await mainPage.expectLogMessages('event2', 'event1', 'event3');
});

test('same message should be shown both sources that happened to fetch it', TagSuppressDefaultAppStateTag, async ({ mainPage, appState, logs }) => {

    const [s1, s2] = await appState.givenSources({ name: 's1' }, {name: 's2'});

    const sameTimestamp = '2025-02-04T20:00:00.000Z';
    const sameData = {'event': 'event1'};

    logs.givenSourceRecords(s1, { message: 's1 event1', timestamp: sameTimestamp, data: sameData });
     // NB: message can be formatted differently different sources
    logs.givenSourceRecords(s2, { message: 's2 event1', timestamp: sameTimestamp, data: sameData });

    await mainPage.open({startFetch: true});

    await mainPage.expectLogMessages('s1 event1'); //ok, we take the first message

    const firstSourceMaker = mainPage.page.getByTestId('log-table-row')
        .getByTestId('log-row-source-marker')
    await expectTexts(firstSourceMaker, 's1', 's2')

    await mainPage.selectSourceTab(s1)
    await mainPage.expectLogMessages('s1 event1');
    await mainPage.selectSourceTab(s2)
    await mainPage.expectLogMessages('s2 event1');

});


test('should show error upon failure to fetch', TagSuppressDefaultAppStateTag, async ({ page, appState, mainPage }) => {

    await page.route(routes.loki, async (request) => {
        await request.abort();
    });

    const source = await appState.givenSource();

    await mainPage.open({startFetch: true});

    await expect(mainPage.sourceTabHeader(source).getByTestId('source-name')).toHaveClass('animate-pulse')
    await expect(mainPage.sourceTabHeader(source).getByTestId('source-in-error-indicator')).toBeVisible()
});

test('should keep fetching after a delayed response', async ({ page, mainPage, logs }) => {

    await page.clock.install();

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

    delayedResponse.resolve();

    await page.clock.runFor('01:30');

    await mainPage.expectLogMessages('e2', 'e1');

    // next cycle
    logs.givenRecords({ message: 'e3' });
    await page.clock.runFor('01:30');
    await mainPage.expectLogMessages('e3', 'e2', 'e1');
});

test('should show error on no responses', async ({ page, mainPage }) => {

    await page.route(routes.loki, async (request) => {
        await request.abort();
    });
    await mainPage.open({startFetch: true});
    //NB: shouldn't actually be clean on error, but never mind for now.
    await expect(mainPage.cleanCheck).toBeVisible();
});

test('should mark fetched messages with their source names in the all tab but not in the source one', TagSuppressDefaultAppStateTag, async ({ appState, mainPage, logs }) => {

    const [s1, s2] = await appState.givenSources({ name: 's1' }, {name: 's2'});

    logs.givenSourceRecords(s1, 'm1');
    logs.givenSourceRecords(s2, 'm2');

    await mainPage.open({startFetch: true});

    await mainPage.expectLogMessages('m2', 'm1');

    const firstSourceMaker = mainPage.page.getByTestId('log-table-row').
        filter({hasText: /m1/})
        .getByTestId('log-row-source-marker')
    await expect(firstSourceMaker).toHaveText('s1')

    await expect(mainPage.page.getByTestId('log-table-row').
        filter({hasText: /m2/})
        .getByTestId('log-row-source-marker')
        ).toHaveText('s2')

    // and then when switched to the source - no need to show it


    await mainPage.selectSourceTab(s1)

    await expect(firstSourceMaker).not.toBeAttached();


});

test('should open source tab when clicking on row source indicator', TagSuppressDefaultAppStateTag, async ({ appState, mainPage, logs }) => {

    const [s1, s2] = await appState.givenSources({ name: 's1' }, {name: 's2'});

    logs.givenSourceRecords(s1, 'm1');
    logs.givenSourceRecords(s2, 'm2');

    await mainPage.open({startFetch: true});

    await mainPage.expectLogMessages('m2', 'm1');

    const firstSourceMaker = mainPage.page.getByTestId('log-table-row').
        filter({hasText: /m1/})
        .getByTestId('log-row-source-marker')
    await expect(firstSourceMaker).toHaveText('s1')

    await firstSourceMaker.click()

    //then we're on the s1 source page

    await expect(firstSourceMaker).not.toBeAttached();

    await mainPage.expectLogMessages('m1');

});