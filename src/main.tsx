import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import { setUpdateAvailable } from "./lib/updater";
import "./styles.css";

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() { setUpdateAvailable(() => void updateSW(true)); },
});
createRoot(document.getElementById("root")!).render(<App />);
