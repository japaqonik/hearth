// Prevents additional console window on Windows
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // On Linux, WebKitGTK's DMABUF renderer causes severe rendering corruption
    // (horizontal-stripe artifacts) on some GPUs — notably the Raspberry Pi's
    // VideoCore. Disabling it forces a stable rendering path. Only set if the
    // user hasn't already configured it, so an explicit override still wins.
    #[cfg(target_os = "linux")]
    {
        if std::env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none() {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
    }

    hearth_lib::run()
}
