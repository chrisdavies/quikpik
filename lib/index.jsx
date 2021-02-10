import { render } from 'inferno';
import { Quikpik } from './quikpik';
import { mediaSupport } from './media-lib';

const isSupported = mediaSupport();

/**
 * Create and show the file picker.
 *
 * @param {Object} opts
 * @param {boolean} opts.customProgress
 * @param {string[]} opts.sources the allowable file sources
 * @param {function} opts.upload the upload function { file, onProgress() } => { promise, cancel() }
 * @param {function} [opts.onClose] the callback to be called when quikpik closes
 */
export default function quikpik(opts) {
  const root = document.createElement('div');
  const app = {
    close,

    // If an upload is in progress, this property
    // will be set to a cancelable object.
    uploader: undefined,
  };

  const sources = (opts.sources || ['filepicker', 'takephoto', 'takevideo', 'takeaudio']).filter(
    (k) => isSupported[k],
  );

  document.body.appendChild(root);

  function close() {
    if (app.uploader) {
      app.uploader.cancel();
    }

    root.remove();
    opts.onClose && opts.onClose();
  }

  function upload(...args) {
    app.uploader = opts.upload(...args);
    return app.uploader;
  }

  render(<Quikpik {...opts} sources={sources} close={close} upload={upload} />, root);

  return { close };
}
