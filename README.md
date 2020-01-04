## Building Whisker Electron

```bash
# Clone whisker-main and whisker-electron in the same directory

git clone https://github.com/se2p/whisker-main
git clone https://github.com/marvinkreis/whisker-electron

# Install dependencies and build both projects
# Use 'npm run build:prod' for production build

cd whisker-main
npm install
npm run build
cd ..

cd whisker-electron
npm install
npm run build
cd ..

# Then execute whisker-electron with electron

electron whisker-electron --tests testsFile [--outdir dir] [projectFile...]

# Alternatively, if you don't have electron installed globally

whisker-electron/node_modules/electron/dist/electron whisker-electron ...
```
