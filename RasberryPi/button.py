from gpiozero import Button
import time
import threading


# GPIO buttons
# bounce_time prevents one physical press from being detected multiple times.
left_b = Button(17, pull_up=False, bounce_time=0.03)
right_b = Button(27, pull_up=False, bounce_time=0.03)


# Shared states
toggle = 0
count = 0
previous_time = None
time_interval = None
queue = None
data = {
    "time_interval" : None,
    "rap" : None
}

_lock = threading.Lock()


def init(button_queue):
    global queue
    queue = button_queue


def _left_pressed():
    """Toggle the left-button state only when the button is actually pressed."""
    global toggle

    with _lock:
        toggle = 1 - toggle


def _right_pressed():
    """Measure the interval between consecutive right-button presses."""
    global previous_time
    global time_interval
    global count

    current_time = time.monotonic()

    with _lock:
        count = 1

        if previous_time is not None:
            time_interval = current_time - previous_time
            data["time_interval"] = time_interval

            queue.put(data)

        previous_time = current_time


def _right_released():
    global count

    with _lock:
        count = 0


# Event-driven GPIO handling:
# No infinite polling loop, so CPU usage stays very low while idle.
left_b.when_pressed = _left_pressed
right_b.when_pressed = _right_pressed
right_b.when_released = _right_released


def get_interval():
    """Return the latest measured interval without blocking."""
    with _lock:
        return time_interval


def get_toggle():
    """Return the current left-button toggle state."""
    with _lock:
        return toggle


def get_count():
    """Return 1 while the right button is pressed, otherwise 0."""
    with _lock:
        return count


def button_input():
    """
    Compatibility function for older code.

    GPIO is already handled by callbacks above, so this function does not
    busy-loop. If older code starts it in a thread, the thread simply sleeps.
    """
    while True:
        time.sleep(3600)
