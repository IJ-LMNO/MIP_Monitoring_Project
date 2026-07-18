import paho.mqtt.client as mqtt
import json
import time
from Monitoring_Server.log import main as main

BROKER_HOST = "localhost"
BROKER_PORT = 1883
TOPIC = "vehicle/car_01/#"
START_TIME = time.time()


def update_recent_drive_log(key, data):
    main.update_recent_drive_log(key, data, START_TIME)

def update_lastest_data(key, latest_data, data):
    latest_data[key] = data


def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("MQTT 연결 성공")
    else:
        print(f"MQTT 연결 실패 : {reason_code}")


def on_message(client, userdata, message):
    payload = message.payload.decode("utf-8")
    data = json.loads(payload)
    
    if(message.topic.split("/")[-1] == "can_0"):
        userdata["can0_queue"].put(data)
    elif(message.topic.split("/")[-1] == "tps"):
        userdata["tps_queue"].put(data)
    elif(message.topic.split("/")[-1] == "bps"):
        userdata["bps_queue"].put(data)
    elif(message.topic.split("/")[-1] == "desiredyawrate"):
        userdata["desired_yawrate_queue"].put(data) 
        
    
    
def main(can0_queue, tps_queue, bps_queue, desired_yawrate_queue):
    monitoring_client = mqtt.Client() 

    monitoring_client.user_data_set({
        "can0_queue" : can0_queue,
        "tps_queue" : tps_queue,
        "bps_queue" : bps_queue,
        "desired_yawrate_queue" : desired_yawrate_queue
    })

    monitoring_client.on_connect = on_connect
    monitoring_client.on_message = on_message

    monitoring_client.connect(BROKER_HOST, BROKER_PORT, 60)
    monitoring_client.subscribe(TOPIC, qos= 2)  
    monitoring_client.loop_forever()
