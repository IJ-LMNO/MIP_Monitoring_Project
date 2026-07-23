import "./SpeedStatusPanel.css";

function SpeedStatusPanel({ speed = 0 }) {
    const maxSpeed = 100;

    const startAngle = -75;
    const endAngle = 75;

    const displayspeed = speed;
    const gaugeSpeed = Math.min(Math.max(speed, 0), maxSpeed);



    // -120° ~ 120°
    const needleAngle = startAngle + (gaugeSpeed / maxSpeed) * (endAngle - startAngle);

    return (
        <div className="speed-panel">
            <div className="speed-value">
                {displayspeed} km
            </div>

            <div className="speed-gauge">

                <div className="gauge-arc"></div>

                <div
                    className="speed-needle"
                    style={{
                        transform: `rotate(${needleAngle}deg)`
                    }}
                ></div>

                <div className="needle-center"></div>

                <div className="speed-label left">
                    0 km
                </div>

                <div className="speed-label top">
                    60 km
                </div>

                <div className="speed-label right">
                    100 km
                </div>

            </div>
        </div>
    );
}

export default SpeedStatusPanel;