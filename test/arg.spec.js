"use strict"

const chai = require('chai')
var expect = chai.expect;
let argsArraybrowser = []

const parseSchemaAndSetDefault = (schemaString) => {
    const schema = JSON.parse(schemaString)
    for (let arg in schema) {
        switch (schema[arg].type) {
            case "boolean":
                schema[arg].value = false
                break
            case "integer":
                schema[arg].value = 0
                break
            case "string":
                schema[arg].value = ""
                break
            default:
                throw TypeError("Unsupported type '" + schema[arg].type + "' for argument '" + arg + "'")
        }
    }
    return schema
}

const BrowsetheArray = (arg) => {
    if (arg[0] == '-') {
        argsArraybrowser.push({ argName: arg[1] })
    }
}

const parseArgs = (schema, commandArgs) => {
    argsArraybrowser = []

    if (commandArgs.length == 0) { return [] }
    else {



        //commandArgs.forEach(BrowsetheArray)
        for (let i = 0; i < commandArgs.length; i++) {
            const arg = commandArgs[i]
            if (arg[0] == '-') {
                let value = null
                if (schema[arg[1]].type == "integer") value = commandArgs[i + 1]
                argsArraybrowser.push({
                    argName: arg[1],
                    value: value
                })
            }
        }

        // check for missing required args
        for (let arg in schema) {
            if (schema[arg].required && !has(argsArraybrowser, arg))
                throw Error("Missing required argument '" + arg + "'")
        }

        return argsArraybrowser
    }
}

const has = (argsArray, arg) => {
    for (let i = 0; i < argsArray.length; i++) {
        if (argsArray[i].argName === arg) { return true }
    }
    return false
}

const getValue = (arg, argsArray) => {
    for (let i = 0; i < argsArray.length; i++) {
        if (argsArray[i].argName === arg) { return argsArray[i].value }
    }
    throw Error("Argument " + arg + " missing")
}

describe('args', () => {
    beforeEach(() => {
        
    })
    it('Should return an empty array if no args', () => {
        //GIVEN
        const schema = ""
        const commandArgs = []

        //WHEN
        const argsArray = parseArgs(schema, commandArgs)

        //THEN
        expect(argsArray).to.be.empty
    })
    it("if they have an arg returns array with one element", () => {
        //GIVEN
        const schema = ""
        const commandArgs = ["-l"]


        //when
        const argsArray = parseArgs(schema, commandArgs)

        //then
        expect(argsArray).to.not.be.empty
    })
    it("if arg -l is specified returns array containing an object with argChar property equals l", () => {
        //GIVEN
        const schema = ""
        const commandArgs = ["-l", "-p", "8080"]

        //when
        const argsArray = parseArgs(schema, commandArgs)
        const result = has(argsArray, "l")

        //then
        expect(result).to.be.true
    })
    it("if arg -l is not specified returns array not containing an object with argChar property equals l", () => {
        //GIVEN
        const schema = ""
        const commandArgs = ["-", "-p", "8080"]

        //when
        const argsArray = parseArgs(schema, commandArgs)
        const result = has(argsArray, "l")

        //then
        expect(result).to.be.false
    })
    it("Should return false as default value for arg -l which is a boolean", () => {
        //GIVEN
        const schemaString = `{
            "l": {
                "type": "boolean",
                "required": false
            },
            "p": {
                "type": "integer",
                "required": true
            }
        }`

        const commandArgs = ["-l", "-p", "8080"]

        //WHEN
        const schema = parseSchemaAndSetDefault(schemaString)

        //THEN
        expect(schema.l.value).to.be.false
    })
    it("Should return 0 as default value for arg -p which is an integer", () => {
        //GIVEN
        const schemaString = `{
            "l": {
                "type": "boolean",
                "required": false
            },
            "p": {
                "type": "integer",
                "required": true
            }
        }`

        const commandArgs = ["-l", "-p", "8080"]

        //WHEN
        const schema = parseSchemaAndSetDefault(schemaString)

        //THEN
        expect(schema.p.value).to.equal(0)
    })
    it("Should return an empty string as default value for arg -d which is a string", () => {
        //GIVEN
        const schemaString = `{
            "l": {
                "type": "boolean",
                "required": false
            },
            "p": {
                "type": "integer",
                "required": true
            },
            "d": {
                "type": "string",
                "required": true
            }
        }`

        const commandArgs = ["-l", "-p", "8080"]

        //WHEN
        const schema = parseSchemaAndSetDefault(schemaString)

        //THEN
        expect(schema.d.value).to.equal("")
    })
    it("Should throw an exception if the schema specifies an argument of an unsupported type", () => {
        //GIVEN
        const schemaString = `{
            "x": {
                "type": "list",
                "required": false
            }
        }`

        const commandArgs = ["-l", "-p", "8080"]

        //THEN
        expect(() => { parseSchemaAndSetDefault(schemaString) }).to.throw(TypeError, "Unsupported type 'list' for argument 'x'")
    })
    it("Should throw an exception if arg -p that is required in schema is missing in args", () => {
        //GIVEN
        const schemaString = `{
            "p": {
                "type": "integer",
                "required": true
            }
        }`

        const commandArgs = ["-l", "-d", "/tmp"]

        //WHEN
        const schema = parseSchemaAndSetDefault(schemaString)

        //THEN
        expect(() => { parseArgs(schema, commandArgs) }).to.throw("Missing required argument 'p'");
    })
    it("Should not throw an exception if arg -p that is required in schema is present in args", () => {
        //GIVEN
        const schemaString = `{
            "p": {
                "type": "integer",
                "required": true
            }
        }`

        const commandArgs = ["-l", "-p", "8080"]

        //WHEN
        const schema = parseSchemaAndSetDefault(schemaString)
        parseArgs(schema, commandArgs)

        //THEN
        expect(() => {
            parseArgs(schema, commandArgs)
        }).not.to.throw(Error);
    })
    it("Should return 8080 for arg -p if p is specified as an integer with value equals to 8080", () => {
        //GIVEN
        const schemaString = `{
            "p": {
                "type": "integer",
                "required": true
            }
        }`

        const commandArgs = ["-l", "-p", "8080"]

        //WHEN
        const schema = parseSchemaAndSetDefault(schemaString)
        const argsArray = parseArgs(schema, commandArgs)
        const pArgsValue = getValue("p", argsArray)

        //THEN
        expect(pArgsValue).to.equals(8080);
    })
})

