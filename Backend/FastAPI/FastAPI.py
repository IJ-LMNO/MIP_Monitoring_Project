from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import deque
from Backend.Backend_Mqtt.Backend_Mqtt_shared.shared_state import MQTT_event as MQTT_event


import uvicorn
import copy
import threading as thread
import asyncio
import queue


app = FastAPI()


# =========================================================
# 센서별 Adapter 파일에서 새로 래핑한 데이터 구조를 저장하는 dequeue
# =========================================================

dequeue_size = 10
can0_dequeue = deque(maxlen=dequeue_size)
can1_dequeue = deque(maxlen=dequeue_size)
gps_dequeue = deque(maxlen=dequeue_size)
button_dequeue = deque(maxlen=dequeue_size)



# =========================================================
# 상세보기 페이지를 위한 dequeue
# =========================================================

can0_detail_dequeue = deque(maxlen = 6000)
yawrate_detail_dequeue = deque(maxlen= 2400)
desired_yawrate_detail_dequeue = deque(maxlen = 2400)
rollrate_detail_dequeue = deque(maxlen = 2400)

gps_detail_dequeue_for_powerstatus = deque(maxlen = 120)
gps_detail_dequeue_for_yawrate = deque(maxlen = 120)
gps_detail_dequeue_for_rollrate = deque(maxlen = 120)




# =========================================================
# pace up / down mqtt 통신을 위해 프론트에서 들어오는 데이터를 저장하는 queue
# =========================================================

face_queue = queue.Queue(maxsize=dequeue_size)



# =========================================================
# 프론트와 백엔드 통신을 위한 middleware 설정
# =========================================================

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",

    "http://localhost:4173",
    "http://127.0.0.1:4173",

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




# =========================================================
# 프론트에서 들어오는 데이터에 대한 BaseModel class
# =========================================================

class FrontendStartRequest(BaseModel):
    status : bool

class FaceUpDownRequest(BaseModel):
    status : str



# =========================================================
# 다운로드를 위한 함수
# =========================================================


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




# =========================================================
# 프론트의 race start / stop / reset을 처리하기 위한 함수
# =========================================================

@app.post("/race/start")
def race_start_button():
    pass


@app.post("/race/stop")
def race_stop_button():
    pass

@app.post("/race/reset")
def race_reset_button():
    pass



# =========================================================
# 프론트의 pace up / down를 처리하기 위한 함수
# =========================================================

@app.post("/face/up")
def face_up(request : FaceUpDownRequest):
    face_queue.put(request.status) ## Up, Hold, Down


@app.post("/face/down")
def face_down(request : FaceUpDownRequest):
    face_queue.put(request.status) ## Up, Hold, Down




# =========================================================
# 프론트가 실행된걸 알리는 신호를 처리하는 함수
#   -> 백로그 방지를 위해 프론트 - 백엔드 연결 후 백엔드 - 라즈베리파이 연결 구조 구현
# =========================================================

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













# =========================================================
# can0 / can0 detail 처리 
# =========================================================

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








# =========================================================
# gps / gps detail 처리 
# =========================================================

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




gps_lock_powerstatus = thread.Lock()
@app.get("/first/detail/gps/powerstatus")
def gps_detail_page_first_telemetry():
    if(len(gps_detail_dequeue_for_powerstatus) == 0):
        print("gps detail no data")
        raise HTTPException(
            status_code = 404,
            detail = "no data in gps detail dequeue"
        )
    else:
        with gps_lock_powerstatus:
            return_deque = copy.deepcopy(gps_detail_dequeue_for_powerstatus)

        return(
            return_deque
        )

gps_detail_asyncio_event_powerstatus = asyncio.Event()
gps_detail_event_loop_powerstatus = None
@app.websocket("/detail/gps/powerstatus")
async def gps_detial_page(websocket : WebSocket):
    global gps_detail_event_loop_powerstatus
    await websocket.accept()

    gps_detail_event_loop_powerstatus = asyncio.get_running_loop()

    while True:
        if len(gps_detail_dequeue_for_powerstatus) == 0:
            await gps_detail_asyncio_event_powerstatus.wait()

        else:
            gps_detail_dequeue_len = len(gps_detail_dequeue_for_powerstatus)

            while gps_detail_dequeue_len > 0:
                gps = gps_detail_dequeue_for_powerstatus.popleft()

                await websocket.send_json(
                    gps
                )

                gps_detail_dequeue_len-= 1

            if len(gps_detail_dequeue_for_powerstatus) == 0:
                gps_detail_asyncio_event_powerstatus.clear()




