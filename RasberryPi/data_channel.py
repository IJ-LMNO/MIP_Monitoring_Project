"""Bounded queues for latest-value telemetry; producers never wait on consumers."""

import queue


def put_latest(data_queue, data):
    """Publish a new snapshot, discarding an older pending one if full."""
    while True:
        try:
            data_queue.put_nowait(data)
            return
        except queue.Full:
            try:
                data_queue.get_nowait()
                data_queue.task_done()
            except queue.Empty:
                pass


def take_latest(data_queue):
    """Return the newest queued value, or None; finish all removed queue tasks."""
    latest = None
    while True:
        try:
            latest = data_queue.get_nowait()
        except queue.Empty:
            return latest
        else:
            data_queue.task_done()
