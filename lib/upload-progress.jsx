import './upload-progress.css';

export function UploadProgress({ file, progress }) {
  return (
    <div class="quikpik-progress">
      <span class="quikpik-progress-text">
        <span class="quikpik-filename">Uploading {file.name || ''}</span>
        <span class="quikpik-percent">{Math.round(progress)}%</span>
      </span>
      <span class="quikpik-progress-bar-wrapper">
        <span
          class={`quikpik-progress-bar ${progress >= 100 ? 'quikpik-done-bar' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </span>
    </div>
  );
}
