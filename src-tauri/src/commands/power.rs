use tauri::AppHandle;

/// Close the application.
#[tauri::command]
pub fn close_app(app: AppHandle) {
    app.exit(0);
}

/// Power stub — no-op for now.
/// Will be replaced with suspend/shutdown/reboot in a later project.
#[tauri::command]
pub fn shutdown_stub() -> Result<(), String> {
    Ok(())
}
