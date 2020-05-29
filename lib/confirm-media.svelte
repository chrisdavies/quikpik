<script>
  import { onDestroy } from 'svelte';

  export let file;
  const src = URL.createObjectURL(file);

  onDestroy(() => URL.revokeObjectURL(src));
</script>

{#if file.type.startsWith('video/') || file.type.startsWith('audio/')}
  <div class="quikpik-vid-wrapper">
    <video class="quikpik-vid" src={src} muted={false} controls={true}></video>
  </div>
{:else}
  <div class="quikpik-confirm-wrapper">
    <img class="quikpik-confirm-item" src={src} alt="Confirm" />
  </div>
{/if}

<style>
  .quikpik-confirm-item {
    width: 100%;
    max-width: 100%;
    max-height: 100%;
  }
</style>
