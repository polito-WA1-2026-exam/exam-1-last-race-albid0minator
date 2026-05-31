import { Link, useLocation } from 'react-router-dom';

export default function Navigation({ user, onLogout }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar navbar-expand navbar-dark py-3 px-4 shadow-sm border-bottom border-secondary border-opacity-25" style={{ backgroundColor: '#0f172a' }} id="global-navbar">
      <div className="container-fluid d-flex align-items-center justify-content-between">
        
        {/* Brand/Logo */}
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4 text-white text-decoration-none" to="/" style={{ letterSpacing: '-0.5px' }} id="navbar-brand-link">
          <i className="bi bi-train-front text-warning fs-3"></i>
          <span>Last Race</span>
        </Link>

        {/* Unified Links Menu */}
        <div className="d-flex align-items-center gap-1" id="navbar-main-links">
          <Link 
            className={`nav-link px-3 py-1.5 rounded-3 transition-all ${isActive('/events') ? 'text-white bg-secondary bg-opacity-25 fw-semibold' : 'text-white-50 hover-text-white'}`} 
            to="/events"
            style={{ fontSize: '14.5px' }}
            id="nav-link-events"
          >
            Bonus & Malus
          </Link>

          {user ? (
            <>
              <Link 
                className={`nav-link px-3 py-1.5 rounded-3 transition-all ${isActive('/ranking') ? 'text-white bg-secondary bg-opacity-25 fw-semibold' : 'text-white-50 hover-text-white'}`} 
                to="/ranking"
                style={{ fontSize: '14.5px' }}
                id="nav-link-ranking"
              >
                Classifica
              </Link>
              
              <Link 
                className={`nav-link px-3 py-1.5 rounded-3 transition-all ${isActive('/game') ? 'text-white bg-secondary bg-opacity-25 fw-semibold' : 'text-white-50 hover-text-white'}`} 
                to="/game"
                style={{ fontSize: '14.5px' }}
                id="nav-link-game"
              >
                Gioca
              </Link>

              {/* Logout button styled exactly like a nav link */}
              <button 
                className="nav-link px-3 py-1.5 rounded-3 transition-all text-white-50 hover-text-white border-0 bg-transparent text-start" 
                type="button" 
                onClick={onLogout}
                style={{ fontSize: '14.5px' }}
                id="btn-logout"
              >
                Esci
              </button>
            </>
          ) : (
            <Link 
              className={`nav-link px-3 py-1.5 rounded-3 transition-all ${isActive('/login') ? 'text-white bg-secondary bg-opacity-25 fw-semibold' : 'text-white-50 hover-text-white'}`} 
              to="/login"
              style={{ fontSize: '14.5px' }}
              id="btn-login"
            >
              Accedi
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
}
