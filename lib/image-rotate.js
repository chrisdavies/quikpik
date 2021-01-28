/**
 * Given an image and a canvas, this will render the image on the canvas, allow
 * 90-degree rotation, and saving the canvas to PNG forat.
 * @param {URL} url
 * @param {File|Blob} original
 */
export function imageRotate(url, original) {
  let angle = 0;
  let canvas = undefined;
  let ready = false;
  const image = new Image();

  function renderImage(image, canvas, angle) {
    if (!canvas || !ready) {
      return;
    }
    const w = canvas.width;

    canvas.width = canvas.height;
    canvas.height = w;

    const ctx = canvas.getContext('2d');

    ctx.translate(canvas.width / 2, canvas.height / 2);

    ctx.rotate((angle * Math.PI) / 180);

    ctx.drawImage(image, -image.width / 2, -image.height / 2);

    ctx.rotate((-angle * Math.PI) / 180);

    ctx.translate(-canvas.width / 2, -canvas.height / 2);
  }

  image.addEventListener('load', () => {
    ready = true;
    canvas.width = image.width;
    canvas.height = image.height;
    renderImage(image, canvas, angle);
  });
  image.addEventListener('error', () => alert('Failed to load image.'));
  image.src = url;

  return {
    setCanvas(c) {
      if (!c || c.$rotater) {
        return;
      }
      canvas = c;
      canvas.$rotater = true;
      renderImage(image, canvas, angle);
    },
    save(format = 'image/png', quality = undefined) {
      if (!angle) {
        return Promise.resolve(original);
      }
      return new Promise((resolve) =>
        canvas.toBlob(
          (blob) => {
            blob.name = original && original.name;
            resolve(blob);
          },
          format,
          quality,
        ),
      );
    },
    rotate() {
      angle = (angle + 90) % 360;
      renderImage(image, canvas, angle);
    },
  };
}