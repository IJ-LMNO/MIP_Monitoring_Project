from collections import deque
import copy

from Monitoring_Server.api.main import get_tps_data, get_desired_yawrate_data, get_yawrate_data, get_rollrate_data, get_steeringhandle_data, get_tiredegree_data

class can1_data_set():
    def __init__(self):
        self.tps = {
            "latest" : 0.0,
            "history" : deque(maxlen=40),
            "version" : 0
        }


        self.desired_yawrate = {
            "latest" : 0.0,
            "history" : deque(maxlen=40),
            "version" : 0
        }

        self.yawrate = {
            "latest" : 0.0,
            "history" : deque(maxlen=40),
            "version" : 0
        }

        self.rollrate = {
            "latest" : 0.0,
            "history" : deque(maxlen=40),
            "version" : 0
        }

        self.steeringhandle = {
            "latest" : 0.0,
            "history" : deque(maxlen=40),
            "version" : 0
        }

        self.tiredegree = {
            "latest" : 0.0,
            "history" : deque(maxlen=40),
            "version" : 0
        }

        self.data_list = [self.tps, self.desired_yawrate, self.yawrate, self.rollrate, self.steeringhandle, self.tiredegree]
        self.function_list= [get_tps_data, get_desired_yawrate_data, get_yawrate_data, get_rollrate_data, get_steeringhandle_data, get_tiredegree_data]



def main(queue):
    data_set = can1_data_set()
    while(True):
        try:
            idx = 0
            can1_key = list(queue.get().values())

            for data in data_set.data_list:
                data["latest"] = can1_key[idx]
                data["history"].append(can1_key[idx])
                data["version"] += 1

                data_set.function_list[idx](copy.deepcopy(data))

                idx += 1
                          
        finally:
            queue.task_done()

