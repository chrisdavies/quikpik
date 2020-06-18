import { comp } from './comp';
import './file-picker.css';

export const FilePicker = comp(({ uploadFile }, hooks) => {
  const [isDropTarget, setIsDropTarget] = hooks.useState(false);
  hooks.useEffect(() => {
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  });

  function onPaste(e) {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length) {
      uploadFile(e.clipboardData.files[0]);
    }
  }

  function onDragOver(e) {
    e.preventDefault();
    setIsDropTarget(true);
  }

  function onDragEnd() {
    setIsDropTarget(false);
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    uploadFile(e.dataTransfer.files && e.dataTransfer.files[0]);

    onDragEnd();
  }

  function onPick(e) {
    uploadFile(e.target.files[0]);
  }

  return (
    <div
      class={`quikpik-filepicker ${isDropTarget ? 'quikpik-drop-target' : ''}`}
      onDragover={onDragOver}
      onDragend={onDragEnd}
      onDrop={onDrop}
    >
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
          <input class="quikpik-input" type="file" onChange={onPick} />
        </label>
      </div>
    </div>
  );
});
