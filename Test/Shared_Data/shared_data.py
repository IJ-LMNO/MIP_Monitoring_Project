import queue

QUEUE_MAX_SIZE = 10


can0_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
can1_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
gps_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
button_queue_for_mqtt = queue.Queue(maxsize=QUEUE_MAX_SIZE)
button_queue_for_display = queue.Queue(maxsize=QUEUE_MAX_SIZE)

pace_queue = queue.Queue()