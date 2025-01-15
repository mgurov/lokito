import { Page } from '@playwright/test';
import { test, expect } from '@tests/app/setup/testExtended';

test('find a line create a filter on it', async ({ page, appState }) => {

    await appState.givenSources({ name: 'existing' });

    await page.goto('/');

    await routeLogResponses(page, { message: 'Some<thing> (H)appened' });

    await page.getByTestId('start-fetching-button').click();

    await page.getByText('Some<thing> (H)appened').click();
    await page.getByTestId('new-rule-button').click();
    await page.getByTestId('save-rule-button').click();

    await expect(page.getByText('Some<thing> (H)appened')).not.toBeVisible();
    await expect(page.getByText('1 ACK messages')).toBeVisible();
});

type LogRecordSpec = {
    timestamp?: string;
    message?: string;
    data?: Record<string, string>;
}

type LogRecord = { stream: Record<string, string>, values: string[][] };

async function routeLogResponses(page: Page, ...logRecords: LogRecordSpec[]) {
    const source = new LogSource();
    source.records = logRecords.map(({ timestamp, message, data }) => ({
        stream: {
            ...data,
        },
        values: [[timestamp || new Date().toISOString(), message || 'a log record']],
    }));
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

    constructor() {
    }
    
}