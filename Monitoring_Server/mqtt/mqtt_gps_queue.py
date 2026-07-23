import copy 
import time
from Monitoring_Server.api.main import get_gps_data

def main(queue, data):
    while(True):
        try:
            latest_data = queue.get()

            data["latest"]["timestamp"] = latest_data["latest"]["timestamp"]
            data["latest"]["latitude"] = latest_data["latest"]["latitude"]
            data["latest"]["longitude"] = latest_data["latest"]["longitude"]

            data["version"] += 1


            get_gps_data(copy.deepcopy(data))
        finally:
            queue.task_done()