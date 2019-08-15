const ScratchStorage = require('scratch-storage');
const ScratchRender = require('scratch-render');
const ScratchSVGRenderer = require('scratch-svg-renderer');
const ScratchAudio = require('scratch-audio');
const ScratchVM = require('scratch-vm');
const Thread = require('scratch-vm/src/engine/thread');

const Scratch = {
    ScratchStorage,
    ScratchRender,
    ScratchSVGRenderer,
    ScratchAudio,
    ScratchVM,
    Thread
};

module.exports = Scratch;
