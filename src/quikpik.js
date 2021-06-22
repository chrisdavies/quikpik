import { h } from './dom';
import { renderFilePicker } from './file-picker';

export function renderPickerModal(opts) {
  const close = opts.close;
  const el = h(
    '.quikpik',
    { onclick: close, ontouchend: close },
    h(
      'div.quik-body',
      {
        onclick(e) {
          e.stopPropagation();
        },
        ontouchend(e) {
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
