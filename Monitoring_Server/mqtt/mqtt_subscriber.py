import paho.mqtt.client as mqtt
import json
import time

BROKER_HOST = "100.70.221.71"
BROKER_PORT = 1883
TOPIC = "vehicle/car_01/#"
START_TIME = time.time()


def on_connect(client, userdata, flags, reason_code):
    if reason_code == 0:
        print("MQTT 연결 성공")
    else:
        print(f"MQTT 연결 실패 : {reason_code}")


def on_message(client, userdata, message):
    payload = message.payload.decode("utf-8")
    data = json.loads(payload)
    
    if(message.topic.split("/")[-1] == "can0"):
        userdata["can0_queue"].put(data)
    elif(message.topic.split("/")[-1] == "tps"):
        userdata["tps_queue"].put(data)
    elif(message.topic.split("/")[-1] == "desiredyawrate"):
        userdata["desired_yawrate_queue"].put(data) 
    elif(message.topic.split("/")[-1] == "gps"):
        userdata["gps_queue"].put(data) 
    elif(message.topic.split("/")[-1] == "yawrate"):
            userdata["yawrate_queue"].put(data) 
    elif(message.topic.split("/")[-1] == "rollrate"):
            userdata["rollrate_queue"].put(data) 
    elif(message.topic.split("/")[-1] == "tiredegree"):
            userdata["tiredegree_queue"].put(data) 
    elif(message.topic.split("/")[-1] == "steeringhandle"):
            userdata["steeringhandle_queue"].put(data) 
                
    
    

def main(can0_queue, tps_queue, desired_yawrate_queue,gps_queue,yawrate_queue,rollrate_queue,tiredegree_queue,steeringhandle_queue):

    monitoring_client = mqtt.Client() 

    monitoring_client.user_data_set({
        "can0_queue" : can0_queue,
        "tps_queue" : tps_queue,
        "desired_yawrate_queue" : desired_yawrate_queue,
        "gps_queue" : gps_queue,
        "yawrate_queue" : yawrate_queue,
        "rollrate_queue" : rollrate_queue,
        "steeringhandle_queue" : steeringhandle_queue,
        "tiredegree_queue" : tiredegree_queue
    })

    monitoring_client.on_connect = on_connect
    monitoring_client.on_message = on_message

    monitoring_client.connect(BROKER_HOST, BROKER_PORT, 60)
    monitoring_client.subscribe(TOPIC, qos= 2)  
    monitoring_client.loop_forever()
