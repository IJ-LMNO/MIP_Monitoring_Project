import threading as thread
import can
import copy
import queue

tps_tmp_queue = queue.Queue()
bps_tmp_queue = queue.Queue()
desired_yawrate_tmp_queue = queue.Queue()


class Can1:
    def __init__(self, channel='can1'):
        self.channel = channel
        self.bus = None
        self._data_lock = thread.Lock()

        # Use default values until the first frame from each data
        self.BPS = {
            'Braking_Percent': 0,  # unit is percent
        }

        self.TPS = {
            'Throttle_Percent': 0,  # unit is percent
        }

        self.Desired_yawrate = {
            'Desired_yawrate': 0.00,  # unit is deg/s
        }

    def init_can1(self):
        if self.bus is not None:
            return True

        try:
            self.bus = can.interface.Bus(
                channel=self.channel,
                interface='socketcan'
            )
            return True

        except (can.CanError, OSError) as error:
            print("CAN Init Fail:", error)
            self.bus = None
            return False

    def read_can_data(self, tps_tmp_queue, bps_tmp_queue, desired_yawrate_tmp_queue):

        if self.bus is None:
            return 0

        msg = self.bus.recv(timeout=0)

        while msg is not None:
            if len(msg.data) >= 8:
                with self._data_lock:

                    if msg.arbitration_id == 0x200:
                        self.TPS['Throttle_Percent'] = int.from_bytes(
                            msg.data[0:1],
                            'little',
                            signed=True
                        )

                        self.TPS["version"] += 1

                        tps_tmp_queue.put(
                            copy.deepcopy(self.TPS)
                        )

                    elif msg.arbitration_id == 0x201:
                        self.BPS['Braking_Percent'] = int.from_bytes(
                            msg.data[0:1],
                            'little',
                            signed=True
                        )

                        self.BPS["version"] += 1

                        bps_tmp_queue.put(
                            copy.deepcopy(self.BPS)
                        )

                    elif msg.arbitration_id == 0x202:
                        self.Desired_yawrate['Desired_yawrate'] = int.from_bytes(
                            msg.data[0:1],
                            'little',
                            signed=True
                        )

                        self.Desired_yawrate["version"] += 1

                        desired_yawrate_tmp_queue.put(
                            copy.deepcopy(self.Desired_yawrate)
                        )

            msg = self.bus.recv(timeout=0)

    def shutdown(self):
        if self.bus is not None:
            self.bus.shutdown()
            self.bus = None

def can1_read_can_data(tps_tmp_queue, bps_tmp_queue, desired_yawrate_tmp_queue):
    obj = Can1()

    obj.init_can1()

    while(True):
        obj.read_can_data(tps_tmp_queue, bps_tmp_queue, desired_yawrate_tmp_queue)

def tmp_queue_to_main_queue(queue, tmp_queue):
    latest = tmp_queue.get()

    queue.put(copy.deepcopy(latest))

def can1_read_can_data_thread():
    can1_mqtt_thread = thread.Thread(
        target=can1_read_can_data,
        args=(tps_tmp_queue, bps_tmp_queue, desired_yawrate_tmp_queue)
    )

    can1_mqtt_thread.start()

def tps_thread(tps_queue):
    tps_thread = thread.Thread(
        target=tmp_queue_to_main_queue,
        args=(tps_queue, tps_tmp_queue)
    )

    tps_thread.start()

def bps_thread(bps_queue):
    bps_thread = thread.Thread(
        target=tmp_queue_to_main_queue,
        args=(bps_queue, bps_tmp_queue)
    )

    bps_thread.start()

def desired_yawrate_thread(desired_yawrate_queue):
    desired_yawrate_thread = thread.Thread(
        target=tmp_queue_to_main_queue,
        args=(desired_yawrate_queue, desired_yawrate_tmp_queue)
    )

    desired_yawrate_thread.start()


def main(tps_queue, bps_queue, desired_yawrate_queue):
    can1_read_can_data_thread()
    tps_thread(tps_queue)
    bps_thread(bps_queue)
    desired_yawrate_thread(desired_yawrate_queue)