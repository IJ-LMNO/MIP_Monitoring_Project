from Backend.Backend_Mqtt.Backend_Mqtt_shared.shared_state import MQTT_event
import paho.mqtt.client as mqtt
import json


#  "100.70.221.71"
#  "127.0.0.1
BROKER_HOST = "127.0.0.1"
BROKER_PORT = 1883



# =========================================================
# backend mqtt subscriber가 구독하는 토픽
# =========================================================

TOPIC_CAN0 = "vehicle/car_01/can0"
TOPIC_CAN1 = "vehicle/car_01/can1"
TOPIC_GPS = "vehicle/car_01/gps"
TOPIC_BUTTON = "vehicle/car_01/button"




# =========================================================
# mqtt subscriber on_connect, on_message 오버라이딩
# =========================================================

def on_connect(client, userdata, flags, reason_code):
    if reason_code == 0:
        print("Monitoring_Server MQTT 연결 성공")

        client.subscribe(TOPIC_CAN0, qos=0)
        client.subscribe(TOPIC_CAN1, qos=0)
        client.subscribe(TOPIC_GPS, qos=0)
        client.subscribe(TOPIC_BUTTON, qos=0)

    else:
        print(f"Monitoring_Server MQTT : {reason_code}")


def on_message(client, userdata, message):
    try:
        payload = message.payload.decode("utf-8")
        data = json.loads(payload)

        topic = message.topic.split("/")[-1]

        if topic == "can0":
            userdata["can0_queue"].put(data)

        elif topic == "can1":
            userdata["can1_queue"].put(data)

        elif topic == "gps":
            userdata["gps_queue"].put(data)

        elif topic == "button":
            userdata["button_queue"].put(data)

    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        print(f"subscriber MQTT 데이터 파싱 오류: {error}")





# =========================================================
# backend mqtt subscriber main
# =========================================================

def main(can0_queue, can1_queue, gps_queue, button_queue):

    monitoring_client = mqtt.Client()

    monitoring_client.user_data_set({
        "can0_queue": can0_queue,
        "can1_queue": can1_queue,
        "gps_queue": gps_queue,
        "button_queue": button_queue
    })

    print("프론트 실행 대기 중")
    MQTT_event.wait()

    print("프론트 실행 확인 -> mqtt 연결")

    monitoring_client.on_connect = on_connect
    monitoring_client.on_message = on_message

    monitoring_client.connect(
        BROKER_HOST,
        BROKER_PORT,
        60
    )

    monitoring_client.loop_forever()