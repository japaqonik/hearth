use std::process::Command;

/// Launch an external application. Fire-and-forget — does not wait for it to exit.
#[tauri::command]
pub fn launch_app(command: String, args: Vec<String>) -> Result<(), String> {
    Command::new(&command)
        .args(&args)
        // Detach from our process group so the child outlives us if needed
        .spawn()
        .map_err(|e| format!("Failed to launch '{}': {}", command, e))?;
    Ok(())
}
