from Monitoring_Server.main import main as Monitoring_server_main
from Logging_Service.main import main as Logging_service_main

def main():
    Logging_service_main()
    Monitoring_server_main()

if __name__ == "__main__":
    main()