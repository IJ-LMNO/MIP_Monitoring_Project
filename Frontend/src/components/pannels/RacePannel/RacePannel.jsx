import { useEffect, useRef } from "react";
import "./RacePannel.css";

function RacePannel({ rapcount }) {

    const lastRapRef = useRef(null);

    useEffect(() => {
        if (lastRapRef.current) {
            lastRapRef.current.scrollIntoView({
                behavior: "smooth",
                block: "end"
            });
        }
    }, [rapcount.history.length]);


    const conversionRapTime = (start, stop) => {
        const elapsed = stop - start;

        const min = Math.floor(elapsed / 60000);
        const sec = Math.floor(elapsed / 1000) % 60;
        const milli = Math.floor(elapsed % 1000);

        return (
            `${String(min).padStart(2, "0")}:` +
            `${String(sec).padStart(2, "0")}:` +
            `${String(milli).padStart(3, "0")}`
        );
    };


    const make_pannel = () => {
        return rapcount.history.map((value, index) => {

            const isLast = index === rapcount.history.length - 1;

            return (
                <div
                    className="race-rap-pannel"
                    key={index}
                    ref={isLast ? lastRapRef : null}
                >
                    <div className="race-rap-pannel-text">
                        {conversionRapTime(value[0], value[1])}
                    </div>

                    <div className="race-rap-pannel-rap">
                        Rap : {index + 1}
                    </div>
                </div>
            );
        });
    };


    return (
        <div className="race-pannel-row">
            {make_pannel()}
        </div>
    );
}

export default RacePannel;