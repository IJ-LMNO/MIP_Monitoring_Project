import json
import socket
import threading
import time

import paho.mqtt.client as mqtt

#  "100.70.221.71"
#  "127.0.0.1"
BROKER_HOST = "100.70.221.71"
BROKER_PORT = 1883
KEEPALIVE = 60
QOS = 0
mqtt_connected = threading.Event()




# =========================================================
# mqtt on_connect, on_disconnect 오버라이딩
# =========================================================

def on_connect(client, userdata, flags, reason_code):
    if reason_code == 0:
        print("[MQTT] 브로커 연결 성공")
        mqtt_connected.set()
    else:
        print(f"[MQTT] 브로커 연결 실패: {reason_code}")
        mqtt_connected.clear()


def on_disconnect(client, userdata, reason_code):
    mqtt_connected.clear()
    print(f"[MQTT] 연결 해제: {reason_code}")






# =========================================================
# data_queue에서 데이터를 get해서 publish하는 함수 : 발생할 수 있는 예외처리 포함
# =========================================================

def publish_worker(
    client,
    data_queue,
    topic,
    telemetry_name,
):

    while True:
        data = data_queue.get()

        try:
            while True:
                if not mqtt_connected.wait(timeout=1):
                    continue

                try:
                    publish_info = client.publish(
                        topic,
                        data,
                        qos=QOS,
                    )

                    if publish_info.rc != mqtt.MQTT_ERR_SUCCESS:
                        print(
                            f"[MQTT][{telemetry_name}] "
                            f"publish 요청 실패: rc={publish_info.rc}"
                        )

                        if publish_info.rc == mqtt.MQTT_ERR_NO_CONN:
                            mqtt_connected.clear()

                        time.sleep(1)
                        continue

                    publish_info.wait_for_publish(timeout=10)

                    if not publish_info.is_published():
                        print(
                            f"[MQTT][{telemetry_name}] "
                            "publish 완료 대기 시간 초과"
                        )
                        time.sleep(1)
                        continue

                    break

                except (RuntimeError, OSError, ValueError) as error:
                    print(
                        f"[MQTT][{telemetry_name}] "
                        f"publish 중 오류: {error}"
                    )
                    mqtt_connected.clear()
                    time.sleep(1)

        finally:
            data_queue.task_done()





# =========================================================
# backend mqtt publisher main
# =========================================================

def main(
    faceup_queue
):
    client_id = f"car-01-publisher-{socket.gethostname()}"
    client = mqtt.Client(client_id=client_id)

    client.on_connect = on_connect
    client._on_disconnect = on_disconnect

    client.reconnect_delay_set(
        min_delay=1,
        max_delay=10,
    )

    client.connect_async(
        BROKER_HOST,
        BROKER_PORT,
        keepalive=KEEPALIVE
    )

    client.loop_start()

    publisher_configs = [
        (
            faceup_queue,
            "vehicle/car_01/face",
            "face"
        )
    ]

    thread = []
    for data_queue, topic, name in publisher_configs:
        woker = threading.Thread(
            name = f"mqtt-{name}",
            target = publish_worker,
            args = (client, data_queue, topic, name)
        )

        woker.start()
        thread.append(woker)

    try:
        for worker in thread:
            worker.join()
    finally:
        mqtt_connected.clear()
        client.loop_stop()
        client.disconnect()
