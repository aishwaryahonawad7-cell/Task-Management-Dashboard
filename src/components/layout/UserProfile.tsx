import { useAuth } from "../../hooks/useAuth";

const UserProfile = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="user-profile">
      <div>
        <strong>{user.name}</strong>
        <p>{user.role}</p>
      </div>

      <button onClick={logout}>
        Logout
      </button>
    </div>
  );
};

export default UserProfile;