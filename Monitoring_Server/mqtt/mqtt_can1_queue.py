from collections import deque
import copy

from Monitoring_Server.api.api_main import get_can1_data

class can1_data_set():
    def __init__(self):
        self.can1 = {
            "tps" : {
                "latest" : 0.0,
                "history" : deque(maxlen=40),
            },

            "desired_yawrate" :{
                "latest" : 0.0,
                "history" : deque(maxlen=40),
            },

            "yawrate" : {
                "latest" : 0.0,
                "history" : deque(maxlen=40),
            },

            "rollrate" : {
                "latest" : 0.0,
                "history" : deque(maxlen=40),
            },

            "steeringhandle" : {
                "latest" : 0.0,
                "history" : deque(maxlen=40),
            },

            "tiredegree" : {
                "latest" : 0.0,
                "history" : deque(maxlen=40),
            },

            "version" : 0
        }


        self.data_list = [self.can1["tps"], self.can1["desired_yawrate"], self.can1["yawrate"], self.can1["rollrate"], self.can1["steeringhandle"], self.can1["tiredegree"]]


def main(queue):
    data_set = can1_data_set()
    while(True):
        try:
            idx = 0
            # print(f"mqtt_Can1_line51>{queue.qsize()}")
            can1_key = list(queue.get().values())

            for data in data_set.data_list:
                data["latest"] = can1_key[idx]
                data["history"].append(can1_key[idx])

                idx += 1

            data_set.can1["version"] += 1
            get_can1_data(copy.deepcopy(data_set.can1))

        finally:
            queue.task_done()

