# -*- coding: utf-8 -*-
from datetime import datetime, timezone

import pynmea2
import serial
import time
import copy


RECONNECT_INTERVAL = 0.1


class GPS:
    def __init__(self, port="/dev/ttyAMA10", baudrate=9600, timeout=30):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.serial = None

        self.gps = {
            "latest" : {
                "latitude" : 0.0,
                "longitude" : 0.0
            },
            "timestamp" : 0.0
        }

    def shutdown(self):
        if self.serial:
            self.serial.close()
            self.serial = None

    def connect(self):
        if self.serial and self.serial.is_open:
            print("already connected")
        
        try:
            self.serial = serial.Serial(self.port, self.baudrate, timeout=self.timeout)
            print("connected Success")
        except (serial.SerialException, OSError): 
            self.serial = None
            raise

        return True

    def read_gps_data(self):

        cur_gps_count = 0
        init_gps_count = 0

        if not self.serial:
            print("serial is not opened")
            return None

        try:     
            lane = self.serial.readline().decode("ascii", "ignore").strip()

            if not lane:
                return None

            message = pynmea2.parse(lane)
            sentence_type = message.sentence_type

            if sentence_type == "RMC":
                if message.status != "A":
                    return None
            elif sentence_type == "GGA":
                if not int(message.gps_qual or 0):
                    return None
            else:
                return None

            cur_gps_count += 1
            self.gps["latest"]["timestamp"] = datetime.now(timezone.utc).isoformat()
            self.gps["latest"]["latitude"] = float(message.latitude)
            self.gps["latest"]["longitude"] = float(message.longitude)

            if(cur_gps_count == init_gps_count):
                return False
            else:
                return True

        except (serial.SerialException, OSError, UnicodeError,pynmea2.ParseError, AttributeError, TypeError, ValueError):
            print("fuck you gps")
            raise
            
def main(gps_queue):
    gps = GPS()

    while(True):
        try:
            if gps.connect():
                time.sleep(RECONNECT_INTERVAL)
                break
        except(serial.SerialException, OSError) as error:
            print(f"error : {error}")
            continue


    while(True):
        try:
            if not gps.read_gps_data():
                time.sleep(RECONNECT_INTERVAL)
                continue
            else:
                gps_queue.put(copy.deepcopy(gps.gps))
        except(serial.SerialException, OSError) as error:
            print(f"error : {error}")

            while(True):
                    try:
                        if gps.connect():
                            break
                    except(serial.SerialException, OSError) as error:
                        print(f"error : {error}")
                        continue
        except(UnicodeError,pynmea2.ParseError, AttributeError, TypeError, ValueError) as error:
            print(f"error : {error}")
            continue
        except KeyboardInterrupt as error:
            print(f"error : {error}")
            gps.shutdown()

