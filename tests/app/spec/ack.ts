import { expect, test } from '@tests/app/setup/testExtended';
import { expectTexts } from '../util/visualAssertions';

test.describe('ack all', () => {
    test('ack all messages', async ({ page, appState, mainPage, logs }) => {

        await appState.givenSources({}); //TODO: a default state with one given state?
    
        logs.givenRecords('event1', 'event2', 'event3');
    
        await mainPage.open({startFetch: true});
        
        await expectTexts(page.getByTestId('log-message'), 'event3', 'event2', 'event1');
    
        //when

        await mainPage.clickAckAll({expectedCount: 3})
        
        await expectTexts(page.getByTestId('log-message'), ...[]);
    
    });

    test('hide when nothing to ack', async ({ appState, mainPage }) => {

        await appState.givenSources({});
    
        await mainPage.open();
        
        await expect(mainPage.ackAllButton).not.toBeVisible()
        
    });


    //TODO: when multiple sources and selected one tag, ack all should only apply to it.
})

test('acked indicator should indicate the number of acked messages', async ({ page, appState, mainPage, logs }) => {

    await appState.givenSources({}); //TODO: a default state with one given state

    logs.givenRecords('event1', 'event2');

    await mainPage.open();

    await page.getByTestId('start-fetching-button').click();

    await mainPage.expectAckMessages(0)

    await expectTexts(page.getByTestId('log-message'), 'event2', 'event1');

    //when
    
    await mainPage.page.getByTestId('ack-message-button').first().click()

    //then
    await mainPage.expectAckMessages(1)
    await expectTexts(page.getByTestId('log-message'), 'event1');

    //and then again
    await mainPage.page.getByTestId('ack-message-button').first().click()

    await mainPage.expectAckMessages(2)
    await expectTexts(page.getByTestId('log-message'), ...[]);
    
});
