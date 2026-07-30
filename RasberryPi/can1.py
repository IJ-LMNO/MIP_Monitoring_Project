import queue
import time
import copy

import can


CAN_CHANNEL = "can1"


PUBLISH_INTERVAL = 0.1

RECONNECT_INTERVAL = 2.0


MAX_FRAMES_PER_CYCLE = 200


TIRE_DEGREE_TABLE = [
    0,
    0.3115,
    0.6225,
    0.934,
    1.2455,
    1.558,
    1.8695,
    2.181,
    2.4925,
    2.805,
    3.1175,
    3.429,
    3.741,
    4.053,
    4.3665,
    4.6785,
    4.991,
    5.3035,
    5.6175,
    5.9305,
    6.2435,
    6.557,
    6.8705,
    7.185,
    7.499,
    7.813,
    8.1275,
    8.4435,
    8.7585,
    9.0735,
    9.389,
    9.7045,
    10.0215,
    10.338,
    10.655,
    10.9715,
    11.2905,
    11.608,
    11.9255,
    12.2445,
    12.563,
    12.8835,
    13.203,
    13.523,
    13.8435,
    14.1655,
    14.487,
    14.8085,
    15.131,
    15.454,
    15.7785,
    16.102,
    16.4265,
    16.751,
    17.0775,
    17.404,
    17.7305,
    18.0575,
    18.3855,
    18.7145,
    19.044,
    19.3735,
    19.704,
    20.036,
    20.368,
    20.7005,
    21.0335,
    21.368,
    21.704,
    22.039,
    22.3755,
    22.7125,
    23.0515,
    23.3905,
    23.73,
    24.0705,
    24.412,
    24.7555,
    25.099,
    25.4435,
    25.7885,
    26.136,
    26.483,
    26.8315,
    27.181,
    27.5315,
    27.8845,
    28.237,
    28.591,
    28.9465,
    29.304,
    29.6615,
    30.02,
    30.3805,
    30.742,
    31.106,
    31.4705,
    31.836,
    32.2025,
    32.5725,
    32.943,
    33.3145,
    33.6875,
    34.062,
    34.44,
    34.818,
]


class Can1:
    def __init__(self, channel=CAN_CHANNEL):
        self.channel = channel
        self.bus = None

        self.throttle_percent = 0
        self.steering_handle_degree = 0.0
        self.desired_yaw_rate = 0.0
        self.measured_yaw_rate = 0.0
        self.measured_roll_rate = 0.0

        self.last_no_data_log_time = 0.0
        self.received_frame_count = 0

    def init_can(self):
        if self.bus is not None:
            return True

        try:
            self.bus = can.interface.Bus(
                channel=self.channel,
                interface="socketcan",
            )

            print(
                f"[CAN1] 인터페이스 연결 성공: "
                f"{self.channel}"
            )

            return True

        except (can.CanError, OSError) as error:
            print(
                f"[CAN1] 인터페이스 연결 실패: "
                f"{error}"
            )

            self.bus = None
            return False

    def process_message(self, message):
        if message.arbitration_id != 0x202:
            return False

        if len(message.data) < 8:
            print(
                f"[CAN1] 데이터 길이 부족: "
                f"{len(message.data)}"
            )
            return False

        self.throttle_percent = int.from_bytes(
            message.data[0:1],
            byteorder="little",
            signed=False,
        )

        self.steering_handle_degree = (
            int.from_bytes(
                message.data[1:3],
                byteorder="little",
                signed=True,
            )
            / 100.0
        )

        self.desired_yaw_rate = (
            int.from_bytes(
                message.data[3:5],
                byteorder="little",
                signed=True,
            )
            / 100.0
        )

        self.measured_yaw_rate = (
            int.from_bytes(
                message.data[5:7],
                byteorder="little",
                signed=True,
            )
            / 100.0
        )

        self.measured_roll_rate = (
            int.from_bytes(
                message.data[7:8],
                byteorder="little",
                signed=True,
            )
            / 100.0
        )

        self.received_frame_count += 1

        if (
            self.received_frame_count == 1
            or self.received_frame_count % 100 == 0
        ):
            print(
                f"[CAN1] 0x202 수신 "
                f"#{self.received_frame_count}"
            )

        return True

    def read_can_data(self):
        if self.bus is None:
            return False

        supported_frame_count = 0

        try:
            for frame_index in range(MAX_FRAMES_PER_CYCLE):
                timeout = 0.05 if frame_index == 0 else 0

                message = self.bus.recv(timeout=timeout)

                if message is None:
                    break

                if self.process_message(message):
                    supported_frame_count += 1

        except (can.CanError, OSError) as error:
            print(f"[CAN1] CAN 수신 오류: {error}")
            self.shutdown()
            return False

        if supported_frame_count == 0:
            current_time = time.monotonic()
            if (
                current_time - self.last_no_data_log_time
                >= 5.0
            ):
                print(
                    "[CAN1] 인터페이스는 연결됐지만 "
                    "0x202 프레임을 기다리는 중"
                )

                self.last_no_data_log_time = current_time

        return True

    def calculate_tire_degree(self):
        handle_degree = self.steering_handle_degree

        absolute_degree = abs(handle_degree)

        maximum_index = len(TIRE_DEGREE_TABLE) - 1

        clamped_degree = min(
            max(absolute_degree, 0.0),
            float(maximum_index),
        )

        lower_index = int(clamped_degree)

        upper_index = min(
            lower_index + 1,
            maximum_index,
        )

        ratio = clamped_degree - lower_index

        lower_value = TIRE_DEGREE_TABLE[lower_index]
        upper_value = TIRE_DEGREE_TABLE[upper_index]

        tire_degree = (
            lower_value
            + (upper_value - lower_value) * ratio
        )

        if handle_degree < 0:
            tire_degree *= -1

        return round(tire_degree, 1)

    def make_payloads(self):
        return ({
            "tps" : self.throttle_percent,
            "desired_yawrate" : self.desired_yaw_rate,
            "yawrate" : self.measured_yaw_rate,
            "rollrate" : self.measured_roll_rate,
            "steeringhandle" : self.steering_handle_degree,
            "tiredegree" : self.calculate_tire_degree()
        })

    def shutdown(self):
        if self.bus is not None:
            try:
                self.bus.shutdown()

            except (can.CanError, OSError):
                pass

            self.bus = None


def put_latest(data_queue, data):

    try:
        data_queue.put_nowait(data)

    except queue.Full:
        try:
            data_queue.get_nowait()
            data_queue.task_done()

        except queue.Empty:
            pass

        try:
            data_queue.put_nowait(data)

        except queue.Full:
            pass


def main(
    can1_queue
):
    can1 = Can1()

    next_publish_time = time.monotonic()

    try:
        while True:
            if can1.bus is None:
                if not can1.init_can():
                    time.sleep(RECONNECT_INTERVAL)
                    continue

                next_publish_time = time.monotonic()

            if not can1.read_can_data():
                time.sleep(RECONNECT_INTERVAL)
                continue

            current_time = time.monotonic()

            if current_time < next_publish_time:
                continue

            payloads = can1.make_payloads()

            can1_queue.put(copy.deepcopy(payloads))

    except KeyboardInterrupt:
        print("[CAN1] 종료 요청")

    finally:
        can1.shutdown()
