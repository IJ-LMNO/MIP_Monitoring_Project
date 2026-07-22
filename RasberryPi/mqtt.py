import json
import threading

import paho.mqtt.client as mqtt


BROKER_HOST = "172.20.10.13"
BROKER_PORT = 1883


def can0_mqtt(client, can0_queue):
    while True:
        data = can0_queue.get()

        try:
            payload = json.dumps(data)
            client.publish(
                "vehicle/car_01/can0",
                payload,
                qos=2
            )
        finally:
            can0_queue.task_done()


def tps_mqtt(client, tps_queue):
    while True:
        data = tps_queue.get()

        try:
            payload = json.dumps(data)
            client.publish(
                "vehicle/car_01/tps",
                payload,
                qos=2
            )
        finally:
            tps_queue.task_done()


def bps_mqtt(client, bps_queue):
    while True:
        data = bps_queue.get()

        try:
            payload = json.dumps(data)
            client.publish(
                "vehicle/car_01/bps",
                payload,
                qos=2
            )
        finally:
            bps_queue.task_done()


def desired_yawrate_mqtt(client, desired_yawrate_queue):
    while True:
        data = desired_yawrate_queue.get()

        try:
            payload = json.dumps(data)
            client.publish(
                "vehicle/car_01/desiredyawrate",
                payload,
                qos=2
            )
        finally:
            desired_yawrate_queue.task_done()

def gps_mqtt(client, gps_queue):
    while True:
        data = gps_queue.get()

        try:
            payload = json.dumps(data)
            client.publish(
                "vehicle/car_01/gps",
                payload,
                qos=2
            )
        finally:
            gps_queue.task_done()


def main(
    can0_queue,
    tps_queue,
    bps_queue,
    desired_yawrate_queue,
    gps_queue
):
    client = mqtt.Client()

    client.connect(
        BROKER_HOST,
        BROKER_PORT,
        keepalive=60
    )

    client.loop_start()

    threads = [
        threading.Thread(
            target=can0_mqtt,
            args=(client, can0_queue),
            daemon=True
        ),
        threading.Thread(
            target=tps_mqtt,
            args=(client, tps_queue),
            daemon=True
        ),
        threading.Thread(
            target=bps_mqtt,
            args=(client, bps_queue),
            daemon=True
        ),
        threading.Thread(
            target=desired_yawrate_mqtt,
            args=(client, desired_yawrate_queue),
            daemon=True
        ),
        threading.Thread(
            target=gps_mqtt,
            args=(client, gps_queue),
            daemon=True
        )
    ]

    for thread in threads:
        thread.start()

    try:
        for thread in threads:
            thread.join()

    finally:
        client.loop_stop()
        client.disconnect()
