import { h } from './dom';

export function renderMediaConfirmation(opts) {
  const url = opts.url,
    file = opts.file,
    cancelText = opts.cancelText,
    confirmText = opts.confirmText,
    onCancel = opts.onCancel,
    onConfirm = opts.onConfirm;

  const player = file.type.startsWith('video/')
    ? h('video.quik-vid.quik-content', { src: url, controls: true })
    : h('audio', { src: url, controls: true });

  return h(
    '.quik-content-wrapper',
    h('.quik-confirm-item', player),
    h(
      'footer.quik-footer',
      h('button.quik-footer-btn', { onclick: onCancel }, cancelText),
      h(
        'button.quik-footer-btn.quik-footer-btn-primary',
        {
          onclick(e) {
            e.target.disabled = true;
            onConfirm(file);
          },
        },
        confirmText,
      ),
    ),
  );
}
