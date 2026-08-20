from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import copy
import threading as thread
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
can1_dequeue = deque(maxlen=dequeue_size)
gps_dequeue = deque(maxlen=dequeue_size)

can1_detail_dequeue = deque(maxlen = 9000)

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


# @app.get("/race/latest/download")
# def return_log_from_server():
#     latest_race = return_log()

#     if(latest_race == False):
#         raise HTTPException(
#             status_code=404,
#             detail="로그데이터 없음"
#         )
#     else:
#         return copy.deepcopy(latest_race)


@app.post("/race/start")
def race_start_button():
    print("race start")
    # race_start()


@app.post("/race/stop")
def race_stop_button():
    print("race stop")
    # race_stop()



@app.post("/race/reset")
def race_reset_button():
    print("race reset")
    # race_reset()


@app.post("/frontend/start")
def frontend_start(request: FrontendStartRequest):
    if not request.status:
        MQTT_event.clear()
        return False

    MQTT_event.set()


    data_ready = (
        len(can0_dequeue) >= 1
        # and len(can1_dequeue) >= 1
        and len(gps_dequeue) >= 1

    )

    print(len(can0_dequeue))
    print(len(gps_dequeue))

    if data_ready:
        return True
    else:
        return False





    
##--------------------------------------------------------------------------
##--------------------------------------------------------------------------
can0_asyncio_event = asyncio.Event()
can0_event_loop = None
@app.websocket("/telemetry/can0/ws")
async def can0_ws_endpoint(websocket: WebSocket):
    global can0_event_loop

    await websocket.accept()

    can0_event_loop = asyncio.get_running_loop()

    try:
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
                            "size": len(can0_dequeue)
                        }
                    )

                    can0_dequeue_len -= 1

                if len(can0_dequeue) == 0:
                    can0_asyncio_event.clear()

    except WebSocketDisconnect:
        print("can0 websocket 연결 종료")
##--------------------------------------------------------------------------
##--------------------------------------------------------------------------




##--------------------------------------------------------------------------
##--------------------------------------------------------------------------
gps_asyncio_event = asyncio.Event()
gps_event_loop = None
@app.websocket("/telemetry/gps/ws")
async def gps_ws_endpoint(websocket: WebSocket):
    global gps_event_loop

    await websocket.accept()

    gps_event_loop = asyncio.get_running_loop()

    while True:
        if len(gps_dequeue) == 0:
            await gps_asyncio_event.wait()

        else:
            gps_dequeue_len = len(gps_dequeue)

            while gps_dequeue_len > 0:
                latest = gps_dequeue.popleft()

                await websocket.send_json(
                    {
                        "latest": latest["latest"],
                        "version": latest["version"],
                        "size": len(gps_dequeue)
                    }
                )

                gps_dequeue_len -= 1

            if len(gps_dequeue) == 0:
                gps_asyncio_event.clear()\
##--------------------------------------------------------------------------
##--------------------------------------------------------------------------



##--------------------------------------------------------------------------
##--------------------------------------------------------------------------
can1_asyncio_event = asyncio.Event()
can1_event_loop = None
@app.websocket("/telemetry/can1/ws")
async def can1_ws_endpoint(websocket: WebSocket):
    global can1_event_loop

    await websocket.accept()

    can1_event_loop = asyncio.get_running_loop()

    while True:
        if len(can1_dequeue) == 0:
            await can1_asyncio_event.wait()

        else:
            can1_dequeue_len = len(can1_dequeue)

            while can1_dequeue_len > 0:
                latest = can1_dequeue.popleft()

                await websocket.send_json(
                    {
                        "tps": latest["tps"]["latest"],
                        "desired_yawrate": latest["desired_yawrate"]["latest"],
                        "yawrate": latest["yawrate"]["latest"],
                        "rollrate": latest["rollrate"]["latest"],
                        "steeringhandle": latest["steeringhandle"]["latest"],
                        "tiredegree": latest["tiredegree"]["latest"],
                        "version": 0
                    }
                )

                can1_dequeue_len -= 1

            if len(can1_dequeue) == 0:
                can1_asyncio_event.clear()

can1_lock = thread.Lock()
@app.get("/first/detail/yawrate")
def yawrate_detail_page_first_telemetry():
    if(len(can1_detail_dequeue) == 0):
        print("can1 detail no data")
        raise HTTPException(
            status_code = 404,
            detail = "no data in can1 detail dequeue"
        )
    else:
        with can1_lock:
            can1_detail = copy.deepcopy(can1_detail_dequeue)
            can1_detail_dequeue.clear()

        return(
            can1_detail
        )

    
can1_lock = thread.Lock()
can1_detail_asyncio_event = asyncio.Event()
can1_detail_event_loop = None
@app.websocket("/detail/yawrate")
async def yawrate_detial_page(websocket : WebSocket):
    global can1_detail_event_loop
    await websocket.accept()

    can1_detail_event_loop = asyncio.get_running_loop()

    while True:
        if len(can1_detail_dequeue) == 0:
            await can1_detail_asyncio_event.wait()

        else:
            can1_detail_dequeue_len = len(can1_detail_dequeue)

            while can1_detail_dequeue_len > 0:
                can1 = can1_detail_dequeue.popleft()

                await websocket.send_json({
                    "yawrate" : can1["yawrate"]["latest"],
                    "desired_yawrate" : can1["desired_yawrate"]["latest"]
                })
                can1_detail_dequeue_len-= 1

            if len(can1_detail_dequeue) == 0:
                can1_detail_asyncio_event.clear()
##--------------------------------------------------------------------------
##--------------------------------------------------------------------------









def get_can0_data(data):
    can0_dequeue.append(data)

    if can0_event_loop is not None:
        can0_event_loop.call_soon_threadsafe(
            can0_asyncio_event.set
        )

def get_gps_data(data):
    gps_dequeue.append(data)

    if gps_event_loop is not None:
        gps_event_loop.call_soon_threadsafe(
            gps_asyncio_event.set
        )

def get_can1_data(data):
    can1_dequeue.append(data)

    with can1_lock:
        can1_detail_dequeue.append(data)

    if can1_event_loop is not None:
        can1_event_loop.call_soon_threadsafe(
            can1_asyncio_event.set
        )

    if can1_detail_event_loop is not None:
        can1_detail_event_loop.call_soon_threadsafe(
            can1_detail_asyncio_event.set
        )


def main():
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )