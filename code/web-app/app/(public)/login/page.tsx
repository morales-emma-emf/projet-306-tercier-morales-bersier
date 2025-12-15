"use client";

export default function LoginPage() {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert("Connexion simulée");
  }

  return (
    <main className="login">
      <section className="login-card">
        <h1>Connexion</h1>
        <p className="login-subtitle">
          Accès au portail de gestion
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="admin@entreprise.ch" required />
          </div>

          <div className="field">
            <label>Mot de passe</label>
            <input type="password" placeholder="••••••••" required />
          </div>

          <button type="submit" className="btn primary full">
            Se connecter
          </button>
        </form>
      </section>
    </main>
  );
}
