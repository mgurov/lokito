export class Deferred<T> {
  promise: Promise<T>;
  private _resolve!: (value: T | PromiseLike<T>) => void;
  private _reject!: (reason?: unknown) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  resolve(value: T) {
    this._resolve(value);
  }

  reject(reason?: unknown) {
    this._reject(reason);
  }
}

export function awaitWithTimeout<T>(
  promise: Promise<T>,
  options: {
    timeout: number;
    failureMessage: string;
  },
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(options.failureMessage)), options.timeout)),
  ]);
}
