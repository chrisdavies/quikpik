export default function quikpik(opts: {
  sources?: Array<'filepicker' | 'takephoto' | 'takevideo' | 'takeaudio'>;
  customProgress?: boolean;
  onClose?: () => any;
  upload(opts: { file: File, onProgress: (percent: number) => any }): void | ({ promise: Promise<any>, cancel: () => void });
}): { close(): void };
