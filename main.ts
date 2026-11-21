//  EXAMPLE: sensor node (MakeCode Python)
//  Extensions: radio-mesh (this repo), sonarbit, timeanddate, datalogger.
//  The same program runs on every sensor; what differs is its saved setup.
// 
//  Set a sensor up over USB serial (115200 baud), or over the mesh from the main
//  micro:bit with "@name <command>":
//    SET name north1
//    SET ch1 sonar 2 500      (channel 1: kind, pin, threshold)
//    SET ch2 mic 0 300        (channel 2: analog microphone on pin 0)
//    SET ch3 pir 8 0          (channel 3: PIR motion sensor on pin 8)
//    SET quiet 10             (seconds between reports per channel)
//    CFG                      (show the setup)
//  Other commands over the mesh:
//    PING   STATUS   READ 1   LAST   TIME 12 34 56   DATE 11 20 2026   LOGCLEAR   HELP
// 
//  The datalogger keeps every detection with a timestamp. When its flash fills up
//  the log is cleared automatically (otherwise the micro:bit would stop with error
//  928). Download the log before then, or send LOGCLEAR yourself.
function reset_log() {
    datalogger.deleteLog(datalogger.DeleteType.Fast)
    datalogger.setColumnTitles("timestamp", "channel", "value")
}

datalogger.onLogFull(function on_log_full() {
    
    logResets += 1
    reset_log()
})
function read_channel(n: number) {
    
    if (channel.kind(n) == "sonar") {
        value = sonarbit.sonarbit_distance(Distance_Unit.Distance_Unit_mm, channel.digitalPin(channel.pin(n)))
    } else {
        value = channel.read(n)
    }
    
}

mesh.onMessage(function on_mesh_message(sender: string, payload: string, to: string) {
    
    reply = commands.run(payload)
    if (reply != "") {
        mesh.send(sender, reply)
    } else {
        verb = commands.word(1, payload)
        if (verb == "PING") {
            mesh.send(sender, "PONG")
        } else if (verb == "STATUS") {
            mesh.send(sender, "up=" + ("" + Math.idiv(input.runningTime(), 1000)) + " t=" + ("" + input.temperature()) + " sig=" + ("" + mesh.lastSignal()) + " rel=" + ("" + mesh.relayedCount()) + " clr=" + ("" + logResets))
        } else if (verb == "READ") {
            ch = parseInt(commands.word(2, payload))
            if (channel.enabled(ch)) {
                read_channel(ch)
                mesh.send(sender, "ch" + ("" + ch) + "=" + ("" + value))
            } else {
                mesh.send(sender, "ERR channel off")
            }
            
        } else if (verb == "LOGCLEAR") {
            reset_log()
            mesh.send(sender, "OK log cleared")
        } else if (verb == "HELP") {
            mesh.send(sender, "PING STATUS READ n LAST TIME DATE LOGCLEAR CFG SET")
        } else if (verb == "LAST") {
            mesh.send(sender, "last " + lastEvent)
        } else if (verb == "TIME") {
            timeanddate.set24HourTime(parseInt(commands.word(2, payload)), parseInt(commands.word(3, payload)), parseInt(commands.word(4, payload)))
            mesh.send(sender, "OK " + timeanddate.time(timeanddate.TimeFormat.HHMMSS24hr))
        } else if (verb == "DATE") {
            timeanddate.setDate(parseInt(commands.word(2, payload)), parseInt(commands.word(3, payload)), parseInt(commands.word(4, payload)))
            mesh.send(sender, "OK " + timeanddate.date(timeanddate.DateFormat.YYYY_MM_DD))
        } else {
            mesh.send(sender, "ERR UNKNOWN")
        }
        
    }
    
})
let lastEvent = "none"
let logResets = 0
let stamp = ""
let reply = ""
let verb = ""
let value = 0
let ch = 0
let lastSent = [-10000, -10000, -10000, -10000]
datalogger.setColumnTitles("timestamp", "channel", "value")
mesh.defaultName("unnamed")
mesh.start(1)
commands.enableSerial()
basic.forever(function on_forever() {
    
    for (let index = 0; index < 4; index++) {
        ch = index + 1
        if (channel.enabled(ch)) {
            read_channel(ch)
            if (channel.triggered(ch, value) && input.runningTime() - lastSent[index] > channel.quietMs()) {
                lastSent[index] = input.runningTime()
                lastEvent = "" + ("" + ch) + " " + channel.kind(ch) + " " + timeanddate.time(timeanddate.TimeFormat.HHMMSS24hr) + " " + ("" + value)
                stamp = "" + timeanddate.date(timeanddate.DateFormat.YYYY_MM_DD) + " " + timeanddate.time(timeanddate.TimeFormat.HHMMSS24hr)
                datalogger.log(datalogger.createCV("timestamp", stamp), datalogger.createCV("channel", ch), datalogger.createCV("value", value))
                mesh.send("main", "LOG " + lastEvent)
            }
            
        }
        
    }
    basic.pause(300)
})
