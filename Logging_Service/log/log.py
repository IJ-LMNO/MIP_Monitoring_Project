import time

def can0_logging(current_race_obj, log_state, start_time, can0_queue):
    if(log_state == "start"):
        latest_can0 = can0_queue.get()

        insert_data = (start_time - time.time(), latest_can0)

        current_race_obj["data"]["can0"].append(insert_data)
    elif(log_state == "reset"):
        current_race_obj["data"]["can0"] = []


def tps_logging(current_race_obj, log_state, start_time, tps_queue):
    if(log_state == "start"):
        latest_can0 = tps_queue.get()

        insert_data = (start_time - time.time(), latest_can0)

        current_race_obj["data"]["tps"].append(insert_data)
    elif(log_state == "reset"):
        current_race_obj["data"]["tps"] = []


def bps_logging(current_race_obj, log_state, start_time, bps_queue):
    if(log_state == "start"):
        latest_can0 = bps_queue.get()

        insert_data = (start_time - time.time(), latest_can0)

        current_race_obj["data"]["bps"].append(insert_data)
    elif(log_state == "reset"):
        current_race_obj["data"]["bps"] = []


def desired_yawrate_logging(current_race_obj, log_state, start_time, desired_yawrate_queue):
    if(log_state == "start"):
        latest_can0 = desired_yawrate_queue.get()

        insert_data = (start_time - time.time(), latest_can0)

        current_race_obj["data"]["desired_yawrate"].append(insert_data)
    elif(log_state == "reset"):
        current_race_obj["data"]["desired_yawrate"] = []
        

def gps_logging(current_race_obj, log_state, start_time, gps_queue):
    if(log_state == "start"):
        latest_can0 = gps_queue.get()

        insert_data = (start_time - time.time(), latest_can0)

        current_race_obj["data"]["gps"].append(insert_data)
    elif(log_state == "reset"):
        current_race_obj["data"]["gps"] = []