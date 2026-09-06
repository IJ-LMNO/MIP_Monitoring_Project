# -*- coding: utf-8 -*-

from datetime import datetime, timezone

import pynmea2
import serial
import time
import copy
import queue


RECONNECT_INTERVAL = 0.1

# GPS 상태값
STATUS_NO_VALID_POSITION = 0
STATUS_VALID_RMC = 1
STATUS_VALID_GGA = 2
STATUS_INVALID_RMC = 3
STATUS_GGA_NO_FIX = 4
STATUS_SERIAL_TIMEOUT = 5
STATUS_SERIAL_ERROR = 6
STATUS_DATA_ERROR = 7
STATUS_RECONNECTING = 8


class GPS:
    def __init__(
        self,
        port="/dev/ttyAMA2",
        baudrate=9600,
        timeout=15,
        update_rate_hz=1
    ):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.serial = None

        # 1 Hz 또는 5 Hz만 사용
        if update_rate_hz not in (1, 5):
            raise ValueError(
                "update_rate_hz must be 1 or 5"
            )

        self.update_rate_hz = update_rate_hz

        self.gps = {
            "latest": {
                "latitude": 0.0,
                "longitude": 0.0,
                "status": STATUS_NO_VALID_POSITION
            },
            "timestamp" : 0.0
        }

    def shutdown(self):
        if self.serial:
            self.serial.close()
            self.serial = None

    def make_ubx_message(self, message_class, message_id, payload):
        """
        UBX 메시지를 생성합니다.
        """
        length = len(payload)

        message_body = bytes([
            message_class,
            message_id,
            length & 0xFF,
            (length >> 8) & 0xFF
        ]) + payload

        checksum_a = 0
        checksum_b = 0

        for value in message_body:
            checksum_a = (checksum_a + value) & 0xFF
            checksum_b = (checksum_b + checksum_a) & 0xFF

        return (
            bytes([0xB5, 0x62])
            + message_body
            + bytes([checksum_a, checksum_b])
        )

    def set_update_rate(self):
        """
        NEO-M8N의 위치 계산 주기를 설정합니다.

        1 Hz -> 1000 ms
        5 Hz -> 200 ms
        """
        if not self.serial or not self.serial.is_open:
            raise serial.SerialException(
                "Serial port is not opened"
            )

        measurement_period_ms = int(
            1000 / self.update_rate_hz
        )

        # UBX-CFG-RATE payload
        # measRate: 측정 주기(ms)
        # navRate : 1
        # timeRef : 1 (GPS time)
        payload = (
            measurement_period_ms.to_bytes(
                2,
                byteorder="little",
                signed=False
            )
            + (1).to_bytes(
                2,
                byteorder="little",
                signed=False
            )
            + (1).to_bytes(
                2,
                byteorder="little",
                signed=False
            )
        )

        command = self.make_ubx_message(
            message_class=0x06,
            message_id=0x08,
            payload=payload
        )

        self.serial.write(command)
        self.serial.flush()

        print(
            f"GPS update rate set to "
            f"{self.update_rate_hz} Hz"
        )

    def connect(self):
        if self.serial and self.serial.is_open:
            print("already connected")
            return True

        try:
            self.gps["latest"]["status"] = (
                STATUS_RECONNECTING
            )

            self.serial = serial.Serial(
                self.port,
                self.baudrate,
                timeout=self.timeout
            )

            # 포트가 열린 직후 잠시 대기
            time.sleep(0.2)

            # 연결 또는 재연결될 때마다 주기 재설정
            self.set_update_rate()

            print("connected Success")

        except (serial.SerialException, OSError):
            self.serial = None
            raise

        return True

    def read_gps_data(self):
        if not self.serial or not self.serial.is_open:
            print("serial is not opened")
            self.gps["latest"]["status"] = (
                STATUS_SERIAL_ERROR
            )
            return True

        try:
            while True:
               # print(self.gps["latest"]["status"])
                line = (
                    self.serial
                    .readline()
                    .decode("ascii", "ignore")
                    .strip()
                )

                # timeout 시간 동안 한 줄도 수신하지 못함
                if not line:
                    self.gps["latest"]["status"] = (
                        STATUS_SERIAL_TIMEOUT
                    )
                    return True

                message = pynmea2.parse(line)
                sentence_type = message.sentence_type

                if sentence_type == "RMC":
                    # A: 유효한 위치
                    # V: 유효하지 않은 위치
                    if message.status != "A":
                        self.gps["latest"]["status"] = (
                            STATUS_INVALID_RMC
                        )
                        return True

                    latitude = float(message.latitude)
                    longitude = float(message.longitude)

                    # 빈 좌표나 비정상적인 좌표 차단
                    if not (
                        -90.0 <= latitude <= 90.0
                        and -180.0 <= longitude <= 180.0
                    ):
                        self.gps["latest"]["status"] = (
                            STATUS_DATA_ERROR
                        )
                        return True

                    self.gps["timestamp"] = (
                        datetime.now(
                            timezone.utc
                        ).isoformat()
                    )

                    self.gps["latest"]["latitude"] = (
                        latitude
                    )

                    self.gps["latest"]["longitude"] = (
                        longitude
                    )

                    self.gps["latest"]["status"] = (
                        STATUS_VALID_RMC
                    )

                    return True

                elif sentence_type == "GGA":
                    fix_quality = int(
                        message.gps_qual or 0
                    )

                    # Fix가 없으면 이전 좌표 유지
                    if fix_quality == 0:
                        self.gps["latest"]["status"] = (
                            STATUS_GGA_NO_FIX
                        )
                        return True

                    latitude = float(message.latitude)
                    longitude = float(message.longitude)

                    # 빈 좌표나 비정상적인 좌표 차단
                    if not (
                        -90.0 <= latitude <= 90.0
                        and -180.0 <= longitude <= 180.0
                    ):
                        self.gps["latest"]["status"] = (
                            STATUS_DATA_ERROR
                        )
                        return True

                    self.gps["latest"]["timestamp"] = (
                        datetime.now(
                            timezone.utc
                        ).isoformat()
                    )

                    self.gps["latest"]["latitude"] = (
                        latitude
                    )

                    self.gps["latest"]["longitude"] = (
                        longitude
                    )

                    self.gps["latest"]["status"] = (
                        STATUS_VALID_GGA
                    )

                    return True

                else:
                    # GSA, GSV, VTG 등은 사용하지 않음
                    continue

        except (
            serial.SerialException,
            OSError
        ):
            self.gps["latest"]["status"] = (
                STATUS_SERIAL_ERROR
            )
            raise

        except (
            UnicodeError,
            pynmea2.ParseError,
            AttributeError,
            TypeError,
            ValueError
        ):
            self.gps["latest"]["status"] = (
                STATUS_DATA_ERROR
            )
            raise


