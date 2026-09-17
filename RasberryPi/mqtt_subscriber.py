from data_channel import put_latest

import paho.mqtt.client as mqtt


BROKER_HOST = "100.70.221.71"
BROKER_PORT = 1883
KEEPALIVE = 60

TOPIC_FACE = "vehicle/car_01/face"
TOPIC_LAP = "vehicle/car_01/lap"


def on_connect(client, userdata, connect_flags, reason_code, properties):
    if reason_code == 0:
        print("[MQTT] subscriber connect succeeded")

        client.subscribe(
            TOPIC_FACE,
            qos=0
        )
        client.subscribe(
            TOPIC_LAP,
            qos=0
        )

    else:
        print(f"[MQTT] subscriber connect failed: {reason_code}")


def on_message(client, userdata, message):
    if message.topic not in (TOPIC_FACE, TOPIC_LAP):
        return

    try:
        data = message.payload.decode("utf-8").strip()

        if message.topic == TOPIC_LAP:
            lap_count = int(data)
            if lap_count < 0:
                raise ValueError("lap count must be non-negative")
            put_latest(userdata["lap_queue"], lap_count)
        elif message.topic == TOPIC_FACE:
            put_latest(userdata["pace_queue"], data)
    except (UnicodeDecodeError, ValueError) as error:
        print(f"[MQTT] 잘못된 메시지 무시: topic={message.topic}, error={error}")


def on_disconnect(
    client,
    userdata,
    disconnect_flags,
    reason_code,
    properties
):
    print(f"[MQTT] subscriber 연결 종료: {reason_code}")


def main(pace_queue, lap_queue):

    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2
    )

    # callback에서 사용할 데이터 등록
    client.user_data_set({
        "pace_queue": pace_queue,
        "lap_queue": lap_queue,
    })

    # callback 등록
    client.on_connect = on_connect
    client.on_message = on_message
    client.on_disconnect = on_disconnect

    # 재연결 간격
    client.reconnect_delay_set(
        min_delay=1,
        max_delay=10
    )

    # 비동기로 최초 연결 시도
    client.connect_async(
        BROKER_HOST,
        BROKER_PORT,
        keepalive=KEEPALIVE
    )

    # MQTT network loop 실행
    client.loop_forever(
        retry_first_connection=True
    )
