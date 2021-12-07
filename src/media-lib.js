/**
 * This file contains helper functions for managing the browser's media APIs.
 */

// Safari doesn't support ImageCapture (it's in experimental mode)...
(function loadPolyfill() {
  if (window.ImageCapture) {
    return;
  }

  const polyfill = document.createElement('script');
  polyfill.src = 'https://unpkg.com/image-capture@0.4.0/lib/imagecapture.min.js';
  document.head.appendChild(polyfill);
})();

export function mediaSupport(sources) {
  const supportsVideoAndAudio = !!window.MediaRecorder;

  return {
    filepicker: true,
    takephoto:
      sources.includes('takephoto') &&
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    takevideo: sources.includes('takevideo') && supportsVideoAndAudio,
    takeaudio: sources.includes('takeaudio') && supportsVideoAndAudio,
  };
}

function getSupportedMimeType(opts) {
  const mimeTypes = opts.video
    ? ['video/mp4', 'video/mpeg', 'video/webm']
    : ['audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp3', 'audio/mp4'];
  const mimeType = mimeTypes.filter((t) => MediaRecorder.isTypeSupported(t))[0];

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
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: getSupportedMimeType(opts),
    });

    mediaRecorder.ondataavailable = ondataavailable;
    mediaRecorder.start();
  }

  function endMediaCapture() {
    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        if (opts.isDisposed()) {
          reject(new Error(`Disposed.`));
        }
        try {
          const blob = new Blob(recordedChunks, {
            type: getSupportedMimeType(opts),
          });
          resolve(mediaResult(blob));
        } catch (err) {
          reject(err);
        }
      };

      mediaRecorder.stop();
    });
  }

  // This is a poor man's dispose mechanism, but it's good enough.
  setTimeout(function autodispose() {
    if (opts.isDisposed()) {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      return;
    }
    setTimeout(autodispose, 1000);
  }, 1000);

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
