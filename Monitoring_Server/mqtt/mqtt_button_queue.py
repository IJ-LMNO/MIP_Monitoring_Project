import copy 
import time
from collections import deque
from Monitoring_Server.api.main import get_gps_data

class button_data_structure():
    def __init__(self):
        self.button = {
            "time_interval" : None,
            "rap" : None
        
        }


def main(queue):
    button_data = button_data_structure()

    while(True):
        try:
            latest = queue.get()

            button_data.gps.update(latest)
            get_gps_data(copy.deepcopy(button_data.gps))
        finally:
            queue.task_done()