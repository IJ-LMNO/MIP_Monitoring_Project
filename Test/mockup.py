import json
import math
import random
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt


BROKER_HOST = "127.0.0.1"
BROKER_PORT = 1883

PUBLISH_HZ = 1
PUBLISH_INTERVAL = 1 / PUBLISH_HZ

BASE_TOPIC = "vehicle/car_01"

can0 ={       
    "latest" : {
            "avg_rpm": 0,
            "avg_voltage": 0,
            "avg_power": 0,
            "speed": 0,

            "power_left": 0,
            "power_right": 0,

            "current_left": 0,
            "current_right": 0,

            "rpm_left": 0,
            "rpm_right": 0,

            "torque_left" : 0,
            "torque_right" : 0
        }}


def create_can0_data(elapsed_time: float) -> dict:
    speed = 50 + 20 * math.sin(elapsed_time * 0.5)

    rpm_left = 3000 + 500 * math.sin(elapsed_time)
    rpm_right = 3000 + 500 * math.sin(elapsed_time + 0.1)

    voltage = 48 + random.uniform(-0.3, 0.3)

    current_left = 20 + random.uniform(-2, 2)
    current_right = 20 + random.uniform(-2, 2)

    torque_left =  20 + random.uniform(-2, 2)
    torque_right = 20 + random.uniform(-2,2)

    power_left = voltage * current_left
    power_right = voltage * current_right

    return {
        "latest" : {
            "avg_rpm": int(round((rpm_left + rpm_right) / 2, 2)),
            "avg_voltage": int(round(voltage, 2)),
            "avg_power": int(round((power_left + power_right) / 2, 2)),
            "speed": int(round(speed, 2)),

            "power_left": int(round(power_left, 2)),
            "power_right": int(round(power_right, 2)),

            "current_left": int(round(current_left, 2)),
            "current_right": int(round(current_right, 2)),

            "rpm_left": round(rpm_left, 2),
            "rpm_right": round(rpm_right, 2),

            "torque_left" : round(torque_left,2),
            "torque_right" : round(torque_right, 2)
        }
    }


def create_tps_data(elapsed_time: float) -> dict:
    throttle = 50 + 40 * math.sin(elapsed_time * 0.7)

    return {
        "latest" : round(max(0, min(100, throttle)), 2)

    }


def create_desired_yawrate_data(elapsed_time: float) -> dict:
    desired_yawrate = 20 * math.sin(elapsed_time * 0.8)

    return {
        "latest" : round(desired_yawrate, 2)

    }


def create_yawrate_data(elapsed_time: float) -> dict:
    yawrate = 20 * math.sin(elapsed_time * 0.8)
    yawrate += random.uniform(-1, 1)

    return {
        "latest": round(yawrate, 2)

    }


def create_rollrate_data(elapsed_time: float) -> dict:
    rollrate = 8 * math.sin(elapsed_time * 0.6)

    return {
        "latest" : round(rollrate, 2) 
        
    }


def create_steeringhandle_data(elapsed_time: float) -> dict:
    steering_angle = 180 * math.sin(elapsed_time * 0.3)

    return {
        "latest" : round(steering_angle, 2)
        
    }


def create_tiredegree_data(elapsed_time: float) -> dict:
    tire_degree = 30 * math.sin(elapsed_time * 0.3)

    return {
        "latest" : round(tire_degree, 2)
    }


def create_gps_data(elapsed_time: float) -> dict:
    base_latitude = 37.450000
    base_longitude = 127.130000

    latitude = base_latitude + 0.001 * math.sin(elapsed_time * 0.05)
    longitude = base_longitude + 0.001 * math.cos(elapsed_time * 0.05)

    speed = 50 + 20 * math.sin(elapsed_time * 0.5)
    heading = (elapsed_time * 5) % 360

    return {
        "latest" : {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "latitude": round(latitude, 7),
            "longitude": round(longitude, 7),
        }
    }


def publish_json(
    client: mqtt.Client,
    topic: str,
    payload: dict,
) -> None:
    message = json.dumps(payload)

    result = client.publish(
        topic=topic,
        payload=message,
        qos=0,
        retain=False,
    )

    if result.rc != mqtt.MQTT_ERR_SUCCESS:
        print(f"[발행 실패] topic={topic}, result={result.rc}")


def main() -> None:
    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2
    )

    try:
        client.connect(
            host=BROKER_HOST,
            port=BROKER_PORT,
            keepalive=60,
        )
    except ConnectionRefusedError:
        print(
            "Mosquitto 브로커에 연결할 수 없습니다. "
            "브로커가 127.0.0.1:1883에서 실행 중인지 확인하세요."
        )
        return

    client.loop_start()

    print(f"MQTT Publisher 시작: {BROKER_HOST}:{BROKER_PORT}")
    print(f"발행 주기: {PUBLISH_HZ}Hz")
    print("종료하려면 Ctrl+C를 누르세요.")

    start_time = time.monotonic()
    sequence = 0

    try:
        while True:
            cycle_start = time.monotonic()
            elapsed_time = cycle_start - start_time

            sensor_data = {
                "can0": create_can0_data(elapsed_time),
                "can1" : {
                    "tps": create_tps_data(elapsed_time),
                    "desired-yawrate": create_desired_yawrate_data(elapsed_time),
                    "yawrate": create_yawrate_data(elapsed_time),
                    "rollrate": create_rollrate_data(elapsed_time),
                    "steeringhandle": create_steeringhandle_data(elapsed_time),
                    "tiredegree": create_tiredegree_data(elapsed_time),            
                },
                "gps": create_gps_data(elapsed_time),
            }

            # if(elapsed_time > 5):
            #     print("5초 지남")              
            #     sensor_data = {
            #         "can0": create_can0_data(elapsed_time),
            #         "can1" : {
            #             "tps": create_tps_data(elapsed_time),
            #             "desired-yawrate": create_desired_yawrate_data(elapsed_time),
            #             "yawrate": create_yawrate_data(elapsed_time),
            #             "rollrate": create_rollrate_data(elapsed_time),
            #             "steeringhandle": create_steeringhandle_data(elapsed_time),
            #             "tiredegree": create_tiredegree_data(elapsed_time),
            #         },
            #         "gps": create_gps_data(elapsed_time),
            #     }
            # else:
            #     sensor_data = {
            #         "can0": can0
            #     }

            for sensor_name, payload in sensor_data.items():
                payload["version"] = sequence

                publish_json(
                    client=client,
                    topic=f"{BASE_TOPIC}/{sensor_name}",
                    payload=payload,
                )

            print(
                f"\r발행 중 | version={sequence} "
                f"| 센서={len(sensor_data)}개",
                end="",
                flush=True,
            )

            sequence += 1

            processing_time = time.monotonic() - cycle_start
            sleep_time = PUBLISH_INTERVAL - processing_time

            if sleep_time > 0:
                time.sleep(sleep_time)

    except KeyboardInterrupt:
        print("\nPublisher를 종료합니다.")

    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()