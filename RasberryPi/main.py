import queue
import threading

from can0 import main as can0_main
from can1 import main as can1_main
from gps import main as gps_main
from mqtt import main as mqtt_main


# MQTT 연결이 잠시 끊겼을 때 무한정 메모리가 증가하지 않도록 제한
QUEUE_MAX_SIZE = 500


can0_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)

tps_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
desired_yawrate_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
yawrate_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
rollrate_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
tiredegree_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
steeringhandle_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)

gps_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)


def main():
    threads = [
        # MQTT를 먼저 시작한다.
        # 센서 데이터가 Queue에 들어오기 전에 브로커 연결을 시도하기 위함이다.
        threading.Thread(
            name="mqtt-publisher",
            target=mqtt_main,
            args=(
                can0_queue,
                tps_queue,
                desired_yawrate_queue,
                gps_queue,
                yawrate_queue,
                rollrate_queue,
                tiredegree_queue,
                steeringhandle_queue,
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
                tps_queue,
                desired_yawrate_queue,
                yawrate_queue,
                rollrate_queue,
                tiredegree_queue,
                steeringhandle_queue,
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