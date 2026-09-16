def main(pace_queue):
    while(True):
        cur = pace_queue.get()
        print(f"pace : {cur}")

if __name__ == "__main__":
    main()