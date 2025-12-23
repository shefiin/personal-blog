import { useState } from "react";
import { applyStore } from "../../../api/applyStore";


export default function ApplyStore(){
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setSuccess] = useState(null);

    const submit = async() => {
        try{
            const res = await applyStore({ name });
            setMessage(res.data.message);
            setSuccess(true)
        } catch(err){
            setMessage(err.response?.data?.message)
            setSuccess(false)
        }

    };

    return (
        <div>
            <h2>Apply Store</h2>

            {message && (
                <p style={{ color: isSuccess ? "green" : "red" }}>
                    {message}
                </p>
            )}

            <input 
                placeholder="Store name"
                value={name}
                onChange={(e) => setName(e.target.value)} 
            />
            <br /><br />

            <button onClick={submit}>Submit</button>
        </div>
    )
};