/* eslint-disable jsx/no-undef */
import { PickerBody } from './picker-body';

/**
 * Display the progress UI.
 *
 * @param {object} p
 * @prop {File} p.file
 * @prop {number} p.progress
 */
export function PickerProgress(p) {
  return (
    <PickerBody fit={true}>
      <style jsx global>
        {`
          .quikpik-progress {
            width: 100%;
          }

          .quikpik-progress-text {
            display: flex;
            justify-content: space-between;
            color: #6b7280;
            line-height: 1.25rem;
            margin: 0.5rem auto 0.5rem;
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
            transition: width 0.25s, background-color 0.5s;
          }

          .quikpik-done-bar {
            background: #48bb78;
          }
        `}
      </style>
      <div class="quikpik-progress">
        <span class="quikpik-progress-text">
          <span class="quikpik-filename">Uploading {p.file.name || ''}</span>
          <span class="quikpik-percent">{Math.round(p.progress)}%</span>
        </span>
        <span class="quikpik-progress-bar-wrapper">
          <span
            classList={{ 'quikpik-progress-bar': true, 'quikpik-done-bar': p.progress >= 100 }}
            style={{ width: `${p.progress}%` }}
          />
        </span>
      </div>
    </PickerBody>
  );
}
