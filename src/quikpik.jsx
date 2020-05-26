/* eslint-disable jsx/no-undef */
import { render } from 'solid-js/dom';
import { onCleanup, createState } from 'solid-js';

/**
 * @typedef PickerInstance
 * @property { function(): void } close close and clean up the picker.
 */

/**
 * @typedef PickerOptions
 * @property { function({ file: File, onProgress: (progress: number) => void}): { promise: Promise<any>; cancel: () => void } } upload upload the specified file
 */

function cancelEvent(e) {
  e.stopPropagation();
}

function FilePicker(props) {
  const [state, setState] = createState({
    // Indicates if the picker is a drop target
    isDropTarget: false,
  });

  function onDragOver(e) {
    e.preventDefault();

    console.log('onDragOver', e);
    setState((s) => ({ ...s, isDropTarget: true }));
  }

  function onDragEnd() {
    setState((s) => ({ ...s, isDropTarget: false }));
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];

    if (file) {
      props.uploadFile(file);
    }

    onDragEnd();
  }

  function onPaste(e) {
    const file = (e.clipboardData || e.originalEvent.clipboardData).files[0];

    if (file) {
      e.preventDefault();
      props.uploadFile(file);
    }
  }

  document.addEventListener('paste', onPaste);

  onCleanup(() => {
    document.removeEventListener('paste', onPaste);
  });

  return (
    <div
      classList={{ 'quikpik-filepicker': true, 'is-drop-target': state.isDropTarget }}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
    >
      <style jsx global>
        {`
          .quikpik-filepicker {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            border-radius: 0.375rem;
            padding: 2rem;
            flex-grow: 1;
          }

          .is-drop-target {
            background: #ebf4ff;
          }

          .quikpik-icon {
            color: #9fa6b2;
            width: 3rem;
            height: 3rem;
          }

          .quikpik-header {
            color: #161e2e;
            line-height: 1.5rem;
            font-size: 1.125rem;
            font-weight: 500;
            margin: 0;
            margin-top: 1.25rem;
          }

          .quikpik-text {
            display: block;
            color: #6b7280;
            line-height: 1.25rem;
            max-width: 75%;
            margin: 0.5rem auto 1.5rem;
          }

          .quikpik-action {
            display: block;
            background: #5a67d8;
            color: #fff;
            border: 0;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            border-radius: 0.375rem;
            cursor: pointer;
          }

          .quikpik-action:active,
          .quikpik-action:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(180, 198, 252, 0.45);
          }

          .quikpik-input {
            position: absolute;
            top: -10000px;
            left: -10000px;
            width: 1px;
            overflow: hidden;
            z-index: 1;
          }
        `}
      </style>
      <svg class="quikpik-icon" stroke="currentColor" fill="none" viewBox="0 0 48 48">
        <path
          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></path>
      </svg>
      <h2 class="quikpik-header">Upload a file</h2>
      <div class="quikpik-instructions">
        <span class="quikpik-text">
          Drag or paste a file here, or click to choose a file from your computer.
        </span>
        <label class="quikpik-action">
          Choose File
          <input
            class="quikpik-input"
            type="file"
            onChange={(e) => props.uploadFile(e.target.files[0])}
          />
        </label>
      </div>
    </div>
  );
}

function PickerBody(props) {
  return (
    <div
      class="quikpik-body"
      classList={{ 'quikpik-body-fit': props.mode === 'fit' }}
      onClick={cancelEvent}
    >
      <style jsx global>
        {`
          @keyframes quikpik-up {
            0% {
              opacity: 0;
              transform: translateY(4rem);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .quikpik-body {
            position: relative;
            background: #fff;
            padding: 1.5rem;
            border-radius: 0.5rem;
            text-align: center;
            font-size: 0.875rem;
            z-index: 10001;
            width: calc(100vw - 5rem);
            height: calc(100vh - 5rem);
            max-width: 1024px;
            max-height: 780px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            outline: none;
            animation: quikpik-up 0.25s ease forwards;
            display: flex;
          }

          .quikpik-body-fit {
            height: auto;
            max-width: 24rem;
          }
        `}
      </style>
      {props.children}
    </div>
  );
}

// function getVideoOptions() {
//   const mimeTypes = ['video/mpeg', 'video/webm; codecs=vp9', 'video/webm; codecs=vp8'];

//   const [mimeType] = mimeTypes.filter((t) => MediaRecorder.isTypeSupported(t));

//   if (!mimeType) {
//     throw new Error('No supported mime type found.');
//   }

//   return { mimeType };
// }

// function recordVideoStream() {
//   const options = getVideoOptions();
//   const recordedChunks = [];

