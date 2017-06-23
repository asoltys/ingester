const chokidar = require('chokidar')
const EI = require('elastic-import')
const parse = require('csv-parse')
const firstline = require('firstline')

const importer = new EI({
  host: '192.168.10.251:9200',
  index: 'esdat',
  type: 'record',
  log: 'info',
  warnErrors: false,
  transform: function (record) {
    record.MATRIX_TYPE = 'I BEEN TRANSFORMED!'
  }
})

function parser() {
  return parse({
    delimiter: ',',
    quote: '',
    columns: true,
    skip_empty_lines: true,
    auto_parse: false,
    auto_parse_date: false 
  }, function (err, data) {
    if (err) {
      console.log(err)
    }

    if (data.length < 1000) {
      importer.import(data)
    } else {
      while (true) {
        if (data.length === 0) {
          break
        }

        var partial = data.splice(0, 1000)
        importer.import(partial)
        console.log('sent', partial.length)
      }
    }
  })
}

const watcher = chokidar.watch(process.cwd(), {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100
  }
})

const log = console.log.bind(console)

watcher.on('add', path => {
  let name = require('path').parse(path).name
  importer.type = name
  fs.createReadStream(path).pipe(parser())

  firstline(path).then(headers => {
    let schema = {}
    each(k => schema[k] = { type: Sequelize.STRING })(headers.split(','))
  })
})
