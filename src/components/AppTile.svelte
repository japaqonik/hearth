<script lang="ts">
  interface Props {
    name: string;
    icon: string;
    focused: boolean;
    color?: string;
    onclick: () => void;
  }

  let { name, icon, focused, color = "var(--accent)", onclick }: Props = $props();

  // Map icon name to inline SVG path data
  const icons: Record<string, string> = {
    globe: `<circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>`,

    "folder-open": `<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>`,

    settings: `<circle cx="12" cy="12" r="3"/>
               <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06
                        a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09
                        A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83
                        l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09
                        A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83
                        l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09
                        a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83
                        l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09
                        a1.65 1.65 0 0 0-1.51 1z"/>`,
  };

  $effect(() => {
    if (focused) {
      // Ensure the focused tile is visible
      const el = document.querySelector(`[data-tile-name="${name}"]`) as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  });
</script>

<button
  class="tile"
  class:focused
  data-tile-name={name}
  {onclick}
>
  <span class="tile-icon" style="color: {color}">
    <svg xmlns="http://www.w3.org/2000/svg" width="84" height="84" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="1.5"
         stroke-linecap="round" stroke-linejoin="round">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html icons[icon] ?? icons["globe"]}
    </svg>
  </span>
  <span class="tile-label">{name}</span>
</button>

<style>
  .tile {
    width: var(--tile-w);
    height: var(--tile-h);
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
    padding: 28px;
    color: var(--text);
    transition: background var(--transition), border-color var(--transition), transform var(--transition);
    flex-shrink: 0;
  }

  .tile:hover {
    background: var(--surface-2);
    border-color: var(--surface-3);
  }

  .tile.focused {
    background: var(--surface-2);
    border-color: var(--accent);
    box-shadow: 0 0 28px var(--accent-glow);
    transform: scale(1.05);
  }

  .tile-icon {
    opacity: 0.75;
    transition: opacity var(--transition), transform var(--transition);
    display: flex;
  }

  .tile.focused .tile-icon {
    opacity: 1;
  }

  .tile-label {
    font-size: 1.4rem;
    font-weight: 700;
    letter-spacing: 0.01em;
  }
</style>
