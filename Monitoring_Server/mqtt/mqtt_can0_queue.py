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
                "torque_left" : 0.0
            },
            "history" : {
                "current_right" : deque(maxlen=40),
                "current_left" : deque(maxlen=40),
                "avg_power" : deque(maxlen=40)
            },
            "version" : 0
        }

def main(queue):
    can0_data = can0_data_sturcture()
    while(True):
        try:
            latest_data = queue.get()

            can0_data.can0["latest"].update(latest_data["latest"])

            can0_data.can0["history"]["current_right"].append(latest_data["latest"]["current_right"])
            can0_data.can0["history"]["current_left"].append(latest_data["latest"]["current_left"])
            can0_data.can0["history"]["avg_power"].append(latest_data["latest"]["avg_power"])

            can0_data.can0["version"] += 1

            get_can0_data(copy.deepcopy(can0_data.can0))

        finally:
            queue.task_done()
