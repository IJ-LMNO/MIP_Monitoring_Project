import "./Button.css"

function Button({onClick, text}){
    return(
        <div className="button">
            <button onClick={onClick}>{text}</button>
        </div>
    )
}

export default Button