const yaml = require('yamljs')
const fs = require('fs')

const keepKeysOf = (object, name) => Object.entries(object)
    .map(([key, value]) => typeof value === 'object' ? {[key]: keepKeysOf(value, name)} : {[key]:name})
    .reduce((acc, value) => Object.assign(acc, value), {})

const deepMerge = (obj1, obj2) => !obj1 ? obj2 : !obj2 ? obj1 :
    Object.assign({}, obj1, Object.entries(obj2).map(([key, value]) => typeof value !== 'object' ? {[key]: value} :
        {[key]: deepMerge(obj1[key], obj2[key])}).reduce((acc, value) => Object.assign({}, acc, value), {}))

const flatten = (flat, toFlatten) => flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten)

const listProperties = (data, where, prefix = '') => Object.entries(data).map(
    ([key, value]) => typeof value === 'object' ?
        listProperties(data[key], where, (prefix.length ? prefix + '.' : '') + key) :
        where(value) ? [prefix + '.' + key]: []).reduce(flatten, []).filter(prop => prop)

const getStatus = data => {

    const allYamls = data.toString().split('---')
        .map(oneYaml => yaml.parse(oneYaml))
        .reduce((acc, value) => Object.assign(acc, {[(value && value.spring.profiles) || 'default']: value}), {})

    const allKeys = Object.entries(allYamls).map(([key, oneYaml]) => ({[key]: keepKeysOf(oneYaml, key)}))
        .reduce((acc, value) => Object.assign(acc, value), {})

    const defaultValues = allKeys.default

    return Object.entries(allKeys).map(([key, oneEnvKeys]) => ({[key]: deepMerge(defaultValues, oneEnvKeys)}))
        .reduce((acc, value) => Object.assign(acc, value), {})
}

const check = files => Promise.all(files.map(file => new Promise((resolve, reject) => fs.readFile(file, (err, data) => err ? reject(data) : resolve(data)))))
    .then(allFiles => allFiles.reduce((acc, value) => acc.length ? acc + '\n---\n' + value : value, ''))
    .then(dump => {
        const status = dump.length ? getStatus(dump) : {}

        const notDefaultEnvs = Object.keys(status).filter(env => env !== 'default')

        notDefaultEnvs.map(oneEnv => console.log(`These ${oneEnv} properties in your YAML are read from 'default' profile :\n- ${listProperties(status[oneEnv], value => value === 'default').join('\n- ')}\n\n`))
    })

check(process.argv.slice(2))

