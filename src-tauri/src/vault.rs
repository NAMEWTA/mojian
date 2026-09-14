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
    #[serde(default)]
    backup_dir: Option<String>,
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

fn backup_dir(app: &AppHandle) -> Result<PathBuf, String> {
    if let Some(dir) = read_meta(app).backup_dir.filter(|s| !s.is_empty()) {
        return Ok(PathBuf::from(dir));
    }
    Ok(data_dir(app)?.join("backups"))
}

fn is_backup_name(name: &str) -> bool {
    let base = Path::new(name)
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("");
    if base != name {
        return false;
    }
    let Some(stem) = base.strip_suffix(".json") else {
        return false;
    };
    let Some(rest) = stem.strip_prefix("mojian-backup-") else {
        return false;
    };
    rest.len() >= 17 && rest.chars().all(|c| c.is_ascii_digit() || c == '-')
}

#[derive(Debug, Serialize)]
pub struct BackupFileInfo {
    pub name: String,
    pub size: u64,
    pub mtime: i64,
}

fn backup_info(path: &Path) -> Result<BackupFileInfo, String> {
    let meta = fs::metadata(path).map_err(|e| e.to_string())?;
    let mtime = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0);
    Ok(BackupFileInfo {
        name: path
            .file_name()
            .map(|s| s.to_string_lossy().into_owned())
            .unwrap_or_default(),
        size: meta.len(),
        mtime,
    })
}

fn backup_path(app: &AppHandle, name: &str) -> Result<PathBuf, String> {
    if !is_backup_name(name) {
        return Err("invalid backup name".into());
    }
    let dir = backup_dir(app)?;
    let path = dir.join(name);
    if path.parent() != Some(dir.as_path()) {
        return Err("invalid backup name".into());
    }
    Ok(path)
}

#[tauri::command]
pub fn get_backup_dir(app: AppHandle) -> Result<String, String> {
    ensure_default_dir(&app)?;
    let dir = backup_dir(&app)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn pick_backup_dir(app: AppHandle) -> Result<Option<String>, String> {
    let picked = app
        .dialog()
        .file()
        .set_title("Mojian backup folder")
        .blocking_pick_folder();
    let Some(folder) = picked else {
        return Ok(None);
    };
    let dir = folder.to_string();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let mut meta = read_meta(&app);
    meta.backup_dir = Some(dir.clone());
    write_meta(&app, &meta)?;
    Ok(Some(dir))
}

#[tauri::command]
pub fn write_backup(app: AppHandle, name: String, json: String) -> Result<BackupFileInfo, String> {
    ensure_default_dir(&app)?;
    let path = backup_path(&app, &name)?;
    atomic_write(&path, &json)?;
    backup_info(&path)
}

#[tauri::command]
pub fn list_backups(app: AppHandle) -> Result<Vec<BackupFileInfo>, String> {
    ensure_default_dir(&app)?;
    let dir = backup_dir(&app)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let mut rows = Vec::new();
    let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let Some(name) = path.file_name().and_then(|s| s.to_str()) else {
            continue;
        };
        if !is_backup_name(name) {
            continue;
        }
        if let Ok(info) = backup_info(&path) {
            rows.push(info);
        }
    }
    rows.sort_by(|a, b| b.mtime.cmp(&a.mtime).then_with(|| b.name.cmp(&a.name)));
    Ok(rows)
}

#[tauri::command]
pub fn read_backup(app: AppHandle, name: String) -> Result<String, String> {
    let path = backup_path(&app, &name)?;
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_backup(app: AppHandle, name: String) -> Result<(), String> {
    let path = backup_path(&app, &name)?;
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn meta_roundtrip() {
        let meta = Meta {
            data_dir: Some("/tmp/mojian".into()),
            backup_dir: Some("/tmp/mojian-backups".into()),
        };
        let encoded = serde_json::to_string(&meta).unwrap();
        let decoded: Meta = serde_json::from_str(&encoded).unwrap();
        assert_eq!(meta, decoded);
    }

    #[test]
    fn old_meta_without_backup_dir() {
        let decoded: Meta = serde_json::from_str(r#"{"data_dir":"/tmp/mojian"}"#).unwrap();
        assert_eq!(decoded.backup_dir, None);
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
        assert!(
            sanitize_asset_name("../x.png").is_err()
                || sanitize_asset_name("../x.png") == Ok("x.png".into())
        );
        assert!(sanitize_asset_name("2026-09-14-abc.png").is_ok());
    }

    #[test]
    fn backup_name_accepts_stamp_and_rejects_paths() {
        assert!(is_backup_name("mojian-backup-2026-09-14-142533.json"));
        assert!(is_backup_name("mojian-backup-2026-09-14-142533-2.json"));
        assert!(!is_backup_name("../mojian-backup-2026-09-14-142533.json"));
        assert!(!is_backup_name("mojian.json"));
        assert!(!is_backup_name("notes.txt"));
    }
}

