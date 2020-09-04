import { comp } from './comp';
import { imageRotate } from './image-rotate';
import './confirm-media.css';

export const ConfirmMedia = comp(
  ({ file, cancelText, confirmText, onCancel, onConfirm }, hooks) => {
    const url = hooks.useDisposable(() => {
      const value = URL.createObjectURL(file);
      return { value, dispose: () => URL.revokeObjectURL(value) };
    }, file);
    const imageRotater = file.type.startsWith('image/') && imageRotate(url, file);

    return (
      <div class="quikpik-confirm-wrapper">
        {imageRotater ? (
          <div class="quikpik-img-wrapper">
            <canvas class="quikpik-confirm-item" ref={(el) => imageRotater.setCanvas(el)}></canvas>
          </div>
        ) : (
          <div class="quikpik-vid-wrapper">
            <video class="quikpik-vid" src={url} muted={false} controls={true}></video>
          </div>
        )}
        <footer class="quikpik-media-footer">
          {imageRotater && (
            <button class="quikpik-media-rotate" onClick={() => imageRotater.rotate()}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c3.31 0 6.291 1.353 8.459 3.522l2.48-2.48 1.061 7.341-7.437-.966 2.489-2.489c-1.808-1.807-4.299-2.928-7.052-2.928-5.514 0-10 4.486-10 10s4.486 10 10 10c3.872 0 7.229-2.216 8.89-5.443l1.717 1.046c-2.012 3.803-6.005 6.397-10.607 6.397-6.627 0-12-5.373-12-12s5.373-12 12-12z" />
              </svg>
              Rotate
            </button>
          )}
          <button class="quikpik-media-retake" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            class="quikpik-media-accept"
            onClick={() => {
              if (!imageRotater) {
                onConfirm(file);
              }
              imageRotater.save().then(onConfirm);
            }}
          >
            {confirmText}
          </button>
        </footer>
      </div>
    );
  },
);
