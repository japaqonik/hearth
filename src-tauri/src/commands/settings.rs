use std::fs;
use std::path::PathBuf;
use crate::models::config::Config;

fn config_path() -> Result<PathBuf, String> {
    let base = dirs::config_dir()
        .ok_or_else(|| "Cannot find config directory".to_string())?;
    Ok(base.join("pi-launcher").join("config.toml"))
}

#[tauri::command]
pub fn load_settings() -> Result<Config, String> {
    let path = config_path()?;

    if !path.exists() {
        // Return defaults — file will be created on first save
        return Ok(Config::default());
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read config: {}", e))?;

    toml::from_str(&content)
        .map_err(|e| format!("Failed to parse config: {}", e))
}

#[tauri::command]
pub fn save_settings(config: Config) -> Result<(), String> {
    let path = config_path()?;

    // Ensure directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config dir: {}", e))?;
    }

    let content = toml::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&path, content)
        .map_err(|e| format!("Failed to write config: {}", e))
}
