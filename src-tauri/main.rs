fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sqlite::init())
        .build()
        .run();
}
