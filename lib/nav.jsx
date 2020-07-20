import { comp } from './comp';
import './nav.css';

export const Nav = comp(({ setMode, sources, mode }, hooks) => {
  const [isVisible, setIsVisible] = hooks.useState(false);
  const toggleIsVisible = () => setIsVisible(!isVisible);
  const hide = () => setIsVisible(false);

  if (sources.length < 2) {
    return;
  }

  return (
    <div class="quikpik-nav">
      <button class="quikpik-nav-mobile-toggle" type="button" onClick={toggleIsVisible}>
        ☰
      </button>
      <nav class={`quikpik-nav-menu ${isVisible ? 'quikpik-nav-flyout' : ''}`} onClick={hide}>
        {sources.includes('filepicker') && (
          <button
            type="button"
            class={`quikpik-opt ${mode === 'pickfile' ? 'quikpik-opt-current' : ''}`}
            onClick={() => setMode('pickfile')}
          >
            <svg
              class="quikpik-opt-ico"
              fill="currentColor"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path d="M20 18.5c0 .276-.224.5-.5.5s-.5-.224-.5-.5.224-.5.5-.5.5.224.5.5zm4-2.5l-5-14h-14l-5 14v6h24v-6zm-17.666-12h11.333l3.75 11h-18.834l3.751-11zm15.666 16h-20v-3h20v3zm-9-6v-5h3l-4-4-4 4h3v5h2z" />
            </svg>
            File picker
          </button>
        )}
        {sources.includes('takephoto') && (
          <button
            type="button"
            class={`quikpik-opt ${mode === 'takephoto' ? 'quikpik-opt-current' : ''}`}
            onClick={() => setMode('takephoto')}
          >
            <svg
              class="quikpik-opt-ico"
              fill="currentColor"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path d="M5 4h-3v-1h3v1zm10.93 0l.812 1.219c.743 1.115 1.987 1.781 3.328 1.781h1.93v13h-20v-13h3.93c1.341 0 2.585-.666 3.328-1.781l.812-1.219h5.86zm1.07-2h-8l-1.406 2.109c-.371.557-.995.891-1.664.891h-5.93v17h24v-17h-3.93c-.669 0-1.293-.334-1.664-.891l-1.406-2.109zm-11 8c0-.552-.447-1-1-1s-1 .448-1 1 .447 1 1 1 1-.448 1-1zm7 0c1.654 0 3 1.346 3 3s-1.346 3-3 3-3-1.346-3-3 1.346-3 3-3zm0-2c-2.761 0-5 2.239-5 5s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5z" />
            </svg>
            Take picture
          </button>
        )}
        {sources.includes('takevideo') && (
          <button
            type="button"
            class={`quikpik-opt ${mode === 'takevideo' ? 'quikpik-opt-current' : ''}`}
            onClick={() => setMode('takevideo')}
          >
            <svg
              class="quikpik-opt-ico"
              fill="currentColor"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path d="M2.184 7.874l-2.184-.918 2.967-2.956.933 2.164-1.716 1.71zm21.816 2.126l-3 2v4l3 2v-8zm-7-2h-7.018l.79.787c.356.355.629.769.831 1.213h4.897c.276 0 .5.224.5.5v7c0 .276-.224.5-.5.5h-11c-.276 0-.5-.224-.5-.5v-2.909l-.018-.014-1.982-1.975v5.398c0 1.104.896 2 2 2h12c1.104 0 2-.896 2-2v-8c0-1.104-.896-2-2-2zm-14.65 1.13l2.967-2.956 4.044 4.029c.819.816.819 2.14 0 2.956-.819.816-2.147.815-2.967 0l-4.044-4.029z" />
            </svg>
            Capture video
          </button>
        )}
        {sources.includes('takeaudio') && (
          <button
            type="button"
            class={`quikpik-opt ${mode === 'takeaudio' ? 'quikpik-opt-current' : ''}`}
            onClick={() => setMode('takeaudio')}
          >
            <svg
              class="quikpik-opt-ico"
              fill="currentColor"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path d="M12 2c1.103 0 2 .897 2 2v7c0 1.103-.897 2-2 2s-2-.897-2-2v-7c0-1.103.897-2 2-2zm0-2c-2.209 0-4 1.791-4 4v7c0 2.209 1.791 4 4 4s4-1.791 4-4v-7c0-2.209-1.791-4-4-4zm8 9v2c0 4.418-3.582 8-8 8s-8-3.582-8-8v-2h2v2c0 3.309 2.691 6 6 6s6-2.691 6-6v-2h2zm-7 13v-2h-2v2h-4v2h10v-2h-4z" />
            </svg>
            Record audio
          </button>
        )}
      </nav>
    </div>
  );
});