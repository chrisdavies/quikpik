import Quikpik from './quikpik.svelte';

/**
 * Create and show the file picker.
 *
 * @param {Object} opts
 * @param {boolean} opts.customProgress
 * @param {string[]} opts.sources the allowable file sources
 * @param {function} opts.upload the upload function { file, onProgress() } => { promise, cancel() }
 */
export default function quikpik(opts) {
  const root = document.createElement('div');

  document.body.appendChild(root);

  function close() {
    if (app.uploader) {
      app.uploader.cancel();
    }

    root.remove();
  }

  const app = new Quikpik({
    target: root,
    props: {
      ...opts,
      uploader: undefined,
      close,
    },
  });

  return {
    close,
  };
}
