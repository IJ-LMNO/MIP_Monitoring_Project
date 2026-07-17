import paho.mqtt.client as mqtt
import json
import time
from Monitoring_Server.log import main as main

BROKER_HOST = "localhost"
BROKER_PORT = 1883
TOPIC = "vehicle/car_01/#"
START_TIME = time.time()

# update recent drive log which locate in log.py
# isolate methods due to maintenace
def update_recent_drive_log(key, data):
    main.update_recent_drive_log(key, data, START_TIME)

# update lastest_data which locate in main.py
def update_lastest_data(key, latest_data, data):
    latest_data[key] = data

# callback_function : this methond run when you first connect to broker server
def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("MQTT 연결 성공")
    else:
        print(f"MQTT 연결 실패 : {reason_code}")

# callback_function : this methond run when you receive mqtt message
# mqtt message type is mqttmessage object : for this reason we must decode mqttmessage type to json
def on_message(client, userdata, message):
    payload = message.payload.decode("utf-8")
    data = json.loads(payload)
    
    if(message.topic.split("/")[-1] == "can_0"):
        with userdata["can0_lock"]:
            userdata["can0"]["latest"] = data
            userdata["can0"]["history"].append(data)
    elif(message.topic.split("/")[-1] == "tps"):
        with userdata["tps_lock"]:
            userdata["tps"]["latest"] = data
            userdata["tps"]["history"].append(data)
    elif(message.topic.split("/")[-1] == "bps"):
        with userdata["bps_lock"]:
            userdata["bps"]["latest"] = data
            userdata["bps"]["history"].append(data)
    elif(message.topic.split("/")[-1] == "desiredyawrate"):
        with userdata["desired_yawrate_lock"]:
            userdata["desired_yawrate"]["latest"] = data
            userdata["desired_yawrate"]["history"].append(data)
        
    
    
# monitoring server mqtt entry methond
def main(can0, tps, bps, desired_yawrate, can0_lock, tps_lock,bps_lock,desired_yawrate_lock):
    monitoring_client = mqtt.Client() 

    monitoring_client.user_data_set({
        "can0" : can0,
        "tps" : tps,
        "bps" : bps,
        "desired_yawrate" : desired_yawrate,
        "can0_lock" : can0_lock,
        "tps_lock" : tps_lock,
        "desired_yawrate_lock" : desired_yawrate_lock

    })

    monitoring_client.on_connect = on_connect
    monitoring_client.on_message = on_message

    monitoring_client.connect(BROKER_HOST, BROKER_PORT, 60)
    monitoring_client.subscribe(TOPIC, qos= 2)  
    monitoring_client.loop_forever()
