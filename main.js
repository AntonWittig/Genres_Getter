import { BrowserWindow, app, nativeTheme } from 'electron';

import server from './app';

let mainWindow;

function UpsertKeyValue(obj, keyToChange, value) {
    if (!obj || !keyToChange || !value) {
        return;
    }
    const keyToChangeLower = keyToChange.toLowerCase();
    for (const key of Object.keys(obj)) {
        if (key.toLowerCase() === keyToChangeLower) {
            obj[key] = value;
            return;
        }
    }
    obj[keyToChange] = value;
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false,
        alwaysOnTop: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
        },
        icon: './assets/icon.ico',
    });

    nativeTheme.themeSource = 'system';
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
    mainWindow.loadURL(`http://localhost:${server.PORT}/index.html`);
    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    mainWindow.webContents.session.webRequest.onBeforeRequest(
        (details, callback) => {
            const { requestHeaders } = details;
            UpsertKeyValue(requestHeaders, 'Access-Control-Allow-Origin', ['*']);
            callback({ requestHeaders });
        }
    );
    mainWindow.webContents.session.webRequest.onHeadersReceived(
        (details, callback) => {
            const { responseHeaders } = details;
            UpsertKeyValue(responseHeaders, 'Access-Control-Allow-Origin', ['*']);
            UpsertKeyValue(responseHeaders, 'Access-Control-Allow-Headers', ['*']);
            callback({
                responseHeaders,
            });
        }
    );
}



/**
 * Creates a window for the app when it is activated.
 */
app.on('activate', () => { if (mainWindow === null) createWindow(); });

// app.on('resize', (e, x, y) => { mainWindow.setSize(x, y); });

/**
 * Mimics default OS behaviour, i.e. closing window closes the app except for macOS.
 */
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });


app.on('ready', createWindow);

// TODO events: open-url, 