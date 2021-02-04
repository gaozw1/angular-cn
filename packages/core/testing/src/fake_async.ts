/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const _Zone: any = typeof Zone !== 'undefined' ? Zone : null;
const fakeAsyncTestModule = _Zone && _Zone[_Zone.__symbol__('fakeAsyncTest')];

const fakeAsyncTestModuleNotLoadedErrorMessage =
    `zone-testing.js is needed for the async() test helper but could not be found.
        Please make sure that your environment includes zone.js/dist/zone-testing.js`;

/**
 * Clears out the shared fake async zone for a test.
 * To be called in a global `beforeEach`.
 *
 * 清除共享的伪异步 Zone 以进行测试。在全局 `beforeEach` 中调用。
 *
 * @publicApi
 */
export function resetFakeAsyncZone(): void {
  if (fakeAsyncTestModule) {
    return fakeAsyncTestModule.resetFakeAsyncZone();
  }
  throw new Error(fakeAsyncTestModuleNotLoadedErrorMessage);
}

/**
 * Wraps a function to be executed in the fakeAsync zone:
 *
 * 包装一个函数，以便在 fakeAsync Zone 中执行：
 *
 * - microtasks are manually executed by calling `flushMicrotasks()`,
 *
 *   通过调用 `flushMicrotasks()` 手动执行微任务，
 *
 * - timers are synchronous, `tick()` simulates the asynchronous passage of time.
 *
 *   计时器是同步的，用 `tick()` 模拟异步时间的流逝。
 *
 * If there are any pending timers at the end of the function, an exception will be thrown.
 *
 * 如果函数末尾有任何待处理的计时器，则将引发异常。
 *
 * Can be used to wrap inject() calls.
 *
 * 可用于包装 inject() 调用。
 *
 * @usageNotes
 *
 * ### Example
 *
 * ### 例子
 *
 * @param fn
 * @returns The function wrapped to be executed in the fakeAsync zone
 *
 * 要包装为在 fakeAsync Zone 中执行的函数
 *
 * @publicApi
 */
export function fakeAsync(fn: Function): (...args: any[]) => any {
  if (fakeAsyncTestModule) {
    return fakeAsyncTestModule.fakeAsync(fn);
  }
  throw new Error(fakeAsyncTestModuleNotLoadedErrorMessage);
}

/**
 * Simulates the asynchronous passage of time for the timers in the fakeAsync zone.
 *
 * 为 fakeAsync 区域中的计时器模拟异步时间流逝。
 *
 * The microtasks queue is drained at the very start of this function and after any timer callback
 * has been executed.
 *
 * 在此函数开始时以及执行任何计时器回调之后，微任务队列就会耗尽。
 *
 * @usageNotes
 *
 * ### Example
 *
 * ### 例子
 *
 * {@example core/testing/ts/fake_async.ts region='basic'}
 * @param millis, the number of millisecond to advance the virtual timer
 * @param tickOptions, the options of tick with a flag called
 * processNewMacroTasksSynchronously, whether to invoke the new macroTasks, by default is
 * false, means the new macroTasks will be invoked
 *
 * For example,
 *
 * it ('test with nested setTimeout', fakeAsync(() => {
 *   let nestedTimeoutInvoked = false;
 *   function funcWithNestedTimeout() {
 *     setTimeout(() => {
 *       nestedTimeoutInvoked = true;
 *     });
 *   };
 *   setTimeout(funcWithNestedTimeout);
 *   tick();
 *   expect(nestedTimeoutInvoked).toBe(true);
 * }));
 *
 * in this case, we have a nested timeout (new macroTask), when we tick, both the
 * funcWithNestedTimeout and the nested timeout both will be invoked.
 *
 * it ('test with nested setTimeout', fakeAsync(() => {
 *   let nestedTimeoutInvoked = false;
 *   function funcWithNestedTimeout() {
 *     setTimeout(() => {
 *       nestedTimeoutInvoked = true;
 *     });
 *   };
 *   setTimeout(funcWithNestedTimeout);
 *   tick(0, {processNewMacroTasksSynchronously: false});
 *   expect(nestedTimeoutInvoked).toBe(false);
 * }));
 *
 * if we pass the tickOptions with processNewMacroTasksSynchronously to be false, the nested timeout
 * will not be invoked.
 *
 *
 * @publicApi
 */
export function tick(
    millis: number = 0, tickOptions: {processNewMacroTasksSynchronously: boolean} = {
      processNewMacroTasksSynchronously: true
    }): void {
  if (fakeAsyncTestModule) {
    return fakeAsyncTestModule.tick(millis, tickOptions);
  }
  throw new Error(fakeAsyncTestModuleNotLoadedErrorMessage);
}

/**
 * Simulates the asynchronous passage of time for the timers in the fakeAsync zone by
 * draining the macrotask queue until it is empty. The returned value is the milliseconds
 * of time that would have been elapsed.
 *
 * 通过清空宏任务队列直到其为空，来为 fakeAsync Zone 中的计时器模拟异步时间流逝。返回的值是本应经过的毫秒数。
 *
 * @param maxTurns
 * @returns The simulated time elapsed, in millis.
 *
 * 已流逝的模拟时间（以毫秒为单位）。
 *
 * @publicApi
 */
export function flush(maxTurns?: number): number {
  if (fakeAsyncTestModule) {
    return fakeAsyncTestModule.flush(maxTurns);
  }
  throw new Error(fakeAsyncTestModuleNotLoadedErrorMessage);
}

/**
 * Discard all remaining periodic tasks.
 *
 * 丢弃所有剩余的定期任务。
 *
 * @publicApi
 */
export function discardPeriodicTasks(): void {
  if (fakeAsyncTestModule) {
    return fakeAsyncTestModule.discardPeriodicTasks();
  }
  throw new Error(fakeAsyncTestModuleNotLoadedErrorMessage);
}

/**
 * Flush any pending microtasks.
 *
 * 刷新所有未完成的微任务。
 *
 * @publicApi
 */
export function flushMicrotasks(): void {
  if (fakeAsyncTestModule) {
    return fakeAsyncTestModule.flushMicrotasks();
  }
  throw new Error(fakeAsyncTestModuleNotLoadedErrorMessage);
}
