from fastapi import FastAPI
from fastapi.responses import FileResponse

def test():
    return { "message" : "hello world"}

def test_dashboard():
    return FileResponse(
        path ="Monitoring_Server/api/template/test_html.html",
        media_type="text/html"
    )