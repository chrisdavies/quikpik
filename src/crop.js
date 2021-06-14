/**
 * Image cropping logic. This comes into play when the user clicks the
 * crop option in the image editor, or if the caller specifies that
 * crop is required for an image.
 */

import { h } from './dom';

/**
 * Consts, min height and width are used to prevent us from
 * getting into a cropper that is too small to be adjusted.
 */
const minHeight = 32;
const minWidth = 32;

/**
 * @param {HTMLCanvasElement} canvas the canvas to which the cropper will be attached
 */
function createCropperElement(canvas) {
  const container = canvas.parentElement;
  const cropper = h('.quik-crop');

  container.appendChild(cropper);

  return cropper;
}

/**
 * Resize by growing to the left.
 */
const left = (opts) => ({
  left: opts.e.clientX - opts.parentBounds.x,
  width: opts.bounds.right - opts.e.clientX,
});

/**
 * Resize by growing to the right.
 */
const right = (opts) => {
  return {
    width:
      // If we have a newSize and an aspectRatio to enforce,
      // then we're giving the height precedent, and the width
      // is a derivative value.
      opts.aspectRatio && opts.newSize
        ? opts.newSize.height * (1 / opts.aspectRatio)
        : opts.e.clientX - opts.bounds.x,
  };
};

/**
 * Resize by growing upward.
 */
const up = (opts) => {
  // Derive our height based on our width (newSize). If newSize
  // is falsy, then height takes precedent over width and viceversa.
  if (opts.aspectRatio && opts.newSize) {
    const height = opts.newSize.width * opts.aspectRatio;
    return {
      top: opts.bounds.bottom - height - opts.parentBounds.y,
      height,
    };
  }

  return {
    top: opts.e.clientY - opts.parentBounds.y,
    height: opts.bounds.bottom - opts.e.clientY,
  };
};

/**
 * Resize by growing downward.
 */
const down = (opts) => ({
  height:
    opts.aspectRatio && opts.newSize
      ? opts.aspectRatio * opts.newSize.width
      : opts.e.clientY - opts.bounds.y,
});

/**
 * Adjust the cropper by moving it.
 */
const move = (opts) => ({
  top: opts.e.clientY - opts.parentBounds.y - opts.offsetY,
  left: opts.e.clientX - opts.parentBounds.x - opts.offsetX,
});

/**
 * A function which does nothing, used to prevent undefined checks.
 */
const noop = () => {};

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
 * Attach a crop UI to the specified canvas.
 * @param {HTMLCanvasElement} canvas the canvas to which the cropper will be attached
 * @param {number} aspectRatio if specified, the cropper height will be width * aspectRatio
 */
export function attachCropper(canvas, aspectRatio) {
  const cropper = createCropperElement(canvas);
  const normalizeEvent = (e) => {
    const touch = e.changedTouches && e.changedTouches[0];
    if (touch) {
      e.clientX = touch.clientX;
      e.clientY = touch.clientY;
    }
    return e;
  };

  // Apply the specified adjustment function during drag operations.
  const adjuster = (fn) => (e) => {
    e = normalizeEvent(e);
    const parent = cropper.offsetParent;
    const bounds = cropper.getBoundingClientRect();
    const parentBounds = parent.getBoundingClientRect();
    const offsetY = e.clientY - bounds.y;
    const offsetX = e.clientX - bounds.x;

    function mousemove(e) {
      e = normalizeEvent(e);
      const props = fn({
        e,
        offsetY,
        offsetX,
        bounds,
        parentBounds,
        aspectRatio,
      });
      Object.keys(props).forEach((k) => (cropper.style[k] = props[k] + 'px'));
    }

    function mouseup(e) {
      parent.removeEventListener('mousemove', mousemove);
      parent.removeEventListener('touchmove', mousemove);
      document.removeEventListener('mouseup', mouseup);
      document.removeEventListener('touchend', mouseup);
      document.removeEventListener('touchcancel', mouseup);
    }

    parent.addEventListener('mousemove', mousemove);
    parent.addEventListener('touchmove', mousemove);
    document.addEventListener('mouseup', mouseup);
    document.addEventListener('touchend', mouseup, true);
    document.addEventListener('touchcancel', mouseup, true);
  };

  // Resize the cropper based on the adjustment functions.
  const resizer = (adjustA, adjustB) =>
    adjuster((opts) => {
      const newSize = adjustA(opts);
      Object.assign(newSize, adjustB({ ...opts, newSize }));
      return newSize.width < minWidth || newSize.height < minHeight ? {} : newSize;
    });

  // Functions which adjust the cropper on drag
  const adjusters = {
    se: resizer(right, down),
    sw: resizer(left, down),
    ne: resizer(right, up),
    nw: resizer(left, up),
    s: resizer(down, aspectRatio ? right : noop),
    e: resizer(right, aspectRatio ? down : noop),
    n: resizer(up, aspectRatio ? right : noop),
    w: resizer(left, aspectRatio ? down : noop),
    move: adjuster(move),
  };

  // The action which will be taken when the user drags within the cropper.
  let dragAction = adjusters.move;

  function changeAdjuster(e) {
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

    if (direction) {
      cropper.style.cursor = direction + '-resize';
      dragAction = adjusters[direction];
    } else {
      cropper.style.cursor = 'grabbing';
      dragAction = adjusters.move;
    }
  }

  // Change the caret and drag behavior based on where in the cropper we are.
  cropper.addEventListener('mousemove', changeAdjuster);

  // On mouse down, we'll begin the crop adjustment behavior.
  const dragstart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    changeAdjuster(e);
    dragAction(e);
  };

  cropper.addEventListener('touchstart', dragstart);
  cropper.addEventListener('mousedown', dragstart);

  /**
   * Remove the cropper from the DOM.
   */
  const dispose = () => {
    cropper.remove();
  };

  /**
   * Crop the specified image. Returns a promise that resolves to the cropped image.
   */
  const apply = (image) =>
    cropImage({
      image,
      cropBounds: {
        top: cropper.offsetTop - canvas.offsetTop,
        left: cropper.offsetLeft - canvas.offsetLeft,
        width: cropper.offsetWidth,
        height: cropper.offsetHeight,
      },
      scale: image.naturalWidth / canvas.offsetWidth,
    });

  return {
    el: cropper,
    dispose,
    apply,
  };
}
