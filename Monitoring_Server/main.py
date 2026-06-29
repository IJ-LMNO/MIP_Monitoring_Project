import threading as thread
import MIP_Monitoring_Project.Monitoring_Server.mqtt.mqtt_subscriber as mqtt_subscriber

# shared data using in multi thread(mqtt thread and fast api thread)
shared_data = {

 # 데이터 구조 확정되면 수정 예정

}
# Lock is an object for preventing synchronization between threads
lock = thread.Lock()

# make thread for mqtt and start
def run_mqtt_thread():

    thread_mqtt = thread.Thread(
        target = mqtt_subscriber.start_mqtt,
        args = (shared_data, lock) )

    thread_mqtt.start()

def main():
    run_mqtt_thread()

