/* eslint-disable jsx/no-undef */
import { render } from 'solid-js/dom';
import { onCleanup, createState, Show } from 'solid-js';
import { PickerForm } from './picker-form';
import { PickerProgress } from './picker-progress';

/**
 * @typedef {Object} PickerInstance
 * @property { function(): void } close close and clean up the picker.
 */

/**
 * @typedef {Object} PickerOptions
 * @property {boolean} customProgress whether or not the user will display progress on their own. Defaults to false.
 * @property { function({ file: File, onProgress: (progress: number) => void}): { promise: Promise<any>; cancel: () => void } } upload upload the specified file
 */

/**
 * @param {{ opts: PickerOptions, pickerInstance: PickerInstance }} props
 */
function Picker({ opts, pickerInstance }) {
  const sources = opts.sources || ['filepicker', 'takephoto', 'takevideo', 'takeaudio'];
  const [state, setState] = createState({
    progress: 0,

    // The result of calling opts.upload, has a promise, and a cancel method
    uploader: undefined,

    // The file, or file-like object being uploaded.
    file: undefined,
  });

  function close() {
    if (state.uploader) {
      state.uploader.cancel();
    }

    pickerInstance.close();
  }

  function closeOnEsc(e) {
    if (e.key === 'Escape' || e.code === 'Escape') {
      close();
    }
  }

  function onProgress(progress) {
    setState((s) => ({ ...s, progress }));
  }

  function uploadFile(file) {
    if (file) {
      const uploader = opts.upload({ file, onProgress });

      setState((s) => ({
        ...s,
        mode: 'uploading',
        progress: 0,
        file,
        uploader,
      }));

      uploader.promise
        .then(() => {
          setState((s) => ({ ...s, progress: 100 }));
          setTimeout(close, 1000);
        })
        .catch((err) => {
          // TODO: stylize this
          alert('Upload failed.', err.message);
          close();
        });
    }
  }

  document.addEventListener('keydown', closeOnEsc);

  onCleanup(() => {
    document.removeEventListener('keydown', closeOnEsc);
  });

  return (
    <Show when={!state.uploader || !opts.customProgress}>
      <div class="quikpik" onClick={close}>
        <style jsx global>
          {`
            @keyframes quikpik-spin {
              0% {
                transform: translate(-50%, -50%) rotate(0deg);
              }
              100% {
                transform: translate(-50%, -50%) rotate(360deg);
              }
            }

            .quikpik {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: Inter var, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
                Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji,
                Segoe UI Symbol, Noto Color Emoji;
              z-index: 10000;
            }

            .quikpik::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              bottom: 0;
              right: 0;
              background: #6b7280;
              opacity: 0.75;
              z-index: 10000;
            }

            .quikpik-info {
              color: #6b7280;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-grow: 1;
            }
          `}
        </style>
        {state.uploader ? (
          <PickerProgress progress={state.progress} file={state.file} />
        ) : (
          <PickerForm sources={sources} uploadFile={uploadFile} />
        )}
      </div>
    </Show>
  );
}

/**
 * Displays the file picker with the specified options.
 *
 * @param {PickerOptions} opts The picker options
 * @returns {{ close: () => void }} The picker instance
 */
export function quikpik(opts) {
  const root = document.createElement('div');

  function close() {
    root.remove();
  }

  const pickerInstance = {
    close,
  };

  document.body.appendChild(root);
  render(() => <Picker opts={opts} pickerInstance={pickerInstance} />, root);

  return pickerInstance;
}
