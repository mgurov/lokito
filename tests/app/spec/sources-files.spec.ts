import { Download, Page } from '@playwright/test';
import { test, expect } from '@tests/app/setup/testExtended';
import { AnnotationSuppressDefaultApp } from '../setup/AppStateFixture';

test('download sources', AnnotationSuppressDefaultApp, async ({ page, consoleLogging }) => {

    consoleLogging.ignoreErrorMessagesContaining('Dialog is changing from uncontrolled to controlled.')

    await page.goto('/');
    
    await page.click('text="create a new one"');
    
    await page.fill('text=Name', 'Test Source');
    await page.fill('text=Loki query', '{job="test"}');
    await page.fill('text=Color', '#ff0000');
    await page.click('text=Save changes');
    
    await page.goto('/sources');

    const downloadCapture = new DownloadCapture(page);

    await page.getByTitle('Download configuration').click();

    const downloadData = await downloadCapture.toJson() as {sources: {name: string}[]};

    expect(downloadData.sources.map((s) => s.name)).toEqual(['Test Source']);
});

class DownloadCapture {

    private downloadPromise: Promise<Download>;

    constructor(page: Page) {
        this.downloadPromise = page.waitForEvent('download');
    }

    async toJson(): Promise<unknown> {

        const download = await this.downloadPromise;
        const downloadStream = await download.createReadStream();
    
        let downloadString = '';
        for await (const chunk of downloadStream) {
            downloadString += chunk;
        }
        return JSON.parse(downloadString);
    }
}