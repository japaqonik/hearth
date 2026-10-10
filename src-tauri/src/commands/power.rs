use std::process::Command;
use tauri::{AppHandle, Manager};

/// Close the application.
#[tauri::command]
pub fn close_app(app: AppHandle) {
    app.exit(0);
}

/// Minimize the main window — drops to the desktop without quitting Hearth.
#[tauri::command]
pub fn minimize_window(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;
    window
        .minimize()
        .map_err(|e| format!("Failed to minimize: {}", e))
}

/// Power off the system.
/// Uses `systemctl poweroff`, which on a local session with logind/polkit
/// normally succeeds without a password. Returns an error string on failure
/// so the frontend can surface it.
#[tauri::command]
pub fn shutdown() -> Result<(), String> {
    let status = Command::new("systemctl")
        .arg("poweroff")
        .status()
        .map_err(|e| format!("Failed to run systemctl: {}", e))?;

    if status.success() {
        Ok(())
    } else {
        Err(format!(
            "systemctl poweroff exited with status {}",
            status.code().unwrap_or(-1)
        ))
    }
}

/// Reboot the system via `systemctl reboot`. Same privilege considerations as
/// `shutdown`.
#[tauri::command]
pub fn restart() -> Result<(), String> {
    let status = Command::new("systemctl")
        .arg("reboot")
        .status()
        .map_err(|e| format!("Failed to run systemctl: {}", e))?;

    if status.success() {
        Ok(())
    } else {
        Err(format!(
            "systemctl reboot exited with status {}",
            status.code().unwrap_or(-1)
        ))
    }
}
