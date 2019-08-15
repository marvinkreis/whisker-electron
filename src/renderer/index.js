const {ipcRenderer} = require('electron');

const {CoverageGenerator, TestRunner, TAP13Listener} = require('../../whisker-main');
const ScratchStage = require('../src/renderer/scratch-stage');
const {Thread} = window.Scratch;

let scratch;

const loadTestsFromString = function (string) {
    /* eslint-disable-next-line no-eval */
    let tests = eval(`${string}; module.exports;`);
    tests = TestRunner.convertTests(tests);
    return tests;
};

const runTestsWithCoverage = async function (project, tests) {
    await scratch.vm.loadProject(project);
    CoverageGenerator.prepareThread(Thread);
    CoverageGenerator.prepare(scratch.vm);
    const testRunner = new TestRunner();

    const tap13Report = [];
    const tap13Listener = new TAP13Listener(testRunner, tap13Report.push.bind(tap13Report));

    const summary = await testRunner.runTests(scratch.vm, project, tests);
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
        coverage: coveragePerSprite,
        tap13Report: tap13Report.join('\n')
    };
};

const main = function () {
  scratch = new ScratchStage(document.getElementById('scratch-stage'));
};

document.addEventListener("DOMContentLoaded", main);

ipcRenderer.on('runTests', async (event, message) => {
    const {testsCode, project, id} = message;

    const tests = loadTestsFromString(testsCode);

    try {
        const {summary, coverage, tap13Report} = await runTestsWithCoverage(project, tests);
        ipcRenderer.send('testsDone', {summary, coverage, tap13Report, id});
    } catch (e) {
        ipcRenderer.send('testsError', {id, message: e.message});
    }

    window.close();
});
