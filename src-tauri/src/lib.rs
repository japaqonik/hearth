mod commands;
mod models;

use commands::{
    autostart::{autostart_status, set_autostart},
    filesystem::{
        copy_entry, detect_terminal, home_path, list_directory, move_entry, open_file,
        path_exists, rename_entry, trash_entry,
    },
    launcher::launch_app,
    power::{close_app, minimize_window, shutdown},
    settings::{load_settings, save_settings},
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            launch_app,
            close_app,
            minimize_window,
            shutdown,
            load_settings,
            save_settings,
            list_directory,
            open_file,
            path_exists,
            home_path,
            trash_entry,
            rename_entry,
            copy_entry,
            move_entry,
            detect_terminal,
            autostart_status,
            set_autostart,
        ])
        .run(tauri::generate_context!())
        .expect("error while running hearth");
}
