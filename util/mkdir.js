const fs = require('fs')
const path = require('path')

function mkdir (dir) {
    var dirname = path.dirname(dir)
    console.log(dirname)
    console.log(fs.existsSync(dirname))
    if(!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname,{ recursive: true })
    }
    return fs.mkdirSync(dir)
}

module.exports = mkdir;