import math
import time

import can


CAN_CHANNEL = "can0"

# 백엔드와 프론트보다 지나치게 빠르게 보내지 않도록 10Hz로 제한
PUBLISH_INTERVAL = 0.1

# CAN 인터페이스 연결 실패 시 재시도 간격
RECONNECT_INTERVAL = 2.0

# 한 사이클에서 과도하게 많은 프레임을 처리하지 않도록 제한
MAX_FRAMES_PER_CYCLE = 200


class Can0:
    def __init__(self, channel=CAN_CHANNEL):
        self.channel = channel
        self.bus = None

        self.right_data = {
            "voltage": 0.0,
            "current": 0.0,
            "torque": 0.0,
            "rpm": 0,
        }

        self.left_data = {
            "voltage": 0.0,
            "current": 0.0,
            "torque": 0.0,
            "rpm": 0,
        }

        # 백엔드의 mqtt_can0_queue가 현재 payload["version"]을
        # 읽고 있으므로 호환을 위해 유지한다.
        self.version = 0

        self.last_no_data_log_time = 0.0

    def init_can(self):
        if self.bus is not None:
            return True

        try:
            self.bus = can.interface.Bus(
                channel=self.channel,
                interface="socketcan",
            )

            print(f"[CAN0] 인터페이스 연결 성공: {self.channel}")
            return True

        except (can.CanError, OSError) as error:
            print(f"[CAN0] 인터페이스 연결 실패: {error}")
            self.bus = None
            return False

    def process_message(self, message):
        if len(message.data) < 8:
            return

        if message.arbitration_id == 0x331:
            self.right_data["voltage"] = (
                int.from_bytes(
                    message.data[0:2],
                    byteorder="little",
                    signed=False,
                )
                / 10.0
            )

            self.right_data["current"] = (
                int.from_bytes(
                    message.data[2:4],
                    byteorder="little",
                    signed=True,
                )
                / 10.0
            )

            self.right_data["torque"] = (
                int.from_bytes(
                    message.data[4:6],
                    byteorder="little",
                    signed=True,
                )
                / 10.0
            )

            self.right_data["rpm"] = int.from_bytes(
                message.data[6:8],
                byteorder="little",
                signed=True,
            )

        elif message.arbitration_id == 0x341:
            self.left_data["voltage"] = (
                int.from_bytes(
                    message.data[0:2],
                    byteorder="little",
                    signed=False,
                )
                / 10.0
            )

            self.left_data["current"] = (
                int.from_bytes(
                    message.data[2:4],
                    byteorder="little",
                    signed=True,
                )
                / 10.0
            )

            self.left_data["torque"] = (
                int.from_bytes(
                    message.data[4:6],
                    byteorder="little",
                    signed=True,
                )
                / 10.0
            )

            self.left_data["rpm"] = int.from_bytes(
                message.data[6:8],
                byteorder="little",
                signed=True,
            )

    def read_can_data(self):
        if self.bus is None:
            return False

        received_count = 0

        try:
            for frame_index in range(MAX_FRAMES_PER_CYCLE):
                timeout = 0.05 if frame_index == 0 else 0

                message = self.bus.recv(timeout=timeout)

                if message is None:
                    break

                self.process_message(message)
                received_count += 1

        except (can.CanError, OSError) as error:
            print(f"[CAN0] CAN 수신 오류: {error}")
            self.shutdown()
            return False

        if received_count == 0:
            current_time = time.monotonic()

            # 데이터가 없는 로그는 5초마다 한 번만 출력
            if current_time - self.last_no_data_log_time >= 5:
                print(
                    "[CAN0] 인터페이스는 연결됐지만 "
                    "0x331/0x341 프레임을 기다리는 중"
                )
                self.last_no_data_log_time = current_time

        return True

    def make_payload(self):
        right_data = self.right_data.copy()
        left_data = self.left_data.copy()

        avg_rpm = (
            right_data["rpm"] + left_data["rpm"]
        ) / 2.0

        avg_voltage = (
            right_data["voltage"] + left_data["voltage"]
        ) / 2.0

        power_right = (
            right_data["voltage"] * right_data["current"]
        )

        power_left = (
            left_data["voltage"] * left_data["current"]
        )

        avg_power = (power_right + power_left) / 2.0

        speed = (
            avg_rpm
            / 60.0
            * (18 * 0.0254 * math.pi)
            * (11 / 46)
            * 3.6
        )

        self.version += 1

        return {
            "latest": {
                "avg_rpm": avg_rpm,
                "avg_voltage": avg_voltage,
                "avg_power": avg_power,

                "speed": speed,

                "power_left": power_left,
                "power_right": power_right,

                "current_left": left_data["current"],
                "current_right": right_data["current"],

                "rpm_left": left_data["rpm"],
                "rpm_right": right_data["rpm"],

                "torque_left": left_data["torque"],
                "torque_right": right_data["torque"],
            },

            "version": self.version,
        }

    def shutdown(self):
        if self.bus is not None:
            try:
                self.bus.shutdown()
            except (can.CanError, OSError):
                pass

            self.bus = None


def main(can0_queue):
    can0 = Can0()
    next_publish_time = time.monotonic()

    try:
        while True:
            if can0.bus is None:
                if not can0.init_can():
                    time.sleep(RECONNECT_INTERVAL)
                    continue

                next_publish_time = time.monotonic()

            if not can0.read_can_data():
                time.sleep(RECONNECT_INTERVAL)
                continue

            current_time = time.monotonic()

            if current_time >= next_publish_time:
                payload = can0.make_payload()
                can0_queue.put(payload)

                next_publish_time = (
                    current_time + PUBLISH_INTERVAL
                )

    finally:
        can0.shutdown()