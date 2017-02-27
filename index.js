const os = require('os');
const fs = require('fs');
const path = require('path');

const Busboy = require('busboy');

module.exports = {
    handle: (req, res, app) => {
        const request = req.original;
        const response = res.original;

        if (request.method === 'POST') {
            const bus = new Busboy({ headers: request.headers });
            const tmpFiles = [];

            bus.on('file', (fieldname, file, filename, encoding, mimetype) => {
                const saveTo = path.join(os.tmpdir(), path.basename(fieldname));
                if (!tmpFiles.find(f => f == saveTo)) {
                    tmpFiles.push(saveTo);
                }
                file.pipe(fs.createWriteStream(saveTo));
                file.on('data', data => {
                    req.body[fieldname] = { filename, encoding, mimetype, filepath: saveTo, length: data.length, data };
                });
            });

            bus.on('field', (fieldname, value) => req.body[fieldname] = value);
            bus.on('finish', () => app.dispatch(req, res));

            response.on('finish', () => tmpFiles.forEach(file => fs.unlink(file, () => {})));

            request.pipe(bus);
        } else {
            app.dispatch(req, res);
        }
    }
};
