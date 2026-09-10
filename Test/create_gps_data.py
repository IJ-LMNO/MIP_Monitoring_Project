import json
import math
import random
import time
from datetime import datetime, timezone



PUBLISH_HZ = 1
PUBLISH_INTERVAL = 1 / PUBLISH_HZ


def create_gps_data(elapsed_time: float) -> dict:
    base_latitude = 37.450000
    base_longitude = 127.130000

    latitude = base_latitude + 0.001 * math.sin(elapsed_time * 0.05)
    longitude = base_longitude + 0.001 * math.cos(elapsed_time * 0.05)

    speed = 50 + 20 * math.sin(elapsed_time * 0.5)
    heading = (elapsed_time * 5) % 360

    return {
        "latest" : {
            "latitude": round(latitude, 7),
            "longitude": round(longitude, 7),
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

def main(gps_queue):
    start_time = time.monotonic()

    while(True):
        try:
            cycle_start = time.monotonic()
            elapsed_time = cycle_start - start_time
            gps = create_gps_data(elapsed_time)
            
            gps = {
                "latest" : gps["latest"],
                "timestamp" : gps["timestamp"]
            }

            gps_queue.put(gps)

            processing_time = time.monotonic() - cycle_start
            sleep_time = PUBLISH_INTERVAL - processing_time

            if sleep_time > 0:
                time.sleep(sleep_time)
        except(KeyboardInterrupt):
            print("can0 mockup 종료")
