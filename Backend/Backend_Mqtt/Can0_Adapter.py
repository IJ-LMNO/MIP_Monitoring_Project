from collections import deque
from Backend.FastAPI.FastAPI import get_can0_data
import copy

# =========================================================
# 프론트로 전달할 can0 데이터 구조 -> 프론트에서 반드시 이 형식으로 받아야 함
# =========================================================

class can0_data_sturcture():
    def __init__(self):
        self.can0 = {
            "latest" : {
                'avg_rpm': 0.0,
                'avg_voltage': 0.0,
                "avg_power": 0.0,   

                "power_right": 0.0,
                "power_left": 0.0,

                "speed": 0.0,

                "current_left": 0.0,
                "current_right": 0.0,
                
                "rpm_left": 0.0,
                "rpm_right": 0.0,

                "torque_right" : 0.0,
                "torque_left" : 0.0,
            },
            "timestamp" : None
           
        }


# =========================================================
# mqtt의 can0 queue에서 get해서 api의 dequeue로 넘기는 함수
# =========================================================

def main(queue):
    can0 = can0_data_sturcture()
    while(True):
        try:
            latest = queue.get()

            can0.can0["latest"].update(latest["latest"])
            can0.can0["timestamp"] = latest["timestamp"]

            get_can0_data(copy.deepcopy(can0.can0))

        finally:
            queue.task_done()
