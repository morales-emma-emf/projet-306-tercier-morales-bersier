export default function LoginPage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Connexion</h1>
      <form>
        <input type="text" placeholder="Email" />
        <input type="password" placeholder="Mot de passe" />
        <button type="submit">Se connecter</button>
      </form>
    </main>
  );
}
