/**
 * Result type for explicit error handling (neverthrow pattern)
 *
 * Usage:
 *   const result = ok(42);
 *   const error = err("something went wrong");
 *
 *   result.match({
 *     ok: (value) => console.log(value),
 *     err: (error) => console.error(error),
 *   });
 */

// Type definitions
export type Result<T, E> = Ok<T, E> | Err<T, E>;

export class Ok<T, E> {
  readonly _tag = "Ok" as const;
  constructor(readonly value: T) {}

  isOk(): this is Ok<T, E> {
    return true;
  }

  isErr(): this is Err<T, E> {
    return false;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return ok(fn(this.value));
  }

  mapErr<F>(_fn: (error: E) => F): Result<T, F> {
    return ok(this.value);
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  orElse<F>(_fn: (error: E) => Result<T, F>): Result<T, F> {
    return ok(this.value);
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  unwrapOrElse(_fn: (error: E) => T): T {
    return this.value;
  }

  match<U>(handlers: { ok: (value: T) => U; err: (error: E) => U }): U {
    return handlers.ok(this.value);
  }

  // Convert to Promise (useful for async chains)
  async(): ResultAsync<T, E> {
    return okAsync(this.value);
  }
}

export class Err<T, E> {
  readonly _tag = "Err" as const;
  constructor(readonly error: E) {}

  isOk(): this is Ok<T, E> {
    return false;
  }

  isErr(): this is Err<T, E> {
    return true;
  }

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return err(this.error);
  }

  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return err(fn(this.error));
  }

  andThen<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
    return err(this.error);
  }

  orElse<F>(fn: (error: E) => Result<T, F>): Result<T, F> {
    return fn(this.error);
  }

  unwrap(): T {
    throw new Error(`Called unwrap on Err: ${this.error}`);
  }

  unwrapOr(defaultValue: T): T {
    return defaultValue;
  }

  unwrapOrElse(fn: (error: E) => T): T {
    return fn(this.error);
  }

  match<U>(handlers: { ok: (value: T) => U; err: (error: E) => U }): U {
    return handlers.err(this.error);
  }

  async(): ResultAsync<T, E> {
    return errAsync(this.error);
  }
}

// Constructors
export function ok<T, E = never>(value: T): Result<T, E> {
  return new Ok(value);
}

export function err<T = never, E = unknown>(error: E): Result<T, E> {
  return new Err(error);
}

// Wrap a function that might throw
export function tryCatch<T, E = Error>(fn: () => T, onError?: (error: unknown) => E): Result<T, E> {
  try {
    return ok(fn());
  } catch (e) {
    return err(onError ? onError(e) : (e as E));
  }
}

// ============================================
// ResultAsync - for async operations
// ============================================

export class ResultAsync<T, E> {
  constructor(private readonly promise: Promise<Result<T, E>>) {}

  static fromPromise<T, E = Error>(
    promise: Promise<T>,
    onError?: (error: unknown) => E
  ): ResultAsync<T, E> {
    return new ResultAsync(
      promise
        .then((value) => ok<T, E>(value))
        .catch((e) => err<T, E>(onError ? onError(e) : (e as E)))
    );
  }

  static fromResult<T, E>(result: Result<T, E>): ResultAsync<T, E> {
    return new ResultAsync(Promise.resolve(result));
  }

  async isOk(): Promise<boolean> {
    return (await this.promise).isOk();
  }

  async isErr(): Promise<boolean> {
    return (await this.promise).isErr();
  }

  map<U>(fn: (value: T) => U): ResultAsync<U, E> {
    return new ResultAsync(this.promise.then((result) => result.map(fn)));
  }

  mapErr<F>(fn: (error: E) => F): ResultAsync<T, F> {
    return new ResultAsync(this.promise.then((result) => result.mapErr(fn)));
  }

  andThen<U>(fn: (value: T) => Result<U, E> | ResultAsync<U, E>): ResultAsync<U, E> {
    return new ResultAsync(
      this.promise.then(async (result) => {
        if (result.isErr()) return err(result.error);
        const next = fn(result.value);
        return next instanceof ResultAsync ? next.promise : next;
      })
    );
  }

  orElse<F>(fn: (error: E) => Result<T, F> | ResultAsync<T, F>): ResultAsync<T, F> {
    return new ResultAsync(
      this.promise.then(async (result) => {
        if (result.isOk()) return ok(result.value);
        const next = fn(result.error);
        return next instanceof ResultAsync ? next.promise : next;
      })
    );
  }

  async unwrap(): Promise<T> {
    return (await this.promise).unwrap();
  }

  async unwrapOr(defaultValue: T): Promise<T> {
    return (await this.promise).unwrapOr(defaultValue);
  }

  async match<U>(handlers: { ok: (value: T) => U; err: (error: E) => U }): Promise<U> {
    return (await this.promise).match(handlers);
  }

  // Allow awaiting directly (thenable pattern)
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable implementation
  then<TResult1 = Result<T, E>, TResult2 = never>(
    onfulfilled?: ((value: Result<T, E>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}

// Async constructors
export function okAsync<T, E = never>(value: T): ResultAsync<T, E> {
  return new ResultAsync(Promise.resolve(ok(value)));
}

export function errAsync<T = never, E = unknown>(error: E): ResultAsync<T, E> {
  return new ResultAsync(Promise.resolve(err(error)));
}

// Wrap an async function that might throw
export function tryCatchAsync<T, E = Error>(
  fn: () => Promise<T>,
  onError?: (error: unknown) => E
): ResultAsync<T, E> {
  return ResultAsync.fromPromise(fn(), onError);
}

// ============================================
// Utility functions
// ============================================

// Combine multiple Results - all must succeed
export function combine<T extends readonly Result<unknown, unknown>[]>(
  results: T
): Result<
  { [K in keyof T]: T[K] extends Result<infer U, unknown> ? U : never },
  T[number] extends Result<unknown, infer E> ? E : never
> {
  const values: unknown[] = [];

  for (const result of results) {
    if (result.isErr()) {
      // biome-ignore lint/suspicious/noExplicitAny: complex generic inference
      return err(result.error) as any;
    }
    values.push(result.value);
  }

  // biome-ignore lint/suspicious/noExplicitAny: complex generic inference
  return ok(values) as any;
}

// Combine multiple ResultAsyncs
export function combineAsync<T extends readonly ResultAsync<unknown, unknown>[]>(
  results: T
): ResultAsync<
  { [K in keyof T]: T[K] extends ResultAsync<infer U, unknown> ? U : never },
  T[number] extends ResultAsync<unknown, infer E> ? E : never
> {
  return new ResultAsync(
    // biome-ignore lint/suspicious/noExplicitAny: complex generic inference
    Promise.all(results.map((r) => r.promise)).then((resolved) => combine(resolved) as any)
  );
}
