import queue
import threading

from can0 import main as can0_main
from can1 import main as can1_main
from gps import main as gps_main
from RasberryPi.mqtt_subscriber import main as mqtt_subscriber
from RasberryPi.mqtt_publisher import main as mqtt_publisher
from RasberryPi.display import main as display
from RasberryPi.button import init as button_init


QUEUE_MAX_SIZE = 10


can0_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
can1_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
gps_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
button_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)

face_lock = threading.Lock()

face_status = {
    "status" : "hold"
}




def main():
    threads = [
        threading.Thread(
            name="mqtt-publisher",
            target=mqtt_publisher,
            args=(
                can0_queue,
                can1_queue,
                gps_queue,
                button_queue
            ),
            daemon=True,
        ),

        threading.Thread(
            name="can0-reader",
            target=can0_main,
            args=(can0_queue,),
            daemon=True,
        ),

        threading.Thread(
            name="can1-reader",
            target=can1_main,
            args=(can1_queue,),
            daemon=True,
        ),

        threading.Thread(
            name="gps-reader",
            target=gps_main,
            args=(gps_queue,),
            daemon=True,
        ),

        threading.Thread(
            name = "mqtt-subscriber",
            target=mqtt_subscriber,
            args=(face_status, face_lock),
            daemon =True
        ),

        threading.Thread(
            name = "display",
            target=display,
            args=(face_status, face_lock),
            daemon =True
        )
    ]

    for worker in threads:
        print(f"[MAIN] 스레드 시작: {worker.name}")
        worker.start()

    button_init(button_queue)

    try:
        for worker in threads:
            worker.join()

    except KeyboardInterrupt:
        print("\n[MAIN] 프로그램을 종료합니다.")


if __name__ == "__main__":
    main()