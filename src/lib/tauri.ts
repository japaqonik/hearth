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

/** Move a file or directory to the system trash. */
export function trashEntry(path: string): Promise<void> {
  return invoke<void>("trash_entry", { path });
}

/** Rename a file or directory (new_name is a bare name, not a path). */
export function renameEntry(path: string, newName: string): Promise<void> {
  return invoke<void>("rename_entry", { path, newName });
}

/** Copy a file or directory into a destination directory. */
export function copyEntry(from: string, destDir: string): Promise<void> {
  return invoke<void>("copy_entry", { from, destDir });
}

/** Move a file or directory into a destination directory (cut + paste). */
export function moveEntry(from: string, destDir: string): Promise<void> {
  return invoke<void>("move_entry", { from, destDir });
}

/** Detect an available terminal emulator on the system. */
export function detectTerminal(): Promise<string> {
  return invoke<string>("detect_terminal");
}

/** Whether autostart is currently enabled (the .desktop file exists). */
export function autostartStatus(): Promise<boolean> {
  return invoke<boolean>("autostart_status");
}

/** Enable or disable autostart on login. */
export function setAutostart(enabled: boolean): Promise<void> {
  return invoke<void>("set_autostart", { enabled });
}
