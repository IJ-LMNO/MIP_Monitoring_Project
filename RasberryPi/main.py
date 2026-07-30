import queue
import threading

from can0 import main as can0_main
from can1 import main as can1_main
from gps import main as gps_main
from mqtt import main as mqtt_main


QUEUE_MAX_SIZE = 500


can0_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
can1_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
gps_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)


def main():
    threads = [
        threading.Thread(
            name="mqtt-publisher",
            target=mqtt_main,
            args=(
                can0_queue,
                can1_queue,
                gps_queue,
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
            args=(
                can1_queue
            ),
            daemon=True,
        ),

        threading.Thread(
            name="gps-reader",
            target=gps_main,
            args=(gps_queue,),
            daemon=True,
        ),
    ]

    for worker in threads:
        print(f"[MAIN] 스레드 시작: {worker.name}")
        worker.start()

    try:
        for worker in threads:
            worker.join()

    except KeyboardInterrupt:
        print("\n[MAIN] 프로그램을 종료합니다.")


if __name__ == "__main__":
    main()