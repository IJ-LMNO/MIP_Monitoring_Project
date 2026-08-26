import ringbuffer from "./ringbuffer"

const ports = []

const MAX_LENGTH = 6000;

const history = {
    can0: ringbuffer(MAX_LENGTH),
    yawrate: ringbuffer(MAX_LENGTH),
    desired_yawrate: ringbuffer(MAX_LENGTH),
    rollrate: ringbuffer(MAX_LENGTH),
}

const can0 = new WebSocket(
    "ws://localhost:8000/telemetry/can0/ws"
);

const can1 = new WebSocket(
    "ws://localhost:8000/telemetry/can1/ws"
);

const gps = new WebSocket(
    "ws://localhost:8000/telemetry/gps/ws"
);

can0.onopen = () => {
    console.log("fastapi-sharedworker can0 websocket connect")
}

can1.onopen = () => {
    console.log("fastapi-sharedworker can1 websocket connect")
}

gps.onopen = () => {
    console.log("fastapi-sharedworker gps websocket connect")
}

can0.onmessage = (event) => {
    const data = JSON.parse(event.data)

    history.can0.push(data)
}

can1.onmessage = (event) => {
    const data = JSON.parse(event.data)

    history.yawrate.push(data["yawrate"])
    history.desired_yawrate.push(data["desired_yawrate"])
    history.rollrate.push(data["rollrate"])
    

}

gps.onmessage = (event) => {
    const data = JSON.parse(event.data)

    history.gps.push(data)
}
