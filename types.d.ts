/**
 * If the picker is configured to support multiple files (opts.multiple = true), then
 * it will accept only the first file in a list of files that are dropped, and ignore
 * the rest.
 *
 * Note: It is possible for users to select files that do not match the `accept` criteria.
 * For example, drag / drop does not validate the accept criteria at all. If this is critical
 * for your application, you will need to validate the file types yourself in the upload
 * function, or else server-side.
 */

/**
 * Display the quikpik modal.
 *
 * @param opts
 * @param {string[]} opts.sources the allowed input sources
 * @param {string} opts.accept the optional accept string for the file picker see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#htmlattrdefaccept
 * @param {boolean|undefined} opts.multiple specifies whether or not multiple files are supported
 * @param {boolean} opts.customProgress indicates whether or not the caller will show progress
 * @param {boolean} opts.requireCrop indicates whether or not image crop is required
 * @param {number} opts.cropRatio indicates the aspect ratio (height = cropRatio * width)
 * @param {number} opts.maxDuration the maximum duration, in minutes, allowed for audio and video recording (10mins default)
 * @param {function} opts.upload the upload function
 */
export default function quikpik<T>(opts: {
  sources?: Array<'filepicker' | 'takephoto' | 'takevideo' | 'takeaudio'>;
  multiple?: boolean;
  accept?: string;
  customProgress?: boolean;
  requireCrop?: boolean;
  cropRatio?: number;
  maxDuration?: number;
  upload(opts: { files: File[], onProgress: (percent: number, label: string) => any }): void | ({ promise: Promise<T>, cancel: () => void });
}): Promise<T | undefined> & { cancel(): void; };
