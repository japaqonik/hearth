/// Power stub — no-op for Phase 1.
/// Will be replaced with suspend/shutdown/reboot in a later project.
#[tauri::command]
pub fn power_action() -> Result<(), String> {
    Ok(())
}
