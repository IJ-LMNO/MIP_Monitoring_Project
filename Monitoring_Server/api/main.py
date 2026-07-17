from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from Monitoring_Server.log.main import main as log_main

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def race_start():
    log_main("race_start")


def race_reset():
    log_main("race_reset")


def race_stop():
    log_main("race_stop")


@app.get("/telemetry/can0")
def get_can0():
    with app.state.can0_lock:
        return {
            "latest": app.state.can0["latest"],
            "history": list(app.state.can0["history"]),
        }


@app.get("/telemetry/tps")
def get_tps():
    with app.state.tps_lock:
        return {
            "latest": app.state.tps["latest"],
            "history": list(app.state.tps["history"]),
        }


@app.get("/telemetry/bps")
def get_bps():
    with app.state.bps_lock:
        return {
            "latest": app.state.bps["latest"],
            "history": list(app.state.bps["history"]),
        }


@app.get("/telemetry/desired-yawrate")
def get_desired_yawrate():
    with app.state.desired_yawrate_lock:
        return {
            "latest": app.state.desired_yawrate["latest"],
            "history": list(app.state.desired_yawrate["history"]),
        }


@app.get("/racestartbutton")
def race_start_button():
    race_start()

    return {
        "status": "success",
        "race_state": "start",
    }


@app.get("/racestopbutton")
def race_stop_button():
    race_stop()

    return {
        "status": "success",
        "race_state": "stop",
    }


@app.get("/raceresetbutton")
def race_reset_button():
    race_reset()

    return {
        "status": "success",
        "race_state": "reset",
    }


def main(can0, tps, bps, desired_yawrate, can0_lock, tps_lock, bps_lock, desired_yawrate_lock):
    app.state.can0 = can0
    app.state.tps = tps
    app.state.bps = bps
    app.state.desired_yawrate = desired_yawrate
    app.state.can0_lock = can0_lock
    app.state.tps_lock = tps_lock
    app.state.bps_lock = bps_lock
    app.state.desired_yawrate_lock = desired_yawrate_lock

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )