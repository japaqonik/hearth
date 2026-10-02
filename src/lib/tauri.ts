import { invoke } from "@tauri-apps/api/core";
import type { Config } from "../stores/settings";

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number | null;
  modified: number | null;
  extension: string | null;
}

/** List a directory's contents (dirs first, alphabetical). */
export function listDirectory(
  path: string,
  showHidden: boolean,
): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("list_directory", { path, showHidden });
}

/** Open a file via its configured handler, or xdg-open fallback. */
export function openFile(path: string, config: Config): Promise<void> {
  return invoke<void>("open_file", { path, config });
}

/** Launch an external application. */
export function launchApp(command: string, args: string[]): Promise<void> {
  return invoke<void>("launch_app", { command, args });
}

/** Resolve the home directory absolute path. */
export function homePath(): Promise<string> {
  return invoke<string>("home_path");
}

/** Check whether a path exists. */
export function pathExists(path: string): Promise<boolean> {
  return invoke<boolean>("path_exists", { path });
}
