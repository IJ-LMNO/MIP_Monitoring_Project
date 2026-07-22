import copy 
import time
from Monitoring_Server.api.main import get_can0_data, get_bps_data, get_tps_data, get_desired_yawrate_data, get_gps_data

def main(queue, data, type):
    while(True):
        latest_data = queue.get()

        data["latest"]["timestamp"] = latest_data["latest"]["timestamp"]
        data["latest"]["latitude"] = latest_data["latest"]["latitude"]
        data["latest"]["longitude"] = latest_data["latest"]["longitude"]

        data["version"] += 1

        print(data["latest"])

        if(type == 0):
            get_can0_data(copy.deepcopy(data))
        elif(type == 1):
            get_tps_data(copy.deepcopy(data))
        elif(type == 2):
            get_bps_data(copy.deepcopy(data))
        elif(type == 3):
            get_desired_yawrate_data(copy.deepcopy(data))
        elif(type == 4):
            get_gps_data(data)