import Link from "next/link";

export default function Home() {
  return (
    <main className="home">
      <section className="card">
        <h1>Système de gestion des badges</h1>

        <p className="subtitle">
          Plateforme interne de gestion et d’attribution des badges
        </p>

        <p className="description">
          Ce portail permet aux administrateurs de gérer les badges et aux
          utilisateurs de consulter leur espace personnel.
        </p>

        <div className="buttons">
          <Link href="/login" className="btn primary">
            Se connecter
          </Link>
        </div>
      </section>
    </main>
  );
}
 