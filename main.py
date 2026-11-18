def on_received_value(name, value):
    global threshold, distance
    if name == "DST":
        if value > 0:
            threshold = value
            radio.send_string("OK THRESHOLD " + str(threshold))
    elif name == "TIME":
        # value = hhmmss, e.g. 54025 for 05:40:25
        timeanddate.set24_hour_time(Math.idiv(value, 10000), Math.idiv(value, 100) % 100, value % 100)
        radio.send_string("OK TIME " + timeanddate.time(timeanddate.TimeFormat.HHMMSS2_4HR))
    elif name == "DATE":
        # value = yyyymmdd, e.g. 20261117
        timeanddate.set_date(Math.idiv(value, 100) % 100, value % 100, Math.idiv(value, 10000))
    elif name == "TMRD":
        radio.send_string("TIME " + timeanddate.time(timeanddate.TimeFormat.HHMMSS2_4HR))
    elif name == "FR":
        datalogger.delete_log(datalogger.DeleteType.FULL)
        radio.send_string("OK FLASH RESET")
    elif name == "DRD":
        distance = sonarbit.sonarbit_distance(Distance_Unit.DISTANCE_UNIT_MM, DigitalPin.P2)
        radio.send_string("DIST " + str(distance))
radio.on_received_value(on_received_value)

stamp = ""
distance = 0
threshold = 500
radio.set_group(1)
datalogger.set_column_titles("timestamp", "distance")

def on_forever():
    global distance, stamp
    distance = sonarbit.sonarbit_distance(Distance_Unit.DISTANCE_UNIT_MM, DigitalPin.P2)
    if distance > 0 and distance < threshold:
        stamp = "" + timeanddate.date(timeanddate.DateFormat.YYYY_MM_DD) + " " + timeanddate.time(timeanddate.TimeFormat.HHMMSS2_4HR)
        datalogger.log(datalogger.create_cv("timestamp", stamp),
            datalogger.create_cv("distance", distance))
        radio.send_string("LOG," + timeanddate.time(timeanddate.TimeFormat.HHMMSS2_4HR) + "," + str(distance))
    basic.pause(300)
basic.forever(on_forever)