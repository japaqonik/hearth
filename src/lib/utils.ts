/** Format a byte count into a human-readable string. */
export function formatSize(bytes: number | null): string {
  if (bytes === null) return "";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Format a Unix timestamp (seconds) into a short date string. */
export function formatDate(timestamp: number | null): string {
  if (timestamp === null) return "";
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
