import { Page } from '@playwright/test';
import { test, expect } from '@tests/app/setup/testExtended';
import { expectTexts } from './util/visualAssertions';

test('find a line create a filter on it', async ({ page, appState }) => {

    await appState.givenSources({ name: 'existing' });

    await routeLogResponses(page, { message: 'Some<thing> 👻 (H)appened' });

    await page.goto('/');

    await page.getByTestId('start-fetching-button').click();

    await page.getByText('Some<thing> 👻 (H)appened').click();
    await page.getByTestId('new-rule-button').click();
    await page.getByTestId('save-rule-button').click();

    await expect(page.getByText('Some<thing> 👻 (H)appened')).not.toBeVisible();
    await expect(page.getByText('1 ACK messages')).toBeVisible();
    await expect(page.getByText('Clean ✅')).toBeVisible();
});

test('a saved filter should be applied to existing and following messages ', async ({ page, appState }) => {

    await page.clock.install();

    await appState.givenSources({ name: 'existing' });

    const logs = await routeLogResponses(page, 'this_message 1', 'unrelated 1');

    await page.goto('/');

    await page.getByTestId('start-fetching-button').click();

    await expectTexts(page.getByTestId('log-message'), 'unrelated 1', 'this_message 1');

    await page.getByText('this_message 1').click();
    await page.getByTestId('new-rule-button').click();
    await page.getByTestId('rule_regex').fill('this_message');
    await page.getByTestId('save-rule-button').click();

    await expectTexts(page.getByTestId('log-message'), 'unrelated 1');
    await expect(page.getByText('1 ACK messages')).toBeVisible();

    //two more new messages should be captured
    logs.givenRecords('this_message 2', 'unrelated 2', 'this_message 3');

    await page.clock.runFor('01:30');

    await expectTexts(page.getByTestId('log-message'), 'unrelated 2', 'unrelated 1');
    await expect(page.getByText('3 ACK messages')).toBeVisible();

});


test('fetching messages', async ({ page, appState }) => {

    await page.clock.install();

    await appState.givenSources({ name: 'existing' });

    const logs = await routeLogResponses(page, { message: 'event1' });

    await page.goto('/');

    await page.getByTestId('start-fetching-button').click();

    await expectTexts(page.getByTestId('log-message'), 'event1');

    logs.givenRecords({ message: 'event2' }, { message: 'event3' });

    await page.clock.runFor('01:30');

    await expectTexts(page.getByTestId('log-message'), 'event3', 'event2', 'event1');

});

// TODO: show the date time message.


type LogRecordSpec = string | {
    timestamp?: string;
    message?: string;
    data?: Record<string, string>;
}

type LogRecord = { stream: Record<string, string>, values: string[][] };

async function routeLogResponses(page: Page, ...logRecords: LogRecordSpec[]): Promise<LogSource> {
    const source = new LogSource();
    source.givenRecords(...logRecords);
    await page.route('/lokiprod/api/v1/query_range?**', (route) => {
        const json = {
            data: {
                result: source.records.splice(0, Infinity),
            }
        }
        return route.fulfill({
            status: 200,
            json,
        });
    });
    return source;
}

class LogSource {

    public records: LogRecord[] = [];

    givenRecords(...logRecords: LogRecordSpec[]) {
        let nowCounterMillisecs = new Date().getTime();
        const newRecords = logRecords.map(logSpec => {
            const logSpecObjectified = typeof logSpec === 'string' ? { message: logSpec } : logSpec;
            const { timestamp, message = 'a log message', data } = logSpecObjectified;
            const timestampString = timestamp || new Date(nowCounterMillisecs++).toISOString(); //tODO: do the timestamp into the message
            return {
            stream: {
                ...data,
            },
            values: [[timestampString, message]],
        }}
        );
        this.records.push(...newRecords);
    
    }
    
}