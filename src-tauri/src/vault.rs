//! Local vault: one JSON file in a user-chosen folder (Documents/墨笺 by default).
//! The frontend never talks to the filesystem; it only invokes these commands.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

const META_NAME: &str = "vault.json";
const DATA_NAME: &str = "mojian.json";

#[derive(Debug, Default, Serialize, Deserialize, PartialEq, Eq)]
struct Meta {
    data_dir: Option<String>,
}

fn meta_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("app config dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(META_NAME))
}

fn default_library(app: &AppHandle) -> Result<PathBuf, String> {
    let documents = app
        .path()
        .document_dir()
        .map_err(|e| format!("documents dir: {e}"))?;
    Ok(documents.join("墨笺"))
}

fn read_meta(app: &AppHandle) -> Meta {
    let Ok(path) = meta_path(app) else {
        return Meta::default();
    };
    fs::read_to_string(path)
        .ok()
        .and_then(|text| serde_json::from_str(&text).ok())
        .unwrap_or_default()
}

fn write_meta(app: &AppHandle, meta: &Meta) -> Result<(), String> {
    let path = meta_path(app)?;
    let json = serde_json::to_string_pretty(meta).map_err(|e| e.to_string())?;
    fs::write(path, format!("{json}\n")).map_err(|e| e.to_string())
}

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    if let Some(dir) = read_meta(app).data_dir.filter(|s| !s.is_empty()) {
        return Ok(PathBuf::from(dir));
    }
    default_library(app)
}

fn data_file(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(data_dir(app)?.join(DATA_NAME))
}

fn atomic_write(path: &Path, contents: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, contents).map_err(|e| e.to_string())?;
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    fs::rename(&tmp, path).map_err(|e| e.to_string())
}

pub fn ensure_default_dir(app: &AppHandle) -> Result<(), String> {
    let dir = data_dir(app)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    if read_meta(app).data_dir.is_none() {
        write_meta(
            app,
            &Meta {
                data_dir: Some(dir.to_string_lossy().into_owned()),
            },
        )?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_data_dir(app: AppHandle) -> Result<String, String> {
    ensure_default_dir(&app)?;
    Ok(data_dir(&app)?.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn pick_directory(app: AppHandle) -> Result<Option<String>, String> {
    let picked = app
        .dialog()
        .file()
        .set_title("选择墨笺数据文件夹")
        .blocking_pick_folder();
    let Some(folder) = picked else {
        return Ok(None);
    };
    let dir = folder.to_string();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    write_meta(
        &app,
        &Meta {
            data_dir: Some(dir.clone()),
        },
    )?;
    Ok(Some(dir))
}

#[tauri::command]
pub fn read_data(app: AppHandle) -> Result<Option<String>, String> {
    ensure_default_dir(&app)?;
    let file = data_file(&app)?;
    if !file.exists() {
        return Ok(None);
    }
    fs::read_to_string(file)
        .map(Some)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_data(app: AppHandle, json: String) -> Result<(), String> {
    ensure_default_dir(&app)?;
    atomic_write(&data_file(&app)?, &json)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn meta_roundtrip() {
        let meta = Meta {
            data_dir: Some("/tmp/墨笺".into()),
        };
        let encoded = serde_json::to_string(&meta).unwrap();
        let decoded: Meta = serde_json::from_str(&encoded).unwrap();
        assert_eq!(meta, decoded);
    }

    #[test]
    fn data_file_name() {
        assert_eq!(
            PathBuf::from("/tmp/墨笺").join(DATA_NAME),
            PathBuf::from("/tmp/墨笺/mojian.json")
        );
    }
}
