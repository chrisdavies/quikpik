import { createFuture } from './future';
import { renderPickerModal, setModalBody } from './quikpik';
import { on } from './dom';
import { renderUploadProgress, updateProgress } from './upload-progress';
import { renderImageEditor } from './image-editor';
import { renderFilePicker } from './file-picker';
import { renderMediaConfirmation } from './media-confirmation';
import { renderMediaCapture } from './webcam-capture';
import './index.css';

function appContext(opts) {
  opts = {
    sources: ['filepicker', 'takephoto'],
    ...opts,
  };

  // The result of the upload, if it succeeded
  let result;

  // The promise which will resolve / reject based on
  // what the user picked.
  const promise = createFuture();

  // An array of functions which will be called when the picker
  // closes, to clean up any loose ends.
  const disposers = [
    // Close when the escape key is pressed
    on(window, 'keydown', (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        close();
      }
    }),
    // Handle pasting of files
    on(document.body, 'paste', (e) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length) {
        e.preventDefault();
        onPickFile(e.clipboardData.files[0]);
      }
    }),
  ];

  // The sanitized and expanded context / options
  // object used to control the picker state.
  const app = {
    ...opts,
    close,
    uploadFile,
    onPickFile,
    beginCaptureMedia,
    promise,

    // This gets defined later...
    root: undefined,

    // If an upload is in progress, this property
    // will be set to a cancelable object.
    uploader: undefined,
  };

  app.root = renderPickerModal(app);

  function resetPicker() {
    setModalBody(
      app.root,
      renderFilePicker({
        onPickFile,
        beginCaptureMedia,
        accept: app.accept,
        sources: app.sources,
      }),
    );
  }

  // Close the picker and clean up all the things.
  function close() {
    promise.resolve(result);
    app.root.remove();

    disposers.forEach((fn) => fn());

    if (app.uploader) {
      app.uploader.cancel();
      app.uploader = undefined;
    }
  }

  // A file has been picked. Take the appropriate action...
  function onPickFile(file) {
    if (
      file.type !== 'image/gif' &&
      !file.type.startsWith('image/svg') &&
      file.type.startsWith('image/')
    ) {
      // Show the image rotation options
      const url = URL.createObjectURL(file);
      disposers.push(() => URL.revokeObjectURL(url));
      setModalBody(
        app.root,
        renderImageEditor({
          ...opts,
          url,
          file,
          cancelText: 'Cancel',
          confirmText: 'Accept & upload',
          onCancel: resetPicker,
          onConfirm: uploadFile,
        }),
      );
      return;
    }

    uploadFile(file);
  }

  function onMediaCaptured(file) {
    // Show the audio / video preview / confirmation screen
    const url = URL.createObjectURL(file);
    disposers.push(() => URL.revokeObjectURL(url));
    setModalBody(
      app.root,
      renderMediaConfirmation({
        ...opts,
        url,
        file,
        cancelText: 'Cancel',
        confirmText: 'Accept & upload',
        onCancel: resetPicker,
        onConfirm: uploadFile,
      }),
    );
  }

  function beginCaptureMedia(type) {
    setModalBody(
      app.root,
      renderMediaCapture({
        type,
        onPickFile: type === 'takephoto' ? onPickFile : onMediaCaptured,
        onCancel: resetPicker,
        maxDuration: app.maxDuration,
      }),
    );
  }

  function uploadFile(file) {
    if (opts.customProgress) {
      app.root.remove();
      app.uploader = opts.upload({
        file,
        onProgress() {},
      });
      app.uploader.promise.then((x) => promise.resolve(x)).catch(promise.reject);
    } else {
      const uploadUi = renderUploadProgress(file);
      setModalBody(app.root, uploadUi);
      app.uploader = opts.upload({
        file,
        onProgress(progress) {
          updateProgress(uploadUi, progress);
        },
      });
      app.uploader.promise
        .then((x) => {
          result = x;
          setTimeout(close, 250);
        })
        .catch(promise.reject);
    }

    return app.uploader;
  }

  promise.cancel = close;

  return app;
}

/**
 * Display the quikpik modal.
 * @param opts
 * @param {string[]} opts.sources the allowed input sources
 * @param {string} opts.accept the optional accept string for the file picker see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#htmlattrdefaccept
 * @param {boolean} opts.customProgress indicates whether or not the caller will show progress
 * @param {boolean} opts.requireCrop indicates whether or not image crop is required
 * @param {boolean} opts.cropRatio indicates the aspect ratio (height = cropRatio * width)
 * @param {function} opts.upload the upload function
 */
export default function quikpik(opts = {}) {
  const app = appContext(opts);
  document.body.appendChild(app.root);
  return app.promise;
}
