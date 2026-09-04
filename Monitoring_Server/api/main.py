from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import copy
import threading as thread
import asyncio
from collections import deque
import queue
from pydantic import BaseModel

from Logging_Service.main import race_start as race_start
from Logging_Service.main import race_stop as race_stop
from Logging_Service.main import race_reset as race_reset
from Logging_Service.main import return_log as return_log
from Monitoring_Server.mqtt.shared_state import MQTT_event as MQTT_event


app = FastAPI()


## 백엔드 자료구조 대시보드를 래핑한 데이터를 저장한 자료구조
dequeue_size = 10
can0_dequeue = deque(maxlen=dequeue_size)
can1_dequeue = deque(maxlen=dequeue_size)
gps_dequeue = deque(maxlen=dequeue_size)
button_dequeue = deque(maxlen=dequeue_size)
##-------------------------------------------------


## 상세보기 페이지를 위한 자료구조 ------------------------------------
can0_detail_dequeue = deque(maxlen = 6000)
yawrate_detail_dequeue = deque(maxlen= 6000)
desired_yawrate_detail_dequeue = deque(maxlen = 6000)
rollrate_detail_dequeue = deque(maxlen = 6000)
gps_detail_dequeue = deque(maxlen = 120)
##---------------------------------------------------------------------


## face up/down을 위한 자료구조 ---------------------------------------
face_queue = queue.Queue()
##--------------------------------------------------------------------


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



## common ------------------------------------------------------------------
##--------------------------------------------------------------------------


class FrontendStartRequest(BaseModel):
    status : bool

class FaceUpDownRequest(BaseModel):
    status : str


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
    pass


@app.post("/race/stop")
def race_stop_button():
    pass

@app.post("/race/reset")
def race_reset_button():
    pass


@app.post("/face/up")
def face_up(request : FaceUpDownRequest):
    face_queue.put(request.status)


@app.post("/face/down")
def face_down(request : FaceUpDownRequest):
    face_queue.put(request.status)


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

    if data_ready:
        return True
    else:
        return False
##--------------------------------------------------------------------------
##--------------------------------------------------------------------------













## can0 // can0_detail  ----------------------------------------------------------------
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
                    can0 = can0_dequeue.popleft()

                    await websocket.send_json(
                        can0
                    )

                    can0_dequeue_len -= 1

                if len(can0_dequeue) == 0:
                    can0_asyncio_event.clear()

    except WebSocketDisconnect:
        print("can0 websocket 연결 종료")


@app.get("/first/detail/can0")
def can0_detail_page_first_telemetry():
    if(len(can0_detail_dequeue) == 0):
        print("can0 detail no data")
        raise HTTPException(
            status_code = 404,
            detail = "no data in can0 detail dequeue"
        )
    else:
        with can0_lock:
            can0_detail = copy.deepcopy(

                can0_detail_dequeue

            )
            can0_detail_dequeue.clear()

        return(
            can0_detail
        )

    
can0_lock = thread.Lock()
can0_detail_asyncio_event = asyncio.Event()
can0_detail_event_loop = None
@app.websocket("/detail/can0")
async def can0_detial_page(websocket : WebSocket):
    global can0_detail_event_loop
    await websocket.accept()

    can0_detail_event_loop = asyncio.get_running_loop()

    while True:
        if len(can0_detail_dequeue) == 0:
            await can0_detail_asyncio_event.wait()

        else:
            can0_detail_dequeue_len = len(can0_detail_dequeue)

            while can0_detail_dequeue_len > 0:
                can0 = can0_detail_dequeue.popleft()

                await websocket.send_json(
                    can0
                )

                can0_detail_dequeue_len-= 1

            if len(can0_detail_dequeue) == 0:
                can0_detail_asyncio_event.clear()
##--------------------------------------------------------------------------
##--------------------------------------------------------------------------















## gps----------------------------------------------------------------------------------
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
                gps = gps_dequeue.popleft()

                await websocket.send_json(
                    gps
                )

                gps_dequeue_len -= 1

            if len(gps_dequeue) == 0:
                gps_asyncio_event.clear()

gps_lock = thread.Lock()
@app.get("/first/detail/gps")
def gps_detail_page_first_telemetry():
    if(len(gps_detail_dequeue) == 0):
        print("gps detail no data")
        raise HTTPException(
            status_code = 404,
            detail = "no data in gps detail dequeue"
        )
    else:
        with gps_lock:
            return_deque = copy.deepcopy(gps_detail_dequeue)

        return(
            return_deque
        )

gps_detail_asyncio_event = asyncio.Event()
gps_detail_event_loop = None
@app.websocket("/detail/gps")
async def gps_detial_page(websocket : WebSocket):
    global gps_detail_event_loop
    await websocket.accept()

    gps_detail_event_loop = asyncio.get_running_loop()

    while True:
        if len(gps_detail_dequeue) == 0:
            await gps_detail_asyncio_event.wait()

        else:
            gps_detail_dequeue_len = len(gps_detail_dequeue)

            while gps_detail_dequeue_len > 0:
                gps = gps_detail_dequeue.popleft()

                await websocket.send_json(
                    gps
                )

                gps_detail_dequeue_len-= 1

            if len(gps_detail_dequeue) == 0:
                gps_detail_asyncio_event.clear()
##--------------------------------------------------------------------------
##--------------------------------------------------------------------------

















## can1-----------------------------------------------------------------------
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
                        "tps": latest["tps"],
                        "desired_yawrate": latest["desired_yawrate"],
                        "yawrate": latest["yawrate"],
                        "rollrate": latest["rollrate"],
                        "steeringhandle": latest["steeringhandle"],
                        "tiredegree": latest["tiredegree"],
                        "timestamp" : latest["timestamp"]
                    }
                )

                can1_dequeue_len -= 1

            if len(can1_dequeue) == 0:
                can1_asyncio_event.clear()





yawrate_lock = thread.Lock()
yawrate_detail_asyncio_event = asyncio.Event()
yawrate_detail_event_loop = None
@app.get("/first/detail/yawrate")
def yawrate_detail_page_first_telemetry():
    if(len(yawrate_detail_dequeue) == 0):
        print("can1 detail no data")
        raise HTTPException(
            status_code = 404,
            detail = "no data in can1 detail dequeue"
        )
    else:
        with yawrate_lock:
            yarate_return = copy.deepcopy(yawrate_detail_dequeue)
            desired_yawrate_return = copy.deepcopy(desired_yawrate_detail_dequeue)
            yawrate_detail_dequeue.clear()
            desired_yawrate_detail_dequeue.clear()

        return(
            {
                "yawrate" : yarate_return,
                "desired_yawrate" : desired_yawrate_return
            }
        )

@app.websocket("/detail/yawrate")
async def yawrate_detial_page(websocket : WebSocket):
    global yawrate_detail_event_loop
    await websocket.accept()

    yawrate_detail_event_loop = asyncio.get_running_loop()

    while True:
        if len(yawrate_detail_dequeue) == 0 or len(desired_yawrate_detail_dequeue) == 0:
            await yawrate_detail_asyncio_event.wait()

        else:
            yawrate_detail_dequeue_len = len(yawrate_detail_dequeue)
            desired_yawrate_detail_dequeue_len = len(desired_yawrate_detail_dequeue)

            while yawrate_detail_dequeue_len > 0 and desired_yawrate_detail_dequeue_len >0:

                yawrate = yawrate_detail_dequeue.popleft()
                desired_yawrate = desired_yawrate_detail_dequeue.popleft()

                await websocket.send_json({
                    "yawrate" : yawrate["latest"],
                    "desired_yawrate" : desired_yawrate["latest"]
                })
            
                yawrate_detail_dequeue_len -= 1
                desired_yawrate_detail_dequeue_len -= 1

            if (len(yawrate_detail_dequeue) == 0 or len(desired_yawrate_detail_dequeue) == 0):
                yawrate_detail_asyncio_event.clear()







