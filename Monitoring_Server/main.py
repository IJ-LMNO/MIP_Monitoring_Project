import threading as thread
import queue
from collections import deque
from Monitoring_Server.mqtt.mqtt_subscriber import main as monitoring_server_main
from Monitoring_Server.api import main as fast_api_main
from Monitoring_Server.mqtt.mqtt_queue import main as mqtt_queue_main

can0_queue = queue.Queue()
tps_queue = queue.Queue()
bps_queue = queue.Queue()
desired_yawrate_queue = queue.Queue()

can0 = {
    "latest" : 0.0,
    "history" : deque(maxlen=40)
}
tps = {
    "latest" : 0.0,
    "history" : deque(maxlen=40)
}
bps = {
    "latest" : 0.0,
    "history" : deque(maxlen=40)
}
desired_yawrate = {
    "latest" : 0.0,
    "history" : deque(maxlen=40)
}


# Lock is an object for preventing synchronization between threads
can0_lock = thread.Lock()
tps_lock = thread.Lock()
bps_lock = thread.Lock()
desired_yawrate_lock = thread.Lock()

# make thread for mqtt and start
def mqtt_subscriber_thread():

    thread_mqtt = thread.Thread(
        target = monitoring_server_main,
        args = (can0, tps, bps, desired_yawrate,can0_lock, tps_lock,bps_lock,desired_yawrate_lock)
        )

    thread_mqtt.start()

def run_fast_api():
    fast_api_main()

def mqtt_can0_queue_thread():
    
    thread_mqtt_queue = thread.Thread(
        target= mqtt_queue_main,
        args=(can0_queue, can0, can0_lock,)
    )

    thread_mqtt_queue.start()

def mqtt_tps_queue_thread():
    
    thread_mqtt_queue = thread.Thread(
        target= mqtt_queue_main,
        args=(tps_queue, tps, tps_lock,)
    )

    thread_mqtt_queue.start()

def mqtt_bps_queue_thread():
    
    thread_mqtt_queue = thread.Thread(
        target= mqtt_queue_main,
        args=(bps_queue, bps, bps_lock,)
    )

    thread_mqtt_queue.start()

def mqtt_desired_yawrate_queue_thread():
    
    thread_mqtt_queue = thread.Thread(
        target= mqtt_queue_main,
        args=(desired_yawrate_queue, desired_yawrate, desired_yawrate_lock,)
    )

    thread_mqtt_queue.start()

def mqtt_queue_thread():
    mqtt_can0_queue_thread()
    mqtt_tps_queue_thread()
    mqtt_bps_queue_thread()
    mqtt_desired_yawrate_queue_thread()



def main():
    mqtt_subscriber_thread()
    mqtt_queue_thread()
    run_fast_api(can0_queue, tps_queue, bps_queue, desired_yawrate_queue)

