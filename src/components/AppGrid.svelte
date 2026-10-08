<script lang="ts">
  import AppTile from "./AppTile.svelte";
  import type { AppTile as AppTileType } from "../stores/settings";

  interface Props {
    tiles: AppTileType[];
    focusedIndex: number;
    active: boolean;
    onactivate: (tile: AppTileType) => void;
  }

  let { tiles, focusedIndex, active, onactivate }: Props = $props();

  const COLS = 3;

  // Rotating color palette so the grid isn't monochromatic.
  const TILE_COLORS = [
    "#2dd4bf", // teal
    "#f59e42", // amber
    "#a78bfa", // violet
    "#38bdf8", // sky
    "#fb7185", // rose
    "#4ade80", // green
  ];
</script>

<div class="grid" style="--cols: {COLS}">
  {#each tiles as tile, i}
    <AppTile
      name={tile.name}
      icon={tile.icon}
      color={TILE_COLORS[i % TILE_COLORS.length]}
      focused={active && focusedIndex === i}
      onclick={() => onactivate(tile)}
    />
  {/each}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), var(--tile-w));
    gap: var(--tile-gap);
    justify-content: center;
  }
</style>
