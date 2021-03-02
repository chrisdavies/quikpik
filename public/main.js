import './main.css';
import { h } from '../src/dom';
import quikpik from '../src';

function upload({ file, onProgress }) {
  console.log('Uploading file:', file.name, 'type:', file.type);

  const preview = h('img', { src: URL.createObjectURL(file) });
  preview.style.maxWidth = '800px';
  preview.style.maxHeight = '800px';
  document.body.prepend(preview);

  const mockProgressInterval = 250;
  let progress = 0;
  let resolve, reject, timeout;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
    timeout = setTimeout(mockProgress, mockProgressInterval);

    function mockProgress() {
      progress += 10;
      onProgress(progress);

      if (progress >= 100) {
        resolve(file);
      } else {
        setTimeout(mockProgress, mockProgressInterval);
      }
    }
  });

  return {
    promise,

    cancel() {
      // Reject should do whatever XMLHttpRequest abort does:
      // The XMLHttpRequest.abort() method aborts the request if it has already been sent. When a request is aborted, its readyState is changed to XMLHttpRequest.UNSENT (0) and the request's status code is set to 0.
      console.log('I was canceled!');
      clearTimeout(timeout);
      return reject && reject({ status: 0 });
    },
  };
}

quikpik({ accept: 'image/*', upload, requireCrop: true, cropRatio: 1 }).then((result) =>
  console.log('done with', result.name),
);
