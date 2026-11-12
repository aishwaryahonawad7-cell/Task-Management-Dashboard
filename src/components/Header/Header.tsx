
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./Header.css";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        <h2>SupportDesk</h2>
        <span>Ticket Management System</span>
      </div>

      <div className="header-right">
        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="user-details">
            <strong>{user?.name || "User"}</strong>
            <span>{user?.role || "Member"}</span>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          <span>↪</span>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
