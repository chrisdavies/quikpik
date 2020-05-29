<script>
  export let file;
  export let progress;
</script>

<div class="quikpik-progress">
  <span class="quikpik-progress-text">
    <span class="quikpik-filename">Uploading {file.name || ''}</span>
    <span class="quikpik-percent">{Math.round(progress)}%</span>
  </span>
  <span class="quikpik-progress-bar-wrapper">
    <span
      class="quikpik-progress-bar"
      class:quikpik-done-bar={progress >= 100}
      style="width: {progress}%"
    />
  </span>
</div>

<style>
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
</style>