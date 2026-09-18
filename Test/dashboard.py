import queue

def main(pace_queue, rap_queue):
    while True:
        try:
            cur = pace_queue.get_nowait()
            print(f"pace : {cur}")
        except queue.Empty:
            pass

        try:
            rap = rap_queue.get_nowait()
            print(f"rap : {rap}")
        except queue.Empty:
            pass


if __name__ == "__main__":
    main()