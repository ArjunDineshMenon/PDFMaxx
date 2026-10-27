const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'PDFMaxx — 31-Tool PDF Converter, Editor & AI Suite',
    autoHideMenuBar: true,
    backgroundColor: '#090D16',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the modular src/index.html for easy VS Code editing
  const srcHtml = path.join(__dirname, '..', 'src', 'index.html');
  win.loadFile(srcHtml);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