//   function handleDataAvailable(e) {
//     if (e.data.size > 0) {
//       recordedChunks.push(e.data);
//     } else {
//       // ...
//       console.log('NO DATA...');
//     }
//   }

//   mediaRecorder = new MediaRecorder(stream, options);
//   mediaRecorder.ondataavailable = handleDataAvailable;
//   mediaRecorder.start();

//   return {
//     getVideo() {
//       return new Blob(recordedChunks);
//     },
//     start() {
//       // Reset the recording
//       recordedChunks.splice(0, recordedChunks.length);
//       mediaRecorder.start();
//     },
//     stop() {
//       mediaRecorder.stop();
//     },
//   };
// }

// function getVideoStream(stream) {
//   function playRecording() {
//     const superBuffer = new Blob(recordedChunks);
//     // const recordedVid = document.querySelector('.recorded');
//     vid.muted = false;
//     vid.srcObject = undefined;
//     vid.src = window.URL.createObjectURL(superBuffer);
//     vid.play();
//   }

//   document.querySelector('.stop').addEventListener('click', () => {
//     mediaRecorder.stop();
//   });

//   document.querySelector('.play').addEventListener('click', playRecording);
// }

// // Opts are constraints: { audio: true, video: true }
// function getMedia(constraints) {
//   navigator.mediaDevices.getUserMedia(constraints).then(success).catch(failure);

//   // const constraints = { audio: true, video: true };
//   //   const vid = document.querySelector('video');
//   //   function getVideoOptions() {
//   //     const mimeTypes = [
//   //       'video/mpeg',
//   //       'video/webm; codecs=vp9',
//   //       'video/webm; codecs=vp8',
//   //     ]
//   //     const [mimeType] = mimeTypes.filter(t => MediaRecorder.isTypeSupported(t));
//   //     if (!mimeType) {
//   //       throw new Error('No supported mime type found.');
//   //     }
//   //     return { mimeType };
//   //   }
//   //   function success(stream) {
//   //     const options = getVideoOptions();
//   //     const recordedChunks = [];
//   //     function handleDataAvailable(e) {
//   //       if (e.data.size > 0) {
//   //         recordedChunks.push(e.data);
//   //       } else {
//   //         // ...
//   //         console.log('NO DATA...');
//   //       }
//   //     }
//   //     mediaRecorder = new MediaRecorder(stream, options);
//   //     mediaRecorder.ondataavailable = handleDataAvailable;
//   //     mediaRecorder.start();
//   //     console.log('playing...');
//   //     vid.srcObject = stream;
//   //     vid.muted = true;
//   //     vid.play();
//   //     function playRecording() {
//   //       const superBuffer = new Blob(recordedChunks);
//   //       // const recordedVid = document.querySelector('.recorded');
//   //       vid.muted = false;
//   //       vid.srcObject = undefined;
//   //       vid.src = window.URL.createObjectURL(superBuffer);
//   //       vid.play();
//   //     }
//   //     document.querySelector('.stop').addEventListener('click', () => {
//   //       mediaRecorder.stop();
//   //     });
//   //     document.querySelector('.play').addEventListener('click', playRecording);
//   //   }
//   //   function failure(e) {
//   //     console.error(e);
//   //     alert('FAIL');
//   //   }
//   //   navigator.mediaDevices.getUserMedia(constraints).then(success).catch(failure);
// }

