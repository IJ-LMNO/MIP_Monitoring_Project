import copy 
import time
from collections import deque
from Monitoring_Server.api.main import get_gps_data

class gps_data_structure():
    def __init__():
        gps = {
            "latest" : {
                "timestamp" : 0.0,
                "latitude" : 0.0,
                "longitude" : 0.0
            },

            "history" : deque(maxlen=40),

            "version" : 0
        }


def main(queue):
    gps_data = gps_data_structure()
    while(True):
        try:
            latest_data = queue.get()

            gps_data.gps["latest"]["timestamp"] = latest_data["latest"]["timestamp"]
            gps_data.gps["latest"]["latitude"] = latest_data["latest"]["latitude"]
            gps_data.gps["latest"]["longitude"] = latest_data["latest"]["longitude"]

            gps_data.gps["history"].append(latest_data)

            gps_data.gps["version"] += 1


            get_gps_data(copy.deepcopy(gps_data.gps))
        finally:
            queue.task_done()