import paho.mqtt.client as mqtt
import json

BROKER_HOST = "localhost"
BROKER_PORT = 1883

def can0_mqtt(client, can0_queue):
    data = can0_queue.get()
    payload = json.dump(data)

    client.publish("vehicle/car_01/can_0", payload, qos = 2)
    
def tps_mqtt(client, tps_queue):
    data = tps_queue.get()
    payload = json.dump(data)

    client("vehicle/car_01/tps", payload, qos = 2)

def bps_mqtt(client, bps_queue):
    data = bps_queue.get()
    payload = json.dump(data)

    client("vehicle/car_01/bps", payload, qos = 2)

def desired_yawrate_mqtt(client, desired_yawrate_queue):
        data = desired_yawrate_queue.get()
        payload = json.dump(data)

        client("vehicle/car_01/desiredyawrate", payload, qos = 2)



def main(can0_queue, tps_queue, bps_queue, desired_yawrate_queue):
    client = mqtt.Client()
    client.connect(BROKER_HOST, BROKER_PORT, 60)
    client.loop_start()


    while(True):
        can0_mqtt(client, can0_queue)
        tps_mqtt(client, tps_queue)
        bps_mqtt(client, bps_queue)
        desired_yawrate_mqtt(client, desired_yawrate_queue)
