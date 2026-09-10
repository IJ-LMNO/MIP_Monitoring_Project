import json
import math
import random
import time
from datetime import datetime, timezone


PUBLISH_HZ = 1
PUBLISH_INTERVAL = 1 / PUBLISH_HZ


def create_tps_data(elapsed_time: float) -> dict:
    throttle = 50 + 40 * math.sin(elapsed_time * 0.7)

    return(
        round(max(0, min(100, throttle)), 2)
    )

    

def create_desired_yawrate_data(elapsed_time: float) -> dict:
    desired_yawrate = 20 * math.sin(elapsed_time * 0.8)

    return (
        round(desired_yawrate, 2)
    )


def create_yawrate_data(elapsed_time: float) -> dict:
    yawrate = 20 * math.sin(elapsed_time * 0.8)
    yawrate += random.uniform(-1, 1)

    return (
        round(yawrate, 2)
    )


def create_rollrate_data(elapsed_time: float) -> dict:
    rollrate = 8 * math.sin(elapsed_time * 0.6)

    return (
        round(rollrate, 2) 
    )


def create_steeringhandle_data(elapsed_time: float) -> dict:
    steering_angle = 180 * math.sin(elapsed_time * 0.3)

    return (
        round(steering_angle, 2)    
    )


def create_tiredegree_data(elapsed_time: float) -> dict:
    tire_degree = 30 * math.sin(elapsed_time * 0.3)

    return (
        round(tire_degree, 2)
    )




def main(can1_queue):
    start_time = time.monotonic()

    while(True):
        try:
            cycle_start = time.monotonic()
            elapsed_time = cycle_start - start_time
            
            can1 = {
                    "tps": create_tps_data(elapsed_time),
                    "desired-yawrate": create_desired_yawrate_data(elapsed_time),
                    "yawrate": create_yawrate_data(elapsed_time),
                    "rollrate": create_rollrate_data(elapsed_time),
                    "steeringhandle": create_steeringhandle_data(elapsed_time),
                    "tiredegree": create_tiredegree_data(elapsed_time),
                    "timestamp" : datetime.now(timezone.utc).isoformat(),
            }

            can1_queue.put(can1)

            processing_time = time.monotonic() - cycle_start
            sleep_time = PUBLISH_INTERVAL - processing_time

            if sleep_time > 0:
                time.sleep(sleep_time)
        except(KeyboardInterrupt):
            print("can0 mockup 종료")
