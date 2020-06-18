import './live-vid.css';

export function LiveVid({ recorder }) {
  function autoplay(el) {
    if (!el || el.$autoplay) {
      return;
    }

    el.srcObject = recorder.liveSrc();
    el.muted = true;
    el.controls = false;
    el.play();
  }

  return (
    <div class="quikpik-vid-wrapper">
      <video ref={autoplay} class="quikpik-vid"></video>
    </div>
  );
}
