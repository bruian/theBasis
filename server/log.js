import Winston from 'winston'

const srvPath = process.cwd() + '/server/'
const config = require(srvPath + 'config')
const isProd = process.env.NODE_ENV === 'production'

Winston.emitErrs = true

const _winston = new Winston.Logger({
  transports: [
    new Winston.transports.File({
      level: 'info',
      filename: process.cwd() + '/logs/all.log',
      handleExceptions: true,
      json: true,
      maxsize: 5242880,
      maxFiles: 2,
      colorize: false
    }),
    new Winston.transports.Console({
      level: 'info',
      label: '==>',
      handleExceptions: true,
      json: false,
      colorize: true
    }),
  ],
  exitOnError: false
})

if (!isProd && config.debugTrace) {
  _winston.remove(Winston.transports.Console)
  _winston.add(Winston.transports.Console, {
    level: 'debug',
    label: '==>',
    handleExceptions: true,
    json: false,
    colorize: true
  })
}

function logger(module) {
  return _winston
}

function getFilePath(module) {
  return module.filename.split('/').slice(-2).join('/')
}

module.exports = logger
