import { Locator, Page } from "@playwright/test";

export default class FiltersPageFixture {
    constructor(readonly page: Page) { }

    getFilterCard({regex}: {regex: string}) {
        return new FilterCard(
            this.page.getByTestId('filter-card')
                .filter(
                    {has: this.page.getByTestId('filter-message-regex').filter({hasText: regex})}
                )
        )
    }
    
}

export class FilterCard {
    constructor(readonly locator: Locator) { }

    get currentHitCount() {
        return this.locator.getByTestId('current-hit-count')
    }
}