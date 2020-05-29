<script>
  import { onDestroy } from 'svelte';

  const startTime = Date.now();
  let elapsedTime = computeElapsedTime();

  let timeout = setTimeout(function tick() {
    if (!timeout) {
      return;
    }

    elapsedTime = computeElapsedTime(startTime);
    timeout = setTimeout(tick, 1000);
  }, 1000);

  onDestroy(() => {
    clearTimeout(timeout);
    timeout = undefined;
  });

  function computeElapsedTime() {
    const elapsedMs = Date.now() - startTime;
    const sec = Math.floor(elapsedMs / 1000) % 60;
    const min = Math.floor(sec / 60) % 60;
    const h = Math.floor(min / 60);

    return `${h ? h + ':' : ''}${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
</script>

<span class="quikpik-elapsed-time">
  Recording {elapsedTime}
</span>

<style>
  .quikpik-elapsed-time {
    position: absolute;
    left: calc(50% + 2.75rem);
    top: 50%;
    margin-top: -0.5rem;
    line-height: 1;
    opacity: 0.8;
  }
</style>
