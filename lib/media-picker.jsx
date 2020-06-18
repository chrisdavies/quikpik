import { comp } from './comp';
import { ElapsedTime } from './elapsed-time';
import { ConfirmMedia } from './confirm-media';
import { LiveVid } from './live-vid';
import { createRecorder } from './media-lib';
import './media-picker.css';

export const MediaPicker = comp(({ mode, uploadFile }, hooks) => {
  const [{ status, error, recorder, recorderMode, file }, setState] = hooks.useState({
    // init | live | error | recording | confirm
    status: 'init',
    error: undefined,
    recorder: undefined,
    recorderMode: undefined,
    file: undefined,
  });

  hooks.useEffect(() => {
    createRecorder({ video: mode !== 'takeaudio', audio: true })
      .then((value) => {
        setState((s) => ({
          ...s,
          status: 'live',
          recorder: value,
          recorderMode: mode,
        }));
      })
      .catch(mediaError);
  }, mode);

  function mediaError(err) {
    console.error(err);
    setState((s) => ({
      ...s,
      status: 'error',
      error: 'Unable to connect to your camera.',
    }));
  }

  function captureImage() {
    recorder
      .capturePhoto()
      .then((newFile) => {
        setState((s) => ({
          ...s,
          file: newFile,
          status: 'confirm',
        }));
      })
      .catch(mediaError);
  }

  function startRecording() {
    recorder.beginMediaCapture();
    setState((s) => ({ ...s, status: 'recording' }));
  }

  function onCapture() {
    if (mode === 'takephoto') {
      captureImage();
    } else {
      startRecording();
    }
  }

  function stopRecording() {
    recorder
      .endMediaCapture()
      .then((newFile) => {
        setState((s) => ({
          ...s,
          file: newFile,
          status: 'confirm',
        }));
      })
      .catch(mediaError);
  }

  function retake() {
    setState((s) => ({
      ...s,
      status: 'live',
      file: undefined,
    }));
  }

  function accept() {
    uploadFile(file);
  }

  return (
    <div class="quikpik-media">
      {status === 'error' && <p class="quikpik-error">{error}</p>}
      {status === 'init' && (
        <p class="quikpik-info">Waiting for your camera or microphone to be ready.</p>
      )}
      {(status === 'live' || status === 'recording') && mode !== 'takeaudio' && (
        <LiveVid recorder={recorder} />
      )}
      {status === 'live' && mode === 'takeaudio' && (
        <p class="quikpik-info">Click the red button to begin recording.</p>
      )}
      {status === 'live' && (
        <footer class="quikpik-media-footer">
          <button
            class={`quikpik-snap-photo ${mode !== 'takephoto' ? 'quikpik-record-media' : ''} ${
              status === 'recording' ? 'quikpik-stop-media' : ''
            }`}
            disabled={recorderMode !== mode}
            onClick={onCapture}
          ></button>
        </footer>
      )}
      {status === 'recording' && (
        <footer class="quikpik-media-footer">
          <button class="quikpik-stop-media" onClick={stopRecording}></button>
          <ElapsedTime />
        </footer>
      )}
      {status === 'confirm' && <ConfirmMedia file={file} />}
      {status === 'confirm' && (
        <footer class="quikpik-media-footer">
          <button class="quikpik-media-retake" onClick={retake}>
            Retake
          </button>
          <button class="quikpik-media-accept" onClick={accept}>
            Accept &amp; upload
          </button>
        </footer>
      )}
    </div>
  );
});
