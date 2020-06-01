import '@testing-library/jest-dom/extend-expect';
import { render } from '@testing-library/svelte';
import ConfirmMedia from './confirm-media.svelte';

// The real functions
const createObjectURL = URL.createObjectURL;
const revokeObjectURL = URL.revokeObjectURL;

// Our mock ones!
const createFn = jest.fn(() => 'heyo!!!');
const revokeFn = jest.fn();

afterEach(() => {
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
});

beforeEach(() => {
  URL.createObjectURL = createFn;
  URL.revokeObjectURL = revokeFn;
});

test('creates and revokes the URL', () => {
  const file = { type: 'video/mp4' };
  const { unmount } = render(ConfirmMedia, { file });
  expect(createFn).toHaveBeenCalledTimes(1);
  expect(createFn).toHaveBeenCalledWith(file);
  expect(revokeFn).not.toHaveBeenCalled();
  unmount();
  expect(revokeFn).toHaveBeenCalledWith('heyo!!!');
});

test('renders a video', async () => {
  const file = { type: 'video/mp4' };
  const comp = render(ConfirmMedia, { file });
  const vid = comp.container.querySelector('video');
  expect(vid).toHaveAttribute('src', 'heyo!!!');
  comp.unmount();
});

test('renders an image', async () => {
  const file = { type: 'image/png' };
  const comp = render(ConfirmMedia, { file });
  const img = comp.container.querySelector('img');
  expect(img).toHaveAttribute('src', 'heyo!!!');
  comp.unmount();
});
