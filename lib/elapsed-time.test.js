import '@testing-library/jest-dom/extend-expect';
import { render } from '@testing-library/svelte';
import ElapsedTime from './elapsed-time.svelte';

jest.useFakeTimers();

const originalNow = Date.now;

afterEach(() => {
  Date.now = originalNow;
});

test('shows the elapsed time as time passes', async () => {
  Date.now = () => 0;
  const { getByText } = render(ElapsedTime);
  expect(getByText('Recording 00:00')).toBeInTheDocument();
  Date.now = () => 1000;
  jest.advanceTimersByTime(1000);
  // Wait for the component to rerender
  await Promise.resolve();
  expect(getByText('Recording 00:01')).toBeInTheDocument();
});
