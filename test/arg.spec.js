"use strict"

const chai = require('chai')
var expect = chai.expect;

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

const parseArgs = (schemaString, commandArgs) => {
    const argsArray = []
    const schema = parseSchemaAndSetDefault(schemaString)

    //Check for undefined args

    for (let i = 0; i < commandArgs.length; i++) {
        const arg = commandArgs[i]
        if (arg[0] == '-') {
            let value = null
        
            //Check for undefined args
            if(!schema.hasOwnProperty(arg[1])) throw Error("Undefined argument " + arg)

            switch (schema[arg[1]].type) {
                case "boolean":
                    value = true
                    break
                case "string":
                    value = commandArgs[++i]
                    break;
                case "integer":
                    if(commandArgs.length == i + 1) throw Error("Argument " + arg + " has no value")
                    value = parseInt(commandArgs[++i])
                    if(isNaN(value)) throw Error("Argument " + arg + " expected an integer but got '" + commandArgs[i] + "'")
                    break;
                default:
                // Should never happen
            }

            argsArray.push({
                argName: arg[1],
                value: value
            })
        }
    }

    // check for missing required args
    for (let arg in schema) {
        if (schema[arg].required && !has(argsArray, arg))
            throw Error("Missing required argument '" + arg + "'")
    }

    return argsArray
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

    //GIVEN
    const defaultSchemaString = `{
            "l": {
                "type": "boolean",
                "required": false
            },
            "p": {
                "type": "integer",
                "required": false
            },
            "d": {
                "type": "string",
                "required": false
            }
        }`

    const defaultCommandArgs = ["-l", "-p", "8080", "-d", "/tmp"]

    beforeEach(() => {
    })

    it('Should return an empty array if no args', () => {
        //GIVEN
        const schemaString = defaultSchemaString
        const commandArgs = []

        //WHEN
        const argsArray = parseArgs(schemaString, commandArgs)

        //THEN
        expect(argsArray).to.be.empty
    })

    it("Should return a non empty array if there's one arg", () => {
        //GIVEN
        const schemaString = defaultSchemaString
        const commandArgs = ["-l"]

        //when
        const argsArray = parseArgs(schemaString, commandArgs)

        //then
        expect(argsArray).not.to.be.empty
    })

    it("Should return an array of object containing the arg l if arg -l is specified", () => {
        //GIVEN
        const schemaString = defaultSchemaString
        const commandArgs = ["-l"]

        //WHEN
        const argsArray = parseArgs(schemaString, commandArgs)
        const result = has(argsArray, "l")

        //THEN
        expect(result).to.be.true
    })

    it("Should return an array of object not containing the arg l if arg -l is not specified", () => {
        //GIVEN
        const schemaString = defaultSchemaString
        const commandArgs = ["-p", "8080"]

        //WHEN
        const argsArray = parseArgs(schemaString, commandArgs)
        const result = has(argsArray, "l")

        //THEN
        expect(result).to.be.false
    })

    it("Should return false as default value for arg -l which is a boolean", () => {
        //GIVEN
        const schemaString = defaultSchemaString

        //WHEN
        const schema = parseSchemaAndSetDefault(schemaString)

        //THEN
        expect(schema.l.value).to.be.false
    })

    it("Should return 0 as default value for arg -p which is an integer", () => {
        //GIVEN
        const schemaString = defaultSchemaString

        //WHEN
        const schema = parseSchemaAndSetDefault(schemaString)

        //THEN
        expect(schema.p.value).to.equal(0)
    })

    it("Should return an empty string as default value for arg -d which is a string", () => {
        //GIVEN
        const schemaString = defaultSchemaString

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

        //WHEN

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

        const commandArgs = []

        //WHEN

        //THEN
        expect(() => { parseArgs(schemaString, commandArgs) }).to.throw("Missing required argument 'p'");
    })

    it("Should not throw an exception if arg -p that is required in schema is present in args", () => {
        //GIVEN
        const schemaString = `{
            "p": {
                "type": "integer",
                "required": true
            }
        }`

        const commandArgs = ["-p", "8080"]

        //WHEN

        //THEN
        expect(() => {
            parseArgs(schemaString, commandArgs)
        }).not.to.throw(Error);
    })

    it("Should return 8080 for arg -p if p is specified as an integer with value equals to 8080", () => {
        //GIVEN
        const schemaString = defaultSchemaString
        const commandArgs = defaultCommandArgs

        //WHEN
        const argsArray = parseArgs(schemaString, commandArgs)
        const pArgsValue = getValue("p", argsArray)

        //THEN
        expect(pArgsValue).to.equals(8080);
    })

    it("Should throw an exception if an argument undefined in schema is present in args", () => {
        //GIVEN
        const schemaString = defaultSchemaString
        const commandArgs = ["-z"]

        //WHEN

        //THEN
        expect(()=>{parseArgs(schemaString, commandArgs)}).to.throw("Undefined argument -z");
    })

    it("Should throw an exception if an integer argument has no value", () => {
        //GIVEN
        const schemaString = defaultSchemaString
        const commandArgs = ["-p"]

        //WHEN

        //THEN
        expect(()=>{parseArgs(schemaString, commandArgs)}).to.throw("Argument -p has no value");
    })

    it("Should throw an exception if an integer argument has a non integer value", () => {
        //GIVEN
        const schemaString = defaultSchemaString
        const commandArgs = ["-p", "twenty"]

        //WHEN

        //THEN
        expect(()=>{parseArgs(schemaString, commandArgs)}).to.throw("Argument -p expected an integer but got 'twenty'");
    })
})

