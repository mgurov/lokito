import { test, expect } from '@tests/app/setup/testExtended';

test('should start with given delay at the moment of click', async ({mainPage, appState, logs}) => {
    await appState.givenSource();
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
    test(`should select ${selected}`, async ({mainPage, appState, logs}) => {
        await appState.givenSource();
        await mainPage.clock.setFixedTime(now);

        await mainPage.open({startFetch: false});

        await mainPage.startFetchingButton(selected).click();

        await expect.poll(() => logs.requests).toHaveLength(1)

        const requestUrl = logs.requests[0]

        expect(requestUrl.searchParams.get('start')).toBe(expected)
    });
});

// TODO: imporant: alert of handle exceeding the limit of 1000

test('should show start to begin with', async ({ mainPage, page, appState }) => {

    await appState.givenSource();

    await page.goto('/');

    await expect(mainPage.cleanCheck).not.toBeVisible();

    await expect(mainPage.ackedMessagesCount).not.toBeVisible();

    await mainPage.startFetchingButton().click();

    await expect(mainPage.startFetchingButton()).not.toBeVisible();
    
    await expect(mainPage.cleanCheck).toBeVisible();

    await expect(mainPage.ackedMessagesCount).toBeVisible();
})