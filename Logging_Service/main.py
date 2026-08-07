from fastapi import HTTPException
import time
import threading as thread
import queue
import copy
import os

from Logging_Service.mqtt.logging_mqtt_subscriber import main as logging_mqtt_main
from Logging_Service.log.logging_can0_queue import main  as can0_logging_queue
from Logging_Service.log.logging_can1_queue import main as can1_logging_queue
from Logging_Service.log.logging_gps_queue import main as gps_logging_queue


can0_queue = queue.Queue()
can1_queue = queue.Queue()
gps_queue = queue.Queue()

shared_data = {
    "log_state" : "stop",
    "start_time" : None,
    "current_race_obj" : None,
    "possibiity_download" : False
}


class RaceLogger:
    def __init__(self):
        self.recent_drive_log = {
            "data" : {
                "can0" : [],
                "tps" : [],
                "desired-yawrate" : [],
                "yawrate" : [],
                "rollrate" : [],
                "steeringhandle" : [],
                "tiredegree" : [],
                "gps" : []
            }
        }


def logging_mqtt():
    logging_mqtt_thread = thread.Thread(
        target= logging_mqtt_main,
        args=(can0_queue, can1_queue, gps_queue)
    )

    logging_mqtt_thread.start()



def return_log():
    if(shared_data["possibiity_download"] == False):
        raise HTTPException(
            status_code=404,
            detail="다운로드 할 주행로그가 없습니다"
        )
    else:
        return copy.deepcopy(shared_data["current_race_obj"])


def can0_logging():
    logging_thread = thread.Thread(
        target= can0_logging_queue,
        args=(shared_data, can0_queue)
    )

    logging_thread.start()

def can1_logging():
    logging_thread = thread.Thread(
        target = can1_logging_queue,
        args=(shared_data, can1_queue)
    )

    logging_thread.start()


def gps_logging():
    logging_thread = thread.Thread(
        target= gps_logging_queue,
        args=(shared_data, gps_queue)
    )

    logging_thread.start()


##-------------------------------------------------
def race_start():
    shared_data["log_state"] = "start"
    shared_data["current_race_obj"] = RaceLogger()
    shared_data["start_time"] = time.time()
    print("race_start : logging_service")
    print(f"logging_main 96 : {shared_data["log_state"]}")
    print("race_start PID:", os.getpid())
    print("race_start shared_data id:", id(shared_data))

def race_stop():
    shared_data["log_state"] = "stop"
    shared_data["possibiity_download"] = True
    print("race_stop : logging_service")

def race_reset():
    shared_data["log_state"] = "reset"
    shared_data["possibiity_download"] = False
    print("race_reset : logging_service")
##-----------------------------------------------------

def logging():
    can0_logging()
    can1_logging()
    gps_logging()



def main():
    logging_mqtt()
    logging()
    

if __name__ == "__main__":
    main()