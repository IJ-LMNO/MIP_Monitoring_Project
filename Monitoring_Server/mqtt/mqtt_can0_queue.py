import copy, time
from Monitoring_Server.api.main import get_can0_data

def main(queue, data):
    while(True):
        try:
            latest_data = queue.get()

            data["latest"].update(latest_data["latest"])

            data["history"]["current_right"].append(latest_data["latest"]["current_right"])
            data["history"]["current_left"].append(latest_data["latest"]["current_left"])
            data["history"]["avg_power"].append(latest_data["latest"]["avg_power"])

            data["version"] = latest_data["version"]

            get_can0_data(data)

        finally:
            queue.task_done()