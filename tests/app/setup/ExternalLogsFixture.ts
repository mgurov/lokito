import { TRACE_ID_FIELDS } from "@/hardcodes";
import { expect, Page, test } from "@playwright/test";

export const routes = {
  loki: "/loki-proxy/api/v1/query_range?**",
};

// TODO: rename loki logs?
export const externalLogsTest = test.extend<{ logs: LogSource }>({
  logs: [async ({ page }, use) => {
    const logSource = await routeLogResponses(page);

    await use(logSource);
  }, { auto: true }],
});

export type LogRecordSpec = string | {
  timestamp?: string;
  message?: string;
  traceId?: string;
  data?: Record<string, string>;
};

export type LogRecord = { stream: Record<string, string>; values: string[][]; queryExpected: string | undefined };

export async function routeLogResponses(page: Page, ...logRecords: LogRecordSpec[]): Promise<LogSource> {
  const source = new LogSource();
  source.givenRecords(...logRecords);
  await page.route(routes.loki, (route, request) => {
    const url = new URL(request.url());
    source.requests.push(url);
    const query = url.searchParams.get("query");
    if (!query) {
      return route.fulfill({ status: 400, body: "no query" });
    }

    const json = {
      data: {
        result: source.popRecords(query),
      },
    };
    return route.fulfill({
      status: 200,
      json,
    });
  });
  return source;
}

class LogSource {
  private nowCounterMillisecs = new Date().getTime();

  public records: LogRecord[] = [];

  public requests: URL[] = [];

  popRecords(query: string) {
    const [matchingRecords, nonMatchingRecords] = this.records.reduce<[LogRecord[], LogRecord[]]>((acc, record) => {
      const [matching, nonMatching] = acc;
      if (!record.queryExpected || record.queryExpected === query) {
        matching.push(record);
      } else {
        nonMatching.push(record);
      }
      return acc;
    }, [[], []]);

    this.records = nonMatchingRecords;

    return matchingRecords;
  }

  givenRecords(...logRecords: LogRecordSpec[]) {
    this.givenSourceRecords(null, ...logRecords);
  }

  givenSourceRecords(source: { query: string } | null, ...logRecords: LogRecordSpec[]) {
    const newRecords = logRecords.map(logSpec => {
      const logSpecObjectified = typeof logSpec === "string" ? { message: logSpec } : logSpec;
      const { timestamp, message = "a log message", data = {} } = logSpecObjectified;
      if (logSpecObjectified.traceId) {
        data[TRACE_ID_FIELDS[0]] = logSpecObjectified.traceId;
      }
      let timestampDate: Date;
      if (timestamp) {
        timestampDate = new Date(timestamp);
        if (timestampDate.getTime() > this.nowCounterMillisecs) {
          // advance "now" further.
          this.nowCounterMillisecs = timestampDate.getTime();
        }
      } else {
        this.nowCounterMillisecs += 1;
        timestampDate = new Date(this.nowCounterMillisecs);
      }
      // tODO: do the timestamp into the message
      return {
        stream: {
          ...data,
        },
        values: [[`${timestampDate.getTime()}000000`, message]],
        queryExpected: source?.query,
      };
    });
    this.records.push(...newRecords);
  }

  async expectQueries(...sources: { query: string }[]) {
    await test.step("expectQueries", async () => {
      await expect.poll(
        () => this.requests.map(r => r.searchParams.get("query")),
      ).toStrictEqual(sources.map(s => s.query));
    }, { box: true });
  }
}
