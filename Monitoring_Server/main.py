import threading as thread
import queue
from collections import deque
from Monitoring_Server.mqtt.mqtt_subscriber import main as monitoring_server_main
from Monitoring_Server.api.main import main as fast_api_main
from Monitoring_Server.mqtt.mqtt_can1_queue import main as mqtt_can1_queue
from Monitoring_Server.mqtt.mqtt_can0_queue import main as mqtt_can0_queue
from Monitoring_Server.mqtt.mqtt_gps_queue import main as mqtt_gps_queue

can0_queue = queue.Queue()
can1_queue = queue.Queue()
gps_queue = queue.Queue()

Mqtt_event = thread.Event()



def run_fast_api():
    fast_api_main()

def check_frontend_status(frontend_status):
    if(frontend_status):
        Mqtt_event.set()
    else:
        Mqtt_event.clear()

def mqtt_subscriber_thread():

    thread_mqtt = thread.Thread(
        target = monitoring_server_main,
        args = (can0_queue, can1_queue, gps_queue)
        )

    thread_mqtt.start()


def mqtt_can0_queue_thread():
    
    thread_mqtt_queue = thread.Thread(
        target= mqtt_can0_queue,
        args=(can0_queue,)
    )

    thread_mqtt_queue.start()

def mqtt_can1_queue_thread():
    
    thread_mqtt_queue = thread.Thread(
        target= mqtt_can1_queue,
        args=(can1_queue,)
    )

    thread_mqtt_queue.start()


def mqtt_gps_queue_thread():
    
    thread_mqtt_queue = thread.Thread(
        target= mqtt_gps_queue,
        args=(gps_queue,)
    )

    thread_mqtt_queue.start()

def queue_start():
    mqtt_can0_queue_thread()
    mqtt_can1_queue_thread()
    mqtt_gps_queue_thread()


def main():
    mqtt_subscriber_thread()
    queue_start()
    fast_api_main()

