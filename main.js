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

  // This loads your web app from the 'static' folder
  mainWindow.loadFile(path.join(__dirname, 'static', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
