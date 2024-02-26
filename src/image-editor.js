import { h, raw } from './dom';
import { imageRotate } from './image-rotate';
import { attachCropper } from './crop';

function loadImage(blob, callback) {
  const previewImg = new Image();
  return new Promise((resolve) => {
    previewImg.onload = () => {
      resolve(callback(previewImg));
      URL.revokeObjectURL(previewImg.src);
    };
    previewImg.src = URL.createObjectURL(blob);
  });
}

export function renderImageEditor(opts) {
  const url = opts.url,
    file = opts.file,
    cancelText = opts.cancelText,
    confirmText = opts.confirmText,
    onCancel = opts.onCancel,
    onConfirm = opts.onConfirm,
    requireCrop = opts.requireCrop,
    cropRatio = opts.cropRatio;
  let cropper;
  const result = h('.quik-content-wrapper', h('.quik-text', 'Loading...'));
  const canvas = h('canvas.quik-confirm-item');
  const content = h('.quik-content', canvas);
  const imageRotater = imageRotate(url, file, canvas, () => {
    if (requireCrop) {
      // Wait for the elements to be in the DOM, then attach the cropper, so
      // it can properly size itself on creation.
      requestAnimationFrame(() => {
        cropper = requireCrop ? attachCropper(canvas, cropRatio) : undefined;
      });
    }

    result.appendChild(
      h(
        'footer.quik-footer',
        h('button.quik-footer-btn', { onclick: onCancel }, cancelText),
        !requireCrop &&
          h(
            'button.quik-footer-btn',
            {
              onclick() {
                if (cropper) {
                  cropper.dispose();
                  cropper = undefined;
                } else {
                  cropper = attachCropper(canvas, cropRatio);
                }
              },
            },
            raw(
              `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 18h-4v-14h-14v-4h-2v4h-4v2h4v14h14v4h2v-4h4v-2zm-18 0v-12h12v12h-12z"/></svg>`,
            ),
            'Crop',
          ),
        h(
          'button.quik-footer-btn',
          {
            onclick: imageRotater.rotate,
          },
          raw(
            `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c3.31 0 6.291 1.353 8.459 3.522l2.48-2.48 1.061 7.341-7.437-.966 2.489-2.489c-1.808-1.807-4.299-2.928-7.052-2.928-5.514 0-10 4.486-10 10s4.486 10 10 10c3.872 0 7.229-2.216 8.89-5.443l1.717 1.046c-2.012 3.803-6.005 6.397-10.607 6.397-6.627 0-12-5.373-12-12s5.373-12 12-12z" /></svg>`,
          ),
          ' Rotate',
        ),
        h(
          'button.quik-footer-btn.quik-footer-btn-primary',
          {
            onclick(e) {
              e.target.disabled = true;
              imageRotater
                .save()
                .then((blob) => (cropper ? loadImage(blob, cropper.apply) : blob))
                .then((blob) => {
                  if (!blob.name) {
                    blob.name = file.name;
                  }
                  onConfirm(blob);
                });
            },
          },
          confirmText,
        ),
      ),
    );

    result.firstChild.replaceWith(content);
  });

  return result;
}
