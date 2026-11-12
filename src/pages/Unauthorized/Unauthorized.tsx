import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="unauthorized-container">
      <h1>403 - Access Denied</h1>

      <p>
        You do not have permission to access this page.
      </p>

      <Link to="/dashboard">
        Go to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;