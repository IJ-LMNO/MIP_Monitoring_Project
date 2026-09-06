from PyQt5 import QtWidgets, QtCore
from PyQt5.QtWidgets import QLabel
from PyQt5.QtGui import QPixmap

import threading
import sys
import math
import time
import queue
import can
import button


class MyClock(QtWidgets.QWidget):

    def __init__(self, button_queue, pace_queue):
        super().__init__()

        self.setFixedSize(1280, 400)

        # Data exchanged with the main MQTT threads.
        self.button_queue = button_queue
        self.pace_queue = pace_queue
        self.last_published_rap = 0
        self.last_face_status = None
        self.cur_pace = "hold"
        self.last_displayed_rap = -1

        # ==========================================
        # Shared CAN data
        # ==========================================

        self.rpm_331 = None
        self.rpm_341 = None
        self.voltage_value = 0.0

        self.last_331_time = None
        self.last_341_time = None

        self.motor_timeout = 0.2

        # Protect CAN data shared between CAN thread and GUI thread.
        self.can_lock = threading.Lock()
        self.can_stop_event = threading.Event()
        self.can_thread = None

        # Cache values already drawn on the GUI.
        # This avoids unnecessary Qt repaint/style work.
        self.last_speed_text = None
        self.last_voltage_text = None
        self.last_interval_text = None
        self.last_left_status = None
        self.last_right_status = None
        self.speed_is_red = False

        # ==========================================
        # Background
        # ==========================================

        self.image_label = QLabel(self)
        self.image_label.setGeometry(0, 0, 1280, 400)

        pixmap = QPixmap("test6.png")
        self.image_label.setPixmap(pixmap)

        # ==========================================
        # Speed
        # ==========================================

        self.speed = QLabel(self)
        self.speed.setStyleSheet(
            'color: green; '
            'font-size: 150px; '
            'font-weight: bold;'
        )
        self.speed.setGeometry(0, 0, 640, 400)
        self.speed.setAlignment(QtCore.Qt.AlignCenter)
        self.speed.setText("0.0")

        # ==========================================
        # Voltage
        # ==========================================

        self.voltage = QLabel(self)
        self.voltage.setStyleSheet(
            'color: green; '
            'font-size: 150px; '
            'font-weight: bold;'
        )
        self.voltage.setGeometry(640, 0, 640, 400)
        self.voltage.setAlignment(QtCore.Qt.AlignCenter)
        self.voltage.setText("0.0")

        # ==========================================
        # Left motor status
        # CAN ID: 0x341
        # ==========================================

        self.left_motor_on = QLabel(self)
        self.left_motor_on.setStyleSheet(
            'color: red; '
            'font-size: 80px; '
            'font-weight: bold;'
        )
        self.left_motor_on.setGeometry(1000, -110, 640, 400)
        self.left_motor_on.setText("off")

        # ==========================================
        # Right motor status
        # CAN ID: 0x331
        # ==========================================

        self.right_motor_on = QLabel(self)
        self.right_motor_on.setStyleSheet(
            'color: red; '
            'font-size: 80px; '
            'font-weight: bold;'
        )
        self.right_motor_on.setGeometry(1150, -110, 640, 400)
        self.right_motor_on.setText("off")

        # ==========================================
        # Button interval
        # ==========================================

        self.inter = QLabel(self)
        self.inter.setStyleSheet(
            'color: red; '
            'font-size: 100px; '
            'font-weight: bold;'
        )
        self.inter.setGeometry(550, 250, 300, 100)
        self.inter.setAlignment(QtCore.Qt.AlignCenter)
        self.inter.setText("0.00")

        # ==========================================
        # Rap count
        # ==========================================

        self.rap = QLabel(self)
        self.rap.setStyleSheet(
            'color: white; '
            'font-size: 50px; '
            'font-weight: bold;'
        )
        self.rap.setGeometry(850, 280, 260, 80)
        self.rap.setAlignment(QtCore.Qt.AlignCenter)
        self.rap.setText("RAP 0")

        # ==========================================
        # Face pace indicator
        # ==========================================

        self.face_indicator = QLabel(self)
        self.face_indicator.setGeometry(560, 10, 160, 130)
        self.face_indicator.setAlignment(QtCore.Qt.AlignCenter)
        self.set_face_indicator("hold")

        # ==========================================
        # CAN / GUI timer
        # ==========================================

        self.init_can()
        self.start_can_thread()
        self.setup_timer()

        self.showFullScreen()

    # ==========================================
    # CAN initialization
    # ==========================================

    def init_can(self):
        try:
            # Receive only the two IDs used by this dashboard.
            # Filtering is performed as low in the stack as python-can/socketcan
            # allows, reducing unnecessary Python work.
            filters = [
                {
                    "can_id": 0x331,
                    "can_mask": 0x7FF,
                    "extended": False
                },
                {
                    "can_id": 0x341,
                    "can_mask": 0x7FF,
                    "extended": False
                }
            ]

            self.bus = can.interface.Bus(
                channel='can0',
                interface='socketcan',
                can_filters=filters
            )

            print("[DISPLAY] CAN0 connected")

        except Exception as e:
            print("[DISPLAY] CAN initialization failed:", e)
            self.bus = None

    # ==========================================
    # CAN receive thread
    # ==========================================

    def start_can_thread(self):
        if not self.bus:
            return

        self.can_thread = threading.Thread(
            target=self.can_receive_loop,
            daemon=True
        )
        self.can_thread.start()

    def can_receive_loop(self):
        """
        Blocking CAN receive loop.

        recv(timeout=1.0) sleeps while no CAN frame is available, unlike the
        previous 10 ms GUI polling loop.
        """
        while not self.can_stop_event.is_set():
            try:
                msg = self.bus.recv(timeout=1.0)

                if msg is None:
                    continue

                now = time.monotonic()

                if (
                    msg.arbitration_id == 0x331
                    and len(msg.data) >= 8
                ):
                    voltage = (
                        int.from_bytes(
                            msg.data[0:2],
                            byteorder='little',
                            signed=False
                        )
                        / 10.0
                    )

                    rpm = int.from_bytes(
                        msg.data[6:8],
                        byteorder='little',
                        signed=True
                    )

                    with self.can_lock:
                        self.voltage_value = voltage
                        self.rpm_331 = rpm
                        self.last_331_time = now

                elif (
                    msg.arbitration_id == 0x341
                    and len(msg.data) >= 8
                ):
                    rpm = int.from_bytes(
                        msg.data[6:8],
                        byteorder='little',
                        signed=True
                    )

                    with self.can_lock:
                        self.rpm_341 = rpm
                        self.last_341_time = now

            except can.CanOperationError as e:
                if not self.can_stop_event.is_set():
                    print("[DISPLAY] CAN receive failed:", e)
                    time.sleep(0.1)

            except Exception as e:
                if not self.can_stop_event.is_set():
                    print("[DISPLAY] CAN receive failed:", e)
                    time.sleep(0.1)

    # ==========================================
    # GUI timer
    # ==========================================

    def setup_timer(self):
        # 50 ms = 20 Hz GUI refresh.
        # CAN is still received immediately in the blocking CAN thread.
        self.display_timer = QtCore.QTimer(self)
        self.display_timer.timeout.connect(self.update_display)
        self.display_timer.start(50)

    def set_face_indicator(self, status):
        """Convert the received face state into a dashboard symbol."""
        normalized = str(status).strip().lower()

        if normalized in {"up", "face up", "face_up", "face-up"}:
            symbol = "↑"
            color = "lime"
        elif normalized in {"down", "face down", "face_down", "face-down"}:
            symbol = "↓"
            color = "red"
        else:
            symbol = "—"
            color = "white"

        self.face_indicator.setText(symbol)
        self.face_indicator.setStyleSheet(
            f'color: {color}; '
            'font-size: 110px; '
            'font-weight: bold;'
        )

    # ==========================================
    # GUI update
    # ==========================================

    def update_display(self):
        current_time = time.monotonic()

        # Take one short snapshot of CAN data.
        with self.can_lock:
            rpm_331 = self.rpm_331
            rpm_341 = self.rpm_341
            voltage_value = self.voltage_value
            last_331_time = self.last_331_time
            last_341_time = self.last_341_time

        # ==========================================
        # Motor status
        # ==========================================

        right_status = (
            "on"
            if (
                last_331_time is not None
                and current_time - last_331_time < self.motor_timeout
            )
            else "off"
        )

        left_status = (
            "on"
            if (
                last_341_time is not None
                and current_time - last_341_time < self.motor_timeout
            )
            else "off"
        )

        # Only repaint when text actually changes.
        if right_status != self.last_right_status:
            self.right_motor_on.setText(right_status)
            self.last_right_status = right_status

        if left_status != self.last_left_status:
            self.left_motor_on.setText(left_status)
            self.last_left_status = left_status

        # ==========================================
        # Voltage
        # ==========================================

        voltage_text = f"{voltage_value:.1f}"

        if voltage_text != self.last_voltage_text:
            self.voltage.setText(voltage_text)
            self.last_voltage_text = voltage_text

        # ==========================================
        # RPM selection
        # ==========================================

        if rpm_331 is not None and rpm_341 is not None:
            motor_rpm = (rpm_331 + rpm_341) / 2.0
        elif rpm_331 is not None:
            motor_rpm = rpm_331
        elif rpm_341 is not None:
            motor_rpm = rpm_341
        else:
            motor_rpm = 0.0

        # ==========================================
        # Motor RPM -> Vehicle speed [km/h]
        #
        # Motor sprocket: 11T
        # Axle sprocket: 50T
        # Tire diameter: 18 inch
        # ==========================================

        speed_kmh = (
            motor_rpm
            / 60.0
            * (18 * 0.0254 * math.pi)
            * (11 / 50)
            * 3.6
        )

        speed_kmh = abs(speed_kmh)
        speed_text = f"{speed_kmh:.1f}"

        if speed_text != self.last_speed_text:
            self.speed.setText(speed_text)
            self.last_speed_text = speed_text

        # Change stylesheet only when crossing the 60 km/h threshold.
        should_be_red = speed_kmh >= 60

        if should_be_red != self.speed_is_red:
            if should_be_red:
                self.speed.setStyleSheet(
                    'color: red; '
                    'font-size: 150px; '
                    'font-weight: bold;'
                )
            else:
                self.speed.setStyleSheet(
                    'color: green; '
                    'font-size: 150px; '
                    'font-weight: bold;'
                )

            self.speed_is_red = should_be_red

        # ==========================================
        # Button interval
        # ==========================================

        try:
            data = self.button_queue.get_nowait()

            if (
                data["time_interval"] is not None
                and data["rap"] > self.last_displayed_rap
            ):
                interval_text = f'{data["time_interval"]:.2f}'

                if interval_text != self.last_interval_text:
                    self.inter.setText(interval_text)
                    self.last_interval_text = interval_text

                self.rap.setText(f'RAP {data["rap"]}')

                self.last_displayed_rap = data["rap"]

        except queue.Empty:
            pass 

        # ==========================================
        # face up and down
        # ==========================================

        try:
            self.cur_pace = self.pace_queue.get_nowait()
            print(self.cur_pace)
            self.set_face_indicator(self.cur_pace)

        except queue.Empty:
            pass    


    # ==========================================
    # Close
    # ==========================================

    def closeEvent(self, event):
        self.can_stop_event.set()

        if hasattr(self, 'bus') and self.bus:
            try:
                self.bus.shutdown()
            except Exception:
                pass

        event.accept()


# ==========================================
# Main
# ==========================================
def main(button_queue, pace_queue):
    app = QtWidgets.QApplication(sys.argv)
    window = MyClock(button_queue, pace_queue)
    return app.exec_()



if __name__ == '__main__':
    standalone_button_queue = queue.Queue()
    standalone_face_status = {"status": "hold"}
    standalone_face_lock = threading.Lock()
    app = QtWidgets.QApplication(sys.argv)
    window = MyClock(
        standalone_button_queue,
        standalone_face_status,
        standalone_face_lock,
    )
    sys.exit(app.exec_())
