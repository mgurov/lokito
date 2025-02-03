import { Page } from '@playwright/test';
import { test, expect } from '@tests/app/setup/testExtended';

test('find a line create a filter on it', async ({ page, appState }) => {

    await page.clock.install();

    await appState.givenSources({ name: 'existing' });

    const logs = await routeLogResponses(page, { message: 'Some<thing> (H)appened' });

    await page.goto('/');

    await page.getByTestId('start-fetching-button').click();

    await page.getByText('Some<thing> (H)appened').click();
    await page.getByTestId('new-rule-button').click();
    await page.getByTestId('save-rule-button').click();

    await expect(page.getByText('Some<thing> (H)appened')).not.toBeVisible();
    await expect(page.getByText('1 ACK messages')).toBeVisible();

    //two more new messages should be captured
    logs.givenRecords({ message: 'Some<thing> else (H)appened' }, { message: 'Some<thing> (H)appened' });

    await page.clock.runFor('01:30');

    await expect(page.getByText('Some<thing> (H)appened')).not.toBeVisible();
    await expect(page.getByText('3 ACK messages')).toBeVisible();

});

test('fetching messages', async ({ page, appState }) => {

    await page.clock.install();

    await appState.givenSources({ name: 'existing' });

    const logs = await routeLogResponses(page, { message: 'Some<thing> (H)appened' });


    await page.goto('/');

    await page.getByTestId('start-fetching-button').click();

    await expect(page.getByText('Some<thing> (H)appened')).toBeVisible();

    logs.givenRecords({ message: 'Some<thing> else (H)appened' }, { message: 'Some even more else happened' });

    await page.clock.runFor('01:30');

    logs.givenRecords({ message: 'Some<thing> else (H)appened' }, { message: 'Some even more else happened' });
    await expect(page.getByText('Some<thing> else (H)appened')).toBeVisible();
    // await expect(page.getByText('3 ACK messages')).toBeVisible();

});

// TODO: show the date time message.


type LogRecordSpec = {
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

    private counter = 1;

    public records: LogRecord[] = [];

    givenRecords(...logRecords: LogRecordSpec[]) {
        const newRecords = logRecords.map(({ timestamp, message, data }) => {
            const timestampString = timestamp || new Date().toISOString()
            return {
            stream: {
                timestampString, // need to prevent deduplication
                ...data,
            },
            values: [[timestampString + ' _ ' + this.counter++, message || 'a log record']],
        }}
        );
        this.records.push(...newRecords);
    
    }
    
}