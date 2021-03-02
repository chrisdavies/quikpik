/**
 * Display the quikpik modal.
 * @param opts
 * @param {string[]} opts.sources the allowed input sources
 * @param {string} opts.accept the optional accept string for the file picker see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#htmlattrdefaccept
 * @param {boolean} opts.customProgress indicates whether or not the caller will show progress
 * @param {boolean} opts.requireCrop indicates whether or not image crop is required
 * @param {boolean} opts.cropRatio indicates the aspect ratio (height = cropRatio * width)
 * @param {function} opts.upload the upload function
 */
export default function quikpik<T>(opts: {
  sources?: Array<'filepicker' | 'takephoto'>;
  accept?: string;
  customProgress?: boolean;
  requireCrop?: boolean;
  cropRatio?: number;
  upload(opts: { file: File, onProgress: (percent: number) => any }): void | ({ promise: Promise<T>, cancel: () => void });
}): Promise<{ canceled: true } | { canceled: false, result: T }> & { cancel(): void; };
