
import { test, expect } from '@tests/app/setup/testExtended';
import { Deferred } from '../util/promises';

test('should be able to get a hint from the AI', async ({ page, appState, mainPage, logs }) => {
    
    await mainPage.open({
        executeBefore: async () => {
            await appState.givenSources({ name: 'existing' });
            logs.givenRecords({ message: 'Invalid status: policy XEBO125 has been cancelled.' });
        },
        startFetch: true
    });

    await page.getByText('Invalid status: policy XEBO125 has been cancelled.').click();

    const requestedJsonPromise = new Deferred<any>()

    await page.route('/ollama/chat', (route, request) => {
        requestedJsonPromise.resolve(request.postDataJSON())
        route.fulfill({
            json: {
                "model": "codellama-regex",
                "created_at": "2025-03-25T20:36:52.676419Z",
                "message": {
                  "role": "assistant",
                  "content": "Invalid status: policy [a-zA-Z0-9]+ has been cancelled\."
                },
                "done_reason": "stop",
                "done": true,
                "total_duration": 793262166,
                "load_duration": 12006125,
                "prompt_eval_count": 128,
                "prompt_eval_duration": 68129292,
                "eval_count": 16,
                "eval_duration": 708759583
              }
        })
    })

    await page.getByTestId('new-rule-button').click();


    const requestedPromise = await requestedJsonPromise.promise;
    expect(requestedPromise).toStrictEqual({
        "stream": false,
        "model": "codellama-regex",
        "messages": [
          { "role": "user", "content": "Invalid status: policy XEBO125 has been cancelled." }
        ]
      })

      await page.getByTestId('use-suggestion').click();
      await expect(page.getByTestId('rule_regex')).toHaveValue('Invalid status: policy [a-zA-Z0-9]+ has been cancelled\.')
      await page.getByTestId('apply-rule-button').click();
      await mainPage.expectAckMessages(1);

});

