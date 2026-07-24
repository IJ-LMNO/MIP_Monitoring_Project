import time
import threading as thread
import queue
from Logging_Service.mqtt.mqtt_subscriber import main as logging_mqtt_main
from Logging_Service.log.log import can0_logging as can0_logging
from Logging_Service.log.log import tps_logging as tps_logging
from Logging_Service.log.log import bps_logging as bps_logging
from Logging_Service.log.log import desired_yawrate_logging as desried_yawrate_logging
from Logging_Service.log.log import gps_logging as gps_logging


can0_queue = queue.Queue()
tps_queue = queue.Queue()
bps_queue = queue.Queue()
desired_yawrate_queue = queue.Queue()
gps_queue = queue.Queue()

shared_data = {
    "log_state" : "stop",
    "start_time" : None,
    "current_race_obj" : None
}


class RaceLogger:
    def __init__(self):
        self.recnt_drive_log = {
            "data" : {
                "can0" : [],
                "tps" : [],
                "bps" : [],
                "desired_yawrate" : [],
                "gps" : []
            }
        }

def logging_mqtt():
    logging_mqtt_thread = thread.Thread(
        target= logging_mqtt_main,
        args=(can0_queue, tps_queue, bps_queue, desired_yawrate_queue, gps_queue)
    )

    logging_mqtt_thread.start()

def can0_logging():
    logging_thread = thread.Thread(
        target= can0_logging,
        args=(shared_data, can0_queue)
    )

    logging_thread.start()

def tps_logging():
    logging_thread = thread.Thread(
        target= tps_logging,
        args=(shared_data, tps_queue)
    )

    logging_thread.start()

def bps_logging():
    logging_thread = thread.Thread(
        target= bps_logging,
        args=(shared_data, bps_queue)
    )

    logging_thread.start()

def desired_yawrate_logging():
    logging_thread = thread.Thread(
        target= desired_yawrate_logging,
        args=(shared_data, desired_yawrate_queue)
    )

    logging_thread.start()

def gps_logging():
    logging_thread = thread.Thread(
        target= gps_logging,
        args=(shared_data, gps_queue)
    )

    logging_thread.start()


def race_start():
    shared_data["log_state"] = "start"
    shared_data["current_race_obj"] = RaceLogger()
    shared_data["start_time"] = time.time()

def race_stop():
    shared_data["log_state"] = "stop"

def race_reset():
    shared_data["log_state"] = "reset"

def logging():
    can0_logging()
    tps_logging()
    bps_logging()
    desired_yawrate_logging()
    gps_logging()



def main(toggle):
    global log_state
    global start_time
    global current_race_obj

    logging_mqtt()
    logging()




    