import { useEffect, useState } from "react";
import"./Timer.css"

function Timer({ state, elapsedMs, setElapsedMs }) {

    useEffect(() => {
        if(state.start == true){
            if(state.reset == false){
                const timer = setInterval(() => {
                    setElapsedMs((prev) => prev + 10);
                }, 10);

                return () => clearInterval(timer);
            }
        }
        else{
            if(state.reset == false){
                setElapsedMs(0)
            }
        }
    }, [state]);

    const min = Math.floor(elapsedMs / 60000);
    const sec = Math.floor(elapsedMs / 1000) % 60;
    const milli = elapsedMs % 1000;

    return (
        <div className="timer">
            {String(min).padStart(2, "0")}:
            {String(sec).padStart(2, "0")}.
            {String(milli).padStart(3, "0")}
        </div>
    );
}

export default Timer;