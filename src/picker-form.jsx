/* eslint-disable jsx/no-undef */
import { createState, Show } from 'solid-js';
import { PickerBody } from './picker-body';
import { MediaPicker } from './media-picker';
import { FilePicker } from './file-picker';

const modes = {
  filepicker: FilePicker,
  takephoto: MediaPicker,
  takevideo: MediaPicker,
  takeaudio: MediaPicker,
};

/**
 * Display the form for uploading.
 *
 * @param {object} p
 * @prop {string[]} p.sources
 * @prop {function} p.uploadFile
 */
export function PickerForm(p) {
  const [state, setState] = createState({
    // filepicker | takephoto | takevideo | takeaudio
    mode: 'filepicker',
    menuVisible: false,
  });

  function setMode(mode) {
    setState((s) => ({ ...s, mode }));
  }

  function toggleMenu() {
    setState((s) => ({ ...s, menuVisible: !s.menuVisible }));
  }

  function hideMenu() {
    setState((s) => ({ ...s, menuVisible: false }));
  }

  function MenuItem(props) {
    return (
      <Show when={p.sources.includes(props.value)}>
        <button
          type="button"
          class="quikpik-opt"
          classList={{ 'quikpik-opt-current': state.mode === props.value }}
          onClick={() => setMode(props.value)}
        >
          {props.children}
        </button>
      </Show>
    );
  }

  return (
    <PickerBody>
      <style jsx global>
        {`
          .quikpik-nav {
            color: #6b7280;
            margin-right: 1.5rem;
            padding-right: 1.5rem;
            border-right: 1px dashed #ddd;
            display: flex;
            flex-direction: column;
            white-space: nowrap;
            align-items: flex-start;
          }

          .quikpik-opt {
            background: transparent;
            cursor: pointer;
            border: 0;
            font: inherit;
            font-size: 0.875rem;
            display: inline-flex;
            color: inherit;
            align-items: center;
            margin-bottom: 0.75rem;
            border-left: 2px solid transparent;
            padding-left: 0.5rem;
            margin-left: -0.5rem;
            text-decoration: none;
            outline: none;
          }

          .quikpik-opt:hover {
            color: #5a67d8;
          }

          .quikpik-opt-current {
            color: #5a67d8;
            border-color: #5a67d8;
          }

          .quikpik-opt-ico {
            margin-right: 0.75rem;
            height: 1.25rem;
          }

          .quikpik-nav-mobile-toggle {
            display: none;
          }

          @keyframes quikpik-menu-in {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(0);
            }
          }

          @media only screen and (max-width: 600px) {
            .quikpik-body {
              padding: 0;
              width: calc(100% - 2rem);
              height: calc(100% - 2rem);
            }

            .quikpik-nav {
              position: absolute;
              top: 0;
              left: 0;
              bottom: 0;
              right: 0;
              background: #fff;
              box-shadow: 0.5rem 0 1rem -0.5rem rgba(0, 0, 0, 0.5);
              border: 0;
              padding: 2rem;
              z-index: 1;
              display: flex;
              margin: 0;
              transform: translateX(100%);
              z-index: -1;
              visibility: hidden;
            }

            .quikpik-nav-flyout {
              transform: translateY(0);
              animation: quikpik-menu-in 0.1s ease forwards;
              z-index: 9;
              visibility: visible;
            }

            .quikpik-nav-mobile-toggle {
              display: inline-block;
              background: transparent;
              border: none;
              outline: none;
              font-size: 1rem;
              position: absolute;
              right: 0.5rem;
              top: 0.5rem;
              z-index: 10;
              color: #718096;
            }
          }
        `}
      </style>
      <Show when={p.sources.length > 1}>
        <button class="quikpik-nav-mobile-toggle" type="button" onClick={toggleMenu}>
          ☰
        </button>
        <nav
          class="quikpik-nav"
          classList={{ 'quikpik-nav-flyout': state.menuVisible }}
          onClick={hideMenu}
        >
          <MenuItem value="filepicker">
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
          </MenuItem>
          <MenuItem value="takephoto">
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
          </MenuItem>
          <MenuItem value="takevideo">
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
          </MenuItem>
          <MenuItem value="takeaudio">
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
          </MenuItem>
        </nav>
      </Show>
      {modes[state.mode]({ uploadFile: p.uploadFile, mode: state.mode })}
    </PickerBody>
  );
}
