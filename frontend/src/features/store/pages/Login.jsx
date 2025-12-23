import { useState } from "react";
import { loginUser } from "../../../api/auth.api.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isSuccess, setSuccess] = useState(null);


  const submit = async () => {
    try {
      const res = await loginUser({ email, password });
      setMessage(res.data.message)
      setSuccess(true)

    } catch (err) {
      setMessage(err.response?.data?.message)
      setSuccess(false)
    }
  };

  return (
    <div>
      <h2>Login</h2>

      {message && (
        <p style={{ color: isSuccess ? "green" : "red" }}>
            {message}
        </p>
      )}

      <input
        placeholder="Email"
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

      <button onClick={submit}>Login</button>
    </div>
  );
}
