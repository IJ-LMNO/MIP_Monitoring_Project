import "./RpmPannel.css";

function RpmGauge({ label, value, max = 5000, colorClass }) {
    const safeValue = Math.min(Math.max(value, 0), max);
    const percentage = (safeValue / max) * 100;

    const segments = 10;

    return (
        <div className="rpm-gauge">
            <div className="rpm-title">{label}</div>
            <div className="rpm-value">{Math.ceil(value)}</div>

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
                    <div className="rpm-scale-item scale-5000">
                        <span className="rpm-scale-line" />
                        <span>5000</span>
                    </div>

                    <div className="rpm-scale-item scale-4000">
                        <span className="rpm-scale-line" />
                        <span>4000</span>
                    </div>

                    <div className="rpm-scale-item scale-3000">
                        <span className="rpm-scale-line" />
                        <span>3000</span>
                    </div>

                    <div className="rpm-scale-item scale-2000">
                        <span className="rpm-scale-line" />
                        <span>2000</span>
                    </div>

                    <div className="rpm-scale-item scale-1000">
                        <span className="rpm-scale-line" />
                        <span>1000</span>
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

function RpmPannel({rpm_left = 0, rpm_right = 0}) {
    return (
        <div className="rpm-panel">
            <RpmGauge
                label="LEFT_RPM"
                value={rpm_left}
                colorClass="front-rpm-fill"
            />

            <div className="rpm-divider" />

            <RpmGauge
                label="RIGHT_RPM"
                value={rpm_right}
                colorClass="rear-rpm-fill"
            />
        </div>
    );
}

export default RpmPannel;