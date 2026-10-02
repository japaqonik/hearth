mod commands;
mod models;

use commands::{
    filesystem::{home_path, list_directory, open_file, path_exists},
    launcher::launch_app,
    power::{close_app, shutdown_stub},
    settings::{load_settings, save_settings},
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            launch_app,
            close_app,
            shutdown_stub,
            load_settings,
            save_settings,
            list_directory,
            open_file,
            path_exists,
            home_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running hearth");
}
