import { expect, Locator, Page, test } from "@playwright/test";
import { expectTexts } from "@tests/app/util/visualAssertions";
import FiltersPageFixture from "./FiltersPageFixture";
import SourcePageFixture, { NewSourceRollover, SourceCardFixture } from "./SourcesPageFixture";

export const mainPageTest = test.extend<{ mainPage: MainPageFixture }>({
  mainPage: [async ({ page }, use) => {
    await use(new MainPageFixture(page));
  }, {}],
});

export default class MainPageFixture {
  constructor(readonly page: Page) {}

  async open({
    executeBefore,
    startFetch = true,
  }: {
    executeBefore?: () => Promise<void>;
    startFetch?: boolean | string;
  } = {}) {
    await test.step("open main page", async () => {
      if (executeBefore) {
        await executeBefore();
      }
      await this.page.goto("/");
      if (startFetch !== false) {
        const startFetchButton = typeof startFetch === "string" ? startFetch : "now";
        await this.page.getByTestId("fetch-option").getByText(startFetchButton).click();
      }
    }, { box: true });
  }

  startFetchingButton(from: string = "now") {
    return this.page.getByTestId("fetch-option").getByText(from);
  }

  get ackedMessagesCount() {
    return this.page.getByTestId("acked-messages-count");
  }

  async expectAckMessages(count: number) {
    const ackedMessagesCounter = this.ackedMessagesCount;
    await expect(ackedMessagesCounter).toHaveText(`ACK'ed ${count}`);
  }

  get cleanBacklogMessage() {
    return this.page.getByText("Clean ✅");
  }

  async clickToSources() {
    await this.page.getByTestId("sources-button").click();
    return new SourcePageFixture(this.page);
  }

  async openFiltersPage() {
    await this.page.getByTestId("filters-button").click();
    return new FiltersPageFixture(this.page);
  }

  get homeLogo() {
    return this.page.getByTestId("home-page-logo");
  }

  async clickNewSourceButton() {
    await this.page.getByTestId("new-source-button").getByText("New Source").click();

    const newSourceRollover = new NewSourceRollover(this.page);

    await expect(newSourceRollover.locator).toBeVisible();

    return newSourceRollover;
  }

  async unack(message: string) {
    const row = this.page.getByTestId("log-table-row").filter({ hasText: message });
    await row.getByTestId("unack-message-button").click();
  }

  async ack(message: string) {
    const row = this.page.getByTestId("log-table-row").filter({ hasText: message });
    await row.getByTestId("ack-message-button").click();
  }

  get ackAllButton(): Locator {
    return this.page.getByTestId("ack-all-button");
  }

  traceButton(traceId: string): Locator {
    return this.page.getByTitle(`trace: ${traceId}`);
  }

  async ackTrace(traceId: string) {
    await this.traceButton(traceId).first().click();
    await this.getByTestId("trace-ack").click();
  }

  async openTrace(traceId: string) {
    await this.traceButton(traceId).first().click();
    await this.getByTestId("trace-show").click();
    await this.page.waitForURL("/by-trace/" + traceId);
  }

  get matchingFilterButtons(): Locator {
    return this.getByTestId("matching-filter");
  }

  get matchingFilterAckSuchDropdownOption(): Locator {
    return this.getByTestId("matching-filter-ack-such");
  }

  get matchingFilterShowSuchDropdownOption(): Locator {
    return this.getByTestId("matching-filter-show-such");
  }

  //

  get cleanCheck(): Locator {
    return this.page.getByText("Clean ✅");
  }

  async clickAckAll(props: { expectedCount?: number } = {}) {
    await test.step("clickAckAll", async () => {
      if (props.expectedCount) {
        await expect(this.ackAllButton).toHaveText(`ACK ${props.expectedCount}`);
      }
      await this.ackAllButton.click();
    }, { box: true });
  }

  get ackedUnackedMessagesToggle() {
    return this.getByTestId("toggle-ack-nack");
  }

  get logMessage() {
    return this.page.getByTestId("log-message");
  }

  async expectLogMessages(...expected: string[]) {
    await test.step("expectLogMessages", () => expectTexts(this.logMessage, ...expected), { box: true });
  }

  async expandRow(message: string): Promise<RowLine> {
    const locator = this.logMessage.getByText(message);
    await locator.click();
    return new RowLine(this.page);
  }

