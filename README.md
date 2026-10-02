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
- **Phase 2** — File manager: directory browsing, media playback
- **Phase 3** — Settings panel, file operations, background picker
- **Phase 4** — Polish, thumbnails, autostart, .deb packaging

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Arrow keys | Navigate tiles / file list |
| Enter | Activate tile / open file |
| Escape | Go back / close overlay |
| Backspace | Go up one directory (file manager) |
| M | Toggle options bar (file manager, Phase 3) |
