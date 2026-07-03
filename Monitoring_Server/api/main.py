from fastapi import FastAPI
from pydantic import BaseModel
from Monitoring_Server.api.api import test as test

app = FastAPI()

# @app.get("/")
# def home():
#     #html파일 리턴

@app.get("/dashboard")
def main_test():
    print("hello react")
    return{"message" : "hello"}

@app.get("/button")
def main_test_dashboard():
    print("button click")
    return {"message" : "button"}