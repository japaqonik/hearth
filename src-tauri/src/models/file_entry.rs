use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: Option<u64>,     // None for directories
    pub modified: Option<u64>, // Unix timestamp (seconds)
    pub extension: Option<String>,
}
