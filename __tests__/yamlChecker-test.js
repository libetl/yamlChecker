const yamlChecker = require('../yamlChecker')
const chai = require('chai')

beforeEach(() => chai.should())

const withoutSpaces = text => text.replace(/\u001b[^m]+m/g, '').trim()

describe('the yaml checker', () =>
    it('should work even without data', () => yamlChecker()
        .then(data => withoutSpaces(data).should.be.equal(withoutSpaces(`
╔══════════╗
║ key name ║
╚══════════╝`)))) &&

    it('should work with an empty list of files', () => yamlChecker([])
        .then(data => withoutSpaces(data).should.be.equal(withoutSpaces(`
╔══════════╗
║ key name ║
╚══════════╝`)))) &&

    it('should work with one file', () => yamlChecker(['./__tests__/onefile/application.yml'])
        .then(data => withoutSpaces(data).should.be.equal(withoutSpaces(`
╔══════════╗
║ key name ║
╚══════════╝`)))) &&

    it('should work without discrepancy', () => yamlChecker(
        ['./__tests__/no_discrepancy/application.yml',
            './__tests__/no_discrepancy/application-profile1.yml'])
        .then(data => withoutSpaces(data).should.be.equal(withoutSpaces(`
╔══════════╤══════════╗
║ key name │ profile1 ║
╚══════════╧══════════╝`)))) &&

    it('should work with one discrepancy', () => yamlChecker(
        ['./__tests__/one_discrepancy/application.yml',
            './__tests__/one_discrepancy/application-profile1.yml',
            './__tests__/one_discrepancy/application-profile2.yml'])
        .then(data => withoutSpaces(data).should.be.equal(withoutSpaces(`
╔══════════════╤══════════╤══════════╗
║ key name     │ profile1 │ profile2 ║
╟──────────────┼──────────┼──────────╢
║ required.va… │ V        │ X        ║
╚══════════════╧══════════╧══════════╝`)))) &&

    it('should work with one structural discrepancy', () => yamlChecker(
        ['./__tests__/structural_discrepancy/application.yml',
            './__tests__/structural_discrepancy/application-profile1.yml',
            './__tests__/structural_discrepancy/application-profile2.yml'])
        .then(data => withoutSpaces(data).should.be.equal(withoutSpaces(`
╔══════════════╤══════════╤══════════╗
║ key name     │ profile1 │ profile2 ║
╟──────────────┼──────────┼──────────╢
║ required.va… │ V        │ X        ║
╚══════════════╧══════════╧══════════╝`)))))