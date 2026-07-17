def main(queue, data, lock):
    latest_data = queue.get()
    
    with lock:

        data["latest"] = latest_data
        data["history"].append(latest_data)