use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::UNIX_EPOCH;

use crate::models::config::Config;
use crate::models::file_entry::FileEntry;

/// Resolve a path that may start with "~" into an absolute path.
pub fn resolve_path(input: &str) -> PathBuf {
    if input == "~" {
        return dirs::home_dir().unwrap_or_else(|| PathBuf::from("/"));
    }
    if let Some(rest) = input.strip_prefix("~/") {
        if let Some(home) = dirs::home_dir() {
            return home.join(rest);
        }
    }
    PathBuf::from(input)
}

/// List the contents of a directory.
/// Directories are listed first, then files, both alphabetical (case-insensitive).
#[tauri::command]
pub fn list_directory(path: String, show_hidden: bool) -> Result<Vec<FileEntry>, String> {
    let dir = resolve_path(&path);

    let read = fs::read_dir(&dir)
        .map_err(|e| format!("Cannot open '{}': {}", dir.display(), e))?;

    let mut entries: Vec<FileEntry> = Vec::new();

    for item in read {
        let item = match item {
            Ok(i) => i,
            Err(_) => continue, // skip unreadable entries
        };

        let name = item.file_name().to_string_lossy().to_string();

        // Hidden files
        if !show_hidden && name.starts_with('.') {
            continue;
        }

        let path_buf = item.path();
        let metadata = match item.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };

        let is_dir = metadata.is_dir();

        let size = if is_dir { None } else { Some(metadata.len()) };

        let modified = metadata
            .modified()
            .ok()
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_secs());

        let extension = if is_dir {
            None
        } else {
            path_buf
                .extension()
                .map(|e| e.to_string_lossy().to_lowercase())
        };

        entries.push(FileEntry {
            name,
            path: path_buf.to_string_lossy().to_string(),
            is_dir,
            size,
            modified,
            extension,
        });
    }

    // Sort: directories first, then alphabetical case-insensitive
    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(entries)
}

/// Open a file by dispatching to the correct application based on its extension.
/// Falls back to `xdg-open` for any extension not matched by a configured handler.
#[tauri::command]
pub fn open_file(path: String, config: Config) -> Result<(), String> {
    let file_path = resolve_path(&path);

    if !file_path.exists() {
        return Err(format!("File does not exist: {}", file_path.display()));
    }

    let ext = file_path
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    let handlers = &config.media.handlers;

    // Find a matching handler by extension
    let handler = if handlers.video.extensions.contains(&ext) {
        Some(&handlers.video)
    } else if handlers.audio.extensions.contains(&ext) {
        Some(&handlers.audio)
    } else if handlers.image.extensions.contains(&ext) {
        Some(&handlers.image)
    } else {
        None
    };

    match handler {
        Some(h) => {
            let mut cmd = Command::new(&h.command);
            cmd.args(&h.args);
            cmd.arg(&file_path);
            cmd.spawn()
                .map_err(|e| format!("Failed to open with {}: {}", h.command, e))?;
            Ok(())
        }
        None => {
            // Fallback to xdg-open — lets the system decide.
            // If xdg-open itself is missing or has no handler, report it.
            Command::new("xdg-open")
                .arg(&file_path)
                .spawn()
                .map_err(|_| {
                    let label = if ext.is_empty() {
                        "this file".to_string()
                    } else {
                        format!(".{} files", ext)
                    };
                    format!("No application configured for {}", label)
                })?;
            Ok(())
        }
    }
}

/// Check whether a path exists and is accessible.
#[tauri::command]
pub fn path_exists(path: String) -> Result<bool, String> {
    let p = resolve_path(&path);
    Ok(Path::new(&p).exists())
}

/// Return the resolved absolute home directory path (used as the default root).
#[tauri::command]
pub fn home_path() -> Result<String, String> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Cannot determine home directory".to_string())
}
