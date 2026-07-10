from fastapi import FastAPI
from pydantic import BaseModel

from Monitoring_Server.log.main import main as log_main
from Monitoring_Server.api.api import test as test

app = FastAPI()

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