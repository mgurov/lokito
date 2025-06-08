import { test, expect } from '@tests/app/setup/testExtended';
import { AnnotationSuppressDefaultApp } from '../setup/AppStateFixture';
import { sourceLastSuccessFromStorageKey } from '@/data/source';

test('should start with given delay at the moment of click', async ({mainPage, logs}) => {
    await mainPage.clock.install({time: "2025-02-04T20:30:00.000Z"});

    await mainPage.open({startFetch: false});

    //and then we stared at the screen for 1 minute
    await mainPage.clock.runFor('01:00');

    await mainPage.startFetchingButton('last 1 hour').click();

    await expect.poll(() => logs.requests).toHaveLength(1)

    const requestUrl = logs.requests[0]

    expect(requestUrl.searchParams.get('start')).toContain('2025-02-04T19:31:') //some millisecs initiating the click and such
});


[{
    now: "2025-02-04T20:30:00.000Z",
    selected: 'now',
    expected: "2025-02-04T20:30:00.000Z"
}, {
    now: "2025-02-04T20:30:00.000Z",
    selected: 'last 5 min',
    expected: "2025-02-04T20:25:00.000Z"
}, {
    now: "2025-02-04T20:30:00.000Z",
    selected: 'last 1 hour',
    expected: "2025-02-04T19:30:00.000Z"
}, {
    now: "2025-02-04T20:30:00.000Z",
    selected: 'last 6 hours',
    expected: "2025-02-04T14:30:00.000Z"
}, {
    now: "2025-02-04T20:30:00.000Z",
    selected: 'last 24 hours',
    expected: "2025-02-03T20:30:00.000Z"
}].forEach(({now, selected, expected}) => {
    test(`should select ${selected}`, async ({mainPage, logs}) => {
        await mainPage.clock.setFixedTime(now);

        await mainPage.open({startFetch: false});

        await mainPage.startFetchingButton(selected).click();

        await expect.poll(() => logs.requests).toHaveLength(1)

        const requestUrl = logs.requests[0]

        expect(requestUrl.searchParams.get('start')).toBe(expected)
    });
});

test.describe('continue from where stopped', () => {
    test('firstly, we should record where we stopped', AnnotationSuppressDefaultApp, async({mainPage, logs, appState}) => {

        const source = await appState.givenSource()

        await mainPage.clock.install({time: "2025-02-04T20:30:00.000Z"});

        await mainPage.open({startFetch: true});

        await expect.poll(() => logs.requests).toHaveLength(1)

        const initialRequestUrl = logs.requests[0]

        expect(initialRequestUrl.searchParams.get('start')).toContain('2025-02-04T20:30:') //some millisecs initiating the click and such

        const stored = await appState.storage.getLocalItem(sourceLastSuccessFromStorageKey(source.id), true)
        expect(stored).toBe(initialRequestUrl.searchParams.get('start'))
    })

    test('then, we should apply stored value to the first fetch moment', AnnotationSuppressDefaultApp, async({mainPage, logs, appState}) => {

        const [source1, source2, _newSource] = await appState.givenSources({}, {}, {})
        const s1fetch = "2025-02-04T16:30:00.000Z"
        await appState.storage.setLocalItem(sourceLastSuccessFromStorageKey(source1.id), s1fetch, true)
        const s2fetch = "2025-02-04T16:35:00.000Z"
        await appState.storage.setLocalItem(sourceLastSuccessFromStorageKey(source2.id), s2fetch, true)

        await mainPage.clock.install({time: "2025-02-05T08:30:00.000Z"});

        await mainPage.open({startFetch: "since stopped"});

        await expect.poll(() => logs.requests).toHaveLength(3)

        expect(
        logs.requests.map(r => r.searchParams.get('start')?.substring(0, 19))
        ).toStrictEqual([s1fetch,
            s2fetch,
            "2025-02-05T08:30:00.000Z",
            ].map(s => s.substring(0, 19)))
    })

    test('continue where we stopped should pick the last ingested date and start from it', async ({mainPage, logs}) => {
        await mainPage.clock.install({time: "2025-02-04T20:30:00.000Z"});

        await mainPage.open({startFetch: true});

        await expect.poll(() => logs.requests).toHaveLength(1)

        const initialRequestUrl = logs.requests[0]

        expect(initialRequestUrl.searchParams.get('start')).toContain('2025-02-04T20:30:') //some millisecs initiating the click and such

        //and then we continue

        await mainPage.open({startFetch: false});
        await mainPage.clock.install({time: "2025-02-05T08:30:00.000Z"});    

        await mainPage.startFetchingButton('since stopped').click();

        await expect.poll(() => {
            return logs.requests
        }).toHaveLength(2)

        const continueRequestUrl = logs.requests[1]

        expect(continueRequestUrl.searchParams.get('start')).toBe(initialRequestUrl.searchParams.get('start'))

    });

    test('should not show continue when we stopped if no active source last fetch recorded', AnnotationSuppressDefaultApp, async({mainPage, appState}) => {

        const [_activeSource, inactiveSource] = await appState.givenSources({active: true}, {active: false})

        await appState.storage.setLocalItem(sourceLastSuccessFromStorageKey(inactiveSource.id), "2025-02-04T16:30:00.000Z", true)

        await mainPage.open({startFetch: false});

        await expect(mainPage.startFetchingButton("now")).toBeVisible() //not to check too early
        await expect(mainPage.startFetchingButton("since stopped")).not.toBeAttached() //the check actually

    })

    test('should indicate how early would be fetching from', AnnotationSuppressDefaultApp, async({mainPage, appState}) => {

        const [s1, s2] = await appState.givenSources({}, {})

        await appState.storage.setLocalItem(sourceLastSuccessFromStorageKey(s1.id), "2025-02-04T16:30:00.000Z", true)
        await appState.storage.setLocalItem(sourceLastSuccessFromStorageKey(s2.id), "2025-02-04T16:35:00.000Z", true)

        await mainPage.open({startFetch: false});

        await expect(mainPage.startFetchingButton("since stopped")).toHaveAttribute('title', "2025-02-04T16:30:00.000Z")

    })

// hide "since we stopped" if no previous records? Like the first time fetch thingy.


})


// TODO: imporant: alert of handle exceeding the limit of 1000...

test('should show start to begin with', async ({ mainPage, page }) => {

    await page.goto('/');

    await expect(mainPage.cleanCheck).not.toBeVisible();

    await expect(mainPage.ackedMessagesCount).not.toBeVisible();

    await mainPage.startFetchingButton().click();

    await expect(mainPage.startFetchingButton()).not.toBeVisible();
    
    await expect(mainPage.cleanCheck).toBeVisible();

    await expect(mainPage.ackedMessagesCount).toBeVisible();
})