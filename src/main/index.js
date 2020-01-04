const fs = require('fs');
const path = require('path');
const {app, BrowserWindow, ipcMain} = require('electron');
const minimist = require('minimist');

let testsCode;
let outDir;
let projectPaths;

const setAndValidateOptions = function () {
    const error = message => {
        console.error(message);
        app.quit();
        process.exit(1);
    };

    const argv = minimist(process.argv.slice(2), {default: {outdir: '.'}});

    if (argv._.length === 0 || argv.tests === undefined) {
        error(`Usage: ${process.argv[1]} --tests testsFile [--outdir dir] [projectFile...]`);
    }

    const testsPath = argv.tests;
    outDir = argv.outdir;
    projectPaths = argv._;

    try {
        const stat = fs.statSync(testsPath);
        if (!stat.isFile()) {
            error(`Tests file "${testsPath}" is not a regular file.`);
        }
        testsCode = fs.readFileSync(testsPath, 'utf8');
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
        error(`Tests file does not exist "${testsPath}`);
    }

    try {
        const stat = fs.statSync(outDir);
        if (!stat.isDirectory()) {
            error(`Output directory "${outDir}" is not a directory.`);
        }
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
        error(`Output directory "${outDir}" does not exist.`);
    }

    for (const projectPath of projectPaths) {
        try {
            const stat = fs.statSync(projectPath);
            if (!stat.isFile()) {
                error(`Project file "${projectPath}" is not a regular file.`);
            }
        } catch (err) {
            if (err.code !== 'ENOENT') throw err;
            error(`Project file "${projectPath}" does not exist.`);
        }
    }
};

const runTestsOnProject = async function (projectPath) {
    console.log(`Running tests on "${projectPath}" ...`);

    let resolve;
    const promise = new Promise((rs, _) => {
        resolve = rs;
    });

    const project = fs.readFileSync(projectPath);

    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },
        autoHideMenuBar: true
    });

    win.loadURL(`file://${__dirname}/../renderer/index.html`);

    win.webContents.on('did-finish-load', () => {
        win.webContents.send('runTests', {
            testsCode: testsCode,
            project: project,
            id: projectPath
        });
    });

    win.on('closed', () => {
        console.log();
        resolve();
    });

    return promise;
};

const onTestsDone = function (event, message) {
    const {id, tap13Report, summary, coverage} = message;
    console.log(`Finished running tests on "${id}"`);
    // console.log(summary);
    // console.log(coverage);

    const pathInfo = path.parse(id);
    const outString = `# project: ${pathInfo.base}\n${tap13Report}}`;
    const outPath = path.resolve(outDir, pathInfo.name + '.tap');

    try {
        fs.writeFileSync(outPath, outString);
    } catch (e) {
        error(`Could not write test report "${outPath}".`);
    }
};

const onTestsError = function (event, message) {
    console.error(`Error while running tests on "${message.id}":\n${message.message}`);
};

const main = async function () {
    setAndValidateOptions();

    ipcMain.on('testsDone', onTestsDone);
    ipcMain.on('testsError', onTestsError);

    for (const projectPath of projectPaths) {
        await runTestsOnProject(projectPath);
    }

    app.quit()
};

/* Don't quit when a test run finished. */
app.on('window-all-closed', e => e.preventDefault());
app.on('ready', main);
