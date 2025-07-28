import { test } from "@tests/app/setup/testExtended";
import { AnnotationSuppressDefaultApp } from "../setup/AppStateFixture";

test("should show acked and allow unacking", async ({ mainPage, logs }) => {
  logs.givenRecords("event1", "event2", "event3");

  await mainPage.open();

  await mainPage.expectLogMessages("event3", "event2", "event1");

  // when

  await mainPage.clickAckAll({ expectedCount: 3 });

  await mainPage.expectLogMessages(...[]);

  await mainPage.ackedUnackedMessagesToggle.click();

  await mainPage.expectLogMessages("event3", "event2", "event1");

  await mainPage.unack("event2");

  await mainPage.expectLogMessages("event3", "event1");

  await mainPage.ackedUnackedMessagesToggle.click();

  await mainPage.expectLogMessages("event2");
});

test("navigate correctly in the acked view", AnnotationSuppressDefaultApp, async ({ mainPage, logs, appState }) => {
  const [source1] = await appState.givenSources(
    { name: "source1" },
  );
  logs.givenRecords("event1", "event2", "event3");

  await mainPage.open();

  await mainPage.ack("event2");

  await mainPage.expectLogMessages("event3", "event1");

  await mainPage.ackedUnackedMessagesToggle.click();

  await mainPage.expectLogMessages("event2");

  // on the source tab
  await mainPage.selectSourceTab(source1);
  await mainPage.expectLogMessages("event2");

  // back to the all sources should still stay in the acked mode
  await mainPage.selectAllSourcesTab();
  await mainPage.expectLogMessages("event2");

  await mainPage.ackedUnackedMessagesToggle.click();
  await mainPage.expectLogMessages("event3", "event1");
});

test(
  "should show acked per source",
  AnnotationSuppressDefaultApp,
  async ({ appState, mainPage, logs }) => {
    const [source1, source2] = await appState.givenSources(
      { name: "source1" },
      { name: "source2" },
    );
    // TODO: fight the fmt here.
    logs.givenSourceRecords(source1, { message: "source1.1", timestamp: "1" }, {
      message: "source1.2",
      timestamp: "2",
    });
    logs.givenSourceRecords(source2, { message: "source2.1", timestamp: "3" }, {
      message: "source2.2",
      timestamp: "4",
    });

    await mainPage.open();

    await mainPage.expectLogMessages("source2.2", "source2.1", "source1.2", "source1.1");

    // when

    await mainPage.clickAckAll({ expectedCount: 4 });

    await mainPage.expectLogMessages(...[]);

    await mainPage.ackedUnackedMessagesToggle.click();

    await mainPage.expectLogMessages("source2.2", "source2.1", "source1.2", "source1.1");

    await mainPage.selectSourceTab(source1);

    await mainPage.expectLogMessages("source1.2", "source1.1");
  },
);

// TODO: hide or correct the "Ack message" button on the acked view;
