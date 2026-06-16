import { NavLink } from 'react-router-dom';

export default function Navigation({ user, onLogout }) {
  const linkClass = ({ isActive }) =>
    `nav-link app-nav-link ${isActive ? 'active' : ''}`;

  return (
    <nav className="navbar navbar-dark sticky-top app-navbar" id="global-navbar" aria-label="Navigazione principale">
      <div className="container-fluid app-navbar__inner">
        <NavLink className="navbar-brand d-flex align-items-center gap-2 fw-bold text-white text-decoration-none" to="/" id="navbar-brand-link">
          <span className="app-brand-icon" aria-hidden="true">
            <i className="bi bi-train-front" />
          </span>
          <span>Last Race</span>
        </NavLink>

        <div className="d-flex align-items-center gap-1 ms-auto" id="navbar-main-links">
          <NavLink className={linkClass} to="/events" id="nav-link-events">
            Bonus & Malus
          </NavLink>

          {user ? (
            <>
              <NavLink className={linkClass} to="/history" id="nav-link-history">
                Le mie partite
              </NavLink>

              <NavLink className={linkClass} to="/ranking" id="nav-link-ranking">
                Classifica
              </NavLink>

              <NavLink className={({ isActive }) => `${linkClass({ isActive })} app-nav-link--primary`} to="/game" id="nav-link-game">
                <i className="bi bi-play-fill me-1" aria-hidden="true" />
                Gioca
              </NavLink>

              <span className="app-navbar__divider" aria-hidden="true" />
              <button
                className="nav-link app-nav-link border-0 bg-transparent"
                type="button"
                onClick={onLogout}
                id="btn-logout"
              >
                <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />
                Disconnetti
              </button>
            </>
          ) : (
            <NavLink className={({ isActive }) => `${linkClass({ isActive })} app-nav-link--primary`} to="/login" id="btn-login">
              <i className="bi bi-box-arrow-in-right me-2" aria-hidden="true" />
              Accedi
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
