/* eslint-disable jsx/no-undef */
import { onCleanup, createState } from 'solid-js';

/**
 * FilePicker is the UI for picking a file from the local computer.
 * @param {object} p
 * @param {(f: File) => void} p.uploadFile
 */
export function FilePicker(p) {
  const [state, setState] = createState({
    // Indicates if the picker is a drop target
    isDropTarget: false,
  });

  function onDragOver(e) {
    e.preventDefault();

    setState((s) => ({ ...s, isDropTarget: true }));
  }

  function onDragEnd() {
    setState((s) => ({ ...s, isDropTarget: false }));
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];

    if (file) {
      p.uploadFile(file);
    }

    onDragEnd();
  }

  function onPaste(e) {
    const file = (e.clipboardData || e.originalEvent.clipboardData).files[0];

    if (file) {
      e.preventDefault();
      p.uploadFile(file);
    }
  }

  document.addEventListener('paste', onPaste);

  onCleanup(() => {
    document.removeEventListener('paste', onPaste);
  });

  return (
    <div
      classList={{ 'quikpik-filepicker': true, 'is-drop-target': state.isDropTarget }}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
    >
      <style jsx global>
        {`
          .quikpik-filepicker {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            border-radius: 0.375rem;
            padding: 2rem;
            flex-grow: 1;
          }

          .is-drop-target {
            background: #ebf4ff;
          }

          .quikpik-icon {
            color: #9fa6b2;
            width: 3rem;
            height: 3rem;
          }

          .quikpik-header {
            color: #161e2e;
            line-height: 1.5rem;
            font-size: 1.125rem;
            font-weight: 500;
            margin: 0;
            margin-top: 1.25rem;
          }

          .quikpik-text {
            display: block;
            color: #6b7280;
            line-height: 1.25rem;
            max-width: 75%;
            margin: 0.5rem auto 1.5rem;
          }

          .quikpik-action {
            display: block;
            background: #5a67d8;
            color: #fff;
            border: 0;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            border-radius: 0.375rem;
            cursor: pointer;
          }

          .quikpik-action:active,
          .quikpik-action:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(180, 198, 252, 0.45);
          }

          .quikpik-input {
            position: absolute;
            top: -10000px;
            left: -10000px;
            width: 1px;
            overflow: hidden;
            z-index: 1;
          }
        `}
      </style>
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
          <input
            class="quikpik-input"
            type="file"
            onChange={(e) => p.uploadFile(e.target.files[0])}
          />
        </label>
      </div>
    </div>
  );
}
