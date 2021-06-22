import { h } from './dom';
import { renderFilePicker } from './file-picker';

export function renderPickerModal(opts) {
  const close = opts.close;
  const el = h(
    '.quikpik',
    { onmousedown: close, ontouchstart: close },
    h(
      'div.quik-body',
      {
        onmousedown(e) {
          e.stopPropagation();
        },
        ontouchstart(e) {
          e.stopPropagation();
        },
      },
      renderFilePicker(opts),
    ),
  );

  return el;
}

export function setModalBody(el, child) {
  el.querySelector('.quik-body').firstChild.replaceWith(child);
}
