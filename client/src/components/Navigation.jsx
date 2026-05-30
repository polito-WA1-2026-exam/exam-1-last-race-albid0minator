import { Link } from 'react-router-dom'

export default function Navigation({ user, onLogout }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <Link className="navbar-brand text-decoration-none" to="/">
        Last Race
      </Link>
      <div className="ms-auto d-flex align-items-center gap-2">
        {user ? (
          <>
            <Link className="btn btn-outline-light btn-sm" to="/ranking">
              Classifica
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/game">
              Gioca
            </Link>
            <span className="navbar-text text-light">{user.name}</span>
            <button className="btn btn-outline-light btn-sm" type="button" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <Link className="btn btn-outline-light btn-sm" to="/login">
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}
