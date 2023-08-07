import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./styles.css";

// Entry point of your Tauri app
function TauriApp() {
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <TauriApp />
);