  sourceTabHeader(source: { id: string }) {
    return this.page.getByTestId(`source-tab-${source.id}`);
  }

  async selectSourceTab(source: { id: string }) {
    await this.sourceTabHeader(source).click();
  }

  get allSourcesTab() {
    return this.page.getByTestId("all-sources-tab");
  }

  async selectAllSourcesTab() {
    await this.allSourcesTab.click();
  }

  async expectSourceTabCount(source: { id: string }, count: number | undefined) {
    await test.step("expectSourceTabCount", async () => {
      const unackCountLocator = this.sourceTabHeader(source).getByTestId("source-unack-count");
      if (count === undefined) {
        await expect(unackCountLocator).not.toBeAttached();
      } else {
        await expect(unackCountLocator).toHaveText(`${count}`);
      }
    }, { box: true });
  }

  get clock() {
    return this.page.clock;
  }

  getByTestId(testId: string) {
    return this.page.getByTestId(testId);
  }

  get showSourceButton() {
    return this.page.getByTestId("show-source-button");
  }

  async showSource() {
    await this.showSourceButton.click();
    return new SourceCardFixture(this.page);
  }

  async waitNextSyncCycle() {
    await this.page.clock.runFor("01:00"); // a minute to sync
  }

  async createFilter(props: {
    logLineText: string | undefined; // undefined for if there's already the log record open
    expectedPrefilledRegex?: string;
    filterRegex?: string;
    stepName?: string;
    saveAction?: "apply" | "save" | "none"; // defaults to 'save'
    onFirstScreenShown?: (filterEditor: FilterEditorPageFixture) => Promise<void>;
    onSecondScreenShown?: (filterEditor: FilterEditorPageFixture) => Promise<void>;
  }) {
    const filterEditor = new FilterEditorPageFixture(this.page.getByTestId("rule-edit-section"));

    await test.step(props.stepName ?? "createFilter", async () => {
      if (props.logLineText) {
        await this.page.getByText(props.logLineText).click();
      }
      await this.page.getByTestId("new-rule-button").click();

      await expect(filterEditor.locator).toBeAttached();

      if (props.expectedPrefilledRegex) {
        await expect(filterEditor.filterRegex).toHaveValue(props.expectedPrefilledRegex);
      }

      if (props.filterRegex) {
        await filterEditor.filterRegex.fill(props.filterRegex);
      }
      switch (props.saveAction) {
        case "none":
          break;
        case "apply":
          if (props.onFirstScreenShown) {
            await props.onFirstScreenShown(filterEditor);
          }
          await filterEditor.applyButton.click();
          break;
        case "save":
        case undefined:
          if (props.onFirstScreenShown) {
            await props.onFirstScreenShown(filterEditor);
          }
          await filterEditor.persistButton.click();
          if (props.onSecondScreenShown) {
            await props.onSecondScreenShown(filterEditor);
          }
          await filterEditor.saveButton.click();
          break;
      }
    }, { box: false });

    return filterEditor;
  }
}

export class FilterEditorPageFixture {
  constructor(public locator: Locator) {}

  get filterRegex() {
    return this.locator.getByTestId("rule_regex");
  }

  get saveButton() {
    return this.locator.getByTestId("save-rule-button");
  }

  get persistButton() {
    return this.locator.getByTestId("persist-rule-button");
  }

  get applyButton() {
    return this.locator.getByTestId("apply-rule-button");
  }

  get autoAckCheckbox() {
    return this.locator.getByTestId("auto-ack");
  }

  get ackWholeTraceCheckbox() {
    return this.locator.getByTestId("ack-trace");
  }

  get autoAckTtlTriggerButton() {
    return this.locator.getByTestId("auto-ack-ttl-trigger-button");
  }

  get descriptionTextEditor() {
    return this.locator.getByTestId("filter-description-input");
  }

  calendarDateButton(date: string) {
    return this.locator.locator(`td[data-day="${date}"] button`);
  }

  async pickTTLDate(date: string) {
    await this.autoAckTtlTriggerButton.click();
    await this.calendarDateButton(date).click();
  }
}

// NB: full-page ATM
class RowLine {
  constructor(public page: Page) {}

  get ackTillThis() {
    return this.page.getByTestId("ack-till-this");
  }
}
