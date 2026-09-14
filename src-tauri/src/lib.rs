mod vault;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            vault::pick_directory,
            vault::get_data_dir,
            vault::read_data,
            vault::write_data,
            vault::write_asset,
            vault::read_asset,
        ])
        .setup(|app| {
            vault::ensure_default_dir(app.handle()).map_err(std::io::Error::other)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to start Mojian");
}
