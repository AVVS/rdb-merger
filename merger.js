var fs = require("fs")

var filesFlags = "-f",
    outputFlag = "-o"

var activeArg = ""
var output,
    input = []

process.argv.forEach(function(arg, idx){
    if (arg === filesFlags) {
        activeArg = filesFlags
    } else if ( arg === outputFlag ) {
        activeArg = outputFlag
    } else {
        if ( activeArg === filesFlags ) {
            input.push(arg)
        } else if ( activeArg === outputFlag ) {
            output = arg
        }
    }
})

var inpLength = input.length
if ( inpLength === 0 )
    throw new Error("No files specified with the flag -f")

if ( !output )
    throw new Error("No output file specified")

var rdbVersion = process.env.rdbVer || 6,
    checksumLength = 0
if ( rdbVersion > 4 )
    checksumLength = 8

var readStreams = input.map(function(filename, idx){
    var options = { encoding: null },
        stats = fs.statSync(filename),
        lastByte = stats.size - 1 - checksumLength

    if ( idx === 0 ){
        options.start = 0
        options.end = lastByte - 1
    } else if ( idx === inpLength - 1) {
        options.start = 11
        options.end = lastByte
    } else {
        options.start = 11
        options.end = lastByte - 1
    }

    if ( idx === 0 && idx === inpLength - 1 ) {
        options.start = 0
        options.end = lastByte
    }

    return { stream: fs.createReadStream(filename, options), length: options.end - options.start + 1 }
})

// erase old file
try {
    fs.unlinkSync(output)
} catch(e) {
    // could be no file, we care not
}


var position = 0
var writeStreams = readStreams.map(function(handler){
    var stream = handler.stream,
        length = handler.length

    var options = {
        flags: "a",
        encoding: null,
        start: position
    }

    position += length

    var writeStream = fs.createWriteStream(output, options)
    stream.pipe(writeStream)
    writeStream.on("finish", printReport)

    return writeStream
})

var toBeCalled = writeStreams.length
var exec = require('child_process').exec,
    child

function printReport() {
    if ( --toBeCalled > 0 )
        return

    child = exec(__dirname + "/redis_crc64/crc64 " + output,
        function(error, stdout, stderr){
            if ( error ) throw error

            console.log(stdout)
            process.exit(0)
    })
}