function PhotoPicker(props) {
  const [state, setState] = createState({
    // init | error | video | confirm
    mode: 'init',

    // The error message to be displayed.
    error: undefined,

    // The video stream, if successfully created
    stream: undefined,

    // The photo which was snapped, if available,
    // will be a Blob which can be converted into an object URL,
    // or uploaded.
    photo: undefined,

    // The URL of the photo being confirmed or denied.
    photoURL: undefined,
  });

  let vid;

  function showStream(stream) {
    vid.srcObject = stream;
    vid.muted = true;
    vid.play();
  }

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      setState((s) => ({ ...s, mode: 'video', stream }));
      showStream(stream);
    })
    .catch((err) => {
      console.error(err);
      setState((s) => ({ ...s, mode: 'error', error: 'Unable to connect to your camera.' }));
    });

  function captureImage() {
    const track = state.stream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(track);

    imageCapture
      .takePhoto()
      .then((blob) => {
        const [, ext] = blob.type.split('/');
        blob.name = `yourphoto.${ext}`;

        setState((s) => ({
          ...s,
          mode: 'confirm',
          photo: blob,
          photoURL: URL.createObjectURL(blob),
        }));
      })
      .catch((err) => {
        console.error(err);
        setState((s) => ({ ...s, mode: 'error', error: 'Unable to capture an image.' }));
      });
  }

  function retake() {
    URL.revokeObjectURL(state.photoURL);
    setState((s) => ({ ...s, mode: 'video', photo: undefined, photoURL: undefined }));
    showStream(state.stream);
  }

  function upload() {
    props.uploadFile(state.photo);
    URL.revokeObjectURL(state.photoURL);
  }

  return (
    <div class="quikpik-photo">
      <style jsx global>
        {`
          .quikpik-photo {
            box-sizing: border-box;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: #161e2e;
            color: #fff;
            padding: 1rem;
            border-radius: 0.375rem;
          }

          .quikpik-vid-wrapper {
            flex-grow: 1;
          }

          .quikpik-info {
            color: #6b7280;
          }

          .quikpik-media-footer {
            padding: 1rem;
          }

          .quikpik-vid-wrapper {
            position: relative;
            width: 100%;
            flex-grow: 1;
          }

          .quikpik-vid {
            position: absolute;
            height: 100%;
            width: 100%;
            margin: auto;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 2px;
          }

          .quikpik-snap-photo {
            cursor: pointer;
            box-shadow: inset 0 0 0 2px;
            border: 4px solid #fff;
            width: 3rem;
            height: 3rem;
            border-radius: 100%;
            outline: none;
          }

          .quikpik-snap-photo:focus {
            box-shadow: inset 0 0 0 4px;
          }

          .quikpik-media-retake,
          .quikpik-media-accept {
            background: #5a67d8;
            color: #fff;
            border: 0;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            border-radius: 0.375rem;
            cursor: pointer;
            margin: 0 0.25rem;
            outline: none;
          }

          .quikpik-media-retake {
            border: 1px solid;
            background: transparent;
            color: inherit;
          }

          .quikpik-confirm-item {
            width: 100%;
            max-width: 100%;
            max-height: 100%;
          }
        `}
      </style>
      {state.mode === 'error' && <p class="quikpik-error">{state.error}</p>}
      {state.mode === 'init' && <p class="quikpik-info">Connecting to your camera...</p>}
      {state.mode === 'video' && (
        <div class="quikpik-vid-wrapper">
          <video class="quikpik-vid" ref={vid}></video>
        </div>
      )}
      {state.mode === 'video' && (
        <footer class="quikpik-media-footer">
          <button class="quikpik-snap-photo" onClick={captureImage}></button>
        </footer>
      )}
      {state.mode === 'confirm' && (
        <div class="quikpik-confirm-wrapper">
          <img class="quikpik-confirm-item" src={state.photoURL} ref="Your photo" />
        </div>
      )}
      {state.mode === 'confirm' && (
        <footer class="quikpik-media-footer">
          <button class="quikpik-media-retake" onClick={retake}>
            Retake
          </button>
          <button class="quikpik-media-accept" onClick={upload}>
            Accept &amp; upload
          </button>
        </footer>
      )}
    </div>
  );
}

const modes = {
  filepicker: FilePicker,
  takephoto: PhotoPicker,
};

