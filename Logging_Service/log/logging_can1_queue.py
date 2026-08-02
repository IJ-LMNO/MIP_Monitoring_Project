from collections import deque
import copy
import time

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
        self.key_list= ["tps", "desired-yawrate", "yawrate", "rollrate", "steeringhandle","tiredegree"]



def main(shared_data, queue):
    data_set = can1_data_set()

    while(True):
        if(shared_data["log_state"] == "start"):
            while(True):
                try:
                    idx = 0
                    can1_key = list(queue.get().values())

                    for data in data_set.data_list:
                        data["latest"] = can1_key[idx]["latest"]
                        data["history"].append(can1_key[idx]["latest"])
                        data["version"] += 1

                        shared_data["current_race_obj"].recent_drive_log["data"][data_set.key_list[idx]].append((time.time() - shared_data["start_time"], copy.deepcopy(data) )) 
                        idx += 1               
                                
                finally:
                    queue.task_done()
        elif(shared_data["log_state"] == "reset"):
            for data_key in data_set.key_list:
                shared_data["current_race_obj"].recent_drive_log["data"][data_key] = []
                