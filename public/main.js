import './main.css';
import { h } from '../src/dom';
import quikpik from '../src';

function upload(opts) {
  const files = opts.files;
  const onProgress = opts.onProgress;
  console.log('Uploading files:', files);

  const mockProgressInterval = 50;
  let canceled = false;

  const promise = (async () => {
    const total = files.length * 100;
    let remaining = 0;
    for (let f = 0; f < files.length; ++f) {
      const file = files[f];
      for (let i = 0; i < 100; ++i) {
        if (canceled) {
          break;
        }
        remaining++;
        onProgress(Math.floor((remaining / total) * 100), file.name);
        await new Promise((r) => setTimeout(r, mockProgressInterval));
      }
    }
    if (canceled) {
      const err = new Error('Uploads canceled.');
      err.status = 0;
      throw err;
    }
    return files;
  })();

  return {
    promise,

    cancel() {
      // Reject should do whatever XMLHttpRequest abort does:
      // The XMLHttpRequest.abort() method aborts the request if it has already been sent. When a request is aborted, its readyState is changed to XMLHttpRequest.UNSENT (0) and the request's status code is set to 0.
      console.log('I was canceled!');
      canceled = true;
    },
  };
}

function showPreview(files) {
  if (!files || !files.length) {
    return;
  }
  console.log('Previewing first of ', files);
  const file = files[0];
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
          upload(opts) {
            const files = opts.files;
            showPreview(files);
            return upload({
              files,
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
  requireCrop: true,
  // cropRatio: 1,
  sources: ['filepicker', 'takephoto', 'takevideo', 'takeaudio'],
  multiple: true,
  upload,
  cropRatio: 1,
  maxDuration: 2,
}).then(showPreview);
