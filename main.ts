radio.onReceivedValue(function (name, value) {
    if (name == "DST") {
        if (value > 0) {
            threshold = value
            radio.sendString("OK THRESHOLD " + ("" + threshold))
        }
    } else if (name == "TIME") {
        // value = hhmmss, e.g. 54025 for 05:40:25
        timeanddate.set24HourTime(Math.idiv(value, 10000), Math.idiv(value, 100) % 100, value % 100)
        radio.sendString("OK TIME " + timeanddate.time(timeanddate.TimeFormat.HHMMSS24hr))
    } else if (name == "DATE") {
        // value = yyyymmdd, e.g. 20261117
        timeanddate.setDate(Math.idiv(value, 100) % 100, value % 100, Math.idiv(value, 10000))
    } else if (name == "TMRD") {
        radio.sendString("TIME " + timeanddate.time(timeanddate.TimeFormat.HHMMSS24hr))
    } else if (name == "FR") {
        datalogger.deleteLog(datalogger.DeleteType.Full)
        radio.sendString("OK FLASH RESET")
    } else if (name == "DRD") {
        distance = sonarbit.sonarbit_distance(Distance_Unit.Distance_Unit_mm, DigitalPin.P2)
        radio.sendString("DIST " + ("" + distance))
    }
})
let stamp = ""
let distance = 0
let threshold = 0
threshold = 500
radio.setGroup(1)
datalogger.setColumnTitles(
"timestamp",
"distance"
)
basic.forever(function () {
    distance = sonarbit.sonarbit_distance(Distance_Unit.Distance_Unit_mm, DigitalPin.P2)
    if (distance > 0 && distance < threshold) {
        stamp = "" + timeanddate.date(timeanddate.DateFormat.YYYY_MM_DD) + " " + timeanddate.time(timeanddate.TimeFormat.HHMMSS24hr)
        datalogger.log(
        datalogger.createCV("timestamp", stamp),
        datalogger.createCV("distance", distance)
        )
        radio.sendString("LOG," + timeanddate.time(timeanddate.TimeFormat.HHMMSS24hr) + "," + ("" + distance))
    }
    basic.pause(300)
})
