import { writable, derived } from "svelte/store";
import { invoke } from "@tauri-apps/api/core";
import type { Keymap } from "../lib/keyboard";
import { DEFAULT_KEYMAP } from "../lib/keyboard";

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
    terminal: string;
  };
  controls: {
    keymap: Partial<Keymap>;
  };
}

export const DEFAULT_CONFIG: Config = {
  appearance: {
    theme: "dark",
    accent_color: "#2dd4bf",
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
        command: "xdg-open",
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
    terminal: "xterm",
  },
  controls: {
    keymap: {},
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

/**
 * The active keymap: configured overrides merged over the built-in defaults.
 * Any action not present in config falls back to DEFAULT_KEYMAP.
 */
export const effectiveKeymap = derived(settings, ($settings): Keymap => {
  const configured = $settings.controls?.keymap ?? {};
  const merged = { ...DEFAULT_KEYMAP };
  for (const action of Object.keys(DEFAULT_KEYMAP) as (keyof Keymap)[]) {
    const override = configured[action];
    if (override && override.length > 0) {
      merged[action] = override;
    }
  }
  return merged;
});

