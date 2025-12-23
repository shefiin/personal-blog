import { useState } from "react";
import { registerUser } from "../../../api/auth.api.js";


export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [message, setMessage] = useState("");
    const [isSuccess, setSuccess] = useState(null)

    

    const submit = async () => {
        try {
            const res = await registerUser({name, email, password});
            console.log(res.data.message);           
            setMessage(res.data.message);
            setSuccess(true);
            
        } catch(err){
            setMessage(err.response?.data?.message || "Registeration failed") 
            setSuccess(false)
        }
    };

    return (
        <div>

            <h2>Register here</h2>

            {message && (
                <p style={{ color: isSuccess ? "green" : "red" }}>
                    {message}
                </p>
            )}

            <input 
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            />

            <br /><br />

            <input 
            placeholder="Enter you email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            />

            <br /><br />

            <input 
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
            />

            <br /><br />

            <button onClick={submit}>Submit</button>

        </div>
    )
}