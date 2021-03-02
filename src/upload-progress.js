import { h } from './dom';

export function renderUploadProgress(file) {
  return h(
    '.quik-progress',
    h(
      'span.quik-progress-text',
      h('span.quik-filename', 'Uploading ', file.name || ''),
      h('span.quik-percent', '0%'),
    ),
    h('span.quik-progress-bar-wrapper', h('span.quik-progress-bar', { style: 'width: 0%' })),
  );
}

export function updateProgress(el, progress) {
  const bar = el.querySelector('.quik-progress-bar');
  el.querySelector('.quik-percent').textContent = Math.round(progress) + '%';
  bar.style.width = progress + '%';
  if (progress >= 100) {
    bar.classList.add('quik-done-bar');
  }
}
