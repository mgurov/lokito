import { Page, test } from '@playwright/test';

export const externalLogsTest = test.extend<{ logs: LogSource }>({
    logs: [async ({ page }, use) => {

        const logSource = await routeLogResponses(page)

        await use(logSource);

    }, {auto: true}],
});


export type LogRecordSpec = string | {
    timestamp?: string;
    message?: string;
    data?: Record<string, string>;
}

export type LogRecord = { stream: Record<string, string>, values: string[][] };

export async function routeLogResponses(page: Page, ...logRecords: LogRecordSpec[]): Promise<LogSource> {
    const source = new LogSource();
    source.givenRecords(...logRecords);
    await page.route('/lokiprod/api/v1/query_range?**', (route, request) => {
        source.requests.push(new URL(request.url()));
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

    public requests: URL[] = [];

    givenRecords(...logRecords: LogRecordSpec[]) {
        let nowCounterMillisecs = new Date().getTime();
        const newRecords = logRecords.map(logSpec => {
            const logSpecObjectified = typeof logSpec === 'string' ? { message: logSpec } : logSpec;
            const { timestamp, message = 'a log message', data } = logSpecObjectified;
            const timestampString = timestamp ? new Date(timestamp) : new Date(nowCounterMillisecs++); //tODO: do the timestamp into the message
            return {
            stream: {
                ...data,
            },
            values: [[`${timestampString.getTime()}000000`, message]],
        }}
        );
        this.records.push(...newRecords);
    }   
}