from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import copy
import queue

from Logging_Service.main import race_start as race_start
from Logging_Service.main import race_stop as race_stop
from Logging_Service.main import race_reset as race_reset
from Logging_Service.main import return_log as return_log

can0_queue = queue.Queue()
tps_queue = queue.Queue()
bps_queue = queue.Queue()
desired_yawrate_queue = queue.Queue()
gps_queue = queue.Queue()


app = FastAPI()


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://100.84.183.9",
    "https://100.70.221.71"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/telemetry/can0")
def get_can0():
    latest = can0_queue.get()
    return {
        "latest": latest["latest"],
        "history": list(latest["history"]),
        "version" : latest["version"]
    }


@app.get("/telemetry/tps")
def get_tps():
    latest = tps_queue.get()
    return {
        "latest": latest["latest"],
        "history": list(latest["history"]),
        "version" : latest["version"]
    }


@app.get("/telemetry/bps")
def get_bps():
    latest = bps_queue.get()
    return {
        "latest": latest["latest"],
        "history": list(latest["history"]),
        "version" : latest["version"]
    }


@app.get("/telemetry/desired-yawrate")
def get_desired_yawrate():
    latest = desired_yawrate_queue.get()
    return {
        "latest": latest["latest"],
        "history": list(latest["history"]),
        "version" : latest["version"]
    }


@app.get("/telemetry/gps")
def get_gps():
    latest = gps_queue.get()
    return {
        "latest": latest["latest"],
        "version" : latest["version"]
    }

@app.get("/detail/yawrate"){
    return
}

@app.get("/race/latest/download")
def return_log_from_server():
    latest_race = return_log()

    if(latest_race == False):
        raise HTTPException(
            status_code=404,
            detail="로그데이터 없음"
        )
    else:
        return copy.deepcopy(latest_race)

@app.post("/race/start")
def race_start_button():
    race_start()


@app.post("/race/stop")
def race_stop_button():
    race_stop()



@app.post("/race/reset")
def race_reset_button():
    race_reset()


def get_can0_data(data):
    can0_queue.put(data)

def get_tps_data(data):
    tps_queue.put(get_gps_data)

def get_bps_data(data):
    bps_queue.put(data)

def get_desired_yawrate_data(data):
    desired_yawrate_queue.put(data)

def get_gps_data(data):
    gps_queue.put(data)


def main():
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )