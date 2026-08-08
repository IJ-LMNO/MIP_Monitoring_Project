from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import copy
import time
import asyncio
from collections import deque
from pydantic import BaseModel

from Logging_Service.main import race_start as race_start
from Logging_Service.main import race_stop as race_stop
from Logging_Service.main import race_reset as race_reset
from Logging_Service.main import return_log as return_log
from Monitoring_Server.mqtt.shared_state import MQTT_event as MQTT_event

dequeue_size = 10

can0_dequeue = deque(maxlen=dequeue_size)
tps_dequeue = deque(maxlen=dequeue_size)
desired_yawrate_dequeue = deque(maxlen=dequeue_size)
yawrate_dequeue = deque(maxlen=dequeue_size)
rollrate_dequeue = deque(maxlen=dequeue_size)
steeringhandle_dequeue = deque(maxlen=dequeue_size)
tiredegree_dequeue = deque(maxlen=dequeue_size)
gps_dequeue = deque(maxlen=dequeue_size)

can0_detail_dequeue = deque(maxlen=9000)
desired_yawrate_detail_dequeue = deque(maxlen=9000)
yawrate_detail_dequeue = deque(maxlen= 9000)
rollrate_detail_dequeue = deque(maxlen=9000)


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

class FrontendStartRequest(BaseModel):
    status : bool



@app.get("/telemetry/can0")
def get_can0():
    if(len(can0_dequeue) == 0):
        raise HTTPException(
            status_code=404,
            detail="can0 데이터 없음"
        )
    else:
        latest = can0_dequeue.popleft()
        return {
            "latest": latest["latest"],
            "version" : latest["version"],
            "size" : len(can0_dequeue)
        }

@app.get("/telemetry/can1")
def get_tps():
    if(len(tps_dequeue) == 0):
        raise HTTPException(
            status_code=404,
            detail = "tps 데이터 없음"
        )

    if(len(desired_yawrate_dequeue) == 0):
        raise HTTPException(
            status_code=404,
            detail = "desired_yawrate 데이터 없음"
        )

    if(len(yawrate_dequeue) == 0):
        raise HTTPException(
            status_code=404,
            detail = "yawrate 데이터 없음"
        )

    if(len(rollrate_dequeue) == 0):
        raise HTTPException(
            status_code=404,
            detail = "rollrate 데이터 없음"
        )
    if(len(steeringhandle_dequeue) == 0):
        raise HTTPException(
            status_code=404,
            detail = "steeringhandle 데이터 없음"
        )
    if(len(tiredegree_dequeue) == 0):
        raise HTTPException(
            status_code=404,
            detail = "tiredegree 데이터 없음"
        )
    
    tps_latest = tps_dequeue.popleft()
    print(f"tps_len 108 : {len(tps_dequeue)}")
    desired_yawrate_latest = desired_yawrate_dequeue.popleft()
    yawrate_latest = yawrate_dequeue.popleft()
    rollrate_latest = rollrate_dequeue.popleft()
    steeringhandle_latest = steeringhandle_dequeue.popleft()
    tiredegree_latest = tiredegree_dequeue.popleft()

    return (
        [
            {
                "latest": tps_latest["latest"],
                "version" : tps_latest["version"],
                "size" : len(tps_dequeue)
            },
            {
                "latest": desired_yawrate_latest["latest"],
                "version" : desired_yawrate_latest["version"],
                "size" : len(desired_yawrate_dequeue)
            },
            {
                "latest": yawrate_latest["latest"],
                "version" : yawrate_latest["version"],
                "size" : len(yawrate_dequeue)
            },
            {
                "latest": rollrate_latest["latest"],
                "version" : rollrate_latest["version"],
                "size" : len(rollrate_dequeue)
            },
            {
                "latest": steeringhandle_latest["latest"],
                "version" : steeringhandle_latest["version"],
                "size" : len(steeringhandle_dequeue)
            },
            {
                "latest": tiredegree_latest["latest"],
                "version" : tiredegree_latest["version"],
                "size" : len(tiredegree_dequeue)
            },
        ]      
    )
    
