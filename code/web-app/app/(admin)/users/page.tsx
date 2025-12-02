async function getUsers() {
  // In a real app, use absolute URL or fetch from DB directly in server component
  // For now, we'll mock or assume the API is reachable if running
  // const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users`, { cache: "no-store" });
  // return res.json();
  return [];
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Gestion des Utilisateurs</h1>
      <ul>
        {users.map((u: any) => (
          <li key={u.id}>{u.name} – {u.badge_id}</li>
        ))}
      </ul>
      {users.length === 0 && <p>Aucun utilisateur trouvé (ou API non connectée).</p>}
    </main>
  );
}
