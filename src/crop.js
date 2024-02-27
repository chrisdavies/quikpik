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
function createCropperElement(canvas, aspectRatio) {
  const container = canvas.parentElement;
  const cropper = h('.quik-crop');
  const bounds = canvas.getBoundingClientRect();

  container.appendChild(cropper);

  let height = Math.max(bounds.height - 32, minHeight);
  let width = aspectRatio ? height * aspectRatio : height;

  if (width > bounds.width) {
    width = Math.max(bounds.width - 32, minWidth);
    height = aspectRatio ? width / aspectRatio : height;
  }

  cropper.style.width = `${width}px`;
  cropper.style.height = `${height}px`;
  cropper.style.top = `${canvas.offsetTop + (bounds.height - height) / 2}px`;
  cropper.style.left = `${canvas.offsetLeft + (bounds.width - width) / 2}px`;

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

function applyAdjustment(opts) {
  const n = opts.direction.startsWith('n');
  const s = opts.direction.startsWith('s');
  const e = opts.direction.endsWith('e');
  const w = opts.direction.endsWith('w');
  const aspectRatio = opts.aspectRatio;
  const parentBounds = opts.parentBounds;
  let deltaX = opts.deltaX;
  let deltaY = opts.deltaY;
  let left = opts.bounds.left;
  let top = opts.bounds.top;
  let width = opts.bounds.width;
  let height = opts.bounds.height;

  const applyDeltaX = () => {
    if (w) {
      const newLeft = Math.min(left + width - minWidth, Math.max(left + deltaX, parentBounds.left));
      const delta = left - newLeft;
      left -= delta;
      width += delta;
    } else if (e) {
      width = Math.max(minWidth, Math.min(width + deltaX, parentBounds.right - left));
    }
  };

  const applyDeltaY = () => {
    if (n) {
      const newTop = Math.min(top + height - minHeight, Math.max(top + deltaY, parentBounds.top));
      const delta = top - newTop;
      top -= delta;
      height += delta;
    } else if (s) {
      height = Math.max(minHeight, Math.min(height + deltaY, parentBounds.bottom - top));
    }
  };

  if (!aspectRatio) {
    applyDeltaX();
    applyDeltaY();
    return { left, top, width, height };
  }

  // We're enforcing an aspect ratio, which makes things a bit trickier...
  const maxDelta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;

  // Adjust the height (and optionally the top) to have the proper ratio
  const adjustHeight = () => {
    const newHeight = width / opts.aspectRatio;
    const delta = height - newHeight;
    height = newHeight;
    if (n) {
      top += delta;
    }
  };

  // Adjust the width (and optionally the left) to have the proper ratio
  const adjustWidth = () => {
    const newWidth = height * opts.aspectRatio;
    const delta = width - newWidth;
    width = newWidth;
    if (w) {
      left += delta;
    }
  };

  if (maxDelta === deltaX) {
    applyDeltaX();
    adjustHeight();
  } else {
    applyDeltaY();
    adjustWidth();
  }

  // Check for out-of-bounds condition, and adjust if need be.
  const right = left + width;
  const bottom = top + height;
  const oobX = Math.max(parentBounds.left - left, right - parentBounds.right);
  const oobY = Math.max(parentBounds.top - top, bottom - parentBounds.bottom);

  if (oobX > 0 && oobX > oobY) {
    if (w) {
      width -= parentBounds.left - left;
      left = parentBounds.left;
    } else {
      width -= right - parentBounds.right;
    }
    adjustHeight();
  } else if (oobY > 0) {
    if (n) {
      height -= parentBounds.top - top;
      top = parentBounds.top;
    } else {
      height -= bottom - parentBounds.bottom;
    }
    adjustWidth();
  }

  return { left, top, width, height };
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
  const cropper = createCropperElement(canvas, aspectRatio);
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
