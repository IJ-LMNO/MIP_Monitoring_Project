import threading
import math
import can

class Can1:
    def __init__(self, channel='can1'):
        self.channel = channel
        self.bus = None
        self._data_lock = threading.Lock()

        # Use default values until the first frame from each data
        self.BPS = {
            'Braking_Percent': 0, #unit is percent
            "bps_received_count" : 0
        }

        self.TPS = {
            'Throttle_Percent': 0, #unit is percent
            "tps_received_count" : 0
        }

        self.Desired_yaw_rate = {
            'Desired_yaw_rate': 0.00, #unit is deg/s
            "desired_yaw_rate_received_count" : 0
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
        except(can.CanError, OSError) as error:
            print("CAN Init Fail:", error)
            self.bus = None
            return False
        
    def read_can_data(self):
        if self.bus is None:
            return 0
        
        msg = self.bus.recv(timeout=0)
        while msg is not None:
            if len(msg.data) >= 8:
                with self._data_lock:
                    if msg.arbitration_id ==0x200:
                        self.TPS['Throttle_Percent']=int.from_bytes(msg.data[0:1],'little', signed=True)
                        self.TPS["tps_received_count"] += 1
                    elif msg.arbitration_id == 0x201:
                        self.BPS['Braking_Percent']=int.from_bytes(msg.data[0:1],'little', signed=True)
                        self.BPS["bps_received_count"] += 1
                    elif msg.arbitration_id == 0x202:
                        self.Desired_yaw_rate['Desired_yaw_rate']=int.from_bytes(msg.data[0:1],'little', signed=True)
                        self.Desired_yaw_rate["yaw_rate_received_count"] += 1
            msg = self.bus.recv(timeout = 0)

    
    def shutdown(self):
        if self.bus is not None:
            self.bus.shutdown()
            self.bus = None

def main(can1_share_data, tps_queue, bps_queue, desired_yawrate_queue):
    obj = Can1()
    prev_tps_received_cout = 0
    prev_bps_received_count = 0
    prev_desired_yaw_rate_received_count = 0

    while(True):
        obj.read_can_data()

        if(obj.TPS["tps_received_count"] != prev_tps_received_cout):
            tps_queue.put(obj.TPS["Throttle_Percent"])
        
        if(obj.BPS["bps_received_count"] != prev_bps_received_count):
            bps_queue.put(obj.BPS["Braking_Percent"])
        
        if(obj.Desired_yaw_rate["yaw_rate_received_count"] != prev_desired_yaw_rate_received_count):
            desired_yawrate_queue.put(obj.Desired_yaw_rate["Desired_yaw_rate"])