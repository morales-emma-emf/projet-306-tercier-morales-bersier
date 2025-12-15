"use client";

import { useState, useEffect } from "react";

export default function DevPage() {
  const [data, setData] = useState<{ users: any[]; roles: any[]; pointages: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    pk_utilisateur: "",
    prenom: "",
    nom: "",
    password: "1234",
    id_badge: "",
    taux_horaire: 0,
    fk_role: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dev");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditing ? "PUT" : "POST";
    const body = {
      ...formData,
      pk_utilisateur: formData.pk_utilisateur ? parseInt(formData.pk_utilisateur) : undefined,
      id_badge: formData.id_badge, // Keep as string
      taux_horaire: parseFloat(formData.taux_horaire.toString()),
      fk_role: formData.fk_role ? parseInt(formData.fk_role) : null,
    };

    try {
      const res = await fetch("/api/dev", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        resetForm();
        fetchData();
      } else {
        const err = await res.json();
        alert("Erreur: " + err.error);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  };

  const handleEdit = (user: any) => {
    setFormData({
      pk_utilisateur: user.pk_utilisateur.toString(),
      prenom: user.prenom,
      nom: user.nom,
      password: user.password,
      id_badge: user.id_badge.toString(),
      taux_horaire: user.taux_horaire,
      fk_role: user.fk_role ? user.fk_role.toString() : "",
    });
    setIsEditing(true);
  };

  const resetForm = () => {
    setFormData({
      pk_utilisateur: "",
      prenom: "",
      nom: "",
      password: "1234",
      id_badge: "",
      taux_horaire: 0,
      fk_role: "",
    });
    setIsEditing(false);
  };

  if (loading) return <div className="p-8">Chargement...</div>;
  if (!data) return <div className="p-8">Erreur de chargement</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Interface de Développement (Dev Only)</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulaire Utilisateur */}
        <div className="bg-white p-6 rounded shadow border">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? "Modifier Utilisateur" : "Ajouter Utilisateur"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Prénom</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Nom</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">ID Badge (Alphanumérique)</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={formData.id_badge}
                onChange={(e) => setFormData({ ...formData, id_badge: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Mot de passe</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Taux Horaire</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border p-2 rounded"
                  value={formData.taux_horaire}
                  onChange={(e) => setFormData({ ...formData, taux_horaire: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Rôle</label>
                <select
                  className="w-full border p-2 rounded"
                  value={formData.fk_role}
                  onChange={(e) => setFormData({ ...formData, fk_role: e.target.value })}
                >
                  <option value="">Aucun</option>
                  {data.roles.map((role) => (
                    <option key={role.pk_role} value={role.pk_role}>
                      {role.nom_role}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className={`px-4 py-2 rounded text-white ${
                  isEditing ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isEditing ? "Mettre à jour" : "Créer"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Liste des Utilisateurs */}
        <div className="bg-white p-6 rounded shadow border overflow-auto max-h-[600px]">
          <h2 className="text-xl font-semibold mb-4">Utilisateurs ({data.users.length})</h2>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Nom</th>
                <th className="p-2">Badge</th>
                <th className="p-2">Rôle</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => (
                <tr key={user.pk_utilisateur} className="border-b hover:bg-gray-50">
                  <td className="p-2">{user.pk_utilisateur}</td>
                  <td className="p-2">
                    {user.prenom} {user.nom}
                  </td>
                  <td className="p-2">{user.id_badge}</td>
                  <td className="p-2">{user.nom_role || "-"}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:underline"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Liste des Pointages */}
      <div className="mt-8 bg-white p-6 rounded shadow border">
        <h2 className="text-xl font-semibold mb-4">Derniers Pointages</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Utilisateur</th>
                <th className="p-2">Date</th>
                <th className="p-2">Entrée</th>
                <th className="p-2">Sortie</th>
                <th className="p-2">Durée (min)</th>
              </tr>
            </thead>
            <tbody>
              {data.pointages.map((pt) => (
                <tr key={pt.pk_pointage} className="border-b hover:bg-gray-50">
                  <td className="p-2">{pt.pk_pointage}</td>
                  <td className="p-2">
                    {pt.prenom} {pt.nom}
                  </td>
                  <td className="p-2">
                    {new Date(pt.date_pointage).toLocaleDateString()}
                  </td>
                  <td className="p-2">
                    {new Date(pt.heure_entree).toLocaleTimeString()}
                  </td>
                  <td className="p-2">
                    {pt.heure_sortie
                      ? new Date(pt.heure_sortie).toLocaleTimeString()
                      : "-"}
                  </td>
                  <td className="p-2">{pt.duree_minutes ?? "-"}</td>
                </tr>
              ))}
              {data.pointages.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    Aucun pointage récent
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
