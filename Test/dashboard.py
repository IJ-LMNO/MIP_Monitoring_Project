import queue

def main(pace_queue, rap_datastructure):
    prevcnt = 0
    while True:
        try:
            cur = pace_queue.get_nowait()
            print(f"pace : {cur}")
        except queue.Empty:
            pass

        if(rap_datastructure["cnt"] == prevcnt):
            pass
        else:
            print(f"rap :{rap_datastructure["cnt"]}")
            prevcnt = rap_datastructure["cnt"]


if __name__ == "__main__":
    main()