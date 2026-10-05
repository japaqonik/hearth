use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppearanceConfig {
    pub theme: String,
    pub accent_color: String,
    pub ui_scale: f32,
    pub background_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaHandlerConfig {
    pub extensions: Vec<String>,
    pub command: String,
    pub args: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaHandlers {
    pub video: MediaHandlerConfig,
    pub audio: MediaHandlerConfig,
    pub image: MediaHandlerConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaConfig {
    pub media_root: String,
    pub show_hidden: bool,
    pub handlers: MediaHandlers,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppTile {
    pub name: String,
    pub command: String,
    pub args: Vec<String>,
    pub icon: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppsConfig {
    pub tiles: Vec<AppTile>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemConfig {
    pub autostart: bool,
    pub hostname: String,
    #[serde(default = "default_terminal")]
    pub terminal: String,
}

fn default_terminal() -> String {
    "xterm".into()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ControlsConfig {
    /// Maps a logical action name to one or more physical key names.
    /// Empty = frontend uses its built-in defaults.
    #[serde(default)]
    pub keymap: HashMap<String, Vec<String>>,
}

impl Default for ControlsConfig {
    fn default() -> Self {
        ControlsConfig {
            keymap: HashMap::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub appearance: AppearanceConfig,
    pub media: MediaConfig,
    pub apps: AppsConfig,
    pub system: SystemConfig,
    #[serde(default)]
    pub controls: ControlsConfig,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            appearance: AppearanceConfig {
                theme: "dark".into(),
                accent_color: "#e50914".into(),
                ui_scale: 1.0,
                background_path: "".into(),
            },
            media: MediaConfig {
                media_root: "~".into(),
                show_hidden: false,
                handlers: MediaHandlers {
                    video: MediaHandlerConfig {
                        extensions: vec![
                            "mkv".into(), "mp4".into(), "avi".into(), "mov".into(),
                            "m4v".into(), "ts".into(),  "iso".into(), "webm".into(),
                        ],
                        command: "vlc".into(),
                        args: vec!["--fullscreen".into(), "--play-and-exit".into()],
                    },
                    audio: MediaHandlerConfig {
                        extensions: vec![
                            "mp3".into(), "flac".into(), "ogg".into(), "aac".into(),
                            "wav".into(), "m4a".into(), "opus".into(),
                        ],
                        command: "vlc".into(),
                        args: vec![],
                    },
                    image: MediaHandlerConfig {
                        extensions: vec![
                            "jpg".into(), "jpeg".into(), "png".into(), "gif".into(),
                            "webp".into(), "bmp".into(), "tiff".into(),
                        ],
                        command: "xdg-open".into(),
                        args: vec![],
                    },
                },
            },
            apps: AppsConfig {
                tiles: vec![
                    AppTile {
                        name: "Browser".into(),
                        command: "chromium".into(),
                        args: vec!["--start-maximized".into()],
                        icon: "globe".into(),
                    },
                    AppTile {
                        name: "Files".into(),
                        command: "__filemanager__".into(),
                        args: vec![],
                        icon: "folder-open".into(),
                    },
                    AppTile {
                        name: "Settings".into(),
                        command: "__settings__".into(),
                        args: vec![],
                        icon: "settings".into(),
                    },
                ],
            },
            system: SystemConfig {
                autostart: false,
                hostname: "".into(),
                terminal: default_terminal(),
            },
            controls: ControlsConfig::default(),
        }
    }
}
