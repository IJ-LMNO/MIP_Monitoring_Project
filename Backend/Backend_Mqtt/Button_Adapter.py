import copy 
from Backend.FastAPI.FastAPI import get_button_data

# =========================================================
# 프론트로 전달할 button 데이터 구조 -> 프론트에서 반드시 이 형식으로 받아야 함
# =========================================================

class button_data_structure():
    def __init__(self):
        self.button = {
            "time_interval" : None,
            "rap" : None
        
        }


# =========================================================
# mqtt의 button queue에서 get해서 api의 dequeue로 넘기는 함수
# =========================================================

def main(queue):
    button_data_structure = button_data_structure()

    while(True):
        try:
            latest = queue.get()

            button_data_structure.button.update(latest)
            get_button_data(copy.deepcopy(button_data_structure.button))
        finally:
            queue.task_done()