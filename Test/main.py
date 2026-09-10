import queue
import threading

from create_can0_data import main as can0_main
from create_can1_data import main as can1_main
from create_gps_data import main as gps_main
from mqtt_subscriber import main as mqtt_subscriber
from mqtt_publisher import main as mqtt_publisher

from Shared_Data.shared_data import can0_queue
from Shared_Data.shared_data import can1_queue
from Shared_Data.shared_data import gps_queue
from Shared_Data.shared_data import pace_queue
from Shared_Data.shared_data import button_queue_for_display
from Shared_Data.shared_data import button_queue_for_mqtt


QUEUE_MAX_SIZE = 10


def main():
    threads = [
        threading.Thread(
            name="mqtt-publisher",
            target=mqtt_publisher,
            args=(
                can0_queue,
                can1_queue,
                gps_queue,
                button_queue_for_mqtt
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
            name="mqtt-subscriber",
            target=mqtt_subscriber,
            args=(pace_queue,),
            daemon=True,
        )
    ]

    try:
        for worker in threads:
            print(f"[MAIN] 스레드 시작: {worker.name}")
            worker.start()

        # 모든 작업 스레드가 끝날 때까지 메인 스레드 대기
        for worker in threads:
            worker.join()

    except KeyboardInterrupt:
        print("\n[MAIN] 프로그램을 종료합니다.")


if __name__ == "__main__":
    main()