const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const glob = require('glob');
const fs   = require('fs');

const VIDEO_FORMATS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'MOV'];

module.exports = {

    setup(program) {
        program.option('--rotate-video <file>', 'Rotate a video file');
        program.option('--by <degrees>', '--rotate-video: number of degrees to rotate (90, 180, or 270)');
        program.option('--to <dest>', '--rotate-video: save rotated video as this file name');
        return module.exports;
    },

    run(dirs, opts) {
        if (!opts.rotateVideo) return console.log(`@error --rotate-video is required`);
        if (!opts.by) return console.log(`@error --by is required`);
        if (![90, 180, 270].includes(parseInt(opts.by))) return console.log(`@error --by must be one of 90, 180, or 270`);

        const file = opts.rotateVideo;
        const degrees = parseInt(opts.by);
        let dest = opts.to;

        if (!dest) {
            const dir = path.dirname(file);
            const ext = path.extname(file);
            const basename = path.basename(file, ext);
            dest = path.join(dir, `${basename}_rotated${ext}`);
        }

        ffmpeg(file)
            .videoCodec('libx264')
            .addOption('-vf', `transpose=${(degrees / 90) % 4}`)
            .on('error', (err, stdout, stderr) => {
                console.log(`@error ${err.message}`);
            })
            .on('progress', ({ timemark, percent }) => {

                console.log(`Completed: ${percent.toFixed(2)}% [${timemark}]`);

            })
            .save(dest)
            .on('end', () => {
                console.log(`Rotated video saved as ${dest}`);
            });


    }
};
