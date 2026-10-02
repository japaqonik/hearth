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

  const COLS = 4;
</script>

<div class="grid" style="--cols: {COLS}">
  {#each tiles as tile, i}
    <AppTile
      name={tile.name}
      icon={tile.icon}
      focused={active && focusedIndex === i}
      onclick={() => onactivate(tile)}
    />
  {/each}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), var(--tile-size));
    gap: var(--tile-gap);
    justify-content: center;
  }
</style>
