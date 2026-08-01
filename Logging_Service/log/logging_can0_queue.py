from collections import deque
import time
import copy
import os


class can0_data_sturcture():
    def __init__(self):
        self.can0 = {
            "latest" : {
                'avg_rpm': 0.0,
                'avg_voltage': 0.0,
                "avg_power": 0.0,   

                "power_right": 0.0,
                "power_left": 0.0,

                "speed": 0.0,

                "current_left": 0.0,
                "current_right": 0.0,
                
                "rpm_left": 0.0,
                "rpm_right": 0.0,

                "torque_right" : 0.0,
                "torque_left" : 0.0
            },
            "history" : {
                "current_right" : deque(maxlen=40),
                "current_left" : deque(maxlen=40),
                "avg_power" : deque(maxlen=40)
            },
            "version" : 0
        }

def main(shared_data, queue):
    can0_data = can0_data_sturcture()
    print(f"logging_Can0_queue 38 : logging can0 start")
    print(f"logging_Can0_queue 38 : {shared_data["log_state"]}")
    print("can0 PID:", os.getpid())
    print("can0 shared_data id:", id(shared_data))
    

    while(True):
        if(shared_data["log_state"] == "start"):
            print(f"logging_Can0_queue 43 : {shared_data["log_state"]}")
            try:
                latest_data = queue.get()
                print(f"logging_can0_qeue : {latest_data}")

                can0_data.can0["latest"].update(latest_data["latest"])

                can0_data.can0["history"]["current_right"].append(latest_data["latest"]["current_right"])
                can0_data.can0["history"]["current_left"].append(latest_data["latest"]["current_left"])
                can0_data.can0["history"]["avg_power"].append(latest_data["latest"]["avg_power"])

                can0_data.can0["version"] += 1

                shared_data["current_race_obj"].recnt_drive_log["data"]["can0"].append((time.time() - shared_data["start_time"], copy.deepcopy(can0_data.can0) ))                
            finally:
                queue.task_done()

        elif(shared_data["log_state"] == "reset"):
            shared_data["current_race_obj"]["data"]["can0"] = []      