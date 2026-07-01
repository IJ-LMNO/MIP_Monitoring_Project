import threading as thread
from Monitoring_Server.mqtt.mqtt_subscriber import main as monitoring_server_main
from Monitoring_Server.api import main as fast_api_main

# shared data using in multi thread(mqtt thread and fast api thread)
shared_data = {

 # 데이터 구조 확정되면 수정 예정

}
# Lock is an object for preventing synchronization between threads
lock = thread.Lock()

# make thread for mqtt and start
def run_mqtt_thread():

    thread_mqtt = thread.Thread(
        target = monitoring_server_main.start_mqtt,
        args = (shared_data, lock) )

    thread_mqtt.start()

def run_fast_api():
    fast_api_main()


def main():
    run_mqtt_thread()
    run_fast_api()

