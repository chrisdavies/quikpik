/* eslint-disable jsx/no-undef */
import { onCleanup, createState } from 'solid-js';
import { createRecorder, mediaSupport } from './media-lib';

function LiveVid(p) {
  function ref(el) {
    // This terrible hack is brought to you by Safari.
    // Thanks, Safari!!!
    setTimeout(() => {
      el.srcObject = p.recorder.liveSrc();
      el.muted = true;
      el.controls = false;
      el.play();
    });
  }

  return (
    <div class="quikpik-vid-wrapper">
      <video ref={ref} class="quikpik-vid"></video>
    </div>
  );
}

function computeElapsedTime(startTime) {
  const elapsedMs = Date.now() - startTime;
  const sec = Math.floor(elapsedMs / 1000) % 60;
  const min = Math.floor(sec / 60) % 60;
  const h = Math.floor(min / 60);

  return `${h ? h + ':' : ''}${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function ElapsedTime() {
  const startTime = Date.now();

  const [state, setState] = createState({
    elapsedTime: computeElapsedTime(startTime),
  });

  let timeout = setTimeout(function tick() {
    if (!timeout) {
      return;
    }

    setState((s) => ({ ...s, elapsedTime: computeElapsedTime(startTime) }));
    timeout = setTimeout(tick, 1000);
  }, 1000);

  onCleanup(() => {
    clearTimeout(timeout);
    timeout = undefined;
  });

  return (
    <span class="quikpik-elapsed-time">
      <style jsx global>
        {`
          .quikpik-elapsed-time {
            position: absolute;
            left: calc(50% + 2.75rem);
            top: 50%;
            margin-top: -0.5rem;
            line-height: 1;
            opacity: 0.8;
          }
        `}
      </style>
      Recording {state.elapsedTime}
    </span>
  );
}

function ConfirmMedia(p) {
  const src = URL.createObjectURL(p.file);

  onCleanup(() => URL.revokeObjectURL(src));

  if (p.file.type.startsWith('video/') || p.file.type.startsWith('audio/')) {
    return (
      <div class="quikpik-vid-wrapper">
        <video class="quikpik-vid" src={src} muted={false} controls={true}></video>
      </div>
    );
  }

  return (
    <div class="quikpik-confirm-wrapper">
      <img class="quikpik-confirm-item" src={src} ref="Your photo" />
    </div>
  );
}

function Unsupported(p) {
  return (
    <p class="quikpik-info">
      Your browser does not support this feature. Supported browsers are Firefox, Brave, Chrome, or
      Edge.
    </p>
  );
}

function Supported(p) {
  const [state, setState] = createState({
    // init | error | live | recording | confirm
    mode: 'init',

    // The error message to be displayed.
    error: undefined,

    // The media recorder resulting from createRecorder
    recorder: undefined,

    // The captured file
    file: undefined,
  });

  const recorderOpts = { video: p.mode !== 'takeaudio', audio: p.mode !== 'takephoto' };

  function mediaError(err) {
    console.error(err);
    setState((s) => ({ ...s, mode: 'error', error: 'Unable to connect to your camera.' }));
  }

  function retake() {
    setState((s) => ({ ...s, mode: 'live', file: undefined }));
  }

  function upload() {
    p.uploadFile(state.file);
  }

  function captureImage() {
    state.recorder
      .capturePhoto()
      .then((file) => setState((s) => ({ ...s, mode: 'confirm', file })))
      .catch(mediaError);
  }

  function startRecording() {
    state.recorder.beginMediaCapture();
    setState((s) => ({ ...s, mode: 'recording' }));
  }

  function stopRecording() {
    state.recorder
      .endMediaCapture()
      .then((file) => setState((s) => ({ ...s, mode: 'confirm', file })))
      .catch(mediaError);
  }

  function onCapture() {
    if (p.mode === 'takephoto') {
      captureImage();
    } else {
      startRecording();
    }
  }

  createRecorder(recorderOpts)
    .then((recorder) => setState((s) => ({ ...s, mode: 'live', recorder })))
    .catch(mediaError);

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
            background: #1a202c;
            color: #fff;
            padding: 1rem;
            border-radius: 0.375rem;
          }

          .quikpik-vid-wrapper {
            flex-grow: 1;
          }

          .quikpik-media-footer {
            position: relative;
            padding: 1rem;
            width: 100%;
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
            outline: none;
          }

          .quikpik-snap-photo {
            background: #fff;
            cursor: pointer;
            box-shadow: inset 0 0 0 2px;
            border: 4px solid #fff;
            width: 3rem;
            height: 3rem;
            border-radius: 100%;
            outline: none;
          }

          .quikpik-stop-media,
          .quikpik-record-media {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            background: #f00;
            box-shadow: inset 0 0 0 2px;
            border: 4px solid #fff;
            width: 3rem;
            height: 3rem;
            border-radius: 100%;
            outline: none;
          }

          .quikpik-stop-media {
            background: transparent;
          }

          .quikpik-stop-media::before {
            content: '';
            background: #f00;
            height: 1.5rem;
            width: 1.5rem;
            border-radius: 2px;
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
      {(state.mode === 'live' || state.mode === 'recording') && (
        <LiveVid recorder={state.recorder} />
      )}
      {state.mode === 'live' && (
        <footer class="quikpik-media-footer">
          <button
            class="quikpik-snap-photo"
            classList={{
              'quikpik-record-media': p.mode !== 'takephoto',
              'quikpik-stop-media': state.mode === 'recording',
            }}
            onClick={onCapture}
          ></button>
        </footer>
      )}
      {state.mode === 'recording' && (
        <footer class="quikpik-media-footer">
          <button class="quikpik-stop-media" onClick={stopRecording}></button>
          <ElapsedTime />
        </footer>
      )}
      {state.mode === 'confirm' && <ConfirmMedia file={state.file} />}
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

/**
 * Generic media picker UI
 *
 * @param {object} p
 * @param {takephoto | takevideo | takeaudio} mode
 * @param {(f: file) => { promise: Promise, cancel: () => void }} p.uploadFile
 */
export function MediaPicker(p) {
  return mediaSupport()[p.mode] ? Supported(p) : Unsupported(p);
}
