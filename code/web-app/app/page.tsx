import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Système de Badge</h1>
      <p>Bienvenue sur le portail.</p>
      <div style={{ display: "flex", gap: "1rem" }}>
        <Link href="/login">Connexion Admin</Link>
        <Link href="/me">Mon Espace</Link>
      </div>
    </main>
  );
}
