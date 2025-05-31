import { Page } from '@playwright/test';
import { test, expect } from '@tests/app/setup/testExtended';
import { AnnotationSuppressDefaultApp } from '../setup/AppStateFixture';

test('upload configuration', AnnotationSuppressDefaultApp, async ({ page, appState }) => {
    await page.goto('/');

    await page.getByTitle('Upload configuration').click();

    const content = JSON.stringify({sources: [{id: 'testSource1', name: 'Test Source', query: '{job="test"}', color: '#ff0000', active: true}], filters: []}, null, 2);

    await (new UploadSection(page).uploadConfig(content));

    await expect(page.getByText(/Test Source/)).toBeVisible();

    expect(await appState.sourceNames()).toEqual(['Test Source']);
});

test('upload configuration with no json', AnnotationSuppressDefaultApp, async ({ page }) => {
    await page.goto('/');

    await page.getByTitle('Upload configuration').click();

    await (new UploadSection(page).uploadConfig("not a json content"));

    await expect(page.getByText(/The file is not a valid JSON/)).toBeVisible();

});

class UploadSection {
    constructor(private page: Page) {}

    async uploadConfig(content: string) {
        const dataTransfer = await this.page.evaluateHandle((content) => {
            const dataTransfer = new DataTransfer()
            const file = new File([content], 'example-file.txt');
            dataTransfer.items.add(file);
            return dataTransfer;
        }, content);

        const target = this.page.getByTestId('upload-landing-zone');

        await target.dispatchEvent('drop', {dataTransfer});    
    }
}