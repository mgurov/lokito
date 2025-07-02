import { Locator, Page, test } from "@playwright/test";

export const filtersPageTest = test.extend<{ filtersPage: FiltersPageFixture }>({
  filtersPage: [async ({ page }, use) => {
    await use(new FiltersPageFixture(page));
  }, {}],
});

export default class FiltersPageFixture {
  constructor(readonly page: Page) {}

  getFilterCard({ regex }: { regex: string }) {
    return new FilterCard(
      this.page.getByTestId("filter-card")
        .filter(
          { has: this.page.getByTestId("filter-message-regex").filter({ hasText: regex }) },
        ),
    );
  }

  open = () => this.page.goto("/filters");
}

export class FilterCard {
  constructor(readonly locator: Locator) {}

  get currentHitCount() {
    return this.locator.getByTestId("current-hit-count");
  }

  get totalHitCount() {
    return this.locator.getByTestId("total-hit-count");
  }

  get deleteButton() {
    return this.locator.getByTestId("delete-filter-button");
  }

  get autoAckSign() {
    return this.locator.getByTestId("auto-ack-sign");
  }

  get ttl() {
    return this.locator.getByTestId("autoack-till");
  }
}
