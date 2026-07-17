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
def get_can0(data):
    return {
        "latest": app.state.can0["latest"],
        "history": list(app.state.can0["history"]),
    }


@app.get("/telemetry/tps")
def get_tps():
    return {
        "latest": app.state.tps["latest"],
        "history": list(app.state.tps["history"]),
    }


@app.get("/telemetry/bps")
def get_bps():
    return {
        "latest": app.state.bps["latest"],
        "history": list(app.state.bps["history"]),
    }


@app.get("/telemetry/desired-yawrate")
def get_desired_yawrate():
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

def get_can0_data(data):
    app.state.can0 = data

def get_tps_data(data):
    app.state.tps = data

def get_bps_data(data):
    app.state.bps = data

def get_desired_yawrate_data(data):
    app.state.desired_yawrate = data


def main():
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )