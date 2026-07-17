import copy

def main(queue, data, lock):
    with lock:
        queue.put(copy.deepcopy(data))