<script lang="ts">
  interface Props {
    path: string;
  }

  let { path }: Props = $props();

  // Show the path, truncated from the left if too long (keep the tail visible)
  let display = $derived.by(() => {
    const maxLen = 70;
    if (path.length <= maxLen) return path;
    return "…" + path.slice(path.length - maxLen + 1);
  });
</script>

<div class="breadcrumb">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
  <span class="path truncate">{display}</span>
</div>

<style>
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px var(--edge);
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .path {
    font-size: 1rem;
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    color: var(--text);
  }
</style>
