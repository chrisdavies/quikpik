/* eslint-disable jsx/no-undef */
import { render } from 'solid-js/dom';

/**
 * @typedef PickerInstance
 * @property { function(): void } close close and clean up the picker.
 */

function Picker() {
  return (
    <div class="quikpik">
      <style jsx>
        {`
          @keyframes quikpik-spin {
            0% {
              transform: translate(-50%, -50%) rotate(0deg);
            }
            100% {
              transform: translate(-50%, -50%) rotate(360deg);
            }
          }

          @keyframes quikpik-up {
            0% {
              opacity: 0;
              transform: translateY(4rem);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          a {
            text-decoration: none;
            color: inherit;
          }

          .quikpik {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Inter var, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
              Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji,
              Segoe UI Symbol, Noto Color Emoji;
            z-index: 10000;
          }

          .quikpik::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            background: #6b7280;
            opacity: 0.75;
            z-index: 10000;
          }

          .quikpik-body {
            position: relative;
            background: #fff;
            padding: 1.5rem;
            border-radius: 0.5rem;
            text-align: center;
            font-size: 0.875rem;
            z-index: 10001;
            width: 100%;
            max-width: 32rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            outline: none;
            animation: quikpik-up 0.25s ease forwards;
            display: flex;
            height: 100%;
            max-height: 20rem;
          }

          .quikpik-form {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }

          .quikpik-is-dragging .quikpik-body {
            background: #ebf4ff;
          }

          .quikpik-icon {
            color: #9fa6b2;
            width: 3rem;
            height: 3rem;
          }

          .quikpik-header {
            color: #161e2e;
            line-height: 1.5rem;
            font-size: 1.125rem;
            font-weight: 500;
            margin: 0;
            margin-top: 1.25rem;
          }

          .quikpik-text {
            display: block;
            color: #6b7280;
            line-height: 1.25rem;
            max-width: 75%;
            margin: 0.5rem auto 1.5rem;
          }

          .quikpik-action {
            display: block;
            background: #5850ec;
            color: #fff;
            border: 0;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            border-radius: 0.375rem;
            cursor: pointer;
          }

          .quikpik-action:active,
          .quikpik-action:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(180, 198, 252, 0.45);
          }

          .quikpik-input {
            position: absolute;
            top: -10000px;
            left: -10000px;
            width: 1px;
            overflow: hidden;
            z-index: 1;
          }

          .quikpik-progress-text {
            display: flex;
            justify-content: space-between;
            color: #6b7280;
            line-height: 1.25rem;
            margin: 0.5rem auto 1.5rem;
          }

          .quikpik-progress-bar,
          .quikpik-progress-bar-wrapper {
            display: block;
            background: #c3dafe;
            height: 8px;
            border-radius: 4px;
          }

          .quikpik-progress-bar {
            background: #667eea;
            width: 0;
            transition: width 0.25s;
          }

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
            display: inline-flex;
            color: inherit;
            align-items: center;
            margin-bottom: 0.75rem;
            border-left: 2px solid transparent;
            padding-left: 0.5rem;
            margin-left: -0.5rem;
          }

          .quikpik-opt-current {
            color: #5850ec;
            border-color: #5850ec;
          }

          .quikpik-opt-ico {
            margin-right: 0.75rem;
            height: 1.25rem;
          }
        `}
      </style>
      <div class="quikpik-body">
        <nav class="quikpik-nav">
          <a href="#" class="quikpik-opt quikpik-opt-current">
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
          </a>
          <a href="#" class="quikpik-opt">
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
          </a>
          <a href="#" class="quikpik-opt">
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
          </a>
          <a href="#" class="quikpik-opt">
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
          </a>
        </nav>
        <div class="quikpik-form">
          <svg class="quikpik-icon" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
          <h2 class="quikpik-header">Upload a file</h2>
          <div class="quikpik-instructions">
            <span class="quikpik-text">
              Drag or paste a file here, or click to choose a file from your computer.
            </span>
            <label class="quikpik-action">
              Choose File
              <input class="quikpik-input" type="file" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Displays the file picker with the specified options.
 *
 * @param {Object} opts The picker options
 * @returns {{ close: () => void }} The picker instance
 */
export function quikpik() {
  const root = document.createElement('div');

  document.body.appendChild(root);
  render(Picker, root);

  return {
    close() {
      root.remove();
    },
  };
}
