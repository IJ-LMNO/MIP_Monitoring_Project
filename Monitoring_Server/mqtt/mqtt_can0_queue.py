from collections import deque
import copy

from Monitoring_Server.api.main import get_can0_data

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
                "torque_left" : 0.0,
            },
            "timestamp" : None
           
        }

def main(queue):
    can0_data = can0_data_sturcture()
    while(True):
        try:
            latest = queue.get()

            can0_data.can0["latest"].update(latest["latest"])
            can0_data.can0["timestamp"] = latest["timestamp"]

            get_can0_data(copy.deepcopy(can0_data.can0))

        finally:
            queue.task_done()
