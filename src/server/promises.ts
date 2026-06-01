export async function abort<T>(promise: Promise<T>, signal: AbortSignal, message: string): Promise<T> {
  if (!signal.aborted) {
    return promise;
  }
  throw new DOMException(message, "AbortError");
}
