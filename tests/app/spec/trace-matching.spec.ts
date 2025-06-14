import { expect, test } from '@tests/app/setup/testExtended';
import { AnnotationSuppressDefaultApp } from '../setup/AppStateFixture';

test('should mark multiple messages sharing the same traceId across sources', AnnotationSuppressDefaultApp, async ({ appState, mainPage, logs }) => {

    const [source1, source2] = await appState.givenSources(
        {name: "source1"},
        {name: "source2"},
    );

    logs.givenSourceRecords(source1, 
        {message: 'source1.1', traceId: 'tr-1', timestamp: "1"},
        {message: 'source1.2', traceId: 'tr-2', timestamp: "2"},
    );
    logs.givenSourceRecords(source2, 
        {message: 'source2.1'                 , timestamp: "3"},
        {message: 'source2.2', traceId: 'tr-1', timestamp: "4"}
    );
    
    await mainPage.open();
    
    await mainPage.expectLogMessages('source2.2', 'source2.1', 'source1.2', 'source1.1');
    //TODO: should move the same traces togeter on the timeline
    //TODO: await mainPage.expectLogMessages('source2.2', 'source1.1', 'source2.1', 'source1.2');

    // should mark the repeating traces

    await expect(mainPage.traceButton('tr-1')).toHaveCount(2)
    await expect(mainPage.traceButton('tr-2')).toHaveCount(0)

    //and then we check the related logs in a view
    await mainPage.traceButton('tr-1').first().click()
    await mainPage.page.waitForURL('/by-trace/tr-1')

    await mainPage.expectLogMessages('source2.2', 'source1.1');
    await expect(mainPage.traceButton('tr-1')).toHaveCount(0)
});

//TODO: different traces on the same log message
//TODO: twice same trace on the same log message
//TODO: when acked one trace event from a pair, that one should be removed from the main screen, but still present at the traceid screen - as acked.
//TODO: make sure the auto-acked messages don't disappear completely when apres-trace-id ingested

//TODO: continue after last acked message;  continue after first non-acked message; random date-time selection to continue from;