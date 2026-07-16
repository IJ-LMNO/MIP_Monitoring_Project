import "./RpmPannel.css";

function RpmGauge({ label, value, max = 9000, colorClass }) {
    const safeValue = Math.min(Math.max(value, 0), max);
    const percentage = (safeValue / max) * 100;

    const segments = 12;

    return (
        <div className="rpm-gauge">
            <div className="rpm-title">{label}</div>
            <div className="rpm-value">{value}</div>

            <div className="rpm-meter-area">
                <div className="rpm-bar-frame">
                    <div
                        className={`rpm-bar-fill ${colorClass}`}
                        style={{ height: `${percentage}%` }}
                    />

                    <div className="rpm-segments">
                        {Array.from({ length: segments }).map((_, index) => (
                            <span key={index} />
                        ))}
                    </div>
                </div>

                <div className="rpm-scale">
                    <div className="rpm-scale-item scale-top">
                        <span className="rpm-scale-line" />
                        <span>9000</span>
                    </div>

                    <div className="rpm-scale-item scale-middle">
                        <span className="rpm-scale-line" />
                        <span>6000</span>
                    </div>

                    <div className="rpm-scale-item scale-low">
                        <span className="rpm-scale-line" />
                        <span>3000</span>
                    </div>

                    <div className="rpm-scale-item scale-bottom">
                        <span className="rpm-scale-line" />
                        <span>0</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RpmPannel({ frontRpm = 4321, rearRpm = 3000 }) {
    return (
        <div className="rpm-panel">
            <RpmGauge
                label="FRONT RPM"
                value={frontRpm}
                colorClass="front-rpm-fill"
            />

            <div className="rpm-divider" />

            <RpmGauge
                label="REAR RPM"
                value={rearRpm}
                colorClass="rear-rpm-fill"
            />
        </div>
    );
}

export default RpmPannel;