@app.get("/telemetry/gps")
def get_gps():
    if(len(gps_dequeue) == 0):
        raise HTTPException(
            status_code=404,
            detail = "gps 데이터 없음"
        )
    else:
        latest = gps_dequeue.popleft()
        return {
            "latest": latest["latest"],
            "version" : latest["version"],
            "size" : len(gps_dequeue)
        }



@app.get("/detail/first/yawrate")
def get_first_detail_yawrate():
    if(len(yawrate_detail_dequeue) ==0):
        raise HTTPException(
            status_code=404,
            detail = "데이터 없음"
        )
    else:
        tmp = yawrate_detail_dequeue
        yawrate_detail_dequeue.clear()
        return{
            "history" : list(tmp),
            "size" : len(tmp)
        }

@app.get("/detail/yawrate")
def get_detail_yawrate():
    if(len(yawrate_detail_dequeue) == 0):
        raise HTTPException(
            status_code=404,
            detail = "데이터 없음"
        )
    else:
        latest = yawrate_detail_dequeue.popleft()
        return {
            "latest": latest["latest"],
            "size" : len(yawrate_detail_dequeue)
        }

@app.get("/detail/first/desired/yawrate")
def get_first_detail_desired_yawrate():
    if(len(desired_yawrate_detail_dequeue) ==0):
            raise HTTPException(
            status_code=404,
            detail = "데이터 없음"
        )
    else:
        tmp = desired_yawrate_detail_dequeue
        desired_yawrate_detail_dequeue.clear()
        return{
            "history" : list(tmp),
            "size" : len(tmp)
        }

@app.get("/detail/desired/yawrate")
def get_detail_desired_yawrate():
    if(len(desired_yawrate_detail_dequeue) == 0):
        raise HTTPException(
            status_code=404,
            detail = "데이터 없음"
        )
    else:
        latest = desired_yawrate_detail_dequeue.popleft()
        return {
            "latest": latest["latest"],
            "size" : len(desired_yawrate_detail_dequeue)
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


@app.post("/frontend/start")
def frontend_start(request: FrontendStartRequest):
    if not request.status:
        MQTT_event.clear()
        return False

    MQTT_event.set()

    timeout_seconds = 10
    check_interval = 0.05
    start_time = time.monotonic()

    while True:
        data_ready = (
            len(can0_dequeue) >= 1
            and len(tps_dequeue) >= 1
            and len(gps_dequeue) >= 1
        )

        if data_ready:
            return True

        if time.monotonic() - start_time >= timeout_seconds:
            return False

        time.sleep(check_interval)


can0_asyncio_event = asyncio.Event()
can0_event_loop = None
@app.websocket("/telemetry/can0/ws")
async def can0_ws_endpoint(websocket: WebSocket):
    global can0_event_loop

    await websocket.accept()

    can0_event_loop = asyncio.get_running_loop()

    while True:
        if len(can0_dequeue) == 0:
            await can0_asyncio_event.wait()

        else:
            can0_dequeue_len = len(can0_dequeue)

            while can0_dequeue_len > 0:
                latest = can0_dequeue.popleft()

                await websocket.send_json(
                    {
                        "latest": latest["latest"],
                        "version": latest["version"],
                        "size": len(can0_dequeue)
                    }
                )

                can0_dequeue_len -= 1

            if len(can0_dequeue) == 0:
                can0_asyncio_event.clear()



def get_can0_data(data):
    can0_dequeue.append(data)
    print("호출됨")
    if can0_event_loop is not None:
        can0_event_loop.call_soon_threadsafe(
            can0_asyncio_event.set
        )

def get_tps_data(data):
    tps_dequeue.append(data)

def get_desired_yawrate_data(data):
    desired_yawrate_dequeue.append(data)
    desired_yawrate_detail_dequeue.append(data)

def get_yawrate_data(data):
    yawrate_dequeue.append(data)
    yawrate_detail_dequeue.append(data)

def get_rollrate_data(data):
    rollrate_dequeue.append(data)
    rollrate_detail_dequeue.append(data)

def get_steeringhandle_data(data):
    steeringhandle_dequeue.append(data)

def get_tiredegree_data(data):
    tiredegree_dequeue.append(data)

def get_gps_data(data):
    gps_dequeue.append(data)




def main():
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )