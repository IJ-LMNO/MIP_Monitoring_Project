import threading as thread
import queue
from collections import deque
from Monitoring_Server.mqtt.mqtt_subscriber import main as monitoring_server_main
from Monitoring_Server.api.main import main as fast_api_main
from Monitoring_Server.mqtt.mqtt_publisher import main as mqtt_publisher

## 센서별 put을 위한 함수 import----------------------------------------------------------------------
##---------------------------------------------------------------------------
from Monitoring_Server.mqtt.mqtt_can1_queue import main as mqtt_can1_queue
from Monitoring_Server.mqtt.mqtt_can0_queue import main as mqtt_can0_queue
from Monitoring_Server.mqtt.mqtt_gps_queue import main as mqtt_gps_queue
##---------------------------------------------------------------------------
##---------------------------------------------------------------------------




## api main의 face queue import ------------------------------------------------
##---------------------------------------------------------------------------
from Monitoring_Server.api.main import face_queue as face_queue
##---------------------------------------------------------------------------
##---------------------------------------------------------------------------








## 백엔드측 subscriber 저장소-----------------------------------------------------------------------
##---------------------------------------------------------------------------
can0_queue = queue.Queue()
can1_queue = queue.Queue()
gps_queue = queue.Queue()
button_queue = queue.Queue()
##---------------------------------------------------------------------------
##---------------------------------------------------------------------------









## 프론트엔드 시작 시그널 ----------------------------------------------------------------------
##---------------------------------------------------------------------------
Mqtt_event = thread.Event()
def check_frontend_status(frontend_status):
    if(frontend_status):
        Mqtt_event.set()
    else:
        Mqtt_event.clear()
##---------------------------------------------------------------------------
##---------------------------------------------------------------------------








## 쓰레드 -----------------------------------------------------------------
##---------------------------------------------------------------------------
def run_fast_api():
    fast_api_main()


def mqtt_publisher_thread():

    thread_mqtt = thread.Thread(
        target = mqtt_publisher,
        args = (face_queue, )
        )

    thread_mqtt.start()

def mqtt_subscriber_thread():

    thread_mqtt = thread.Thread(
        target = monitoring_server_main,
        args = (can0_queue, 
                can1_queue, 
                gps_queue,
                button_queue)
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

def mqtt_button_queue_thread():
    
    thread_mqtt_queue = thread.Thread(
        target= mqtt_gps_queue,
        args=(button_queue,)
    )

    thread_mqtt_queue.start()
##---------------------------------------------------------------------------
##---------------------------------------------------------------------------











def queue_start():
    mqtt_can0_queue_thread()
    mqtt_can1_queue_thread()
    mqtt_gps_queue_thread()


def main():
    mqtt_subscriber_thread()
    queue_start()
    fast_api_main()

