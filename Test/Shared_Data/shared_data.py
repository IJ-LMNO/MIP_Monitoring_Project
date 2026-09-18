import queue

QUEUE_MAX_SIZE = 1


can0_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
can1_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
gps_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
button_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)

pace_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
rap_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
