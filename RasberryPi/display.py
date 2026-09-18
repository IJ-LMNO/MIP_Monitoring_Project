"""Render processed telemetry and MQTT lap/pace values on the Qt dashboard."""

from pathlib import Path
import queue
import sys

from PyQt5 import QtWidgets, QtCore
from PyQt5.QtWidgets import QLabel
from PyQt5.QtGui import QPixmap

from data_channel import take_latest


class MyClock(QtWidgets.QWidget):
    def __init__(self, telemetry_queue, rap_datastructure, pace_queue):
        super().__init__()
        self.setFixedSize(1280, 400)
        self.telemetry_queue = telemetry_queue
        self.rap_datastructure = rap_datastructure
        self.pace_queue = pace_queue
        self.last_displayed_lap = 0
        self.last_face_status = "hold"
        self.last_speed_text = "0.0"
        self.last_voltage_text = "0.0"
        self.last_left_status = "off"
        self.last_right_status = "off"
        self.speed_is_red = False

        # ==========================================
        # Background
        # ==========================================

        self.image_label = QLabel(self)
        self.image_label.setGeometry(0, 0, 1280, 400)

        pixmap = QPixmap(str(Path(__file__).with_name("test6.png")))
        self.image_label.setPixmap(pixmap)

        # ==========================================
        # Speed
        # ==========================================

        self.speed = QLabel(self)
        self.speed.setStyleSheet(
            'color: white; '
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
            'color: white; '
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
        # Lap count
        # ==========================================

        self.lap = QLabel(self)
        self.lap.setStyleSheet(
            'color: white; '
            'font-size: 100px; '
            'font-weight: bold;'
        )
        self.lap.setGeometry(550, 180, 360, 280)
        self.lap.setAlignment(QtCore.Qt.AlignCenter)
        self.lap.setText("LAP 0")

        # ==========================================
        # Face pace indicator
        # ==========================================

        self.face_indicator = QLabel(self)
        self.face_indicator.setGeometry(560, 10, 200, 130)
        self.face_indicator.setAlignment(QtCore.Qt.AlignCenter)
        self.set_face_indicator("hold")

        self.display_timer = QtCore.QTimer(self)
        self.display_timer.timeout.connect(self.update_display)
        self.display_timer.start(50)
        self.showFullScreen()

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
            'font-size: 200px; '
            'font-weight: bold;'
        )

    def update_display(self):
        data = take_latest(self.telemetry_queue)
        if data is not None:
            # Values and motor status are already calculated by can0.py.
            speed_text = f'{data["speed"]:.1f}'
            voltage_text = f'{data["voltage"]:.1f}'
            if speed_text != self.last_speed_text:
                self.speed.setText(speed_text)
                self.last_speed_text = speed_text
            if voltage_text != self.last_voltage_text:
                self.voltage.setText(voltage_text)
                self.last_voltage_text = voltage_text
            if data["left_status"] != self.last_left_status:
                self.left_motor_on.setText(data["left_status"])
                self.last_left_status = data["left_status"]
            if data["right_status"] != self.last_right_status:
                self.right_motor_on.setText(data["right_status"])
                self.last_right_status = data["right_status"]

            should_be_red = data["speed"] >= 60
            if should_be_red != self.speed_is_red:
                color = "red" if should_be_red else "white"
                self.speed.setStyleSheet(
                    f'color: {color}; font-size: 150px; font-weight: bold;'
                )
                self.speed_is_red = should_be_red

        lap_count = self.rap_datastructure["cnt"]
        if lap_count is not None and lap_count != self.last_displayed_lap:
            self.lap.setText(f"LAP {lap_count}")
            self.last_displayed_lap = lap_count

        pace = take_latest(self.pace_queue)
        if pace is not None and pace != self.last_face_status:
            self.set_face_indicator(pace)
            self.last_face_status = pace

    def closeEvent(self, event):
        self.display_timer.stop()
        event.accept()


def main(telemetry_queue, rap_datastructure, pace_queue):
    app = QtWidgets.QApplication(sys.argv)
    window = MyClock(telemetry_queue, rap_datastructure, pace_queue)
    return app.exec_()


if __name__ == "__main__":
    # Standalone visual preview. Use main.py for live CAN and MQTT data.
    sys.exit(main(queue.Queue(maxsize=1), queue.Queue(maxsize=1), queue.Queue(maxsize=1)))
