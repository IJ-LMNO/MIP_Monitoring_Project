import paho.mqtt.client as mqtt
import json
import time

BROKER_HOST = "127.0.0.1"
BROKER_PORT = 1883
TOPIC = "vehicle/car_01/#"
START_TIME = time.time()


def on_connect(client, userdata, flags, reason_code):
    if reason_code == 0:
        print("Logging_service MQTT 연결 성공")
    else:
        print(f"Monitoring_Server MQTT : {reason_code}")


def on_message(client, userdata, message):
    payload = message.payload.decode("utf-8")
    data = json.loads(payload)

    try:
        if(message.topic.split("/")[-1] == "can0"):
            userdata["can0_queue"].put(data)
        elif(message.topic.split("/")[-1] == "can1"):
            userdata["can1_queue"].put(data)
        elif(message.topic.split("/")[-1] == "gps"):
            userdata["gps_queue"].put(data)
    except:
         print("subscriber mqtt error")
     

def main(can0_queue,can1_queue,gps_queue):

    monitoring_client = mqtt.Client() 

    monitoring_client.user_data_set({
        "can0_queue" : can0_queue,
        "can1_queue" : can1_queue,
        "gps_queue" : gps_queue
    })

    monitoring_client.on_connect = on_connect
    monitoring_client.on_message = on_message

    monitoring_client.connect(BROKER_HOST, BROKER_PORT, 60)
    monitoring_client.subscribe(TOPIC, qos= 2)  
    monitoring_client.loop_forever()
