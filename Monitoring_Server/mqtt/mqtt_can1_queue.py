import copy, time
from Monitoring_Server.api.main import get_tps_data, get_desired_yawrate_data, get_yawrate_data, get_rollrate_data, get_steeringhandle_data, get_tiredegree_data

def main(queue, data, type):
    while(True):
        try:
            latest_data = queue.get()

            data["latest"] = latest_data
            data["history"].append(latest_data)

            data["version"] += 1

            if(type == "tps"):
                get_tps_data(copy.deepcopy(data))
            elif(type == "desired_yawrate"):
                get_desired_yawrate_data(copy.deepcopy(data))
            elif(type == "yawrate"):
                get_yawrate_data(copy.deepcopy(data))
            elif(type == "rollrate"):
                get_rollrate_data(copy.deepcopy(data))
            elif(type == "steeringhandle"):
                get_steeringhandle_data(copy.deepcopy(data))
            elif(type == "tiredegree"):
                get_tiredegree_data(copy.deepcopy(data))
        finally:
            queue.task_done()

