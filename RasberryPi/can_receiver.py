"""One SocketCAN connection per physical interface, routed by CAN ID."""

from dataclasses import dataclass
import time

import can

from data_channel import put_latest


REFRESH_INTERVAL = 0.02
PUBLISH_INTERVAL = 0.02
RECONNECT_INTERVAL = 2.0


@dataclass
class CanRoute:
    processor: object
    publish_queue: object
    display_queue: object = None
    dirty: bool = False
    next_publish: float = 0.0
    last_display_data: object = None


class CanReceiver:
    def __init__(self, channel, routes, stop_event):
        self.channel = channel
        self.routes = routes
        self.stop_event = stop_event
        self.handlers = {}
        for route in routes:
            for can_id in route.processor.CAN_IDS:
                if can_id in self.handlers:
                    raise ValueError(f"Duplicate CAN handler: {channel}, {can_id:#x}")
                self.handlers[can_id] = route

    def dispatch(self, message, now):
        if message.is_extended_id or message.is_remote_frame or message.is_error_frame:
            return
        route = self.handlers.get(message.arbitration_id)
        if route and route.processor.process_message(message, now):
            route.dirty = True

    def refresh(self, now):
        for route in self.routes:
            publish_due = route.dirty and now >= route.next_publish
            if not publish_due and route.display_queue is None:
                continue

            # Both consumers use values calculated in one processor snapshot.
            payload, display_data = route.processor.snapshot(now)
            if (
                route.display_queue is not None
                and display_data != route.last_display_data
            ):
                put_latest(route.display_queue, display_data)
                route.last_display_data = display_data
            if publish_due:
                put_latest(route.publish_queue, payload)
                route.dirty = False
                route.next_publish = now + PUBLISH_INTERVAL

    def run(self):
        filters = [
            {"can_id": can_id, "can_mask": 0x7FF, "extended": False}
            for can_id in self.handlers
        ]
        while not self.stop_event.is_set():
            bus = None
            try:
                bus = can.interface.Bus(
                    channel=self.channel,
                    interface="socketcan",
                    can_filters=filters,
                )
                print(f"[CAN] connected: {self.channel}")
                next_refresh = time.monotonic()
                while not self.stop_event.is_set():
                    timeout = max(0.0, next_refresh - time.monotonic())
                    message = bus.recv(timeout=timeout)
                    now = time.monotonic()
                    if message is not None:
                        self.dispatch(message, now)
                    # Refresh even without frames, so motor timeouts reach the GUI.
                    if now >= next_refresh:
                        self.refresh(now)
                        next_refresh = now + REFRESH_INTERVAL
            except (can.CanError, OSError) as error:
                print(f"[CAN] {self.channel} receive/connect failed: {error}")
            finally:
                if bus is not None:
                    try:
                        bus.shutdown()
                    except (can.CanError, OSError):
                        pass
                for route in self.routes:
                    route.processor.mark_disconnected()
                self.refresh(time.monotonic())

            # Release the failed bus before waiting and retrying.
            self.stop_event.wait(RECONNECT_INTERVAL)


def create_receivers(routes, stop_event):
    """Group logical processors that use the same physical CAN interface."""
    by_channel = {}
    for route in routes:
        by_channel.setdefault(route.processor.channel, []).append(route)
    return [
        CanReceiver(channel, channel_routes, stop_event)
        for channel, channel_routes in by_channel.items()
    ]
