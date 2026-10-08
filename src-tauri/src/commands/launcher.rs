use std::process::Command;

/// Shell-quote a single argument for safe inclusion in a `sh -c` string.
/// Wraps in single quotes and escapes any embedded single quotes.
fn shell_quote(arg: &str) -> String {
    format!("'{}'", arg.replace('\'', r"'\''"))
}

/// Launch an external application. Fire-and-forget — does not wait for it to exit.
///
/// On Linux the command is run through the user's shell (`sh -c`) so that PATH
/// lookup, scripts, and shell semantics behave the same way a desktop `.desktop`
/// launcher would. This avoids `ExecFormatError` for scripts and resolves bare
/// command names via PATH.
#[tauri::command]
pub fn launch_app(command: String, args: Vec<String>) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        // Build a single shell command line: command + quoted args.
        let mut line = shell_quote(&command);
        for a in &args {
            line.push(' ');
            line.push_str(&shell_quote(a));
        }

        Command::new("sh")
            .arg("-c")
            // `exec` replaces the shell with the target so we don't leave an
            // extra shell process hanging around.
            .arg(format!("exec {}", line))
            .spawn()
            .map_err(|e| format!("Failed to launch '{}': {}", command, e))?;
        return Ok(());
    }

    #[cfg(not(target_os = "linux"))]
    {
        Command::new(&command)
            .args(&args)
            .spawn()
            .map_err(|e| format!("Failed to launch '{}': {}", command, e))?;
        Ok(())
    }
}
