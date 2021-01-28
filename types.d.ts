export default function quikpik(opts: {
  sources?: Array<'filepicker' | 'takephoto' | 'takevideo' | 'takeaudio'>;
  customProgress?: boolean;
  upload(opts: { file: File, onProgress: (percent: number) => any }): void | ({ promise: Promise<any>, cancel: () => void });
}): void;
