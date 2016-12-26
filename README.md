# YION BODY PARSER

A body parser plugin for plugin [Yion](https://www.npmjs.com/package/yion)

## Install

```
$ npm install --save yion-body-parser
```

## Usage

```javascript
const { createServer, createApp } = require('yion');
const bodyParser = require('yion-body-parser');

const app = createApp();
const server = createServer(app, [bodyParser]);

app.post('/file', (req, res) => {
    const file = req.body.file; // file sent with name "file"
    res.sendFile(file.filepath, file.filename, file.mimetype);
});
```

## API reference

File metadata :

* `filename`: file name
* `filepath`: file temporary path
* `encoding`: file encoding
* `mimetype`: file MIME type
* `length`: file length
* `data`: file's data (buffer)
