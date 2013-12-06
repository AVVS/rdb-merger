var exec = require('child_process').exec,
    child

var hex_to_binary_table = {
    "0" : "0000", "8" : "1000",
    "1" : "0001", "9" : "1001",
    "2" : "0010", "A" : "1010",
    "3" : "0011", "B" : "1011",
    "4" : "0100", "C" : "1100",
    "5" : "0101", "D" : "1101",
    "6" : "0110", "E" : "1110",
    "7" : "0111", "F" : "1111"
}

var dec_to_hex = {
    "10" : "A", "11" : "B",
    "12" : "C", "13" : "D",
    "14" : "E", "15" : "F"
}

var idx_to_val = [8,4,2,1]

function hexToBinary(hex) {
    hex = hex.toUpperCase().replace(/^0X/, "")
    var l = hex.length
    var binary = ""
    for (var i = 0; i < l; i++) {
        binary += hex_to_binary_table[hex[i]]
    }
    return binary
}

function binaryToHex(binary) {
    var l = binary.length
    var batches = l / 4
    var hex = ""
    for ( var i = 0; i < batches; i++ ) {
        var number = 0
        for ( var idx = 0; idx < 4; idx++ ) {
            number += idx_to_val[idx] * binary[i*4+idx]
        }
        if ( number > 9 )
            hex += dec_to_hex[number.toString()]
        else
            hex += number.toString()
    }
    return hex
}

var poly = hexToBinary("ad93d23594c935a9")
poly = poly.replace(/^[01]/, "0")
poly = binaryToHex(poly)

console.log("Poly: %s", poly)

exec("java -d64 -jar " + __dirname + "/jacksum.jar -a crc:64," + poly + ",0,true,true,0 -E hex -F '#CHECKSUM' -q txt:123456789",
    function(error, stdout, stderr){
        if ( error ) throw error
        if ( stderr ) {
            console.error(stderr)
            throw new Error("Test failed")
        }


        // e9c6d914c4b8d9ca
        //var buffer = new Int64(stdout).buffer
        console.log(stdout)
        console.log("e9c6d914c4b8d9ca")

        process.exit(0)
})
