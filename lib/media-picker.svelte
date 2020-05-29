<script>
  import { onMount } from 'svelte';
  import LiveVid from './live-vid.svelte';
  import ElapsedTime from './elapsed-time.svelte';
  import ConfirmMedia from './confirm-media.svelte';
  import { createRecorder } from './media-lib';

  export let mode;
  export let uploadFile;

  // init | live | error | recording | confirm
  let status = 'init';
  let error;
  let recorder;
  let recorderMode;
  let file;

  $: recorderOpts = { video: mode !== 'takeaudio', audio: true };
  $: recorderPromise = createRecorder(recorderOpts)
    .then((value) => {
      recorder = value;
      status = 'live';
      recorderMode = mode;
    })
    .catch(mediaError);

  function mediaError(err) {
    console.error(err);
    status = 'error';
    error = 'Unable to connect to your camera.';
  }

  function captureImage() {
    recorder
      .capturePhoto()
      .then((newFile) => {
        file = newFile;
        status = 'confirm';
      })
      .catch(mediaError);
  }

  function startRecording() {
    recorder.beginMediaCapture();
    status = 'recording';
  }

  function onCapture() {
    if (mode === 'takephoto') {
      captureImage();
    } else {
      startRecording();
    }
  }

  function stopRecording() {
    recorder
      .endMediaCapture()
      .then((newFile) => {
        file = newFile;
        status = 'confirm';
      })
      .catch(mediaError);
  }

  function retake() {
    status = 'live';
    file = undefined;
  }

  function accept() {
    uploadFile(file);
  }
</script>

<div class="quikpik-media">
  {#if status === 'error'}
    <p class="quikpik-error">{error}</p>
  {/if}
  {#if status === 'init'}
    <p class="quikpik-info">Waiting for your camera or microphone to be ready.</p>
  {/if}
  {#if (status === 'live' || status === 'recording') && mode !== 'takeaudio'}
    <LiveVid recorder={recorder} />
  {/if}
  {#if (status === 'live' && mode === 'takeaudio')}
    <p class="quikpik-info">Click the red button to begin recording.</p>
  {/if}
  {#if status === 'live'}
    <footer class="quikpik-media-footer">
      <button
        class="quikpik-snap-photo"
        class:quikpik-record-media={mode !== 'takephoto'}
        class:quikpik-stop-media={status === 'recording'}
        disabled={recorderMode !== mode}
        on:click={onCapture}
      ></button>
    </footer>
  {/if}
  {#if status === 'recording'}
    <footer class="quikpik-media-footer">
      <button class="quikpik-stop-media" on:click={stopRecording}></button>
      <ElapsedTime />
    </footer>
  {/if}
  {#if status === 'confirm'}
    <ConfirmMedia file={file} />
    <footer class="quikpik-media-footer">
      <button class="quikpik-media-retake" on:click={retake}>
        Retake
      </button>
      <button class="quikpik-media-accept" on:click={accept}>
        Accept &amp; upload
      </button>
    </footer>
  {/if}
</div>

<style>
  .quikpik-media {
    box-sizing: border-box;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: #1a202c;
    color: #fff;
    padding: 1rem;
    border-radius: 0.375rem;
  }

  .quikpik-media-footer {
    position: relative;
    padding: 1rem;
    width: 100%;
  }

  .quikpik-snap-photo {
    background: #fff;
    cursor: pointer;
    box-shadow: inset 0 0 0 2px;
    border: 4px solid #fff;
    width: 3rem;
    height: 3rem;
    border-radius: 100%;
    outline: none;
  }

  .quikpik-stop-media,
  .quikpik-record-media {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: #f00;
    box-shadow: inset 0 0 0 2px;
    border: 4px solid #fff;
    width: 3rem;
    height: 3rem;
    border-radius: 100%;
    outline: none;
  }

  .quikpik-stop-media {
    background: transparent;
  }

  .quikpik-stop-media::before {
    content: '';
    background: #f00;
    height: 1.5rem;
    width: 1.5rem;
    border-radius: 2px;
  }

  .quikpik-snap-photo:focus {
    box-shadow: inset 0 0 0 4px;
  }

  .quikpik-media-retake,
  .quikpik-media-accept {
    background: #5a67d8;
    color: #fff;
    border: 0;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    border-radius: 0.375rem;
    cursor: pointer;
    margin: 0 0.25rem;
    outline: none;
  }

  .quikpik-media-retake {
    border: 1px solid;
    background: transparent;
    color: inherit;
  }

  .quikpik-info {
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>