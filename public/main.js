import './main.css';
import { h } from '../src/dom';
import quikpik from '../src';

function upload({ file, onProgress }) {
  console.log('Uploading file:', file.name, 'type:', file.type);

  const mockProgressInterval = 50;
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

function showPreview(file) {
  if (!file) {
    return;
  }
  console.log(file);
  let preview = document.querySelector('img.preview') || h('img.preview');

  if (preview.src) {
    URL.revokeObjectURL(preview.src);
  }

  preview.src = URL.createObjectURL(file);
  document.body.prepend(preview);
}

document.body.append(
  h(
    'button',
    {
      onclick() {
        quikpik({ upload, sources: ['filepicker'] }).then(showPreview);
      },
    },
    'Any file, no camera',
  ),
  h(
    'button',
    {
      onclick(e) {
        quikpik({
          customProgress: true,
          upload({ file }) {
            showPreview(file);
            return upload({
              file,
              onProgress(percent) {
                e.target.textContent = `${percent}%`;
              },
            });
          },
        }).then(() => (e.target.textContent = `Done!`));
      },
    },
    'Custom progress',
  ),
);

quikpik({
  // accept: 'image/*',
  // requireCrop: true,
  // cropRatio: 1,
  sources: ['filepicker', 'takephoto', 'takevideo', 'takeaudio'],
  upload,
  maxDuration: 2,
}).then(showPreview);
