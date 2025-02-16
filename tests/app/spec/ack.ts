import { expect, test } from '@tests/app/setup/testExtended';

test.describe('ack all', () => {
    test('ack all messages', async ({ appState, mainPage, logs }) => {

        await appState.givenSource();
    
        logs.givenRecords('event1', 'event2', 'event3');
    
        await mainPage.open({startFetch: true});
        
        await mainPage.expectLogMessages('event3', 'event2', 'event1');
    
        //when

        await mainPage.clickAckAll({expectedCount: 3})
        
        await mainPage.expectLogMessages(...[]);
    
    });

    test('hide when nothing to ack', async ({ appState, mainPage }) => {

        await appState.givenSource();
    
        await mainPage.open();
        
        await expect(mainPage.ackAllButton).not.toBeVisible()
        
    });


    //TODO: when multiple sources and selected one tag, ack all should only apply to it.
})

test.describe('ack till this', () => {
    test('should be able to ack till this message via expanded log line', async ({ appState, mainPage, logs }) => {

        await appState.givenSource();
    
        logs.givenRecords('event1', 'event2', 'event3');
    
        await mainPage.open({startFetch: true});
        
        await mainPage.expectLogMessages('event3', 'event2', 'event1');
    
        //when

        const logRow = await mainPage.expandRow('event2')

        await logRow.ackTillThis.click()

        await mainPage.expectLogMessages('event3');

        await mainPage.expectAckMessages(2)
        
    });

    //TODO: should work correctly when two sources and one around another
})


test('acked indicator should indicate the number of acked messages', async ({ appState, mainPage, logs }) => {

    await appState.givenSource();

    logs.givenRecords('event1', 'event2');

    await mainPage.open({startFetch: true});

    await mainPage.expectAckMessages(0)

    await mainPage.expectLogMessages('event2', 'event1');

    //when
    
    await mainPage.page.getByTestId('ack-message-button').first().click()

    //then
    await mainPage.expectAckMessages(1)
    await mainPage.expectLogMessages('event1');

    await test.step('and then ack once more', async () => {
        await mainPage.page.getByTestId('ack-message-button').first().click()

        await mainPage.expectAckMessages(2)
        await mainPage.expectLogMessages(...[]);    
    })

});
