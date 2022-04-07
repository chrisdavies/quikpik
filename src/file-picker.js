import { h, raw } from "./dom";
import { icoCamera, icoMic, icoVideo } from "./ico";
import { mediaSupport } from "./media-lib";
import { isSafari } from "./detect-browser";

export function renderFilePicker(opts) {
  const onPickFiles = opts.onPickFiles,
    accept = opts.accept,
    sources = opts.sources,
    beginCaptureMedia = opts.beginCaptureMedia;
  const supportedMedia = mediaSupport(sources);
  const safari = isSafari();
  const mediaButton = (type, ico, label) =>
    supportedMedia[type] &&
    h(
      "button.quik-footer-btn.quik-main-footer-btn",
      {
        onclick(e) {
          e.preventDefault();
          beginCaptureMedia(type);
        },
      },
      ico(),
      label,
    );

  const safariMediaCapture = () => {
    const video = supportedMedia["takevideo"];
    const img = supportedMedia["takephoto"];
    const accept =
      (video ? "video/*;capture=camcorder" : img ? "image/*," : "");
    if (!accept) {
      return;
    }
    return h(
      "label.quik-footer-btn.quik-main-footer-btn",
      icoVideo(),
      video ? "Take photo or video" : "Take photo",
      h("input.quik-file-input", {
        type: "file",
        accept: accept,
        onchange(e) {
          onPickFiles(e.target.files);
        },
      }),
    );
  };

  const el = h(
    "label.quik-drop-target.quik-content",
    {
      ondragover(e) {
        e.preventDefault();
        el.classList.add("quik-drop-target-active");
      },
      ondragleave() {
        el.classList.remove("quik-drop-target-active");
      },
      ondrop(e) {
        e.preventDefault();
        e.stopPropagation();
        let files = e.dataTransfer.files;
        if (!opts.multiple && files.length > 1) {
          files = [files[0]];
        }
        onPickFiles(files);
      },
    },
    h("input.quik-file-input", {
      type: "file",
      accept,
      multiple: opts.multiple,
      onchange(e) {
        onPickFiles(e.target.files);
      },
    }),
    raw(
      `<svg class="quik-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>`,
    ),
    h("h2.quik-header", "Upload a file"),
    h(
      ".quik-instructions",
      h(
        "span.quik-text",
        "Drag or paste a file here, or choose an option below.",
      ),
      h(
        "footer.quik-footer",
        h(
          "span.quik-footer-btn.quik-footer-btn-primary",
          raw(
            `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`,
          ),
          "Choose File",
        ),
        !safari && mediaButton("takephoto", icoCamera, "Take Photo"),
        !safari && mediaButton("takevideo", icoVideo, "Record Video"),
        safari && safariMediaCapture(),
        mediaButton("takeaudio", icoMic, "Record Audio"),
      ),
    ),
  );

  return el;
}
