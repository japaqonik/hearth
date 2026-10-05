<script lang="ts">
  interface Props {
    size?: number;
  }
  let { size = 32 }: Props = $props();
</script>

<!--
  Hearth logo — a stylized flame.
  Outer flame uses the accent color; inner flame a warm highlight.
  Scales crisply at any size and inherits the app accent via CSS var.
-->
<svg
  class="logo"
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 48 48"
  fill="none"
  aria-hidden="true"
>
  <!-- Outer flame -->
  <path
    d="M24 4
       C 26 12, 34 15, 34 26
       a 10 10 0 0 1 -20 0
       C 14 19, 18 17, 19 12
       C 22 15, 20 20, 24 20
       C 27 20, 26 11, 24 4 Z"
    fill="var(--accent)"
  />
  <!-- Inner flame highlight -->
  <path
    d="M24 24
       C 25 28, 28 29, 28 33
       a 4 4 0 0 1 -8 0
       C 20 30, 22 29, 23 27
       C 23.5 29, 23 31, 24 31
       C 25 31, 25 27, 24 24 Z"
    fill="#ffb020"
  />
</svg>

<style>
  .logo {
    display: block;
    filter: drop-shadow(0 0 6px var(--accent-glow));
  }
</style>
