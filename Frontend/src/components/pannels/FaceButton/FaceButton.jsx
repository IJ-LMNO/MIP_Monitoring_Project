import "./FaceButton.css"

function FaceButton({ 
    onClick = undefined, 
    text = undefined, 
    state = undefined,
    color = undefined }){

    return(
        <div className="face-up-div">
            <button className="face-up-button" onClick={onClick} style={{backgroundColor : color}}>{text}</button>
        </div>
    )
}

export default FaceButton