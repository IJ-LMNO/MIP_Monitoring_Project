from fastapi import FastAPI
from pydantic import BaseModel
from Monitoring_Server.api.api import test as test

app = FastAPI()

# @app.get("/")
# def home():
#     #html파일 리턴

@app.get("/test")
def main_test():
    return test.test()

@app.get("/test/dashboard")
def main_test_dashboard():
    return test.test_dashboard()