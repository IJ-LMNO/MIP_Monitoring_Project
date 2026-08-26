from datetime import datetime, timezone
import pynmea2
import serial
import time
import copy
import queue


RECONNECT_INTERVAL = 0.1


class GPS:
    def __init__(
        self,
        port="/dev/ttyAMA2",
        baudrate=9600,
        timeout=10
    ):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.serial = None

        self.gps = {
            "latest": {
                "timestamp": 0.0,
                "latitude": 0.0,
                "longitude": 0.0
            }
        }

    def shutdown(self):
        if self.serial:
            self.serial.close()
            self.serial = None

    def connect(self):
        if self.serial and self.serial.is_open:
            print("already connected")
            return True

        try:
            self.serial = serial.Serial(
                self.port,
                self.baudrate,
                timeout=self.timeout
            )

            print("connected Success")

        except (serial.SerialException, OSError):
            self.serial = None
            raise

        return True

    def read_gps_data(self):
        if not self.serial:
            print("serial is not opened")
            return None

        try:
            while True:
                line = (
                    self.serial
                    .readline()
                    .decode("ascii", "ignore")
                    .strip()
                )

                if not line:
                    return None

                message = pynmea2.parse(line)
                sentence_type = message.sentence_type

                if sentence_type == "RMC":
                    if message.status != "A":
                        continue

                elif sentence_type == "GGA":
                    if not int(message.gps_qual or 0):
                        continue

                else:
                    continue

                self.gps["latest"]["timestamp"] = (
                    datetime.now(timezone.utc).isoformat()
                )

                self.gps["latest"]["latitude"] = float(
                    message.latitude
                )

                self.gps["latest"]["longitude"] = float(
                    message.longitude
                )

                return True

        except (
            serial.SerialException,
            OSError,
            UnicodeError,
            pynmea2.ParseError,
            AttributeError,
            TypeError,
            ValueError
        ):
            raise


def main(gps_queue):
    gps = GPS()

    while True:
        try:
            if gps.connect():
                time.sleep(RECONNECT_INTERVAL)
                break

        except (serial.SerialException, OSError) as error:
            print(f"GPS connect error : {error}")
            time.sleep(RECONNECT_INTERVAL)
            continue

    while True:
        try:
            if not gps.read_gps_data():
                continue

            try:
                while True:
                    gps_queue.get_nowait()
                    gps_queue.task_done()

            except queue.Empty:
                pass

            gps_queue.put(
                copy.deepcopy(gps.gps)
            )

        except (serial.SerialException, OSError) as error:
            print(f"GPS serial error : {error}")

            gps.shutdown()

            while True:
                try:
                    if gps.connect():
                        break

                except (serial.SerialException, OSError) as reconnect_error:
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
            continue

        except KeyboardInterrupt:
            print("GPS 종료")
            gps.shutdown()
            break