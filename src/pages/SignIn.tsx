import { useState } from "react";
import { useNavigate, NavLink } from "react-router";
import supabase from "../config/supabaseClient";
import "./auth.css";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const storeUserProfile = async (userId: string, displayName: string) => {
    try {
      // Check if profile already exists
      const { data: existingProfile, error: selectError } = await supabase
        .from("profiles")
        .select("*")
        .eq("profile_id", userId)
        .maybeSingle();

      if (selectError) throw selectError;

      // Only insert if profile doesn't exist
      if (!existingProfile) {
        const { error: insertError } = await supabase.from("profiles").insert({
          profile_id: userId,
          display_name: displayName,
        });

        if (insertError) throw insertError;
      }
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return setMessage(error.message);

    const userId = data.user.id;
    const displayName = data.user.user_metadata?.display_name || "No name set";

    await storeUserProfile(userId, displayName);
    navigate("/messages");
  };

  return (
    <div className="auth-container">
      <div className="left-panel">
        <h1>TechTalk</h1>
      </div>
      <div className="right-panel">
        <h1>Sign In</h1>

        <label>Email:</label>
        <input
          type="email"
          placeholder="youremail@gmail.com"
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password:</label>
        <input
          type="password"
          placeholder=""
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={signIn}>Sign In</button>

        <NavLink to="/">
          <p>Sign Up</p>
        </NavLink>

        <div>{message}</div>
      </div>
    </div>
  );
}

export default SignIn;
