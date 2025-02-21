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
        const url = new URL(request.url());
        source.requests.push(url);
        const query = url.searchParams.get('query');
        const [matchingRecords, nonMatchingRecords] = source.records.reduce<[LogRecord[], LogRecord[]]>((acc, record) => {
            const [matching, nonMatching] = acc;
            if (!query || !record.stream.lokitoQuery || record.stream.lokitoQuery === query) {
                matching.push(record);
            } else {
                nonMatching.push(record);
            }
            return acc;
        }, [[], []]);

        const json = {
            data: {
                result: matchingRecords,
            }
        }
        source.records = nonMatchingRecords;
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

    //TODO: simplify with the above?
    givenSourceRecords(source: {query: string},...logRecords: LogRecordSpec[]) {
        let nowCounterMillisecs = new Date().getTime();
        const newRecords = logRecords.map(logSpec => {
            const logSpecObjectified = typeof logSpec === 'string' ? { message: logSpec } : logSpec;
            const { timestamp, message = 'a log message', data } = logSpecObjectified;
            const timestampString = timestamp ? new Date(timestamp) : new Date(nowCounterMillisecs++); //tODO: do the timestamp into the message
            return {
            stream: {
                lokitoQuery: source.query,
                ...data,
            },
            values: [[`${timestampString.getTime()}000000`, message]],
            
        }}
        );
        this.records.push(...newRecords);
    }   

}