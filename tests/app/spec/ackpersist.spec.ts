import { test } from "@tests/app/setup/testExtended";

test("acks should survive page reload", async ({ mainPage, logs }) => {
  logs.givenRecords("event1", "event2", "event3");

  await mainPage.open();

  await mainPage.expectLogMessages("event3", "event2", "event1");

  await mainPage.ack("event1");
  await mainPage.ack("event2");

  await mainPage.expectLogMessages("event3");

  await mainPage.awaitAckBacklogEmpty();

  await mainPage.open({ resetLogsFetchState: logs });

  await mainPage.expectLogMessages("event3");
});

test("unacked item should survive page reload", async ({ mainPage, logs }) => {
  logs.givenRecords("event1", "event2", "event3");

  await mainPage.open();

  await mainPage.expectLogMessages("event3", "event2", "event1");

  await mainPage.ack("event1");
  await mainPage.ack("event2");

  await mainPage.expectLogMessages("event3");

  await test.step("unack one message", async () => {
    await mainPage.ackedMessagesCount.click();
    await mainPage.unack("event1");
  });

  await mainPage.awaitAckBacklogEmpty();

  await mainPage.open({ resetLogsFetchState: logs });

  await mainPage.expectLogMessages("event3", "event1");
});

test("ack all should survive page reload", async ({ mainPage, logs }) => {
  logs.givenRecords("event1", "event2", "event3");

  await mainPage.open();

  await mainPage.clickAckAll({ expectedCount: 3 });

  await mainPage.expectNoLogMessages();

  await mainPage.open({ resetLogsFetchState: logs });

  await mainPage.expectNoLogMessages();
});

/*

TODO:
- sortable id?
- GC?
- visualize

*/
