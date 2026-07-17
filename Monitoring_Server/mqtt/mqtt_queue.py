import copy, time
from Monitoring_Server.api.main import get_can0_data, get_bps_data, get_tps_data, get_desired_yawrate_data

def main(queue, data, lock, type):
    while(True):
        latest_data = queue.get()

        data["latest"] = latest_data
        data["history"].append(latest_data)

        data["version"] += 1

        if(type == 0):
            get_can0_data(copy.deepcopy(data))
        elif(type == 1):
            get_tps_data(copy.deepcopy(data))
        elif(type == 2):
            get_bps_data(copy.deepcopy(data))
        elif(type == 3):
            get_desired_yawrate_data(copy.deepcopy(data))
