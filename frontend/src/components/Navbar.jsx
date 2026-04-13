import Button from "./ui/Button";

export default function Navbar({ onLogout, user }) {
  return (
    <header className="navbar">
      <div className="navbar__brand">
        <span className="navbar__brand-icon" aria-hidden>
          ⧉
        </span>
        <span>Secure Logger</span>
      </div>
      <div className="navbar__actions">
        <span className="navbar__user">
          {user?.username ? `@${user.username}` : "Signed in"}
        </span>
        <Button variant="danger" size="sm" type="button" onClick={onLogout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
