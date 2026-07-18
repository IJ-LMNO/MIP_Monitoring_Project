import can
import math
import threading as thread
import paho.mqtt.client as mqtt
import time
from collections import deque

class Can0:
    def __init__(self, channel='can0'):
        self.channel = channel
        self.bus = None
        self._data_lock = thread.Lock()
        self.received_count = 0

        # Use default values until the first frame from each motor is received.
        self.right_data = {
            'voltage': 0.0,
            'current': 0.0,
            'torque': 0.0,
            'rpm': 0,
        }

        self.left_data = {
            'voltage': 0.0,
            'current': 0.0,
            'torque': 0.0,
            'rpm': 0,
        }

        self.can0_data ={
            "latest" : {
                'avg_rpm' : 0.0,
                'avg_voltage' : 0.0,
                "avg_power" : 0.0,

                "speed" : 0.0,

                "power_left" : 0.0,
                "power_right" : 0.0,
                "current_left" : 0.0,
                "current_right" : 0.0,
                "rpm_left" : 0.0,
                "rpm_right" : 0.0
            },

            "version" : 0    
        }

        self.init_can()

    def init_can(self):
        if self.bus is not None:
            return True

        try:
            # SocketCAN is available on Linux; the can0 interface must be configured and up.
            self.bus = can.interface.Bus(
                channel=self.channel,
                interface='socketcan',
            )
            return True
        except (can.CanError, OSError) as error:
            print("CAN Init Fail:", error)
            self.bus = None
            return False
        
    def read_can_data(self):
        if self.bus is None:
            return 0

        received_count = 0

        # A zero timeout makes this a non-blocking receive operation.
        msg = self.bus.recv(timeout=0)
        while msg is not None:
            # Both supported message layouts require all eight CAN data bytes.
            if len(msg.data) >= 8:
                with self._data_lock:
                    if msg.arbitration_id == 0x331:
                        # Decode little-endian raw values using the sender's scale factors.
                        self.right_data['voltage'] = int.from_bytes(msg.data[0:2], 'little') / 10.0
                        self.right_data['current'] = int.from_bytes(msg.data[2:4], 'little', signed=True) / 10.0
                        self.right_data['torque'] = int.from_bytes(msg.data[4:6], 'little', signed=True) / 10.0
                        self.right_data['rpm'] = int.from_bytes(msg.data[6:8], 'little', signed=True)
                        received_count += 1
                    
                    elif msg.arbitration_id == 0x341:
                        self.left_data['voltage'] = int.from_bytes(msg.data[0:2], 'little') / 10.0
                        self.left_data['current'] = int.from_bytes(msg.data[2:4], 'little', signed=True) / 10.0
                        self.left_data['torque'] = int.from_bytes(msg.data[4:6], 'little', signed=True) / 10.0
                        self.left_data['rpm'] = int.from_bytes(msg.data[6:8], 'little', signed=True)
                        received_count += 1


            self.received_count = received_count
            # Read the next queued frame instead of processing the same frame repeatedly.
            msg = self.bus.recv(timeout=0)



    def calculate_data(self):
        with self._data_lock:
            right_data = self.right_data.copy()
            left_data = self.left_data.copy()


        self.avg_rpm = (right_data['rpm'] + left_data['rpm']) / 2
        self.avg_voltage = (right_data['voltage'] + left_data['voltage']) / 2
        self.power_right = right_data['voltage'] * right_data['current']
        self.power_left = left_data['voltage'] * left_data['current']
        self.avg_power = (self.power_right + self.power_left) / 2

        # Convert motor RPM to vehicle speed in km/h using wheel diameter and gear ratio.
        self.speed = self.avg_rpm / 60 * (18 * 0.0254 * math.pi) * (11 / 68) * 3.6
        self.current_left = left_data['current']
        self.current_right = right_data['current']
        self.rpm_left = left_data['rpm']
        self.rpm_right = right_data['rpm']


    def shutdown(self):
        if self.bus is not None:
            self.bus.shutdown()
            self.bus = None

def main(can0_queue):
    obj = Can0()
    prev_version = 0

    while(True):
        obj.read_can_data()
        obj.calculate_data()

        # 갱신 단위에 따라 수정해야 할 수 있음
        time.sleep(10)

        if(prev_version != obj.can0_data["version"]):
            # can0_share_data.update(obj.can0_data)
            can0_queue.put(obj.can0_data)   
        
            if(obj.can0_data["version"] == 100000):
                obj.can0_data["version"] = 0
            else:
                obj.can0_data["version"] += 1

