"""Connect data processors, transport workers and the display."""

import queue
import sys
import threading

from can0 import Can0
from can1 import Can1
from can_receiver import CanRoute, create_receivers
from gps import main as gps_main
from mqtt_subscriber import main as mqtt_subscriber
from mqtt_publisher import main as mqtt_publisher
from display import main as display


def main():
    # Each consumer has its own queue: MQTT never takes a GUI update away.
    can0_queue = queue.Queue(maxsize=1)
    can1_queue = queue.Queue(maxsize=1)
    gps_queue = queue.Queue(maxsize=1)
    display_queue = queue.Queue(maxsize=1)
    lap_queue = queue.Queue(maxsize=1)
    pace_queue = queue.Queue(maxsize=1)
    stop_event = threading.Event()

    receivers = create_receivers([
        CanRoute(Can0(), can0_queue, display_queue),
        CanRoute(Can1(), can1_queue),
    ], stop_event)


    can_threads = [
        threading.Thread(
            name=f"can-reader-{receiver.channel}",
            target=receiver.run,
            daemon=True,
        )
        for receiver in receivers
    ]


    threads = can_threads + [
        threading.Thread(
            name="mqtt-publisher",
            target=mqtt_publisher,
            args=(can0_queue, can1_queue, gps_queue),
            daemon=True,
        ),
        threading.Thread(
            name="gps-reader",
            target=gps_main,
            args=(gps_queue,),
            daemon=True,
        ),
        threading.Thread(
            name="mqtt-subscriber",
            target=mqtt_subscriber,
            args=(pace_queue, lap_queue),
            daemon=True,
        ),
    ]

    try:
        for worker in threads:
            print(f"[MAIN] 스레드 시작: {worker.name}")
            worker.start()
        return display(display_queue, lap_queue, pace_queue)
    except KeyboardInterrupt:
        print("\n[MAIN] 프로그램을 종료합니다.")
        return 0
    finally:
        stop_event.set()
        for worker in can_threads:
            if worker.ident is not None:
                worker.join(timeout=3)


if __name__ == "__main__":
    sys.exit(main())
