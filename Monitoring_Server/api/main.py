from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware

import uvicorn
import copy

from Logging_Service.main import race_start
from Logging_Service.main import race_stop
from Logging_Service.main import race_reset
from Logging_Service.main import return_log


app = FastAPI()


# 서버 시작 직후 사용할 기본 상태
app.state.can0 = {
    "latest": {
        "avg_rpm": 0.0,
        "avg_voltage": 0.0,
        "avg_power": 0.0,

        "power_right": 0.0,
        "power_left": 0.0,

        "speed": 0.0,

        "current_left": 0.0,
        "current_right": 0.0,

        "rpm_left": 0.0,
        "rpm_right": 0.0,

        "torque_left": 0.0,
        "torque_right": 0.0,
    },
    "history": {
        "current_right": [],
        "current_left": [],
        "avg_power": [],
    },
    "version": 0,
}

app.state.tps = {
    "latest": 0.0,
    "history": [],
    "version": 0,
}

app.state.desired_yawrate = {
    "latest": 0.0,
    "history": [],
    "version": 0,
}

app.state.gps = {
    "latest": {
        "timestamp": 0.0,
        "latitude": 0.0,
        "longitude": 0.0,
    },
    "history": [],
    "version": 0,
}

app.state.yawrate = {
    "latest": 0.0,
    "history": [],
    "version": 0,
}

app.state.rollrate = {
    "latest": 0.0,
    "history": [],
    "version": 0,
}

app.state.steeringhandle = {
    "latest": 0.0,
    "history": [],
    "version": 0,
}

app.state.tiredegree = {
    "latest": 0.0,
    "history": [],
    "version": 0,
}


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://100.84.183.9",
    "https://100.70.221.71",
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
    return {
        "latest": copy.deepcopy(app.state.can0["latest"]),
        "history": {
            "current_right": list(
                app.state.can0["history"]["current_right"]
            ),
            "current_left": list(
                app.state.can0["history"]["current_left"]
            ),
            "avg_power": list(
                app.state.can0["history"]["avg_power"]
            ),
        },
        "version": app.state.can0["version"],
    }


@app.get("/telemetry/tps")
def get_tps():
    return {
        "latest": copy.deepcopy(app.state.tps["latest"]),
        "history": list(app.state.tps["history"]),
        "version": app.state.tps["version"],
    }


@app.get("/telemetry/desired-yawrate")
def get_desired_yawrate():
    return {
        "latest": copy.deepcopy(
            app.state.desired_yawrate["latest"]
        ),
        "history": list(
            app.state.desired_yawrate["history"]
        ),
        "version": app.state.desired_yawrate["version"],
    }


@app.get("/telemetry/gps")
def get_gps():
    return {
        "latest": copy.deepcopy(app.state.gps["latest"]),
        "history": list(app.state.gps["history"]),
        "version": app.state.gps["version"],
    }


@app.get("/telemetry/yawrate")
def get_yawrate():
    return {
        "latest": copy.deepcopy(app.state.yawrate["latest"]),
        "history": list(app.state.yawrate["history"]),
        "version": app.state.yawrate["version"],
    }


@app.get("/telemetry/rollrate")
def get_rollrate():
    return {
        "latest": copy.deepcopy(app.state.rollrate["latest"]),
        "history": list(app.state.rollrate["history"]),
        "version": app.state.rollrate["version"],
    }


@app.get("/telemetry/steeringhandle")
def get_steeringhandle():
    return {
        "latest": copy.deepcopy(
            app.state.steeringhandle["latest"]
        ),
        "history": list(
            app.state.steeringhandle["history"]
        ),
        "version": app.state.steeringhandle["version"],
    }


@app.get("/telemetry/tiredegree")
def get_tiredegree():
    return {
        "latest": copy.deepcopy(
            app.state.tiredegree["latest"]
        ),
        "history": list(
            app.state.tiredegree["history"]
        ),
        "version": app.state.tiredegree["version"],
    }


@app.get("/race/latest/download")
def return_log_from_server():
    latest_race = return_log()

    if latest_race is False:
        raise HTTPException(
            status_code=404,
            detail="로그데이터 없음",
        )

    return copy.deepcopy(latest_race)


@app.post("/race/start")
def race_start_button():
    race_start()

    return {
        "status": "success",
        "state": "start",
    }


@app.post("/race/stop")
def race_stop_button():
    race_stop()

    return {
        "status": "success",
        "state": "stop",
    }


@app.post("/race/reset")
def race_reset_button():
    race_reset()

    return {
        "status": "success",
        "state": "reset",
    }


def get_can0_data(data):
    app.state.can0 = copy.deepcopy(data)


def get_tps_data(data):
    app.state.tps = copy.deepcopy(data)


def get_desired_yawrate_data(data):
    app.state.desired_yawrate = copy.deepcopy(data)


def get_gps_data(data):
    app.state.gps = copy.deepcopy(data)


def get_yawrate_data(data):
    app.state.yawrate = copy.deepcopy(data)


def get_rollrate_data(data):
    app.state.rollrate = copy.deepcopy(data)


def get_steeringhandle_data(data):
    app.state.steeringhandle = copy.deepcopy(data)


def get_tiredegree_data(data):
    app.state.tiredegree = copy.deepcopy(data)


def main():
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )