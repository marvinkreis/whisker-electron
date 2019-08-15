const fs = require('fs');
const path = require('path');
const {app, BrowserWindow, ipcMain} = require('electron');
const minimist = require('minimist');

class Main {
  constructor (testsPath, projectPaths, outdir) {
    this.testsCode = fs.readFileSync(testsPath, 'utf8');
    this.projectPaths = projectPaths;
    this.outdir = outdir;
    ipcMain.on('testsDone', this.onTestsDone.bind(this))
  }

  async runTests () {
    for (const projectPath of this.projectPaths) {
      await this.runTestsOnProject(projectPath);
    }
  }

  async runTestsOnProject (projectPath) {
    process.stdout.write(`Running tests on ${projectPath} ...`);

    let resolve;
    const promise = new Promise((rs, rj) => {
      resolve = rs;
    });

    const project = fs.readFileSync(projectPath);

    const window = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true
      },
      autoHideMenuBar: true
    });

    window.loadURL(`file://${__dirname}/../../static/index.html`);

    window.webContents.on('did-finish-load', () => {
      window.webContents.send('runTests', {
        testsCode: this.testsCode,
        project: project,
        id: projectPath
      });
    });

    window.on('closed', () => {
      process.stdout.write(' done\n');
      resolve();
    });

    return promise;
  }

  onTestsDone (event, message) {
    let {id, tap13Report} = message;
    const parse = path.parse(id);
    console.log(parse);
    tap13Report = [`# project: ${parse.base}`, tap13Report].join('\n');
    const outpath = path.resolve(this.outdir, parse.name + '.tap');
    fs.writeFileSync(outpath, tap13Report);
  }
}

/* Don't quit when a test run finished. */
app.on('window-all-closed', e => e.preventDefault());

app.on('ready', async () => {
  const argv = minimist(process.argv.slice(2));

  if (argv._.length < 2) {
    console.error(`Usage: ${process.argv[1]} --tests testsFile [--outdir dir] [projectFile...]`);
    app.quit();
    process.exit(1);
  }

  const projectPaths = argv._;

  let testsPath;
  if (argv.tests !== undefined) {
    testsPath = argv.tests;
  } else {
    console.error(`Usage: ${process.argv[1]} --tests testsFile [--outdir dir] [projectFile...]`);
    app.quit();
    process.exit(1);
  }

  let outdir = '.';
  if (argv.outdir !== undefined) {
    outdir = argv.outdir;
  }

  const main = new Main(testsPath, projectPaths, outdir);
  await main.runTests();
  app.quit()
});

