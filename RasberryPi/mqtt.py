
import json
import socket
import threading
import time

import paho.mqtt.client as mqtt


BROKER_HOST = "100.70.221.71"
BROKER_PORT = 1883
KEEPALIVE = 60
QOS = 2


mqtt_connected = threading.Event()


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


def publish_worker(
    client,
    data_queue,
    topic,
    telemetry_name,
):
    publish_count = 0

    while True:
        data = data_queue.get()

        try:
            try:
                payload = json.dumps(
                    data,
                    ensure_ascii=False,
                    separators=(",", ":"),
                )

            except (TypeError, ValueError) as error:
                print(
                    f"[MQTT][{telemetry_name}] "
                    f"JSON 변환 실패: {error}"
                )
                continue

            while True:
                if not mqtt_connected.wait(timeout=1):
                    continue

                try:
                    publish_info = client.publish(
                        topic,
                        payload,
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

                    publish_count += 1

        
                    if publish_count == 1 or publish_count % 10 == 0:
                        print(
                            f"[MQTT][{telemetry_name}] "
                            f"publish 성공 #{publish_count} "
                            f"topic={topic}"
                        )

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


def main(
    can0_queue,
    can1_queue,
    gps_queue
):
    client_id = f"car-01-publisher-{socket.gethostname()}"

    client = mqtt.Client(client_id=client_id)

    client.on_connect = on_connect
    client.on_disconnect = on_disconnect

    client.reconnect_delay_set(
        min_delay=1,
        max_delay=10,
    )

    client.connect_async(
        BROKER_HOST,
        BROKER_PORT,
        keepalive=KEEPALIVE,
    )

    client.loop_start()

    publisher_configs = [
        (
            can0_queue,
            "vehicle/car_01/can0",
            "can0",
        ),
        (
            can1_queue,
            "vehicle/car_01/can1",
            "tps",
        ),
        (
            gps_queue,
            "vehicle/car_01/gps",
            "gps",
        ),
    ]

    publisher_threads = []

    for data_queue, topic, telemetry_name in publisher_configs:
        worker = threading.Thread(
            name=f"mqtt-{telemetry_name}",
            target=publish_worker,
            args=(
                client,
                data_queue,
                topic,
                telemetry_name,
            ),
            daemon=True,
        )

        worker.start()
        publisher_threads.append(worker)

    try:
        for worker in publisher_threads:
            worker.join()

    finally:
        mqtt_connected.clear()
        client.loop_stop()
        client.disconnect()