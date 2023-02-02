const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const glob = require('glob');

const IMAGE_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'tiff', 'gif', 'svg'];
const AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'wma'];
const VIDEO_FORMATS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'MOV'];

module.exports = {

    setup(program) {
        program.option('--convert <origin>', 'Convert files');
        program.option('--to <dest>', '--convert: into another file format');
        return module.exports;
    },

    run(dirs, opts) {
        if (!opts.convert) return console.log(`@error --convert is required`);
        if (!opts.to) return console.log(`@error --to is required`);

        glob(opts.convert, (err, files) => {

            console.log(files);

            if (err) return console.error(err);
        
            files.forEach(file => {

                let origin = file;

                let ext = path.extname(origin).substr(1);
                let name = path.basename(origin, path.extname(origin));
                let to = opts.to.replace('*', name);

                let toExt = path.extname(to).substr(1);

                if (IMAGE_FORMATS.includes(ext) && IMAGE_FORMATS.includes(toExt)) {

                    sharp(file)[toExt]()
                    .toFile(to)
                    .then(() => console.log(`@info Converted ${file} to ${to}`))
                    .catch(err => console.log(`@error ${err}`));

                } else if ([...AUDIO_FORMATS, ...VIDEO_FORMATS].includes(ext) && AUDIO_FORMATS.includes(toExt)) {
    
                    return new ffmpeg({ source: origin })
                      .withNoVideo()
                      .toFormat(toExt)
                      .saveToFile(to)
                      .on('error', (err, stdout, stderr) => {
                        console.log(`@error ${err.message}`);
                      })
                      .on('end', () => {
                        console.log(`@info Extracted audio from ${origin} to ${to}`);
                      });

                } else if (VIDEO_FORMATS.includes(ext) && VIDEO_FORMATS.includes(toExt)) {

                    if(ext === toExt) return console.log(`@error Cannot convert ${ext} to ${toExt} format, please use --compress instead`);

                    console.log('Converting video...', file, to);

                    ffmpeg(file)
                    .toFormat(toExt)
                    .on('progress', function(progress) {

                        let percentage = Math.floor(progress.percent);

                        if(percentage < 0) percentage = 0;

                        console.log(`Processing: ${percentage}%  of ${to} done`);
                    })
                    .saveToFile(`${to}`)
                    .on('error', err => console.log(`@error ${err.message}`))
                    .on('end', () => console.log(`@info Converted video ${file} to ${to}`));

                } else {
                    console.log(`@error Unsupported file format conversion`);
                }
            });
        });
    }

};