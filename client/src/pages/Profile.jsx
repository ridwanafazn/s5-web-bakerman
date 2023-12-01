import { useNavigate } from "react-router-dom";
import { auth } from "../authentication/firebase";
import { signOut } from "firebase/auth";
import '../styles/category.css';

const Profile = () => {
    const navigate = useNavigate();
    const user = auth.currentUser;

    const logoutUser = async (e) => {
        e.preventDefault();

        await signOut(auth);
        navigate("/");
    }

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-md-4 text-center">
                    {user ? (
                        <>
                            <p>
                                Welcome <em className="text-decoration-underline">{user.email}</em>. <br />You are logged in!
                            </p>
                            <div className="button">
                                <button type="submit" className="btn btn-primary pt-3 pb-3" onClick={(e) => logoutUser(e)}>Logout</button>
                            </div>
                        </>
                    ) : (
                        <p>You are not logged in. Please <a href="/signin">sign in</a>.</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Profile;
