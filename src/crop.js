/**
 * Image cropping logic. This comes into play when the user clicks the
 * crop option in the image editor, or if the caller specifies that
 * crop is required for an image. This code is very edgecasey, so
 * buyer beware. It's got a lot of code that could be
 * deduplicated / tidied up, but the previous attempt
 * at that left bugs.
 */

import { on, h } from './dom';

/**
 * Consts, min height and width are used to prevent us from
 * getting into a cropper that is too small to be adjusted.
 */
const minHeight = 32;
const minWidth = 32;

/**
 * Crop the specified image.
 */
function cropImage(opts) {
  const image = opts.image,
    cropBounds = opts.cropBounds,
    scale = opts.scale;
  const canvas = h('canvas');
  canvas.width = cropBounds.width * scale;
  canvas.height = cropBounds.height * scale;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    // Subset of the image...
    cropBounds.left * scale,
    cropBounds.top * scale,
    cropBounds.width * scale,
    cropBounds.height * scale,
    // Placement on the canvas...
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      blob.name = image.name;
      resolve(blob);
    }, 'image/png');
  });
}

/**
 * @param {HTMLCanvasElement} canvas the canvas to which the cropper will be attached
 */
function createCropperElement(canvas) {
  const container = canvas.parentElement;
  const cropper = h('.quik-crop');

  container.appendChild(cropper);

  return cropper;
}

function normalizeEvent(e) {
  const touch = e.changedTouches && e.changedTouches[0];
  if (touch) {
    e.clientX = touch.clientX;
    e.clientY = touch.clientY;
  }
  return e;
}

function getDirection(e, cropper) {
  e = normalizeEvent(e);

  const bounds = cropper.getBoundingClientRect();
  const edgeX = Math.max(10, Math.floor(bounds.width / 5));
  const edgeY = Math.max(10, Math.floor(bounds.height / 5));
  const isWest = e.clientX < bounds.left + edgeY;
  const isEast = e.clientX > bounds.right - edgeX;
  const isNorth = e.clientY < bounds.top + edgeY;
  const isSouth = e.clientY > bounds.bottom - edgeY;
  const yDirection = isNorth ? 'n' : isSouth ? 's' : '';
  const xDirection = isEast ? 'e' : isWest ? 'w' : '';
  const direction = yDirection + xDirection;

  return direction || 'move';
}

function move(opts) {
  const bounds = opts.bounds;
  const parentBounds = opts.parentBounds;
  let top = Math.max(parentBounds.top, bounds.top + opts.deltaY);
  let left = Math.max(parentBounds.left, bounds.left + opts.deltaX);

  if (top + bounds.height > parentBounds.bottom) {
    top = parentBounds.bottom - bounds.height;
  }
  if (left + bounds.width > parentBounds.right) {
    left = parentBounds.right - bounds.width;
  }
  return { top, left };
}

function growRight(opts) {
  const bounds = opts.bounds;
  const parentBounds = opts.parentBounds;
  const right = Math.min(parentBounds.right, bounds.left + bounds.width + opts.deltaX);
  let width = Math.max(minWidth, right - bounds.left);

  if (!opts.aspectRatio) {
    return { width };
  }

  let height = width * opts.aspectRatio;

  if (bounds.top + height > parentBounds.bottom) {
    height = parentBounds.bottom - bounds.top;
    width = height / opts.aspectRatio;
  }

  return { width, height };
}

function growBottom(opts) {
  const bounds = opts.bounds;
  const parentBounds = opts.parentBounds;
  const bottom = Math.min(parentBounds.bottom, bounds.top + bounds.height + opts.deltaY);
  let height = Math.max(minHeight, bottom - bounds.top);

  if (!opts.aspectRatio) {
    return { height };
  }

  let width = height / opts.aspectRatio;

  if (bounds.left + width > parentBounds.right) {
    width = parentBounds.right - bounds.left;
    height = width * opts.aspectRatio;
  }

  return { width, height };
}

function growLeft(opts) {
  const bounds = opts.bounds;
  const parentBounds = opts.parentBounds;
  let left = Math.max(parentBounds.left, bounds.left + opts.deltaX);
  let width = bounds.right - left;

  if (width < minWidth) {
    left -= minWidth - width;
    width = minWidth;
  }

  if (!opts.aspectRatio) {
    return { left, width };
  }

  let height = width * opts.aspectRatio;

  if (bounds.top + height > parentBounds.bottom) {
    height = parentBounds.bottom - bounds.top;
    width = height / opts.aspectRatio;
    left = bounds.right - width;
  }

  if (bounds.bottom - height < parentBounds.top) {
    height = bounds.bottom - parentBounds.top;
    width = height / opts.aspectRatio;
    left = bounds.right - width;
  }

  return { left, width, height };
}

