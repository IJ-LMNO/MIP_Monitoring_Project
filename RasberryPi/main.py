import threading as thread
from can0 import main as can0_main
from can1 import main as can1_main
from mqtt import main as mqtt_main
import queue

can0_share_data ={}
can1_share_data = {}

can0_queue = queue.Queue()
tps_queue = queue.Queue()
bps_queue = queue.Queue()
desired_yawrate_queue = queue.Queue()

def Can0_Thread():
    Can0_Thread = thread.Thread(
        target= can0_main,
        args=(can0_share_data, can0_queue)
    )

    Can0_Thread.start()

def Can1_Thread():
    Can1_Thread = thread.Thread(
        target=can1_main,
        args=(can1_share_data, tps_queue, bps_queue, desired_yawrate_queue)
    )

    Can1_Thread.start()

def Mqtt_Thread():
    Mqtt_Thread = thread.Thread(
        target= mqtt_main,
        args=(can0_queue, tps_queue, bps_queue, desired_yawrate_queue)
    )



def main():
    Can0_Thread()
    Can1_Thread()
    Mqtt_Thread()