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

    return { stream: fs.createReadStream(filename, options), length: options.end - options.start + 1 }
})

// erase old file
fs.unlinkSync(output)

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
    child,
    Int64 = require("node-int64")

function printReport() {
    if ( --toBeCalled > 0 )
        return

    //jacksum -f -a crc:16,1021,FFFF,true,true,0
    //    a CRC with customized parameters has been used: 16 Bit, Polynomial 1021
    //    (hex, without the leading bit), initvalue FFFF (hex), mirror neither
    //    the input nor the output, no xor.
    exec("jacksum -a crc:64,94C93800,FFFFFFFFFFFFFFFF,true,true,0000000000000000 -E hex -F '#CHECKSUM' -x " + output,
        function(error, stdout, stderr){
            if ( error ) throw error

            //0009649b701f0991 hex of the 64 bit uint
            var buffer = new Int64(stdout).buffer

            console.log(buffer)

            fs.appendFileSync(output, buffer, {encoding: null})

            process.exit(0)
    })
}

