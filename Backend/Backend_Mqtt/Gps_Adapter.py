from collections import deque
from Backend.FastAPI.FastAPI import get_gps_data

import copy 
import time


# =========================================================
# 프론트로 전달할 gps 데이터 구조 -> 프론트에서 반드시 이 형식으로 받아야 함
# =========================================================

class gps_data_structure():
    def __init__(self):
        self.gps = {
            "latest" : {
                "latitude" : 0.0,
                "longitude" : 0.0,
                "status": None
            },
            "timestamp" : 0.0
        }


# =========================================================
#  mqtt의 gps queue에서 get해서 api의 dequeue로 넘기는 함수
# =========================================================

def main(queue):
    gps_data_structure = gps_data_structure()
    while(True):
        try:
            latest = queue.get()

            gps_data_structure.gps.update(latest)
            get_gps_data(copy.deepcopy(gps_data_structure.gps))
        finally:
            queue.task_done()