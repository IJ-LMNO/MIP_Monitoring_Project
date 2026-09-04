import paho.mqtt.client as mqtt


BROKER_HOST = "127.0.0.1"
BROKER_PORT = 1883
KEEPALIVE = 60

TOPIC_FACE = "vehicle/car_01/face"


def on_connect(client, userdata, connect_flags, reason_code, properties):
    if reason_code == 0:
        print("[MQTT] subscriber 연결 성공")

        client.subscribe(
            TOPIC_FACE,
            qos=0
        )

    else:
        print(f"[MQTT] subscriber 연결 실패: {reason_code}")


def on_message(client, userdata, message):
    data = message.payload.decode("utf-8")

    if message.topic.split("/")[-1] == "face":
        with userdata["face_lock"]:
            userdata["face_status"]["status"] = data


def on_disconnect(
    client,
    userdata,
    disconnect_flags,
    reason_code,
    properties
):
    print(f"[MQTT] subscriber 연결 종료: {reason_code}")


def main(face_status, face_lock):

    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2
    )

    # callback에서 사용할 데이터 등록
    client.user_data_set({
        "face_status": face_status,
        "face_lock" : face_lock
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