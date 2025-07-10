import { app, BrowserWindow } from "electron";
import path from "node:path";
import os from "node:os";

import { registerRoute } from "lib/electron-router-dom";
import { setupIpcHandlers, cleanupDatabase } from "./ipcHandlers";

async function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 670,
    fullscreenable: true,
    show: false,
    resizable: true,
    alwaysOnTop: false,
    focusable: true,
    webPreferences: {
      nodeIntegration: true, // Enable Node.js integration
      contextIsolation: false, // WARNING: Disabling contextIsolation is not recommended for production builds due to security risks.
      webSecurity: true, // Keep webSecurity enabled by default when nodeIntegration is true
    },
  });

  registerRoute({
    id: "main",
    browserWindow: mainWindow,
    htmlFile: path.join(__dirname, "../renderer/index.html"),
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();

    // Open DevTools in development mode to see console logs
    if (process.env.NODE_ENV === "development") {
      mainWindow.webContents.openDevTools();
    }
  });
}

// Set app user data path to avoid cache permission issues
app.setPath("userData", path.join(os.tmpdir(), "electron-app-data"));

// Add command line switches to reduce cache-related errors
app.commandLine.appendSwitch("--disable-gpu-sandbox");
app.commandLine.appendSwitch("--disable-software-rasterizer");
app.commandLine.appendSwitch("--disable-gpu");

app.whenReady().then(() => {
  setupIpcHandlers();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  await cleanupDatabase();
});
