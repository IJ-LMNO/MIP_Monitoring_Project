import { useEffect, useRef, useState } from "react"

import "./RapButton.css"

function RapButton({ text, rapcount, setRapcount}) {

    const curtiemstamp = useRef(null)
    const prevtimestamp = useRef(null)

    const RapButtononclick = (event) => {
        if(event.button == 0){
            if (rapcount.state == false) {
                setRapcount((prev) => {
                    return ({
                        ...prev,
                        "state": true
                    })
                })

                prevtimestamp.current = performance.now()
            }
            else if (rapcount.state == true) {
                curtiemstamp.current = performance.now()

                const prevtimestampsnapshot = prevtimestamp.current
                const curtimestampsnapshot = curtiemstamp.current

                setRapcount((prev) => {
                    return ({
                        ...prev,
                        history: [
                            ...prev.history,
                            [prevtimestampsnapshot, curtimestampsnapshot]
                        ],
                    })
                })

                prevtimestamp.current = curtiemstamp.current
            }
        }
        else if(event.button == 2){
            curtiemstamp.current = null
            prevtimestamp.current = null
            setRapcount(() => {
                return(
                    {
                        "state" : false,
                        "history" : [],
        
                })
            })

            
        }

    }

    const oncontextmenu = (event) =>{
        event.preventDefault()
    }

    return (
        <div className="button">
            <button className={rapcount.state ? "race-record-button" : "race-start-button"} onPointerDown={RapButtononclick} onContextMenu={oncontextmenu}>{text}</button>
        </div>
    )
}

export default RapButton