import json
import math
import random
import time
from datetime import datetime, timezone



PUBLISH_HZ = 1
PUBLISH_INTERVAL = 1 / PUBLISH_HZ


def create_can0_data(elapsed_time: float) -> dict:
    speed = 50 + 20 * math.sin(elapsed_time * 0.5)

    rpm_left = 3000 + 500 * math.sin(elapsed_time)
    rpm_right = 3000 + 500 * math.sin(elapsed_time + 0.1)

    voltage = 48 + random.uniform(-0.3, 0.3)

    current_left = 20 + random.uniform(-2, 2)
    current_right = 20 + random.uniform(-2, 2)

    torque_left =  20 + random.uniform(-2, 2)
    torque_right = 20 + random.uniform(-2,2)

    power_left = 750 + random.uniform(-500, 500)
    power_right = 750 + random.uniform(-500, 500)

    return {
        "latest" : {
            "avg_rpm": (round((rpm_left + rpm_right) / 2, 2)),
            "avg_voltage": (round(voltage, 2)),
            "avg_power": (round((power_left + power_right) / 2, 2)),
            "speed": (round(speed, 2)),

            "power_left": (round(power_left, 2)),
            "power_right": (round(power_right, 2)),

            "current_left": (round(current_left, 2)),
            "current_right": (round(current_right, 2)),

            "rpm_left": round(rpm_left, 2),
            "rpm_right": round(rpm_right, 2),

            "torque_left" : round(torque_left,2),
            "torque_right" : round(torque_right, 2)
        },
        "timestamp" : datetime.now(timezone.utc).isoformat()
    }




def main(can0_queue):
    start_time = time.monotonic()

    while(True):
        try:
            cycle_start = time.monotonic()
            elapsed_time = cycle_start - start_time
            create_can0 = create_can0_data(elapsed_time)

            can0 = {
                "latest" : create_can0["latest"],
                "timestamp" : create_can0["timestamp"]
            }

            can0_queue.put(can0)

            processing_time = time.monotonic() - cycle_start
            sleep_time = PUBLISH_INTERVAL - processing_time

            if sleep_time > 0:
                time.sleep(sleep_time)
                
        except(KeyboardInterrupt):
            print("can0 mockup 종료")

