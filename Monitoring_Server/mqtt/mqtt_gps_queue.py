import copy 
import time
from collections import deque
from Monitoring_Server.api.main import get_gps_data

class gps_data_structure():
    def __init__(self):
        self.gps = {
            "latest" : {
                "latitude" : 0.0,
                "longitude" : 0.0
            },
            "timestamp" : 0.0
        }


def main(queue):
    gps_data = gps_data_structure()
    while(True):
        try:
            latest = queue.get()

            gps_data.gps.update(latest)
            get_gps_data(copy.deepcopy(gps_data.gps))
        finally:
            queue.task_done()