<script lang="ts">
  interface Props {
    appName: string;
  }
  let { appName }: Props = $props();
</script>

<div class="overlay" role="status" aria-live="polite">
  <div class="spinner"></div>
  <p class="label">Opening {appName}…</p>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 20, 25, 0.82);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 28px;
    z-index: 200;
    animation: fadeIn 120ms ease;
  }

  .spinner {
    width: 64px;
    height: 64px;
    border: 5px solid var(--surface-3);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 800ms linear infinite;
  }

  .label {
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.01em;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
