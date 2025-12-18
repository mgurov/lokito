import { expect, Locator, Page, test } from "@playwright/test";
import { expectTexts } from "@tests/app/util/visualAssertions";
import { LogSource, RouteHandler, routes } from "../ExternalLogsFixture";
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
    installClock = false,
    resetLogsFetchState,
  }: {
    executeBefore?: () => Promise<void>;
    startFetch?: boolean | string;
    installClock?: boolean;
    resetLogsFetchState?: LogSource;
  } = {}) {
    await test.step("open main page", async () => {
      if (installClock) {
        await this.page.clock.install();
      }
      if (resetLogsFetchState) {
        resetLogsFetchState.resetServedRecords();
      }
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

  async onLokiRequest(handler: RouteHandler, options?: Parameters<Page["route"]>[2]) {
    await this.page.route(routes.loki, handler, options);
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

  get newSourceButton() {
    return this.page.getByTestId("new-source-button").getByText("New Source");
  }

  async clickNewSourceButton() {
    await this.newSourceButton.click();

    const newSourceRollover = new NewSourceRollover(this.page);

    await expect(newSourceRollover.locator).toBeVisible();

    return newSourceRollover;
  }

  async unack(message: string) {
    const row = this.logRowByMessage(message);
    await row.getByTestId("unack-message-button").click();
  }

  async ack(message: string) {
    const row = this.logRowByMessage(message);
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

  logByMessage(message: string) {
    return this.logMessage.getByText(message);
  }

  logRowByMessage(message: string) {
    return this.page.getByTestId("log-table-row").filter({ hasText: message });
  }

  get showMoreButton() {
    return this.page.getByTestId("show-more-button");
  }

  get showAllButton() {
    return this.page.getByTestId("show-all-button");
  }

  get forceFetchButton() {
    return this.page.getByTestId("force-fetch");
  }

  async expectNoLogMessages() {
    await this.expectLogMessages();
  }

  /**
   * the messages appear in the reverse order of declaration, convenient to re-reverse the expectation for the readability
   */
  async expectLogMessagesRev(...expected: string[]) {
    await this.expectLogMessages(...[...expected].reverse());
  }

  async expectLogMessages(...expected: string[]) {
    await test.step("expectLogMessages", () => expectTexts(this.logMessage, ...expected), { box: true });
  }

  async awaitAckBacklogEmpty() {
    await this.page.evaluate(() => {
      const link = document.querySelector("[data-testid=\"tech-details\"]");
      if (link) {
        link.classList.remove("invisible");
      }
    });

    await this.getByTestId("tech-details").click();
    await expect(this.getByTestId("acked-backlog")).toHaveText("0");
    await expect(this.getByTestId("unacked-backlog")).toHaveText("0");
  }

  async expandRow(message: string): Promise<RowLine> {
    const locator = this.logByMessage(message);
    await locator.click();
    return new RowLine(this.page);
  }

  sourceTabHeader(source: { id: string }) {
    return this.page.getByTestId(`source-tab-${source.id}`);
  }

  get sourceTabHeaders() {
    return this.page.getByTestId(/source-tab-/);
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
    return new SourceCardFixture(this.page.getByTestId("source-card"));
  }

  async waitNextSyncCycle({ timeToWait = "01:00" }: { timeToWait?: string } = {}) {
    await this.page.clock.runFor(timeToWait); // a minute to sync
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
        await this.logRowByMessage(props.logLineText).click();
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

  get ackWholeTraceExplanation() {
    return this.locator.getByTestId("ack-trace-explanation");
  }

  get autoAckTtlTriggerButton() {
    return this.locator.getByTestId("auto-ack-ttl-trigger-button");
  }

  get descriptionTextEditor() {
    return this.locator.getByTestId("filter-description-input");
  }

  get fieldSelectorTrigger() {
    return this.locator.getByTestId("select-field-to-match-trigger");
  }

  get fieldSelectorContent() {
    return this.locator.page().getByTestId("field-selector-popup");
  }

  fieldOption(fieldName: string) {
    return this.fieldSelectorContent.getByTestId("field_selector_option_" + fieldName);
  }

  async selectField(fieldName: string) {
    await this.fieldSelectorTrigger.click();
    await this.fieldOption(fieldName).click();
  }

  async selectMessageField() {
    await this.fieldSelectorTrigger.click();
    await this.fieldSelectorContent.locator(`[data-value="message"][role="option"]`).click();
  }

  calendarDateButton(date: string) {
    return this.locator.locator(`td[data-day="${date}"] button`);
  }

  async pickTTLDate(date: string) {
    await this.autoAckTtlTriggerButton.click();
    await this.calendarDateButton(date).click();
  }

  async expectMatchIndicators({ toAck, ofTotal }: { toAck: number; ofTotal?: number }) {
    const total = ofTotal ? ` (of ${ofTotal})` : "";
    await expect(this.applyButton).toHaveText(`Ack ${toAck} matched now${total}`);
  }
}

// NB: full-page ATM
class RowLine {
  constructor(public page: Page) {}

  get ackTillThis() {
    return this.page.getByTestId("ack-till-this");
  }
}
