import "./Button.css"

function MyButton({onClick, text, state}){
    return(
        <div className="button">
            <button className = {state.start ? "race-start-button" : "race-stop-button"}onClick={onClick}>{text}</button>
        </div>
    )
}

export default MyButton