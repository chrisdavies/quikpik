<script>
  import { onMount } from 'svelte';
  import FilePicker from './file-picker.svelte';
  import UploadProgress from './upload-progress.svelte';
  import MediaPicker from './media-picker.svelte';
  import Nav from './quikpik-nav.svelte';

  // The upload function, passed into quikpik opts
  export let upload;
  export let customProgress = false;
  export let sources = ['filepicker', 'takephoto', 'takevideo', 'takeaudio'];
  export let close;
  export let uploader;

  let mode = 'pickfile';
  let file;
  let progress = 0;

  function setMode(newMode) {
    mode = newMode;
  }

  function onProgress(newProgress) {
    progress = newProgress;
  }

  function uploadFile(newFile) {
    if (!newFile) {
      return;
    }

    file = newFile;
    uploader = upload({ file, onProgress });

    // Give the user a bit of time to see that we've completed.
    uploader.promise
      .then(() => setTimeout(close, 750))
      .catch((err) => {
        if (err && err.status !== 0) {
          alert('Upload failed. ' + (err.message || ''));
        }
      });
  }

  function cancelEvent(e) {
    e.stopPropagation();
  }

  function closeOnEscape(e) {
    if (e.key === 'Escape' || e.code === 'Escape') {
      close();
    }
  }
</script>

<svelte:options accessors={true}></svelte:options>
<svelte:window on:keydown={closeOnEscape}></svelte:window>

{#if !customProgress || !uploader}
  <div class="quikpik" on:click={close}>
    <div
      class="quikpik-body"
      class:quikpik-body-fit={uploader}
      on:click={cancelEvent}
    >
      {#if uploader}
        <UploadProgress {progress} {file} />
      {:else}
        <Nav mode={mode} setMode={setMode} sources={sources} />
        {#if mode === 'pickfile'}
          <FilePicker uploadFile={uploadFile} />
        {:else}
          <MediaPicker uploadFile={uploadFile} mode={mode} />
        {/if}
      {/if}
    </div>
  </div>
{/if}

<style>
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
    overflow: hidden;
  }

  @media only screen and (max-width: 600px) {
    .quikpik-body {
      padding: 0;
      width: calc(100% - 2rem);
      height: calc(100% - 2rem);
    }
  }

  .quikpik-body-fit {
    height: auto;
    max-width: 24rem;
    padding: 1.5rem;
  }

</style>
