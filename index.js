const os = require('os');
const fs = require('fs');
const path = require('path');

const busboy = require('busboy');

module.exports = {
    type: 'post',
    handle: (req, res, app, next) => {
        const headers = req.headers;

        if (req.method === 'POST' && headers['content-type'] &&
            headers['content-type'].match(/multipart\/form-data|application\/x-www-form-urlencoded/i)
        ) {
            req.body = {};

            const bus = busboy({ headers });
            const tmpFiles = [];

            bus.on('file', (fieldName, file, info) => {
                const { filename, encoding, mimeType } = info;
                const saveTo = path.join(os.tmpdir(), path.basename(filename || 'unknown'));
                if (!tmpFiles.find(f => f === saveTo)) {
                    tmpFiles.push(saveTo);
                }

                file.pipe(fs.createWriteStream(saveTo));
                file.on('data', data => {
                    req.body[fieldName] = { filename, encoding, mimeType, filepath: saveTo, length: data.length, data };
                });
            });

            bus.on('field', (fieldName, value) => {
                const objectMatcher = fieldName.match(/(\w+)\[(\w+)\]/i);
                if (objectMatcher) {
                    if (!req.body[objectMatcher[1]]) {
                        req.body[objectMatcher[1]] = !Number.isNaN(parseInt(objectMatcher[2])) ? [] : {};
                    }

                    try {
                        req.body[objectMatcher[1]][parseInt(objectMatcher[2]) || objectMatcher[2]] = JSON.parse(value);
                    } catch (e) {
                        req.body[objectMatcher[1]][parseInt(objectMatcher[2]) || objectMatcher[2]] = value;
                    }
                } else {
                    req.body[fieldName] = value;
                }
            });
            bus.on('finish', () => app.dispatch(req, res));
            bus.on('error', () => app.dispatch(req, res));

            res.on('finish', () => tmpFiles.forEach(file => fs.unlink(file, () => {})));

            req.pipe(bus);
        } else {
            next();
        }
    }
};
