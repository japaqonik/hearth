use std::process::Command;
use tauri::AppHandle;

/// Close the application.
#[tauri::command]
pub fn close_app(app: AppHandle) {
    app.exit(0);
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
