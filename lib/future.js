export function createFuture() {
  let resolved = false;
  let resolve;
  let reject;

  const finish = (fn, result) => {
    if (!resolved) {
      resolved = true;
      fn(result);
    }
  };

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  promise.resolve = (val) => finish(resolve, val);
  promise.reject = (err) => finish(reject, err);

  return promise;
}
