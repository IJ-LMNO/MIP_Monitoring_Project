import "./CarStatusPannel.css";

function CarStatusPannel({ carstatus }) {
    const leftSteerAngle = carstatus?.leftSteerAngle ?? 35;
    const rightSteerAngle = carstatus?.rightSteerAngle ?? -leftSteerAngle;

    const leftTorque = carstatus?.power_right ?? 40;
    const rightTorque = carstatus?.power_left ?? 40;

    return (
        <div className="carstatus-pannel">

            <div className="steer-angle steer-angle-left">
                {leftSteerAngle}°
            </div>

            <div className="steer-angle steer-angle-right">
                {rightSteerAngle}°
            </div>

            <div className="car-layout">
                <svg
                    className="car-frame"
                    viewBox="0 0 300 420"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <line x1="65" y1="105" x2="130" y2="75" />
                    <line x1="235" y1="105" x2="170" y2="75" />
                    <line x1="120" y1="135" x2="65" y2="105" />
                    <line x1="180" y1="135" x2="235" y2="105" />

                    <line x1="130" y1="75" x2="170" y2="75" />
                    <line x1="130" y1="75" x2="130" y2="135" />
                    <line x1="170" y1="75" x2="170" y2="135" />
                    <line x1="130" y1="135" x2="170" y2="135" />

                    <line x1="120" y1="135" x2="95" y2="230" />
                    <line x1="180" y1="135" x2="205" y2="230" />

                    <line x1="95" y1="230" x2="205" y2="230" />

                    <line x1="95" y1="230" x2="95" y2="320" />
                    <line x1="205" y1="230" x2="205" y2="320" />
                    <line x1="95" y1="320" x2="205" y2="320" />

                    <line x1="205" y1="320" x2="250" y2="360" />
                    <line x1="95" y1="320" x2="50" y2="360" />

                    <line x1="95" y1="320" x2="120" y2="390" />
                    <line x1="205" y1="320" x2="180" y2="390" />
                    <line x1="120" y1="390" x2="180" y2="390" />

                    <line x1="120" y1="390" x2="50" y2="360" />
                    <line x1="180" y1="390" x2="250" y2="360" />

                    <circle cx="120" cy="135" r="5" />
                    <circle cx="180" cy="135" r="5" />
                    <circle cx="95" cy="230" r="5" />
                    <circle cx="205" cy="230" r="5" />
                    <circle cx="95" cy="320" r="5" />
                    <circle cx="205" cy="320" r="5" />
                    <circle cx="120" cy="390" r="5" />
                    <circle cx="180" cy="390" r="5" />
                    <circle cx="250" cy="360" r="5" />
                    <circle cx="50" cy="360" r="5" />
                    <circle cx="235" cy="105" r="5" />
                    <circle cx="65" cy="105" r="5" />
                </svg>

                <div
                    className="wheel front-left-wheel"
                    style={{ "--wheel-angle": `${leftSteerAngle}deg` }}
                >
                    <div className="wheel-stripe" />
                </div>

                <div
                    className="wheel front-right-wheel"
                    style={{ "--wheel-angle": `${rightSteerAngle}deg` }}
                >
                    <div className="wheel-stripe" />
                </div>

                <div className="wheel rear-left-wheel">
                    <div className="wheel-stripe" />
                </div>

                <div className="wheel rear-right-wheel">
                    <div className="wheel-stripe" />
                </div>
            </div>

            <div className="torque torque-left">
                {leftTorque}N
            </div>

            <div className="torque torque-right">
                {rightTorque}N
            </div>
        </div>
    );
}

export default CarStatusPannel;