rollrate_lock = thread.Lock()
rollrate_detail_asyncio_event = asyncio.Event()
rollrate_detail_event_loop = None
@app.get("/first/detail/rollrate")
def rollrate_detail_page_first_telemetry():
    if(len(rollrate_detail_dequeue) == 0):
        print("can1 detail no data")
        raise HTTPException(
            status_code = 404,
            detail = "no data in can1 detail dequeue"
        )
    else:
        with rollrate_lock:
            rollrate =  copy.deepcopy(rollrate_detail_dequeue)
            rollrate_detail_dequeue.clear()

        return{
            "rollrate" : rollrate
        }

@app.websocket("/detail/rollrate")
async def rollrate_detial_page(websocket : WebSocket):
    global rollrate_detail_event_loop
    await websocket.accept()

    rollrate_detail_event_loop = asyncio.get_running_loop()

    while True:
        if len(rollrate_detail_dequeue) == 0:
            await rollrate_detail_asyncio_event.wait()

        else:
            rollrate_detail_dequeue_len = len(rollrate_detail_dequeue)

            while rollrate_detail_dequeue_len > 0:
                rollrate = rollrate_detail_dequeue.popleft()

                await websocket.send_json({
                    "rollrate" : rollrate["latest"],
                })
                rollrate_detail_dequeue_len-= 1

            if len(rollrate_detail_dequeue) == 0:
                rollrate_detail_asyncio_event.clear()
##--------------------------------------------------------------------------
##--------------------------------------------------------------------------













## button  ----------------------------------------------------------------
##--------------------------------------------------------------------------
button_asyncio_event = asyncio.Event()
button_event_loop = None
@app.websocket("/telemetry/button/ws")
async def can1_ws_endpoint(websocket: WebSocket):
    global button_event_loop

    await websocket.accept()

    button_event_loop = asyncio.get_running_loop()

    while True:
        if len(button_dequeue) == 0:
            await button_asyncio_event.wait()

        else:
            button_dequeue_len = len(button_dequeue)

            while button_dequeue_len > 0:
                latest = button_dequeue.popleft()

                await websocket.send_json(
                    {
                        "time_interval" : latest["time_interval"],
                        "rap" : latest["rap"]
                    }
                )

                button_dequeue_len -= 1

            if len(can1_dequeue) == 0:
                button_asyncio_event.clear()
##--------------------------------------------------------------------------
##--------------------------------------------------------------------------











##  get can0 / can1 / gps-------------------------------------------------------------------
##--------------------------------------------------------------------------
def get_can0_data(data):
    can0_dequeue.append(data)

    with can0_lock:
        can0_detail_dequeue.append(data)

    if can0_event_loop is not None:
        can0_event_loop.call_soon_threadsafe(
            can0_asyncio_event.set
        )

    if can0_detail_event_loop is not None:
        can0_detail_event_loop.call_soon_threadsafe(
            can0_detail_asyncio_event.set
        )




def get_gps_data(data):
    gps_dequeue.append(data)

    with gps_lock:
        gps_detail_dequeue.append(data)

    if gps_event_loop is not None:
        gps_event_loop.call_soon_threadsafe(
            gps_asyncio_event.set
        )

    if gps_detail_event_loop is not None:
        gps_detail_event_loop.call_soon_threadsafe(
            gps_detail_asyncio_event.set
        )




def get_can1_data(data):
    can1_dequeue.append(data)

    with yawrate_lock:
        yawrate_detail_dequeue.append(data["yawrate"])
        desired_yawrate_detail_dequeue.append(data["desired_yawrate"])
    with rollrate_lock:
        rollrate_detail_dequeue.append(data["rollrate"])

    if can1_event_loop is not None:
        can1_event_loop.call_soon_threadsafe(
            can1_asyncio_event.set
        )

    if yawrate_detail_event_loop is not None:
        yawrate_detail_event_loop.call_soon_threadsafe(
            yawrate_detail_asyncio_event.set
        )

    if rollrate_detail_event_loop is not None:
        rollrate_detail_event_loop.call_soon_threadsafe(
            rollrate_detail_asyncio_event.set
        )



def get_button_data(data):
    button_dequeue.append(data)

    if button_event_loop is not None:
        button_event_loop.call_soon_threadsafe(
            button_asyncio_event.set
        )
##--------------------------------------------------------------------------
##--------------------------------------------------------------------------




def main():
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )