const chokidar = require('chokidar')
const parse = require('csv-parse')
const firstline = require('firstline')
const fs = require('fs')
const transform = require('stream-transform')
const path = require('path')
const Sequelize = require('sequelize')
const deepstream = require('deepstream.io-client-js')
const client = deepstream('localhost:6020').login()
const list = client.record.getList('samples')

const dbstring = 'mysql://root:MPJzfq97@localhost:3306/water_resources'

const parseOpts = {
  columns: true,
  skip_empty_lines: true,
  from: 1
}
const parser = () => parse(parseOpts, (err, data) => {
  if (err) return
})

const watchOpts = {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100
  }
}
const watcher = chokidar.watch(process.cwd(), watchOpts)

watcher.on('add', file => {
  let f = path.parse(file)
  if (f.ext != '.csv') return
  let name = f.name

  let sequelize = new Sequelize(dbstring, { logging: false })

  firstline(file).then(headers => {
    let schema = {}
    let count = 0
    headers.split(',').forEach(k => schema[k.replace(/\W/g,'')] = { type: Sequelize.STRING })

    let table = sequelize.define(name, schema, { tableName: name })
    let transformer = transform((data, callback) => {
      let record = client.record.getRecord(data.ChemCode)
      record.set(data)
      list.addEntry(data.ChemCode)

      table.create(data) && count++
      callback(null, data)
    }, { consume: true })

    table.sync().then(() => {
      fs.createReadStream(file)
        .pipe(parser())
        .pipe(transformer)
    })

    transformer.on('end', () => {
      console.log(`Ingested ${count} records`) 
      sequelize.close()
    })
  })
})