function PickerForm(props) {
  return (
    <PickerBody>
      <style jsx global>
        {`
          .quikpik-nav {
            color: #6b7280;
            margin-right: 1.5rem;
            padding-right: 1.5rem;
            border-right: 1px dashed #ddd;
            display: flex;
            flex-direction: column;
            white-space: nowrap;
            align-items: flex-start;
          }

          .quikpik-opt {
            cursor: pointer;
            border: 0;
            font: inherit;
            font-size: 0.875rem;
            display: inline-flex;
            color: inherit;
            align-items: center;
            margin-bottom: 0.75rem;
            border-left: 2px solid transparent;
            padding-left: 0.5rem;
            margin-left: -0.5rem;
            text-decoration: none;
            outline: none;
          }

          .quikpik-opt:hover {
            color: #5a67d8;
          }

          .quikpik-opt-current {
            color: #5a67d8;
            border-color: #5a67d8;
          }

          .quikpik-opt-ico {
            margin-right: 0.75rem;
            height: 1.25rem;
          }
        `}
      </style>
      <nav class="quikpik-nav">
        <button
          type="button"
          class="quikpik-opt"
          classList={{ 'quikpik-opt-current': props.mode === 'filepicker' }}
          onClick={() => props.setMode('filepicker')}
        >
          <svg
            class="quikpik-opt-ico"
            fill="currentColor"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path d="M20 18.5c0 .276-.224.5-.5.5s-.5-.224-.5-.5.224-.5.5-.5.5.224.5.5zm4-2.5l-5-14h-14l-5 14v6h24v-6zm-17.666-12h11.333l3.75 11h-18.834l3.751-11zm15.666 16h-20v-3h20v3zm-9-6v-5h3l-4-4-4 4h3v5h2z" />
          </svg>
          File picker
        </button>
        <button
          type="button"
          class="quikpik-opt"
          classList={{ 'quikpik-opt-current': props.mode === 'takephoto' }}
          onClick={() => props.setMode('takephoto')}
        >
          <svg
            class="quikpik-opt-ico"
            fill="currentColor"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path d="M5 4h-3v-1h3v1zm10.93 0l.812 1.219c.743 1.115 1.987 1.781 3.328 1.781h1.93v13h-20v-13h3.93c1.341 0 2.585-.666 3.328-1.781l.812-1.219h5.86zm1.07-2h-8l-1.406 2.109c-.371.557-.995.891-1.664.891h-5.93v17h24v-17h-3.93c-.669 0-1.293-.334-1.664-.891l-1.406-2.109zm-11 8c0-.552-.447-1-1-1s-1 .448-1 1 .447 1 1 1 1-.448 1-1zm7 0c1.654 0 3 1.346 3 3s-1.346 3-3 3-3-1.346-3-3 1.346-3 3-3zm0-2c-2.761 0-5 2.239-5 5s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5z" />
          </svg>
          Take picture
        </button>
        <button type="button" class="quikpik-opt">
          <svg
            class="quikpik-opt-ico"
            fill="currentColor"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path d="M2.184 7.874l-2.184-.918 2.967-2.956.933 2.164-1.716 1.71zm21.816 2.126l-3 2v4l3 2v-8zm-7-2h-7.018l.79.787c.356.355.629.769.831 1.213h4.897c.276 0 .5.224.5.5v7c0 .276-.224.5-.5.5h-11c-.276 0-.5-.224-.5-.5v-2.909l-.018-.014-1.982-1.975v5.398c0 1.104.896 2 2 2h12c1.104 0 2-.896 2-2v-8c0-1.104-.896-2-2-2zm-14.65 1.13l2.967-2.956 4.044 4.029c.819.816.819 2.14 0 2.956-.819.816-2.147.815-2.967 0l-4.044-4.029z" />
          </svg>
          Capture video
        </button>
        <button type="button" class="quikpik-opt">
          <svg
            class="quikpik-opt-ico"
            fill="currentColor"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path d="M12 2c1.103 0 2 .897 2 2v7c0 1.103-.897 2-2 2s-2-.897-2-2v-7c0-1.103.897-2 2-2zm0-2c-2.209 0-4 1.791-4 4v7c0 2.209 1.791 4 4 4s4-1.791 4-4v-7c0-2.209-1.791-4-4-4zm8 9v2c0 4.418-3.582 8-8 8s-8-3.582-8-8v-2h2v2c0 3.309 2.691 6 6 6s6-2.691 6-6v-2h2zm-7 13v-2h-2v2h-4v2h10v-2h-4z" />
          </svg>
          Record audio
        </button>
      </nav>
      {modes[props.mode]({ uploadFile: props.uploadFile })}
    </PickerBody>
  );
}

function PickerProgress(props) {
  return (
    <PickerBody mode="fit">
      <style jsx global>
        {`
          .quikpik-progress {
            width: 100%;
          }

          .quikpik-progress-text {
            display: flex;
            justify-content: space-between;
            color: #6b7280;
            line-height: 1.25rem;
            margin: 0.5rem auto 0.5rem;
          }

          .quikpik-progress-bar,
          .quikpik-progress-bar-wrapper {
            display: block;
            background: #c3dafe;
            height: 8px;
            border-radius: 4px;
          }

          .quikpik-progress-bar {
            background: #667eea;
            width: 0;
            transition: width 0.25s, background-color 0.5s;
          }

          .quikpik-done-bar {
            background: #48bb78;
          }
        `}
      </style>
      <div class="quikpik-progress">
        <span class="quikpik-progress-text">
          <span class="quikpik-filename">Uploading {props.file.name || ''}</span>
          <span class="quikpik-percent">{Math.round(props.progress)}%</span>
        </span>
        <span class="quikpik-progress-bar-wrapper">
          <span
            classList={{ 'quikpik-progress-bar': true, 'quikpik-done-bar': props.progress >= 100 }}
            style={{ width: `${props.progress}%` }}
          />
        </span>
      </div>
    </PickerBody>
  );
}

/**
 * @param {{ opts: PickerOptions, pickerInstance: PickerInstance }} props
 */
function Picker({ opts, pickerInstance }) {
  const [state, setState] = createState({
    progress: 0,

    // filepicker | takephoto | takevideo | takeaudio | uploading
    mode: 'filepicker',

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

  function setMode(mode) {
    setState((s) => ({ ...s, mode }));
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
        `}
      </style>
      {state.mode === 'uploading' ? (
        <PickerProgress progress={state.progress} file={state.file} />
      ) : (
        <PickerForm uploadFile={uploadFile} mode={state.mode} setMode={setMode} />
      )}
    </div>
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
