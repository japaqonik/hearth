use std::fs;
use std::path::PathBuf;

/// Path to the autostart .desktop file: ~/.config/autostart/hearth.desktop
fn autostart_file() -> Result<PathBuf, String> {
    let base = dirs::config_dir()
        .ok_or_else(|| "Cannot find config directory".to_string())?;
    Ok(base.join("autostart").join("hearth.desktop"))
}

/// Return whether autostart is currently enabled (the .desktop file exists).
#[tauri::command]
pub fn autostart_status() -> Result<bool, String> {
    let path = autostart_file()?;
    Ok(path.exists())
}

/// Enable or disable autostart by creating/removing the XDG autostart .desktop file.
/// The Exec path is resolved to the currently running executable so it works in
/// both development and installed scenarios.
#[tauri::command]
pub fn set_autostart(enabled: bool) -> Result<(), String> {
    let path = autostart_file()?;

    if !enabled {
        if path.exists() {
            fs::remove_file(&path).map_err(|e| format!("Failed to disable autostart: {}", e))?;
        }
        return Ok(());
    }

    // Resolve the absolute path of the current executable
    let exe = std::env::current_exe()
        .map_err(|e| format!("Cannot determine executable path: {}", e))?;
    let exe_str = exe.to_string_lossy();

    // Ensure the autostart directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create autostart dir: {}", e))?;
    }

    let contents = format!(
        "[Desktop Entry]\n\
         Type=Application\n\
         Name=Hearth\n\
         Comment=Media center launcher\n\
         Exec={}\n\
         Terminal=false\n\
         X-GNOME-Autostart-enabled=true\n",
        exe_str
    );

    fs::write(&path, contents).map_err(|e| format!("Failed to write autostart file: {}", e))
}
