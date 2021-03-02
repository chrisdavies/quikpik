import { h } from './dom';
import { createRecorder } from './media-lib';
import { icoCamera } from './ico';

function renderLiveVideo({ recorder, onPickFile, onError }) {
  const video = h('video.quik-vid.quik-content');

  video.srcObject = recorder.liveSrc();
  video.muted = true;
  video.controls = false;
  video.play();

  return video;
}

export function renderWebcamCapture({ onPickFile, onCancel }) {
  const el = h(
    '.quik-media',
    h('p.quik-info.quik-content', 'Waiting for your camera...'),
    h(
      'footer.quik-footer',
      h('button.quik-footer-btn.quik-footer-btn-secondary', { onclick: onCancel }, 'Cancel'),
    ),
  );

  const onError = (err) => {
    el.firstChild.replaceWith(h('p.quik-error', err.toString()));
  };

  createRecorder({ video: true, audio: false })
    .then((recorder) => {
      el.firstChild.replaceWith(renderLiveVideo({ recorder, onPickFile, onError }));
      el.lastChild.appendChild(
        h(
          'button.quik-footer-btn.quik-footer-btn-primary',
          {
            onclick() {
              recorder.capturePhoto().then(onPickFile).catch(onError);
            },
          },
          icoCamera(),
          'Take photo',
        ),
      );
    })
    .catch(onError);

  return el;
}
