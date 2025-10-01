import React from "react";
import { Link } from "react-router-dom";

function Navbar({ user, userRole, handleLogout, hasApprovedPass }) {
  return (
    <nav
      style={{
        background: "#18193F",
        padding: "0",
        width: "100%",
        minHeight: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(24,25,63,0.08)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "0 auto",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="/logo.png"
            alt="CampusBus Logo"
            style={{
              height: "32px",
              marginRight: "10px",
              borderRadius: "4px",
              background: "#fff",
              padding: "2px",
            }}
          />
          <span
            style={{
              fontWeight: "bold",
              fontSize: "18px",
              color: "#fff",
              letterSpacing: "1px",
            }}
          >
            {userRole === "admin" ? "CampusBus Admin" : "CampusBus"}
          </span>
        </div>

        {/* Center Nav Links */}
        <ul
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0",
            margin: 0,
            padding: 0,
            listStyle: "none",
            height: "56px",
          }}
        >
          {user ? (
            <>
              {/* Home link for authenticated */}
              <li>
                <Link
                  to="/home"
                  style={{
                    color: "#fff",
                    padding: "0 28px",
                    height: "56px",
                    display: "flex",
                    alignItems: "center",
                    fontWeight: "500",
                    textDecoration: "none",
                    border: "none",
                    fontSize: "16px",
                    transition: "background 0.2s, color 0.2s",
                  }}
                  onMouseOver={(e) => (e.target.style.background = "#23244a")}
                  onMouseOut={(e) => (e.target.style.background = "transparent")}
                >
                  Home
                </Link>
              </li>
              {userRole === "student" && (
                <>
                  <li>
                    <Link
                      to="/epass"
                      style={{
                        color: "#18193F",
                        background: "#FFD700",
                        padding: "0 28px",
                        height: "56px",
                        display: "flex",
                        alignItems: "center",
                        fontWeight: "500",
                        textDecoration: "none",
                        border: "none",
                        fontSize: "16px",
                        transition: "background 0.2s, color 0.2s",
                      }}
                    >
                      My E-Pass
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/tracking"
                      style={{
                        color: "#fff",
                        padding: "0 28px",
                        height: "56px",
                        display: "flex",
                        alignItems: "center",
                        fontWeight: "500",
                        textDecoration: "none",
                        border: "none",
                        fontSize: "16px",
                        transition: "background 0.2s, color 0.2s",
                      }}
                      onMouseOver={(e) => (e.target.style.background = "#23244a")}
                      onMouseOut={(e) => (e.target.style.background = "transparent")}
                    >
                      Tracking
                    </Link>
                  </li>
                  {!hasApprovedPass && (
                    <li>
                      <Link
                        to="/apply"
                        style={{
                          color: "#fff",
                          padding: "0 28px",
                          height: "56px",
                          display: "flex",
                          alignItems: "center",
                          fontWeight: "500",
                          textDecoration: "none",
                          border: "none",
                          fontSize: "16px",
                          transition: "background 0.2s, color 0.2s",
                        }}
                        onMouseOver={(e) => (e.target.style.background = "#23244a")}
                        onMouseOut={(e) => (e.target.style.background = "transparent")}
                      >
                        Apply For E-Pass
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link
                      to="/contact"
                      style={{
                        color: "#fff",
                        padding: "0 28px",
                        height: "56px",
                        display: "flex",
                        alignItems: "center",
                        fontWeight: "500",
                        textDecoration: "none",
                        border: "none",
                        fontSize: "16px",
                        transition: "background 0.2s, color 0.2s",
                      }}
                      onMouseOver={(e) => (e.target.style.background = "#23244a")}
                      onMouseOut={(e) => (e.target.style.background = "transparent")}
                    >
                      Contact
                    </Link>
                  </li>
                </>
              )}
              {user && userRole === "admin" && (
                <>
                  <li>
                    <a
                      href="/admin/requests"
                      style={{
                        color: "#18193F",
                        background: "#FFD700",
                        padding: "0 28px",
                        height: "56px",
                        display: "flex",
                        alignItems: "center",
                        fontWeight: "500",
                        textDecoration: "none",
                        border: "none",
                        fontSize: "16px",
                        transition: "background 0.2s, color 0.2s",
                      }}
                    >
                      Requests
                    </a>
                  </li>
                  <li>
                    <a
                      href="/admin/complaints"
                      style={{
                        color: "#fff",
                        padding: "0 28px",
                        height: "56px",
                        display: "flex",
                        alignItems: "center",
                        fontWeight: "500",
                        textDecoration: "none",
                        border: "none",
                        fontSize: "16px",
                        transition: "background 0.2s, color 0.2s",
                      }}
                      onMouseOver={(e) => (e.target.style.background = "#23244a")}
                      onMouseOut={(e) => (e.target.style.background = "transparent")}
                    >
                      Complaints
                    </a>
                  </li>
                </>
              )}
              <li>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "#fff",
                    color: "#18193F",
                    border: "none",
                    padding: "0 28px",
                    height: "56px",
                    display: "flex",
                    alignItems: "center",
                    fontWeight: "bold",
                    fontSize: "16px",
                    cursor: "pointer",
                    transition: "background 0.2s, color 0.2s",
                    borderBottom: "3px solid red",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "#FFD700";
                    e.target.style.color = "#18193F";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "#fff";
                    e.target.style.color = "#18193F";
                  }}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  to="/home"
                  style={{
                    color: "#fff",
                    padding: "0 28px",
                    height: "56px",
                    display: "flex",
                    alignItems: "center",
                    fontWeight: "500",
                    textDecoration: "none",
                    border: "none",
                    fontSize: "16px",
                    transition: "background 0.2s, color 0.2s",
                  }}
                  onMouseOver={(e) => (e.target.style.background = "#23244a")}
                  onMouseOut={(e) => (e.target.style.background = "transparent")}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  style={{
                    color: "#18193F",
                    background: "#FFD700",
                    padding: "0 28px",
                    height: "56px",
                    display: "flex",
                    alignItems: "center",
                    fontWeight: "500",
                    textDecoration: "none",
                    border: "none",
                    fontSize: "16px",
                    transition: "background 0.2s, color 0.2s",
                  }}
                >
                  Login / Register
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* Right Side - Social Icons */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <span
            style={{ color: "#fff", marginRight: "8px", fontSize: "18px", cursor: "pointer" }}
            title="Twitter"
          >
            <i className="fab fa-twitter"></i>
          </span>
          <span
            style={{ color: "#fff", marginRight: "8px", fontSize: "18px", cursor: "pointer" }}
            title="Facebook"
          >
            <i className="fab fa-facebook-f"></i>
          </span>
          <span
            style={{ color: "#fff", marginRight: "8px", fontSize: "18px", cursor: "pointer" }}
            title="Instagram"
          >
            <i className="fab fa-instagram"></i>
          </span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
