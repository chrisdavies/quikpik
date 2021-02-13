import { comp } from './comp';
import { Nav } from './nav';
import { FilePicker } from './file-picker';
import { MediaPicker } from './media-picker';
import { UploadProgress } from './upload-progress';
import './quikpik.css';

export const Quikpik = comp((props, hooks) => {
  const [{ mode, uploader, file, progress }, setState] = hooks.useState({
    mode: 'pickfile',
    file: undefined,
    uploader: undefined,
    progress: 0,
  });

  const { customProgress, close, upload, sources } = props;

  const setMode = (newMode) => setState((s) => ({ ...s, mode: newMode }));
  const onProgress = (newProgress) => setState((s) => ({ ...s, progress: newProgress }));

  hooks.useEffect(() => {
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  });

  function closeOnEscape(e) {
    if (e.key === 'Escape' || e.code === 'Escape') {
      close();
    }
  }

  function uploadFile(newFile) {
    if (!newFile) {
      return;
    }

    const newUploader = upload({ file: newFile, onProgress });

    setState((s) => ({
      ...s,
      file: newFile,
      uploader: newUploader,
    }));

    // Give the user a bit of time to see that we've completed.
    newUploader.promise
      .then(() => setTimeout(close, 250))
      .catch((err) => {
        if (err && err.status !== 0) {
          alert('Upload failed. ' + (err.message || ''));
        }
      });
  }

  if (customProgress && uploader) {
    return;
  }

  return (
    <div class="quikpik" onClick={close} onTouchEnd={close}>
      <div
        class={`quikpik-body ${uploader ? 'quikpik-body-fit' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {uploader && <UploadProgress progress={progress} file={file} />}
        {!uploader && <Nav mode={mode} setMode={setMode} sources={sources} />}
        {!uploader && mode === 'pickfile' && <FilePicker uploadFile={uploadFile} />}
        {!uploader && mode !== 'pickfile' && <MediaPicker uploadFile={uploadFile} mode={mode} />}
      </div>
    </div>
  );
});
