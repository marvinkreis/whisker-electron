const {ipcRenderer} = require('electron');

const {Thread} = window.Scratch;
const {CoverageGenerator, TestRunner, TAP13Listener} = require('../../whisker-main');

const Scratch = require('../src/renderer/scratch-stage');

class Main {
    constructor (canvas) {
        this.scratch = new Scratch(canvas);
    }

    static loadTestsFromString (string) {
        /* eslint-disable-next-line no-eval */
        let tests = eval(`${string}; module.exports;`);
        tests = TestRunner.convertTests(tests);
        return tests;
    }

    async runTestsWithCoverage (project, tests) {
        await this.scratch.vm.loadProject(project);
        CoverageGenerator.prepareThread(Thread);
        CoverageGenerator.prepare(this.scratch.vm);
        const testRunner = new TestRunner();

        const tap13Report = [];
        const tap13Listener = new TAP13Listener(testRunner, tap13Report.push.bind(tap13Report));

        const summary = await testRunner.runTests(this.scratch.vm, project, tests);
        const coverage = CoverageGenerator.getCoverage();
        const coveragePerSprite = coverage.getCoveragePerSprite();

        CoverageGenerator.restoreThread(Thread);

        const formattedSummary = TAP13Listener.formatSummary(summary);
        const formattedCoverage = TAP13Listener.formatCoverage(coveragePerSprite);
        const summaryString = TAP13Listener.extraToYAML({summary: formattedSummary});
        const coverageString = TAP13Listener.extraToYAML({coverage: formattedCoverage});
        tap13Report.push(summaryString);
        tap13Report.push(coverageString);

        return {
            summary,
            coverage,
            tap13Report: tap13Report.join('\n')
        };
    }
}

const main = new Main(document.getElementById('scratch-stage'));

ipcRenderer.on('runTests', async (event, message) => {
    const {testsCode, project, id} = message;
    const tests = Main.loadTestsFromString(testsCode);
    const {summary, coverage, tap13Report} = await main.runTestsWithCoverage(project, tests);
    ipcRenderer.send('testsDone', {summary, coverage, tap13Report, id});
    window.close();
});
