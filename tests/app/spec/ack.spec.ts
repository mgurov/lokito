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

    test('should only ack a selected source messages', async ({ appState, mainPage, logs }) => {

        const [source1, source2] = await appState.givenSources(
            {name: "source1"},
            {name: "source2"},
        );
        logs.givenSourceRecords(source1, {message: 'source1.1', timestamp: "1"}, {message: 'source1.2', timestamp: "2"});
        logs.givenSourceRecords(source2, {message: 'source2.1', timestamp: "3"}, {message: 'source2.2', timestamp: "4"});
        
        await mainPage.open({startFetch: true});
        
        await mainPage.expectLogMessages('source2.2', 'source2.1', 'source1.2', 'source1.1');
    
        //when

        await mainPage.selectSourceTab(source1)

        await mainPage.clickAckAll({expectedCount: 2})
        
        await mainPage.expectLogMessages(...[]);

        await mainPage.selectAllSourcesTab()

        await mainPage.expectLogMessages('source2.2', 'source2.1');

    
    });

    test('should ack all messages all sources', async ({ appState, mainPage, logs }) => {

        const [source1, source2] = await appState.givenSources(
            {name: "source1"},
            {name: "source2"},
        );
        logs.givenSourceRecords(source1, {message: 'source1.1', timestamp: "1"}, {message: 'source1.2', timestamp: "2"});
        logs.givenSourceRecords(source2, {message: 'source2.1', timestamp: "3"}, {message: 'source2.2', timestamp: "4"});
        
        await mainPage.open({startFetch: true});
        
        await mainPage.expectLogMessages('source2.2', 'source2.1', 'source1.2', 'source1.1');
    
        //when

        await mainPage.clickAckAll({expectedCount: 4})
        
        await mainPage.expectLogMessages(...[]);
    
    });

    test('should update source count when acking', async ({ appState, mainPage, logs }) => {

        const [source1, source2] = await appState.givenSources(
            {name: "source1"},
            {name: "source2"},
        );
        logs.givenSourceRecords(source1, {message: 'source1.1', timestamp: "1"}, {message: 'source1.2', timestamp: "2"});
        logs.givenSourceRecords(source2, {message: 'source2.1', timestamp: "3"}, {message: 'source2.2', timestamp: "4"});
        
        await mainPage.open({startFetch: true});
            
        await mainPage.selectSourceTab(source1)
        await mainPage.expectSourceTabCount(source1, 2)
        //when
        await mainPage.clickAckAll({expectedCount: 2})
        //then
        await mainPage.expectSourceTabCount(source1, undefined)
        await mainPage.expectSourceTabCount(source2, 2)
    
    });

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

    test('ack till this should only ack the selected source', async ({ appState, mainPage, logs }) => {

        const [source1, source2] = await appState.givenSources({name: "source1"}, {name: "source2"});
    
        logs.givenSourceRecords(source1, 
            {message: 's1.1', timestamp: "1"}, 
            {message: 's1.2', timestamp: "3"},
            {message: 's1.3', timestamp: "5"},
        );
        logs.givenSourceRecords(source2, 
            {message: 's2.1', timestamp: "2"}, 
            {message: 's2.2', timestamp: "4"}
        );
    
        await mainPage.open({startFetch: true});
        
        await mainPage.expectLogMessages('s1.3', 's2.2', 's1.2', 's2.1', 's1.1');
    
        //when

        await mainPage.selectSourceTab(source1)

        const logRow = await mainPage.expandRow('s1.2')

        await logRow.ackTillThis.click()

        await mainPage.expectLogMessages('s1.3');

        //and then back to the all sources

        await mainPage.selectAllSourcesTab()

        await mainPage.expectLogMessages('s1.3', 's2.2', 's2.1');
        
    });


    test('ack till this should ack from all source when on all sources page', async ({ appState, mainPage, logs }) => {

        const [source1, source2] = await appState.givenSources({name: "source1"}, {name: "source2"});
    
        logs.givenSourceRecords(source1, 
            {message: 's1.1', timestamp: "1"}, 
            {message: 's1.2', timestamp: "3"},
            {message: 's1.3', timestamp: "5"},
        );
        logs.givenSourceRecords(source2, 
            {message: 's2.1', timestamp: "2"}, 
            {message: 's2.2', timestamp: "4"}
        );
    
        await mainPage.open({startFetch: true});
        
        await mainPage.expectLogMessages('s1.3', 's2.2', 's1.2', 's2.1', 's1.1');
    
        //when

        const logRow = await mainPage.expandRow('s1.2')

        await logRow.ackTillThis.click()

        await mainPage.expectLogMessages('s1.3', 's2.2');
        
    });

})


test('acked indicator should indicate the number of acked messages', async ({ appState, mainPage, logs }) => {

    await appState.givenSource();

    logs.givenRecords('event1', 'event2');

    await mainPage.open({startFetch: true});


    await mainPage.expectLogMessages('event2', 'event1');
    await mainPage.expectAckMessages(0)

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

test('document title should indicate the number of acked messages', async ({ appState, mainPage, logs }) => {

    await mainPage.clock.install();

    await appState.givenSource();
    
    await mainPage.open({startFetch: true});

    await expect.poll(async () => mainPage.page.title()).toBe('Lokito');

    logs.givenRecords('event1', 'event2');
    await mainPage.waitNextSyncCycle()

    await expect.poll(async () => mainPage.page.title()).toBe('Lokito🔥2');
    await mainPage.expectLogMessages('event2', 'event1');
    await mainPage.expectAckMessages(0)

    //when

    await test.step('first message acked', async () => {
        await mainPage.page.getByTestId('ack-message-button').first().click()
        await expect.poll(async () => mainPage.page.title()).toBe('Lokito🔥1');
    
        //then
        await mainPage.expectAckMessages(1)
        await mainPage.expectLogMessages('event1');
    })
    

    await test.step('and then ack once more', async () => {
        await mainPage.page.getByTestId('ack-message-button').first().click()

        await mainPage.expectAckMessages(2)
        await mainPage.expectLogMessages(...[]);

        await expect.poll(async () => mainPage.page.title()).toBe('Lokito');
    })

});

