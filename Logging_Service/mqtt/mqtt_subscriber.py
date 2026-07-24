import paho.mqtt.client as mqtt
import json
import time

BROKER_HOST = "100.70.221.71"
BROKER_PORT = 1883
TOPIC = "vehicle/car_01/#"
START_TIME = time.time()



def on_connect(client, userdata, flags, reason_code):
    if reason_code == 0:
        print("Logging_MQTT 연결 성공")
    else:
        print(f"Logging_MQTT 연결 실패 : {reason_code}")


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
    elif(message.topic.split("/")[-1] == "gps"):
        userdata["gps_queue"].put(data) 
        
    
    

def main(can0_queue, tps_queue, bps_queue, desired_yawrate_queue, gps_queue):

    logging_client = mqtt.Client() 

    logging_client.user_data_set({
        "can0_queue" : can0_queue,
        "tps_queue" : tps_queue,
        "bps_queue" : bps_queue,
        "desired_yawrate_queue" : desired_yawrate_queue,
        "gps_queue" : gps_queue
    })

    logging_client.on_connect = on_connect
    logging_client.on_message = on_message

    logging_client.connect(BROKER_HOST, BROKER_PORT, 60)
    logging_client.subscribe(TOPIC, qos= 2)  
    logging_client.loop_forever()
