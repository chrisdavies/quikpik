/**
 * This file contains helper functions for managing the browser's media APIs.
 */
import './image-capture';

export function mediaSupport() {
  const supportsVideoAndAudio = !!window.MediaRecorder;

  return {
    imageCapture: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    videoCapture: supportsVideoAndAudio,
    audioCapture: supportsVideoAndAudio,
  };
}

function getSupportedMimeType(opts) {
  const mimeTypes = opts.video
    ? ['video/mpeg', 'video/webm']
    : ['audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/wav'];
  const [mimeType] = mimeTypes.filter((t) => MediaRecorder.isTypeSupported(t));

  if (!mimeType) {
    throw new Error('No supported mime type found.');
  }

  return mimeType;
}

function mediaResult(blob) {
  // yourvideo.mpeg or yourimage.jpeg or youraudio.mpeg, etc
  blob.name = `your${blob.type.replace('/', '.')}`;

  return blob;
}

/**
 * Create a media recorder which can capture an image, a video or an audio track.
 *
 * @param {Object} opts
 * @param {boolean} [opts.video]
 * @param {boolean} [opts.audio]
 */
export function createRecorder(opts) {
  let recordedChunks = [];
  let stream;
  let mediaRecorder;

  function ondataavailable(e) {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    } else {
      console.error('No data', e);
    }
  }

  function liveSrc() {
    return stream;
  }

  function capturePhoto() {
    const track = stream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(track);

    return imageCapture.takePhoto().then(mediaResult);
  }

  function beginMediaCapture() {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: getSupportedMimeType(opts) });

    mediaRecorder.ondataavailable = ondataavailable;
    mediaRecorder.start();
  }

  function endMediaCapture() {
    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        try {
          const blob = new Blob(recordedChunks, { type: getSupportedMimeType(opts) });
          resolve(mediaResult(blob));
        } catch (err) {
          reject(err);
        }
      };

      mediaRecorder.stop();
    });
  }

  return navigator.mediaDevices.getUserMedia(opts).then((newStream) => {
    stream = newStream;

    return {
      liveSrc,
      capturePhoto,
      beginMediaCapture,
      endMediaCapture,
    };
  });
}