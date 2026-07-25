# -*- coding: utf-8 -*-
from datetime import datetime, timezone

import pynmea2
import serial
import time
import copy
import queue

'''
Class GPSNeom8n has four function
1. __init__
2. connect
3. read_gps_data
4. shutdown
'''

gps_tmp_queue = queue.Queue()

class GPS:
    
# explain function __init__
    '''
    object initialize
    port: check it by using the command "dmesg | grep ttyAMA, ls /dev/tty" in the terminal. Check the port!!!!
    baudrate: check the datasheet (gps_board)
    timeout: waiting the data for a few time, which is setted. And after that time the __init__ function will be shutdown
    '''

    def __init__(self, port="/dev/ttyAMA10", baudrate=9600, timeout=30):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.serial = None
        print("init success")

        self.gps = {
            "latest" : {
                "timestamp" : 0.0,
                "latitude" : 0.0,
                "longitude" : 0.0
            }
        }

        
# explain function connect
        '''
        If it connected then return only True
        But is doesn't, then load the data of Serial and overload it to self.serial
        '''

    def connect(self):
        print("try to connect")
        if self.serial and self.serial.is_open:
            print("already connected")
            return True
        try:
            # Raspberry Pi UART must be enabled and detached from the serial console.
            self.serial = serial.Serial(self.port, self.baudrate, timeout=self.timeout)
            print("connected Success")
#            while True:
#                self.read_gps_data()
            return True
        except (serial.SerialException, OSError): #checking the hardware or other problem. Make the serial port None
            self.serial = None
            print("connected Fail")
            return False

    def read_gps_data(self):
        if not self.serial:
            print("serial is not opened")
            return None

        try:     
            lane = self.serial.readline().decode("ascii", "ignore").strip()
            print(lane)
            if not lane:
                return None

            message = pynmea2.parse(lane)
            #print(message)
            #print("dddd")
            sentence_type = message.sentence_type
            # Sentence type accepts both GP and GN talker prefixes.
            if sentence_type == "RMC":
                if message.status != "A":
                    return None
            elif sentence_type == "GGA":
                if not int(message.gps_qual or 0):
                    return None
            else:
                return None


            self.gps["latest"]["timestamp"] = datetime.now(timezone.utc).isoformat()
            self.gps["latest"]["latitude"] = float(message.latitude)
            self.gps["latest"]["longitude"] = float(message.longitude)

            gps_tmp_queue.put(copy.deepcopy(self.gps))

        except (serial.SerialException, OSError, UnicodeError,pynmea2.ParseError, AttributeError, TypeError, ValueError):
            print("oh my god")
            return None

    def shutdown(self):
        if self.serial:
            self.serial.close()
            self.serial = None
            
#GPSNeom8n( port="/dev/ttyAMA0", baudrate=9600, timeout=0.1)

def tmp_queue_to_main_queue(queue, tmp_queue):
    latest = tmp_queue.get()

    queue.put(copy.deepcopy(latest))

def main(gps_queue):
    obj = GPS()
    obj.connect()

    while(True):
        obj.read_gps_data()
        tmp_queue_to_main_queue(gps_queue, gps_tmp_queue)
