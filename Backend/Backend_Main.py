from Backend.FastAPI.FastAPI import main as FastAPI
from Backend.Backend_Mqtt.Backend_Mqtt_Main import main as Backend_Mqtt

def main():
    FastAPI()
    Backend_Mqtt()


if __name__ == "__main__":
    main()