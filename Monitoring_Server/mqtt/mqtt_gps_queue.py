import copy 
import time
from collections import deque
from Monitoring_Server.api.api_main import get_gps_data

class gps_data_structure():
    def __init__(self):
        self.gps = {
            "latest" : {
                "timestamp" : 0.0,
                "latitude" : 0.0,
                "longitude" : 0.0,
                "status" : 0
            },

            "history" : deque(maxlen=40),

            "version" : 0
        }


def main(queue):
    gps_data = gps_data_structure()
    while(True):
        try:
            # print(f"mqtt_gps_line25>{queue.qsize()}")
            latest_data = queue.get()

            gps_data.gps["latest"]["timestamp"] = latest_data["latest"]["timestamp"]
            gps_data.gps["latest"]["latitude"] = latest_data["latest"]["latitude"]
            gps_data.gps["latest"]["longitude"] = latest_data["latest"]["longitude"]
            gps_data.gps["latest"]["status"] = latest_data["latest"]["status"]


            gps_data.gps["history"].append(latest_data)

            gps_data.gps["version"] += 1


            get_gps_data(copy.deepcopy(gps_data.gps))
        finally:
            queue.task_done()