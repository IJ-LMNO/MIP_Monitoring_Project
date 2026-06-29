import time

# recent driving log
# drive_log is data structure which save recent driving log
# sensor data is mapping with json key and each key have tuple that consist of tuple pair of (value, timestamp)

recent_drive_log={
    #데이터 구조 확정되면 추가 예정
}

def update_recent_drive_log(key, data, start_time):
    timestamp = time.time() - start_time

    if key not in recent_drive_log:
        recent_drive_log[key] = []
    
    recent_drive_log[key].extend((data,timestamp))

def provide_recent_drive_log():
    return recent_drive_log