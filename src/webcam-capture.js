import { h } from './dom';
import { createRecorder } from './media-lib';
import { icoCamera, icoMic, icoVideo } from './ico';

// The default maximum duration, in minutes.
const MAX_DURATION = 10;

function renderLiveVideo(opts) {
  const video = h('video.quik-vid.quik-content');

  video.srcObject = opts.recorder.liveSrc();
  video.muted = true;
  video.controls = false;
  video.play();

  return video;
}

/**
 * Render the recording progress. When maxDuration has been hit, this calls onComplete.
 */
function renderRecordingProgress(label, maxDuration, onComplete) {
  const startTime = Date.now();
  const maxDurationSeconds = maxDuration * 60;
  const progressText = (seconds) => {
    return `${Math.floor(seconds / 60)}:${`00${seconds % 60}`.slice(-2)} / ${maxDuration}:00`;
  };
  let handle;
  const bar = h('span.quik-progress-bar', { style: 'width: 0%' });
  const percent = h('span.quik-duration', progressText(0));
  const el = h(
    '.quik-progress',
    h('span.quik-progress-text', h('span.quik-filename', label), percent),
    h('span.quik-progress-bar-wrapper', bar),
  );

  (() => {
    handle = setTimeout(function tick() {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      percent.textContent = progressText(seconds);
      bar.style.width = `${Math.floor((seconds * 100) / maxDurationSeconds)}%`;
      if (seconds >= maxDurationSeconds) {
        onComplete();
        return;
      }
      // A poor man's dispose
      if (el.isConnected) {
        setTimeout(tick, 1000);
      }
    }, 1000);
  })();

  return el;
}

export function renderMediaCapture(opts) {
  const onPickFiles = opts.onPickFiles,
    maxDuration = opts.maxDuration || MAX_DURATION,
    onCancel = opts.onCancel;
  type = opts.type;
  let recordingProgress;
  const message = h(
    'p.quik-info.quik-content',
    `Waiting for your ${type === 'takeaudio' ? 'microphone' : 'camera'}...`,
  );
  const footer = h(
    'footer.quik-footer',
    h('button.quik-footer-btn.quik-footer-btn-secondary', { onclick: onCancel }, 'Cancel'),
  );
  const el = h('.quik-media', message, footer);
  const isDisposed = () => !el.isConnected;
  const onError = (err) => message.replaceWith(h('p.quik-error', err.toString()));

  createRecorder({ video: type !== 'takeaudio', audio: type !== 'takephoto', isDisposed })
    .then((recorder) => {
      const onComplete = () => {
        message.textContent = 'Generating preview...';
        recordingProgress && recordingProgress.remove();
        const promise = type === 'takephoto' ? recorder.capturePhoto() : recorder.endMediaCapture();
        promise.then((f) => onPickFiles([f])).catch(onError);
      };
      message.textContent =
        type === 'takephoto'
          ? ''
          : `Ready to record. You can record up to ${maxDuration} minutes of ${
              type === 'takeaudio' ? 'audio' : 'video'
            }.`;
      if (type !== 'takeaudio') {
        el.insertBefore(renderLiveVideo({ recorder, onPickFiles, onError }), message);
      }
      footer.appendChild(
        h(
          'button.quik-footer-btn.quik-footer-btn-primary',
          {
            onclick(e) {
              if (type === 'takephoto' || recordingProgress) {
                e.target.disabled = true;
                onComplete();
              } else {
                recorder.beginMediaCapture();
                recordingProgress = renderRecordingProgress(
                  'Recording...',
                  maxDuration,
                  onComplete,
                );
                message.textContent = '';
                el.insertBefore(recordingProgress, footer);
                e.target.innerHTML = '';
                e.target.append(icoMic(), h('span', 'Stop recording'));
              }
            },
          },
          type === 'takephoto' ? icoCamera() : type === 'takeaudio' ? icoMic() : icoVideo(),
          type === 'takephoto' ? 'Take Photo' : 'Begin Recording',
        ),
      );
    })
    .catch(onError);

  return el;
}
