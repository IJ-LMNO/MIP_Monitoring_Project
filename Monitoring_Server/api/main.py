from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from Monitoring_Server.log.main import main as log_main
from Monitoring_Server.api.api import test as test

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

@app.get("/dashboard")
def main_test():
    print("hello react")
    return{"message" : "hello"}

@app.get("/button")
def main_test_dashboard():
    print("race_start button click")
    race_start()