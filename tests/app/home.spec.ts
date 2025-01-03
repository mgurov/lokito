import { Download, Page } from '@playwright/test';
import { test, expect } from '@tests/app/setup/testExtended';

test('should show help text on no active sources when opening the page for the first time', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText(/There are no active sources/)).toBeVisible();
});

test('add source', async ({ page, appState }) => {
    await page.goto('/');
    
    await page.click('text="create a new one"');
    
    await page.fill('text=Name', 'Test Source');
    await page.fill('text=Loki query', '{job="test"}');

    
    await page.click('text=Save changes');
    
    await expect(page.getByText(/Test Source/)).toBeVisible();

    //and then should persist the page reopens
    expect(await appState.sourceNames()).toEqual(['Test Source']);

    await page.goto('/');

    await expect(page.getByText(/Test Source/)).toBeVisible();
});

test('download sources', async ({ page }) => {

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