def put_latest_data(gps_queue, gps_data):
    """
    큐에 남은 이전 데이터를 제거하고
    가장 최신 상태만 저장합니다.
    """
    try:
        while True:
            gps_queue.get_nowait()
            gps_queue.task_done()

    except queue.Empty:
        pass

    gps_queue.put(
        copy.deepcopy(gps_data)
    )


def main(gps_queue, update_rate_hz=1):
    """
    update_rate_hz:
        1 -> GPS 위치 계산 주기 1 Hz
        5 -> GPS 위치 계산 주기 5 Hz
    """
    gps = GPS(
        update_rate_hz=update_rate_hz
    )

    while True:
        try:
            if gps.connect():
                time.sleep(RECONNECT_INTERVAL)
                break

        except (serial.SerialException, OSError) as error:
            print(f"GPS connect error : {error}")

            gps.gps["latest"]["status"] = (
                STATUS_RECONNECTING
            )

            put_latest_data(
                gps_queue,
                gps.gps
            )

            time.sleep(RECONNECT_INTERVAL)
            continue

    while True:
        try:
            if not gps.read_gps_data():
                continue

            put_latest_data(
                gps_queue,
                gps.gps
            )

        except (serial.SerialException, OSError) as error:
            print(f"GPS serial error : {error}")

            gps.gps["latest"]["status"] = (
                STATUS_SERIAL_ERROR
            )

            put_latest_data(
                gps_queue,
                gps.gps
            )

            gps.shutdown()

            while True:
                try:
                    gps.gps["latest"]["status"] = (
                        STATUS_RECONNECTING
                    )

                    put_latest_data(
                        gps_queue,
                        gps.gps
                    )

                    if gps.connect():
                        break

                except (
                    serial.SerialException,
                    OSError
                ) as reconnect_error:
                    print(
                        f"GPS reconnect error : "
                        f"{reconnect_error}"
                    )

                    time.sleep(RECONNECT_INTERVAL)
                    continue

        except (
            UnicodeError,
            pynmea2.ParseError,
            AttributeError,
            TypeError,
            ValueError
        ) as error:
            print(f"GPS data error : {error}")

            gps.gps["latest"]["status"] = (
                STATUS_DATA_ERROR
            )

            put_latest_data(
                gps_queue,
                gps.gps
            )

            continue

        except KeyboardInterrupt:
            print("GPS 종료")
            gps.shutdown()
            break