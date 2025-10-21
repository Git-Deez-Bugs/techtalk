import { useState } from "react";
import { NavLink } from "react-router";
import supabase from "../config/supabaseClient";
import "./auth.css";

function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
      },
    });
    if (error) return setMessage(error.message);

    setMessage("Confirm your email");
  };

  return (
    <div className="auth-container">
      <div className="left-panel">
        <h1>TechTalk</h1>
      </div>
      <div className="right-panel">
        <h1>Create Account</h1>

        <label htmlFor="name">Name:</label>
        <input
          type="text"
          placeholder="John Doe"
          onChange={(e) => setName(e.target.value)}
        />

        <label htmlFor="email">Email:</label>
        <input
          type="email"
          placeholder="youremail@gmail.com"
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="password">Password:</label>
        <input
          type="password"
          placeholder=""
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={signUp}>Sign Up</button>
        <NavLink to="/signin">
          <p>Sign In</p>
        </NavLink>
        <div>{message}</div>
      </div>
    </div>
  );
}

export default SignUp;
