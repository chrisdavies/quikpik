<script>
  import { onMount } from 'svelte';
  import quikpik from '../lib';

  function mockUpload({ file, onProgress }) {
    console.log('Uploading file:', file.name, 'type:', file.type);

    const mockProgressInterval = 250;
    let progress = 0;
    let resolve, reject, timeout;

    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
      timeout = setTimeout(mockProgress, mockProgressInterval);

      function mockProgress() {
        progress += 10;
        onProgress(progress);

        if (progress >= 100) {
          resolve();
        } else {
          setTimeout(mockProgress, mockProgressInterval);
        }
      }
    });

    return {
      promise,

      cancel() {
        // Reject should do whatever XMLHttpRequest abort does:
        // The XMLHttpRequest.abort() method aborts the request if it has already been sent. When a request is aborted, its readyState is changed to XMLHttpRequest.UNSENT (0) and the request's status code is set to 0.
        console.log('I was canceled!');
        clearTimeout(timeout);
        return reject && reject({ status: 0 });
      },
    };
  }

  onMount(() => {
    quikpik({
      upload: mockUpload,
    });
  });
</script>

<main>
  <h1>Quikpik</h1>
  <button
    type="button"
    on:click={() =>
      quikpik({
        upload: mockUpload,
        sources: ['filepicker'],
      })
    }
  >
    There can be only one
  </button>
  <button
    type="button"
    on:click={(e) =>
      quikpik({
        customProgress: true,

        upload({ file }) {
          return mockUpload({
            file,
            onProgress(progress) {
              e.target.textContent = `${progress}%`;
            },
          });
        },
      })
    }
  >
    Custom progress
  </button>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>