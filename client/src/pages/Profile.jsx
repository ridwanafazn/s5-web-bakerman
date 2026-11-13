import { useNavigate } from "react-router-dom";
import { auth } from "../authentication/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import '../styles/profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const { profile } = useSession();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
            setUser(nextUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const logoutUser = async (e) => {
        e.preventDefault();

        await signOut(auth);
        navigate("/");
    }

    return (
        <div className="profile-page">
            <div className="profile-card">
                {loading ? (
                    <p className="profile-text">Memeriksa sesi login…</p>
                ) : user ? (
                    <>
                        <p className="profile-eyebrow">Bakerman Account</p>
                        <h1 className="profile-title">Welcome back</h1>
                        <p className="profile-text">
                            Kamu masuk sebagai <strong>{user.email}</strong>.
                        </p>
                        <div className="profile-actions">
                            <Link to="/balance" className="profile-button">
                                Lihat balance
                            </Link>
                            <Link to="/orders" className="profile-button profile-button-outline">
                                Pesanan saya
                            </Link>
                            {profile && ['staff', 'admin'].includes(profile.role) && (
                                <Link to="/staff" className="profile-button profile-button-outline">
                                    Staff dashboard
                                </Link>
                            )}
                            <button type="button" className="profile-button profile-button-outline" onClick={logoutUser}>
                                Logout
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="profile-eyebrow">Bakerman Account</p>
                        <h1 className="profile-title">Belum masuk</h1>
                        <p className="profile-text">
                            Masuk untuk melihat rewards dan riwayat pembelianmu.
                        </p>
                        <div className="profile-actions">
                            <Link to="/signin" className="profile-button">
                                Sign in
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Profile;
