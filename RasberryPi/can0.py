"""Decode motor frames and calculate values shared by MQTT and the dashboard."""

from datetime import datetime, timezone
import math
import time


CAN_CHANNEL = "can0"
MOTOR_TIMEOUT = 0.2
MOTOR_SPROCKET_TEETH = 11
AXLE_SPROCKET_TEETH = 50
TIRE_DIAMETER_METERS = 18 * 0.0254
RPM_TO_KMH = (
    TIRE_DIAMETER_METERS * math.pi
    * MOTOR_SPROCKET_TEETH / AXLE_SPROCKET_TEETH * 3.6 / 60.0
)


class Can0:
    CAN_IDS = (0x331, 0x341)

    def __init__(self, channel=CAN_CHANNEL):
        self.channel = channel
        self.right_data = {"voltage": 0.0, "current": 0.0, "torque": 0.0, "rpm": 0}
        self.left_data = {"voltage": 0.0, "current": 0.0, "torque": 0.0, "rpm": 0}
        self.last_right_time = None
        self.last_left_time = None
        self.right_received = False
        self.left_received = False
        self._payload = None

    def process_message(self, message, now=None):
        if (
            message.arbitration_id not in self.CAN_IDS
            or message.is_extended_id
            or message.is_remote_frame
            or message.is_error_frame
            or len(message.data) < 8
        ):
            return False
        if now is None:
            now = time.monotonic()
        decoded = {
            "voltage": int.from_bytes(message.data[0:2], "little") / 10.0,
            "current": int.from_bytes(message.data[2:4], "little", signed=True) / 10.0,
            "torque": int.from_bytes(message.data[4:6], "little", signed=True) / 10.0,
            "rpm": int.from_bytes(message.data[6:8], "little", signed=True),
        }
        if message.arbitration_id == 0x331:
            self.right_data = decoded
            self.last_right_time = now
            self.right_received = True
        else:
            self.left_data = decoded
            self.last_left_time = now
            self.left_received = True
        self._payload = None
        return True

    def make_payload(self):
        if self._payload is not None:
            return self._payload
        right = self.right_data
        left = self.left_data
        # Until both motors have reported, use the available motor's reading.
        readings = []
        if self.right_received:
            readings.append(right)
        if self.left_received:
            readings.append(left)
        count = len(readings)
        avg_rpm = sum(data["rpm"] for data in readings) / count if count else 0.0
        avg_voltage = sum(data["voltage"] for data in readings) / count if count else 0.0
        power_right = right["voltage"] * right["current"]
        power_left = left["voltage"] * left["current"]
        # Once handed to a consumer, snapshots are never mutated.
        self._payload = {
            "latest": {
                "avg_rpm": avg_rpm,
                "avg_voltage": avg_voltage,
                "avg_power": (power_right + power_left) / 2.0,
                "speed": abs(avg_rpm) * RPM_TO_KMH,
                "power_left": power_left,
                "power_right": power_right,
                "current_left": left["current"],
                "current_right": right["current"],
                "rpm_left": left["rpm"],
                "rpm_right": right["rpm"],
                "torque_left": left["torque"],
                "torque_right": right["torque"],
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        return self._payload

    def snapshot(self, now):
        payload = self.make_payload()
        display_data = {
            "speed": payload["latest"]["speed"],
            "voltage": payload["latest"]["avg_voltage"],
            "right_status": "on" if (
                self.last_right_time is not None
                and now - self.last_right_time < MOTOR_TIMEOUT
            ) else "off",
            "left_status": "on" if (
                self.last_left_time is not None
                and now - self.last_left_time < MOTOR_TIMEOUT
            ) else "off",
        }
        return payload, display_data

    def mark_disconnected(self):
        # Preserve last measurements but immediately mark both motors offline.
        self.last_right_time = None
        self.last_left_time = None
