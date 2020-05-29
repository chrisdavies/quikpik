<script>
  export let recorder;

  let videoEl;

  $: if (videoEl) {
    videoEl.srcObject = recorder.liveSrc();
    videoEl.muted = true;
    videoEl.controls = false;
    videoEl.play();
  }

  function autoplay(el) {
    videoEl = el;
  }
</script>

<div class="quikpik-vid-wrapper">
  <video
    use:autoplay
    class="quikpik-vid"
  ></video>
</div>

<style>
  .quikpik-vid-wrapper {
    flex-grow: 1;
  }

  .quikpik-vid-wrapper {
    position: relative;
    width: 100%;
    flex-grow: 1;
  }

  .quikpik-vid {
    position: absolute;
    height: 100%;
    width: 100%;
    margin: auto;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 2px;
    outline: none;
  }
</style>