gps_lock_yawrate = thread.Lock()
@app.get("/first/detail/gps/yawrate")
def gps_detail_page_first_telemetry():
    if(len(gps_detail_dequeue_for_yawrate) == 0):
        print("gps detail no data")
        raise HTTPException(
            status_code = 404,
            detail = "no data in gps detail dequeue"
        )
    else:
        with gps_lock_yawrate:
            return_deque = copy.deepcopy(gps_detail_dequeue_for_yawrate)

        return(
            return_deque
        )

gps_detail_asyncio_event_yawrate = asyncio.Event()
gps_detail_event_loop_yawrate = None
@app.websocket("/detail/gps/yawrate")
async def gps_detial_page(websocket : WebSocket):
    global gps_detail_event_loop_yawrate
    await websocket.accept()

    gps_detail_event_loop_yawrate = asyncio.get_running_loop()

    while True:
        if len(gps_detail_dequeue_for_yawrate) == 0:
            await gps_detail_asyncio_event_yawrate.wait()

        else:
            gps_detail_dequeue_len = len(gps_detail_dequeue_for_yawrate)

            while gps_detail_dequeue_len > 0:
                gps = gps_detail_dequeue_for_yawrate.popleft()

                await websocket.send_json(
                    gps
                )

                gps_detail_dequeue_len-= 1

            if len(gps_detail_dequeue_for_yawrate) == 0:
                gps_detail_asyncio_event_yawrate.clear()







# =========================================================
# can1 처리
# =========================================================

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





# =========================================================
# yawrate / desired-yawrate detail 처리
# =========================================================

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
                    "yawrate" : yawrate,
                    "desired_yawrate" : desired_yawrate
                })
            
                yawrate_detail_dequeue_len -= 1
                desired_yawrate_detail_dequeue_len -= 1

            if (len(yawrate_detail_dequeue) == 0 or len(desired_yawrate_detail_dequeue) == 0):
                yawrate_detail_asyncio_event.clear()






# =========================================================
# rolrate detail 처리
# =========================================================

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








# =========================================================
# button 처리 
# =========================================================
button_asyncio_event = asyncio.Event()
button_event_loop = None
@app.websocket("/telemetry/button/ws")
async def button_ws_endpoint(websocket: WebSocket):
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

            if len(button_dequeue) == 0:
                button_asyncio_event.clear()












# =========================================================
# get can0 
# =========================================================
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



# =========================================================
# get gps
# =========================================================

def get_gps_data(data):
    gps_dequeue.append(data)

    with gps_lock_powerstatus:
        gps_detail_dequeue_for_powerstatus.append(data)

    with gps_lock_yawrate:
        gps_detail_dequeue_for_yawrate.append(data)



    if gps_event_loop is not None:
        gps_event_loop.call_soon_threadsafe(
            gps_asyncio_event.set
        )

    if gps_detail_event_loop_powerstatus is not None:
        gps_detail_event_loop_powerstatus.call_soon_threadsafe(
            gps_detail_asyncio_event_powerstatus.set
        )

    if gps_detail_event_loop_yawrate is not None:
        gps_detail_event_loop_yawrate.call_soon_threadsafe(
            gps_detail_asyncio_event_yawrate.set
        )




# =========================================================
# get can1
# =========================================================
def get_can1_data(data):
    can1_dequeue.append(data)

    with yawrate_lock:
        yawrate_detail_dequeue.append({
            "yawrate" : data["yawrate"],
            "timestamp" : data["timestamp"]
        })
        desired_yawrate_detail_dequeue.append({
            "desired_yawrate" : data["desired_yawrate"],
            "timestamp" : data["timestamp"]
        })
    with rollrate_lock:
        rollrate_detail_dequeue.append({
            "rollrate" : data["rollrate"],
            "timestamp" : data["timestamp"]
        })

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


# =========================================================
# get button
# =========================================================

def get_button_data(data):
    button_dequeue.append(data)

    if button_event_loop is not None:
        button_event_loop.call_soon_threadsafe(
            button_asyncio_event.set
        )




# =========================================================
# FastAPI main
# =========================================================

def main():
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )