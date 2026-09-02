from collections import deque
import copy

from Monitoring_Server.api.main import get_can1_data

class can1_data_set():
    def __init__(self):
        self.can1 = {
            "tps" : 0.0,
            "desired_yawrate" : 0.0,
            "yawrate" : 0.0,
            "rollrate" : 0.0,
            "steeringhandle" : 0.0,
            "tiredegree" : 0.0,
            "timestamp" : None
        }


        self.data_list = [self.can1["tps"], self.can1["desired_yawrate"], self.can1["yawrate"], self.can1["rollrate"], self.can1["steeringhandle"], self.can1["tiredegree"]]


def main(queue):
    data_set = can1_data_set()
    while(True):
        try:

            latest = queue.get()

            data_set.can1.update(latest)
            get_can1_data(copy.deepcopy(data_set.can1))

        finally:
            queue.task_done()

