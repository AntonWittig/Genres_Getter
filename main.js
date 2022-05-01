const { app, BrowserWindow } = require("electron");

const server = require("./app");

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
        width: 1200,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    mainWindow.loadURL("http://localhost:8383");
    mainWindow.on("closed", function() {
        mainWindow = null;
    });

    mainWindow.webContents.session.webRequest.onBeforeRequest(
        (details, callback) => {
            const { requestHeaders } = details;
            UpsertKeyValue(requestHeaders, "Access-Control-Allow-Origin", ["*"]);
            callback({ requestHeaders });
        }
    );
    mainWindow.webContents.session.webRequest.onHeadersReceived(
        (details, callback) => {
            const { responseHeaders } = details;
            UpsertKeyValue(responseHeaders, "Access-Control-Allow-Origin", ["*"]);
            UpsertKeyValue(responseHeaders, "Access-Control-Allow-Headers", ["*"]);
            callback({
                responseHeaders,
            });
        }
    );
}

app.on("ready", createWindow);

app.on("resize", function(e, x, y) {
    mainWindow.setSize(x, y);
});

app.on("window-all-closed", function() {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", function() {
    if (mainWindow === null) {
        createWindow();
    }
});