import threading as thread
import queue

# 백엔드쪽 mqtt 통신을 위한 publisher, subscirber
from Backend.Backend_Mqtt.Backend_Mqtt_Subscriber import main as monitoring_server_main
from Backend.Backend_Mqtt.Backend_Mqtt_Publisher import main as mqtt_publisher
from Backend.Backend_Mqtt.Backend_Mqtt_shared.shared_state import MQTT_event as MQTT_publisher_event

# 센서별 queue consumer
from Backend.Backend_Mqtt.Can1_Adapter import main as mqtt_can1_queue
from Backend.Backend_Mqtt.Can0_Adapter import main as mqtt_can0_queue
from Backend.Backend_Mqtt.Gps_Adapter import main as mqtt_gps_queue
from Backend.Backend_Mqtt.Button_Adapter import main as mqtt_button_queue

# API 쪽 Face queue
from Backend.FastAPI.FastAPI import face_queue


# =========================================================
# MQTT Subscriber → sensor consumer로 전달할 Queue
# =========================================================

can0_queue = queue.Queue()
can1_queue = queue.Queue()
gps_queue = queue.Queue()
button_queue = queue.Queue()


# =========================================================
# Thread functions
# =========================================================

def mqtt_publisher_thread():
    worker = thread.Thread(
        name="mqtt-publisher",
        target=mqtt_publisher,
        args=(face_queue,),
        daemon=True
    )

    worker.start()


def mqtt_subscriber_thread():
    worker = thread.Thread(
        name="mqtt-subscriber",
        target=monitoring_server_main,
        args=(
            can0_queue,
            can1_queue,
            gps_queue,
            button_queue,
        ),
        daemon=True
    )

    worker.start()


def mqtt_can0_queue_thread():
    worker = thread.Thread(
        name="can0-queue-consumer",
        target=mqtt_can0_queue,
        args=(can0_queue,),
        daemon=True
    )

    worker.start()


def mqtt_can1_queue_thread():
    worker = thread.Thread(
        name="can1-queue-consumer",
        target=mqtt_can1_queue,
        args=(can1_queue,),
        daemon=True
    )

    worker.start()


def mqtt_gps_queue_thread():
    worker = thread.Thread(
        name="gps-queue-consumer",
        target=mqtt_gps_queue,
        args=(gps_queue,),
        daemon=True
    )

    worker.start()


def mqtt_button_queue_thread():
    worker = thread.Thread(
        name="button-queue-consumer",
        target=mqtt_button_queue,
        args=(button_queue,),
        daemon=True
    )

    worker.start()


# =========================================================
# 센서 스레드 시작 / mqtt pub, sub와는 분리
# =========================================================

def queue_start():
    mqtt_can0_queue_thread()
    mqtt_can1_queue_thread()
    mqtt_gps_queue_thread()
    mqtt_button_queue_thread()


# =========================================================
# Main
# =========================================================

def main():

    # Raspberry Pi → Monitoring Server
    mqtt_subscriber_thread()

    # Monitoring Server → Raspberry Pi
    # Face Up / Down / Hold publish
    mqtt_publisher_thread()

    # MQTT subscriber queue consumers
    queue_start()


if __name__ == "__main__":
    main()
