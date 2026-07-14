import threading as thread
from sample import main as main

powerunit_data ={}

def PowerUnit_Thread():
    powerunit_thread = thread.Thread(
        target= main,
        args=(powerunit_data)
    )

    powerunit_thread.start()



def main():
    PowerUnit_Thread()