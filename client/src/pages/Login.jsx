import { FaGoogle } from 'react-icons/fa'
import '../styles/auth.css'
import '../styles/signin.css'

import { useState } from "react";
import { auth } from "../authentication/firebase";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [notice, setNotice] = useState("");

    const loginWithUsernameAndPassword = async (e) => {
        e.preventDefault();

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("../account");
        } catch {
            setNotice("You entered a wrong username or password.");
        }
    }
    const createWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                // This gives you a Google Access Token. You can use it to access the Google API.
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                // The signed-in user info.
                const user = result.user;
                // IdP data available using getAdditionalUserInfo(result)
                // ...
                navigate("../account");
            }).catch((error) => {
                // Handle Errors here.
                const errorCode = error.code;
                const errorMessage = error.message;
                // The email of the user's account used.
                const email = error.customData.email;
                // The AuthCredential type that was used.
                const credential = GoogleAuthProvider.credentialFromError(error);
                // ...
            });
    }
    const user = auth.currentUser;

    
    return (
        <div className="container">

            <div className="row justify-content-center">
                <div className='hero'>
                    <h1>Sign In Here</h1>
                </div>
                <form className="col-md-4 mt-3 pt-3 pb-3">
                    {"" !== notice &&
                        <div className="alert alert-warning" role="alert">
                            {notice}
                        </div>
                    }
                    <div className="form-floating mb-3">
                        <input type="email" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)}></input>
                        <label htmlFor="exampleInputEmail1" className="form-label">Email address</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input type="password" className="form-control" id="exampleInputPassword1" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}></input>
                        <label htmlFor="exampleInputPassword1" className="form-label">Password</label>
                    </div>
                    <div className="d-grid">
                        <button type="submit" className="btn btn-primary pt-3 pb-3" onClick={(e) => loginWithUsernameAndPassword(e)}>Submit</button>
                    </div>
                    <div className="mt-3 text-center">
                        <span>Need to sign up for an account? <Link to="../signup">Click here.</Link></span>
                    </div>
                </form>
                <body>
                    <button className="Button" onClick={createWithGoogle}><FaGoogle /> Sign with Google</button>
                </body>
                <div className="demo-info">
                    <p>Use the account below for demonstration purposes</p>
                    <p>Email address : bakerman@gmail.com</p>
                    <p>Password      : bakermanAdmin</p>
                </div>
            </div>

        </div>
    )
}

export default Login;