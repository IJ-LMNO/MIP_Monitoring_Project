import threading as thread
import queue
from collections import deque
from Monitoring_Server.mqtt.mqtt_subscriber import main as monitoring_server_main
from Monitoring_Server.api.main import main as fast_api_main
from Monitoring_Server.mqtt.mqtt_can1_queue import main as mqtt_can1_queue
from Monitoring_Server.mqtt.mqtt_can0_queue import main as mqtt_can0_queue
from Monitoring_Server.mqtt.mqtt_gps_queue import main as mqtt_gps_queue

can0_queue = queue.Queue()
tps_queue = queue.Queue()
bps_queue = queue.Queue()
desired_yawrate_queue = queue.Queue()
gps_queue = queue.Queue()

can0_lock = thread.Lock()
tps_lock = thread.Lock()
bps_lock = thread.Lock()
desired_yawrate_lock = thread.Lock()
gps_lock = thread.Lock() 

can0 = {
    "latest" : {
<<<<<<< HEAD
        'avg_rpm' : 0.0,
        'avg_voltage' : 0.0,
        "avg_power" : 0.0,

        "speed" : 0.0,

        "power_left" : 0.0,
        "power_right" : 0.0,
        "current_left" : 0.0,
        "current_right" : 0.0,
        "rpm_left" : 0.0,
        "rpm_right" : 0.0
},
    "history" : {
        "current_left" : deque(maxlen=40),
        "current_right" : deque(maxlen = 40),
=======
        'avg_rpm': 0.0,
        'avg_voltage': 0.0,
        "avg_power": 0.0,   

        "power_right": 0.0,
        "power_left": 0.0,

        "speed": 0.0,

        "current_left": 0.0,
        "current_right": 0.0,
        
        "rpm_left": 0.0,
        "rpm_right": 0.0
    },
    "history" : {
        "current_right" : deque(maxlen=40),
        "current_left" : deque(maxlen=40),
>>>>>>> 1683a56e6b0b817cb0449def7bf960226505e636
        "avg_power" : deque(maxlen=40)
    },
    "version" : 0
}
tps = {
    "latest" : 0.0,
    "history" : deque(maxlen=40),
    "version" : 0
}
bps = {
    "latest" : 0.0,
    "history" : deque(maxlen=40),
    "version" : 0
}
desired_yawrate = {
    "latest" : 0.0,
    "history" : deque(maxlen=40),
    "version" : 0
}
gps = {
    "latest" : {
        "timestamp" : 0.0,
        "latitude" : 0.0,
        "longitude" : 0.0
    },

    "version" : 0
}


<<<<<<< HEAD

def run_fast_api():
    fast_api_main()


=======
>>>>>>> 1683a56e6b0b817cb0449def7bf960226505e636
def mqtt_subscriber_thread():

    thread_mqtt = thread.Thread(
        target = monitoring_server_main,
        args = (can0_queue, tps_queue, bps_queue, desired_yawrate_queue,gps_queue,)
        )

    thread_mqtt.start()

def mqtt_can0_queue_thread():
    
    thread_mqtt_queue = thread.Thread(
        target= mqtt_can0_queue,
        args=(can0_queue, can0, can0_lock, 0)
    )

    thread_mqtt_queue.start()

def mqtt_tps_queue_thread():
    
    thread_mqtt_queue = thread.Thread(
        target= mqtt_can1_queue,
        args=(tps_queue, tps,tps_lock, 1)
    )

    thread_mqtt_queue.start()

def mqtt_bps_queue_thread():
    
    thread_mqtt_queue = thread.Thread(
        target= mqtt_can1_queue,
        args=(bps_queue, bps,bps_lock,2)
    )

    thread_mqtt_queue.start()

def mqtt_desired_yawrate_queue_thread():
    
    thread_mqtt_queue = thread.Thread(
        target= mqtt_can1_queue,
        args=(desired_yawrate_queue, desired_yawrate, desired_yawrate_lock,3)
    )

    thread_mqtt_queue.start()

def mqtt_gps_queue_thread():
    
    thread_mqtt_queue = thread.Thread(
        target= mqtt_gps_queue,
        args=(gps_queue, gps, 4)
    )

    thread_mqtt_queue.start()

def queue_start():
    mqtt_can0_queue_thread()
    mqtt_tps_queue_thread()
    mqtt_bps_queue_thread()
    mqtt_desired_yawrate_queue_thread()
    mqtt_gps_queue_thread()



def main():
    mqtt_subscriber_thread()
    queue_start()
    run_fast_api()
<<<<<<< HEAD
=======

>>>>>>> 1683a56e6b0b817cb0449def7bf960226505e636
