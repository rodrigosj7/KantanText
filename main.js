const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const applicationMenu = require('./src/components/menu');
const path = require('path');
const fs = require('fs');

let mainWindow;
let file = {
  name: '',
  content: '',
  saved: false,
  path: ''
};

function createNewFile() {
  file = {
    name: 'untitled.md',
    content: '',
    saved: false,
    path: app.getPath('documents') + '/untitled.md'
  };

  mainWindow.webContents.send('set-file', file)
}

function writeFile(filePath) {
  try {
    fs.writeFile(filePath, file.content, (error) => {
      if (error) throw error;

      file = {
        ...file,
        path: filePath,
        saved: true,
        name: path.basename(filePath)
      }

      mainWindow.webContents.send('set-file', file);
    })
  } catch (e) {
    dialog.showErrorBox('Error', e);
  }
}

async function saveFileAs() {
  let dialogFile = await dialog.showSaveDialog({ defaultPath: file.path });

  if (dialogFile.canceled) return false;

  writeFile(dialogFile.filePath);
}

function saveFile() {
  return file.saved ? writeFile(file.path) : saveFileAs();
}

const readFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return '';
  }
}

async function openFile() {
  let dialogFile = await dialog.showOpenDialog({ defaultPath: file.path });

  if (dialogFile.canceled) return false;

  file = {
    name: path.basename(dialogFile.filePaths[0]),
    content: readFile(dialogFile.filePaths[0]),
    saved: true,
    path: dialogFile.filePaths[0]
  };

  mainWindow.webContents.send('set-file', file);
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'public/logo.png')
  });

  await mainWindow.loadFile('src/pages/editor/index.html');

  createNewFile();

  ipcMain.on('update-content', (__, data) => {
    file.content = data;
  })
}

const fileMenu = {
  label: 'File',
  submenu: [
    {
      label: 'New file', accelerator: 'CmdOrCtrl+N',
      click() { createNewFile() }
    },
    {
      label: 'Open file', accelerator: 'CmdOrCtrl+O',
      click() { openFile() }
    },
    {
      label: 'Save file', accelerator: 'CmdOrCtrl+S',
      click() { saveFile() }
    },
    {
      label: 'Save file as', accelerator: 'CmdOrCtrl+Shift+S',
      click() { saveFileAs() }
    },
    {
      label: 'Close',
      role: process.platform === 'darwin' ? 'close' : 'quit'
    }
  ],
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(applicationMenu(fileMenu));
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
})