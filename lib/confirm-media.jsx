import { comp } from './comp';
import './confirm-media.css';

export const ConfirmMedia = comp(({ file }, hooks) => {
  const url = hooks.useDisposable(() => {
    const value = URL.createObjectURL(file);
    return { value, dispose: () => URL.revokeObjectURL(value) };
  }, file);

  if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
    return (
      <div class="quikpik-vid-wrapper">
        <video class="quikpik-vid" src={url} muted={false} controls={true}></video>
      </div>
    );
  }
  return (
    <div class="quikpik-confirm-wrapper">
      <img class="quikpik-confirm-item" src={url} alt="Confirm" />
    </div>
  );
});
