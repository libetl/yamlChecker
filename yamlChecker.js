const yaml = require('yamljs')
const fs = require('fs')
const path = require('path')
const Table = require('cli-table')

const keepKeysOf = (object, name) => Object.entries(object)
    .map(([key, value]) =>
        value && typeof value === 'object' ? {[key]: keepKeysOf(value, name)} : {[key]:name})
    .reduce((acc, value) => Object.assign(acc, value), {})

const deepMerge = (obj1, obj2) => !obj1 ? obj2 : !obj2 ? obj1 :
    Object.assign({}, obj1, Object.entries(obj2).map(([key, value]) => typeof value !== 'object' ? {[key]: value} :
        {[key]: deepMerge(obj1[key], obj2[key])}).reduce((acc, value) => Object.assign({}, acc, value), {}))

const flatten = (flat, toFlatten) => flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten)

const normalize = prefix => prefix.length ? prefix + '.' : ''

const listProperties = (data, prefix = '') => Object.entries(data).map(
    ([key, value]) => typeof value === 'object' ?
        listProperties(data[key], `${normalize(prefix)}${key}`) :
        [{[`${normalize(prefix)}${key}`]: value}]).reduce(flatten, []).filter(prop => prop)

const getStatus = data => {
    const allYamls = data.split('---')
        .map(oneYaml => yaml.parse(oneYaml))
        .reduce((acc, value) => Object.assign(acc, {[(value.spring && value.spring.profiles) || 'default']: value}), {})

    const allKeys = Object.entries(allYamls).map(([key, oneYaml]) => ({[key]: keepKeysOf(oneYaml, key)}))
        .reduce((acc, value) => Object.assign(acc, value), {})

    const defaultValues = allKeys.default

    return Object.entries(allKeys).map(([key, oneEnvKeys]) => ({[key]: deepMerge(defaultValues, oneEnvKeys)}))
        .reduce((acc, value) => Object.assign(acc, value), {})
}

const addedProfileTo = ({file, data}) => {
    const suffix = (path.basename(file).match(/^[^.]+-([^.]+)\.yml$/)||[])[1]
    return !suffix ? data.toString() :
        `spring:
   profiles: ${suffix}

${data.toString()}`
}

const discrepencies = files => Promise.all(files.map(file => new Promise((resolve, reject) => fs.readFile(file, (err, data) => err ? reject(err) : resolve({data, file})))))
    .then(allFiles => allFiles.reduce((acc, value) => acc.length ? acc + '\n---\n' + addedProfileTo(value) : addedProfileTo(value), ''))
    .then(dump => {
        const status = dump.length ? getStatus(dump) : {}
        const notDefaultEnvs = Object.keys(status).filter(env => env !== 'default')
        const flattenedStatus = notDefaultEnvs.map(env => ({[env]:
                listProperties(status[env])
                    .reduce((acc, value) => Object.assign(acc, value), {})}))
            .reduce((acc, value) => Object.assign(acc, value), {})
        const keys = Object.keys(listProperties(status.default||{})
            .reduce((acc, value) => Object.assign(acc, value), {}))

        const elems = keys.map(key =>
            [key, ...notDefaultEnvs.map(env =>
                (flattenedStatus[env][key]||'default') !== 'default' ? 'V' : 'X')])

        return [['key name', ...notDefaultEnvs], ...elems.filter(elem =>
            elem.filter (val => val === 'X').length !== notDefaultEnvs.length).filter(elem =>
            elem.filter (val => val === 'V').length !== notDefaultEnvs.length)]
    })

const displayedInTable = discrepencies => {
    const table = new Table({colWidths:[Math.max(...discrepencies.map(elem=>elem[0].length), 10),
            ...discrepencies[0].slice(1).map(envName => envName.length + 2)],
            head: discrepencies[0],
            chars: { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
                , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
                , 'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼'
                , 'right': '║' , 'right-mid': '╢' , 'middle': '│' }})
    table.push(...discrepencies.slice(1))
    return table.toString()
}

const workWith = files => discrepencies(files||[]).then(data => displayedInTable(data))
if (!global.jasmine){
    workWith(process.argv.slice(2)).then(result => console.log(result))
}

module.exports = workWith
