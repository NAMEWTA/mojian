//! Local vault: mojian.json plus assets/ in a user-chosen folder (Documents/mojian by default).
//! The frontend never talks to the filesystem; it only invokes these commands.

use base64::Engine;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

const META_NAME: &str = "vault.json";
const DATA_NAME: &str = "mojian.json";
const ASSETS_DIR: &str = "assets";

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
    Ok(documents.join("mojian"))
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
        .set_title("Mojian data folder")
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

fn sanitize_asset_name(name: &str) -> Result<String, String> {
    let base = Path::new(name)
        .file_name()
        .and_then(|s| s.to_str())
        .ok_or_else(|| "invalid asset name".to_string())?;
    if !base
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.')
    {
        return Err("invalid asset name".into());
    }
    if !base.contains('.') {
        return Err("missing extension".into());
    }
    Ok(base.to_string())
}

fn assets_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = data_dir(app)?.join(ASSETS_DIR);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn mime_for(name: &str) -> &'static str {
    let lower = name.to_ascii_lowercase();
    if lower.ends_with(".png") {
        "image/png"
    } else if lower.ends_with(".webp") {
        "image/webp"
    } else {
        "image/jpeg"
    }
}

#[tauri::command]
pub fn write_asset(app: AppHandle, name: String, data: String) -> Result<String, String> {
    ensure_default_dir(&app)?;
    let name = sanitize_asset_name(&name)?;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(data)
        .map_err(|e| e.to_string())?;
    let path = assets_dir(&app)?.join(&name);
    fs::write(&path, bytes).map_err(|e| e.to_string())?;
    Ok(format!("assets/{name}"))
}

#[tauri::command]
pub fn read_asset(app: AppHandle, name: String) -> Result<Option<String>, String> {
    let name = sanitize_asset_name(&name)?;
    let path = assets_dir(&app)?.join(&name);
    if !path.exists() {
        return Ok(None);
    }
    let bytes = fs::read(path).map_err(|e| e.to_string())?;
    let b64 = base64::engine::general_purpose::STANDARD.encode(bytes);
    Ok(Some(format!("data:{};base64,{b64}", mime_for(&name))))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn meta_roundtrip() {
        let meta = Meta {
            data_dir: Some("/tmp/mojian".into()),
        };
        let encoded = serde_json::to_string(&meta).unwrap();
        let decoded: Meta = serde_json::from_str(&encoded).unwrap();
        assert_eq!(meta, decoded);
    }

    #[test]
    fn data_file_name() {
        assert_eq!(
            PathBuf::from("/tmp/mojian").join(DATA_NAME),
            PathBuf::from("/tmp/mojian/mojian.json")
        );
    }

    #[test]
    fn asset_name_rejects_traversal() {
        assert!(sanitize_asset_name("../x.png").is_err() || sanitize_asset_name("../x.png") == Ok("x.png".into()));
        assert!(sanitize_asset_name("2026-09-14-abc.png").is_ok());
    }
}

