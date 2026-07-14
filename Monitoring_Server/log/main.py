import time

# recent driving log
# drive_log is data structure which save recent driving log
# sensor data is mapping with json key and each key have tuple that consist of tuple pair of (value, timestamp)

class RaceLogger:
    def __init__(self):
        self.recnt_drive_log = {

        }

    def start_race(self):
        print(f"{time.time()} : race start")

def main(toggle):
    race_logger = RaceLogger()

    if(toggle == "race_start"):
        race_logger.start_race()
    elif(toggle == "race_stop"):
        race_logger.stop_race()
    elif(toggle == "race_reset"):
        race_logger.reset_race()
    