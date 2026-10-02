import { writable } from "svelte/store";
import { invoke } from "@tauri-apps/api/core";

export interface AppTile {
  name: string;
  command: string;
  args: string[];
  icon: string;
}

export interface MediaHandlerConfig {
  extensions: string[];
  command: string;
  args: string[];
}

export interface Config {
  appearance: {
    theme: string;
    accent_color: string;
    ui_scale: number;
    background_path: string;
  };
  media: {
    media_root: string;
    show_hidden: boolean;
    handlers: {
      video: MediaHandlerConfig;
      audio: MediaHandlerConfig;
      image: MediaHandlerConfig;
    };
  };
  apps: {
    tiles: AppTile[];
  };
  system: {
    autostart: boolean;
    hostname: string;
  };
}

export const DEFAULT_CONFIG: Config = {
  appearance: {
    theme: "dark",
    accent_color: "#e50914",
    ui_scale: 1.0,
    background_path: "",
  },
  media: {
    media_root: "~",
    show_hidden: false,
    handlers: {
      video: {
        extensions: ["mkv", "mp4", "avi", "mov", "m4v", "ts", "iso", "webm"],
        command: "vlc",
        args: ["--fullscreen", "--play-and-exit"],
      },
      audio: {
        extensions: ["mp3", "flac", "ogg", "aac", "wav", "m4a", "opus"],
        command: "vlc",
        args: [],
      },
      image: {
        extensions: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"],
        command: "eog",
        args: [],
      },
    },
  },
  apps: {
    tiles: [
      { name: "Browser",  command: "chromium",        args: ["--start-maximized"], icon: "globe" },
      { name: "Files",    command: "__filemanager__",  args: [],                   icon: "folder-open" },
      { name: "Settings", command: "__settings__",     args: [],                   icon: "settings" },
    ],
  },
  system: {
    autostart: false,
    hostname: "",
  },
};

function createSettings() {
  const { subscribe, set, update } = writable<Config>(DEFAULT_CONFIG);

  return {
    subscribe,
    async load() {
      try {
        const config = await invoke<Config>("load_settings");
        set(config);
      } catch (e) {
        console.warn("Could not load settings, using defaults:", e);
        set(DEFAULT_CONFIG);
      }
    },
    async save(config: Config) {
      try {
        await invoke("save_settings", { config });
        set(config);
      } catch (e) {
        console.error("Could not save settings:", e);
      }
    },
    update,
  };
}

export const settings = createSettings();
