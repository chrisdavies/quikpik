/* eslint-disable jsx/no-undef */

function cancelEvent(e) {
  e.stopPropagation();
}

/**
 * A wrapper component, primarily used for styling and preventing
 * the modal from closing when the user clicks within it.
 *
 * @param {Object} p
 * @prop {boolean} fit
 * @prop {any} children
 */
export function PickerBody(p) {
  return (
    <div class="quikpik-body" classList={{ 'quikpik-body-fit': p.fit }} onClick={cancelEvent}>
      <style jsx global>
        {`
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

          .quikpik-body {
            position: relative;
            background: #fff;
            padding: 1.5rem;
            border-radius: 0.5rem;
            text-align: center;
            font-size: 0.875rem;
            z-index: 10001;
            width: calc(100vw - 5rem);
            height: calc(100vh - 5rem);
            max-width: 1024px;
            max-height: 780px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            outline: none;
            animation: quikpik-up 0.25s ease forwards;
            display: flex;
          }

          .quikpik-body-fit {
            height: auto;
            max-width: 24rem;
          }
        `}
      </style>
      {p.children}
    </div>
  );
}
