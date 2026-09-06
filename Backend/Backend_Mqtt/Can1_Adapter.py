from collections import deque
from Backend.FastAPI.FastAPI import get_can1_data

import copy


# =========================================================
# 프론트로 전달할 can1 데이터 구조 -> 프론트에서 반드시 이 형식으로 받아야 함
# =========================================================
class can1_data_structure():
    def __init__(self):
        self.can1 = {
            "tps" : 0.0,
            "desired_yawrate" : 0.0,
            "yawrate" : 0.0,
            "rollrate" : 0.0,
            "steeringhandle" : 0.0,
            "tiredegree" : 0.0,
            "timestamp" : None
        }


# =========================================================
# mqtt의 button queue에서 get해서 api의 dequeue로 넘기는 함수
# =========================================================

def main(queue):
    can1_data_structure = can1_data_structure()
    while(True):
        try:

            latest = queue.get()

            can1_data_structure.can1.update(latest)
            get_can1_data(copy.deepcopy(can1_data_structure.can1))

        finally:
            queue.task_done()

