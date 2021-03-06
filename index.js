const os = require('os');
const fs = require('fs');
const path = require('path');

const Busboy = require('busboy');

module.exports = {
    type: 'post',
    handle: (req, res, app, next) => {
        const request = req.original;
        const response = res.original;
        const headers = request.headers;

        if (request.method === 'POST' && headers['content-type'] &&
            headers['content-type'].match(/multipart\/form-data|application\/x-www-form-urlencoded/i)
        ) {
            req.body = {};

            const bus = new Busboy({ headers });
            const tmpFiles = [];

            bus.on('file', (fieldname, file, filename, encoding, mimetype) => {
                const saveTo = path.join(os.tmpdir(), path.basename(filename));
                if (!tmpFiles.find(f => f === saveTo)) {
                    tmpFiles.push(saveTo);
                }

                file.pipe(fs.createWriteStream(saveTo));
                file.on('data', data => {
                    req.body[fieldname] = { filename, encoding, mimetype, filepath: saveTo, length: data.length, data };
                });
            });

            bus.on('field', (fieldname, value) => {
                const objectMatcher = fieldname.match(/(\w+)\[(\w+)\]/i);
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
                    req.body[fieldname] = value;
                }
            });
            bus.on('finish', () => app.dispatch(req, res));

            response.on('finish', () => tmpFiles.forEach(file => fs.unlink(file, () => {})));

            request.pipe(bus);
        } else {
            next();
        }
    }
};
