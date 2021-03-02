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
const left = ({ e, bounds, parentBounds }) => ({
  left: e.clientX - parentBounds.x,
  width: bounds.right - e.clientX,
});

/**
 * Resize by growing to the right.
 */
const right = ({ e, bounds, newSize, aspectRatio }) => {
  return {
    width:
      // If we have a newSize and an aspectRatio to enforce,
      // then we're giving the height precedent, and the width
      // is a derivative value.
      aspectRatio && newSize ? newSize.height * (1 / aspectRatio) : e.clientX - bounds.x,
  };
};

/**
 * Resize by growing upward.
 */
const up = ({ e, bounds, parentBounds, newSize, aspectRatio }) => {
  // Derive our height based on our width (newSize). If newSize
  // is falsy, then height takes precedent over width and viceversa.
  if (aspectRatio && newSize) {
    const height = newSize.width * aspectRatio;
    return {
      top: bounds.bottom - height - parentBounds.y,
      height,
    };
  }

  return {
    top: e.clientY - parentBounds.y,
    height: bounds.bottom - e.clientY,
  };
};

/**
 * Resize by growing downward.
 */
const down = ({ e, bounds, newSize, aspectRatio }) => ({
  height: aspectRatio && newSize ? aspectRatio * newSize.width : e.clientY - bounds.y,
});

/**
 * Adjust the cropper by moving it.
 */
const move = ({ e, parentBounds, offsetY, offsetX }) => ({
  top: e.clientY - parentBounds.y - offsetY,
  left: e.clientX - parentBounds.x - offsetX,
});

/**
 * A function which does nothing, used to prevent undefined checks.
 */
const noop = () => {};

/**
 * Crop the specified image.
 */
function cropImage({ image, cropBounds, scale }) {
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

  // Apply the specified adjustment function during drag operations.
  const adjuster = (fn) => (e) => {
    const parent = cropper.offsetParent;
    const bounds = cropper.getBoundingClientRect();
    const parentBounds = parent.getBoundingClientRect();
    const { offsetY, offsetX } = e;

    function mousemove(e) {
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

    parent.addEventListener('mousemove', mousemove);
    document.addEventListener('mouseup', function mouseup(e) {
      parent.removeEventListener('mousemove', mousemove);
      document.removeEventListener('mouseup', mouseup);
    });
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

  // Change the caret and drag behavior based on where in the cropper we are.
  cropper.addEventListener('mousemove', (e) => {
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
  });

  // On mouse down, we'll begin the crop adjustment behavior.
  cropper.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    dragAction(e);
  });

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
