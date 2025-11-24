import { test } from "@tests/app/setup/testExtended";

test("ack all messages", async ({ mainPage, logs }) => {
  logs.givenRecords("event1", "event2", "event3");

  await mainPage.open();

  await mainPage.expectLogMessages("event3", "event2", "event1");

  await mainPage.ack("event1");
  await mainPage.ack("event2");

  await mainPage.expectLogMessages("event3");

  logs.resetServedRecords(); // TODO: naming and consider merging with the open.
  await mainPage.open();

  await mainPage.expectLogMessages("event1");
});

/*

TODO:
- sortable id?
- GC?
- visualize

*/
