const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    // Set the SVG icon (make sure the filename matches what is in your static folder)
    icon: path.join(__dirname, 'static', 'favicon.png'), 
    webPreferences: {
      nodeIntegration: true
    }
  });

  // Remove the top menu (File, Edit, etc.)
  Menu.setApplicationMenu(null);

  // This loads web app from the 'static' folder
  mainWindow.loadFile(path.join(__dirname, 'static', 'index.html'));

  // ALLOWS DOCUMENT PiP WINDOWS TO OPEN 
  mainWindow.webContents.setWindowOpenHandler((details) => {
      // This allows the website's native Document PiP API to spawn its window
      return { action: 'allow' }; 
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
