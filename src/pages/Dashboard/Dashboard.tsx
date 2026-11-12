
import { Link } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";

import "./Dashboard.css";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { can } = usePermissions();

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>SupportDesk</h2>
        <button onClick={logout}>Logout</button>
      </header>

      <main className="dashboard-main">
        <h1>Welcome, {user.name}</h1>
        <p>Role: {user.role}</p>

        <h2 className="overview-title">Dashboard Overview</h2>

        <div className="dashboard-cards">
          {can("VIEW_ALL_TICKETS") && (
            <div className="dashboard-card">
              <h3>All Tickets</h3>
              <p>View and manage all support tickets.</p>
              <Link to="/dashboard/tickets">View Tickets</Link>
            </div>
          )}

          {can("VIEW_ASSIGNED_TICKETS") && (
            <div className="dashboard-card">
              <h3>My Assigned Tickets</h3>
              <p>View tickets assigned to you.</p>
              <Link to="/dashboard/tickets">
                View My Tickets
              </Link>
            </div>
          )}

          {can("VIEW_TEAM_STATS") && (
            <div className="dashboard-card">
              <h3>Team Statistics</h3>
              <p>View team performance.</p>
              <Link to="/team-statistics">
                View Statistics
              </Link>
            </div>
          )}

          {can("ACCESS_ADMIN") && (
            <div className="dashboard-card">
              <h3>Administration</h3>
              <p>Manage users and application settings.</p>
              <Link to="/admin">
                Open Administration
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
