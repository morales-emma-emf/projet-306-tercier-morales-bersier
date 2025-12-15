"use client";

export default function LoginPage() {
  async function handleSubmit(e) {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Erreur de connexion");
      return;
    }

    alert("Connexion réussie");
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
            <input
              type="email"
              name="email"
              placeholder="admin@entreprise.ch"
              required
            />
          </div>

          <div className="field">
            <label>Mot de passe</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn primary full">
            Se connecter
          </button>
        </form>
      </section>
    </main>
  );
}