function growTop(opts) {
  const bounds = opts.bounds;
  const parentBounds = opts.parentBounds;
  let top = Math.max(parentBounds.top, bounds.top + opts.deltaY);
  let height = bounds.bottom - top;

  if (height < minHeight) {
    top -= minHeight - height;
    height = minHeight;
  }

  if (!opts.aspectRatio) {
    return { top, height };
  }

  let width = height / opts.aspectRatio;

  if (bounds.left + width > parentBounds.right) {
    width = parentBounds.right - bounds.left;
    height = width * opts.aspectRatio;
    top = bounds.bottom - height;
  }

  return { width, height, top };
}

function applyAdjustment(opts) {
  let size = {};
  if (opts.direction === 'sw' && opts.aspectRatio) {
    return growLeft(opts);
  }
  if (opts.direction === 'nw' && opts.aspectRatio) {
    size = growLeft(opts, 'n');
    size.top = opts.bounds.bottom - size.height;
    return size;
  }
  if (opts.direction.includes('s')) {
    Object.assign(size, growBottom(opts));
    if (opts.aspectRatio) {
      return size;
    }
  }
  if (opts.direction.includes('n')) {
    Object.assign(size, growTop(opts));
    if (opts.aspectRatio) {
      return size;
    }
  }
  if (opts.direction.includes('w')) {
    Object.assign(size, growLeft(opts));
  }
  if (opts.direction.includes('e')) {
    Object.assign(size, growRight(opts));
  }
  return size;
}

function getOffsetRect(el) {
  return {
    left: el.offsetLeft,
    top: el.offsetTop,
    height: el.offsetHeight,
    width: el.offsetWidth,
    bottom: el.offsetTop + el.offsetHeight,
    right: el.offsetLeft + el.offsetWidth,
  };
}

function createAdjustmentOpts(originalEvent, canvas, aspectRatio, cropper, direction) {
  const parentBounds = getOffsetRect(canvas);
  const x = originalEvent.clientX;
  const y = originalEvent.clientY;
  const opts = {
    direction,
    aspectRatio,
    parentBounds,
    bounds: getOffsetRect(cropper),
    deltaY: 0,
    deltaX: 0,
    applyEvent(e) {
      e = normalizeEvent(e);
      opts.deltaX = e.clientX - x;
      opts.deltaY = e.clientY - y;
    },
    resize(values) {
      Object.keys(values).forEach((k) => {
        cropper.style[k] = Math.round(values[k]) + 'px';
      });
    },
  };

  return opts;
}

export function attachCropper(canvas, aspectRatio) {
  const cropper = createCropperElement(canvas);
  let isAdjusting = false;

  on(cropper, 'mousedown', beginAdjusting);
  on(cropper, 'touchstart', beginAdjusting);
  on(cropper, 'mousemove', (e) => {
    if (!e.buttons) {
      const direction = getDirection(e, cropper);
      cropper.style.cursor = direction === 'move' ? 'grabbing' : direction + '-resize';
    }
  });

  function beginAdjusting(e) {
    e.preventDefault();
    e = normalizeEvent(e);
    if (isAdjusting) {
      return;
    }
    isAdjusting = true;
    const direction = getDirection(e, cropper);
    const opts = createAdjustmentOpts(e, canvas, aspectRatio, cropper, direction);
    let offs = [];

    function adjust(e) {
      opts.applyEvent(e);
      opts.resize(direction === 'move' ? move(opts) : applyAdjustment(opts));
    }

    function endAdjust() {
      isAdjusting = false;
      offs.forEach((f) => f());
    }

    offs = [
      on(document, 'mousemove', adjust),
      on(document, 'touchmove', adjust),
      on(document, 'mouseup', endAdjust),
      on(document, 'touchend', endAdjust),
      on(document, 'touchcancel', endAdjust),
    ];
  }

  return {
    el: cropper,
    /**
     * Remove the cropper from the DOM.
     */
    dispose() {
      cropper.remove();
    },
    /**
     * Crop the specified image. Returns a promise that resolves to the cropped image.
     */
    apply(image) {
      return cropImage({
        image,
        cropBounds: {
          top: cropper.offsetTop - canvas.offsetTop,
          left: cropper.offsetLeft - canvas.offsetLeft,
          width: cropper.offsetWidth,
          height: cropper.offsetHeight,
        },
        scale: image.naturalWidth / canvas.offsetWidth,
      });
    },
  };
}
