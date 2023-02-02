const sharp  = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const path   = require('path');
const glob   = require('glob');
const fs     = require('fs');

const VIDEO_FORMATS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'MOV'];

module.exports = {

    setup(program) {
        program.option('--compress <origin>', 'Compress files');
        program.option('--to <dest>', '--convert: into these file names');
        return module.exports;
    },

    run(dirs, opts) {

        if (!opts.compress) return console.log(`@error --compress is required`);
        if (!opts.to) return console.log(`@error --to is required`);

        const compressionLevel = opts.compressionLevel || 50;
        glob(opts.compress, (err, files) => {

            if(files.length === 0) return console.log(`@error No files found in ${opts.compress}`);

            files.forEach(file => {
                if (VIDEO_FORMATS.includes(path.extname(file).substring(1))) {
                const newFile = opts.to.replace('*', path.basename(file, path.extname(file)));

                // At the end, must have a message on the new file bytes
                ffmpeg(file)
                    .output(newFile)
                    .on('progress', ({ timemark }) => {
                        console.log(`Processing: ${timemark}`);
                    })
                    .videoCodec('libx264')
                    .videoBitrate('1000k')
                    .audioBitrate('128k')
                    .audioChannels(2)
                    .audioCodec('aac')
                    .outputOptions([`-crf ${compressionLevel}`])
                    .on('error', (err, stdout, stderr) => {
                        console.log(`@error ${err.message}`);
                    })
                    .on('end', () => {
                        console.log(`@info Compressed ${file} to ${newFile}`);
                        
                        // Get the size of new file
                        console.log(`The new size of ${newFile} is: ${Math.round(fs.statSync(newFile).size / 1024 / 1024)} MB`);
                        
                    })
                    .run();

                } else {
                console.log(`@error ${file} is not a video file.`);
                }
            });

            files.forEach(file => {
                console.log(`The original size of ${file} is: ${Math.round(fs.statSync(file).size / 1024 / 1024)} MB`);
            });

        });

    }

};