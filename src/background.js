'use strict'

import { app, protocol, BrowserWindow, ipcMain, screen, Tray, Menu, powerMonitor, nativeImage } from 'electron'
import { autoUpdater } from 'electron-updater'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
import { join } from 'path'
import { existsSync, copyFileSync } from 'fs'
import { execSync, fork } from 'child_process'
import _, { range, map } from 'lodash'
import Store from './Store'

const isDevelopment = process.env.NODE_ENV !== 'production'
const isWin = process.platform === 'win32'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let tray
let store

let screenCaptor

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])

function loadSettings() {
  const settingsPath = join(app.getPath('userData'), 'settings.json')
  if (!existsSync(settingsPath)) {
    copyFileSync(join(__static, 'settings.json'), settingsPath) // eslint-disable-line no-undef
  }
  store = new Store()
}

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    webPreferences: { nodeIntegration: true },
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true
  })
  win.setIgnoreMouseEvents(true)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    // if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  loadSettings()

  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    try {
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }

  } else if (store.get('autoUpdate')) {
    autoUpdater.checkForUpdatesAndNotify()
  }

  tray = new Tray(nativeImage.createFromPath(join(__static, 'favicon.png')).resize({ width: 16, height: 16 })) // eslint-disable-line no-undef
  const contextMenu = Menu.buildFromTemplate([
    { role: 'quit' }
  ])
  tray.setToolTip('Am I Online?')
  tray.setContextMenu(contextMenu)

  powerMonitor.on('lock-screen', () => {
    win.webContents.send('suspend')
  })

  powerMonitor.on('unlock-screen', () => {
    win.webContents.send('resume')
  })

  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (isWin) {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

ipcMain.on('set-window', (event, { offsetWidth, offsetHeight }) => {
  const { width } = screen.getPrimaryDisplay().workAreaSize
  win.setBounds({ x: width - offsetWidth, y: 0, width: offsetWidth, height: offsetHeight })
  screenCaptor = null
  event.reply('window-is-ready')
})

ipcMain.on('get-avg-color', event => {
  // if (!screenCaptor?.connected) {
  if (!(screenCaptor || {}).connected) {
    if (isWin && execSync('tasklist /fi "imagename eq consent.exe').toString().includes('=')) {
      return
    }
    screenCaptor = fork(
      join(__static, 'screenCaptor'), // eslint-disable-line no-undef
      Object.values(win.getBounds()),
      { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] }
    )
    screenCaptor.on('message', colors => {
      event.reply('reply-avg-color', map(range(3), i =>
        Math.round(
          _(colors)
            .map(color =>
              map(color.match(/.{2}/g), c => parseInt(c, 16))
            )
            .meanBy(i)
        )
      ))
    })
  }
  screenCaptor.send(null)
})
