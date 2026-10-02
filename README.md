# Hearth

A fullscreen media center launcher for Linux, designed for TV use with keyboard/remote navigation. No mouse required.

Built with [Tauri 2](https://tauri.app) (Rust backend) + [Svelte 5](https://svelte.dev) (frontend) running on WebKitGTK.

## Features

- Fullscreen app launcher with keyboard navigation
- Embedded file manager for browsing and playing media
- Launches browser, media player, and any configured application
- Dark TV-optimized UI with configurable accent color
- Config stored in `~/.config/hearth/config.toml`

## Requirements

- Linux with Wayland or X11
- WebKitGTK 4.1

## Building from source

### Prerequisites

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# System libraries (Debian/Ubuntu)
sudo apt install -y build-essential libwebkit2gtk-4.1-dev \
  libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

# Tauri CLI
cargo install tauri-cli --version "^2"
```

### Run in development

```bash
npm install
cargo tauri dev
```

### Build for production

```bash
cargo tauri build
# Output: src-tauri/target/release/bundle/deb/hearth_*.deb
```

## Project Structure

```
src/                    Svelte frontend
  components/           UI components (Topbar, AppTile, AppGrid, ...)
  views/                Full views (HomeScreen, FileManager, Settings)
  stores/               Svelte stores (navigation, settings)
src-tauri/              Rust backend
  src/commands/         Tauri commands (launcher, filesystem, settings, power)
  src/models/           Shared data types (Config, FileEntry, ...)
SPEC.md                 Full implementation specification
```

## Implementation Phases

- **Phase 1** ✅ — Core shell: app grid, keyboard nav, launch apps, config
- **Phase 2** ✅ — File manager: directory browsing, media playback
- **Phase 3** — Settings panel, background picker *(file operations ✅ done)*
- **Phase 4** — Polish, thumbnails, autostart, .deb packaging

### File manager (complete for now)

The file manager supports:
- Browsing from the home directory, folders listed first
- Opening media (video/audio via VLC, images and other files via the system default)
- Copy, cut, paste (with automatic rename on collision)
- Rename
- Delete to the system trash (XDG trash — restore/empty via a terminal or system tools)
- Toggle hidden files

Deferred for later (see SPEC.md): in-app trash view, copy/move progress bar.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Arrow keys | Navigate tiles / file list |
| Enter | Activate tile / open file |
| Escape | Go back / close overlay |
| Backspace | Go up one directory (file manager) |
| M | Toggle options bar (file manager) |

In the file manager options bar (press `M`):

| Key | Action |
|-----|--------|
| H | Toggle hidden files |
| C | Copy |
| X | Cut |
| V | Paste |
| R | Rename |
| Del | Delete to trash |
| Esc | Close options bar |
