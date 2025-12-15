"use client";

import { useState, useEffect } from "react";

export default function DevPage() {
  const [data, setData] = useState<{
    users: any[];
    roles: any[];
    portes: any[];
    userDoors: any[];
    roleDoors: any[];
    pointages: any[];
    logs: any[];
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  
  // User Form State
  const [formData, setFormData] = useState({
    pk_utilisateur: "",
    email: "",
    prenom: "",
    nom: "",
    password: "1234",
    id_badge: "",
    taux_horaire: 0,
    fk_role: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // New Forms State
  const [newRole, setNewRole] = useState("");
  const [newDoor, setNewDoor] = useState("");
  const [newDoorId, setNewDoorId] = useState("");
  const [assignUserDoor, setAssignUserDoor] = useState({ userId: "", doorId: "" });
  const [assignRoleDoor, setAssignRoleDoor] = useState({ roleId: "", doorId: "" });

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

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditing ? "PUT" : "POST";
    const body = {
      ...formData,
      pk_utilisateur: formData.pk_utilisateur ? parseInt(formData.pk_utilisateur) : undefined,
      id_badge: formData.id_badge,
      taux_horaire: parseFloat(formData.taux_horaire.toString()),
      fk_role: formData.fk_role ? parseInt(formData.fk_role) : null,
    };

    await sendRequest(method, body);
    resetUserForm();
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole) return;
    await sendRequest("POST", { type: "role", nom_role: newRole });
    setNewRole("");
  };

  const handleCreateDoor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoor) return;
    await sendRequest("POST", { 
      type: "door", 
      titre: newDoor,
      pk_porte: newDoorId ? parseInt(newDoorId) : undefined
    });
    setNewDoor("");
    setNewDoorId("");
  };

  const handleAssignUserDoor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserDoor.userId || !assignUserDoor.doorId) return;
    await sendRequest("POST", { 
      type: "user_door", 
      fk_utilisateur: assignUserDoor.userId, 
      fk_porte: assignUserDoor.doorId 
    });
    setAssignUserDoor({ userId: "", doorId: "" });
  };

  const handleAssignRoleDoor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignRoleDoor.roleId || !assignRoleDoor.doorId) return;
    await sendRequest("POST", { 
      type: "role_door", 
      fk_role: assignRoleDoor.roleId, 
      fk_porte: assignRoleDoor.doorId 
    });
    setAssignRoleDoor({ roleId: "", doorId: "" });
  };

  const sendRequest = async (method: string, body: any) => {
    try {
      const res = await fetch("/api/dev", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
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

  const handleEditUser = (user: any) => {
    setFormData({
      pk_utilisateur: user.pk_utilisateur.toString(),
      email: user.email || "",
      prenom: user.prenom,
      nom: user.nom,
      password: user.password,
      id_badge: user.id_badge.toString(),
      taux_horaire: user.taux_horaire,
      fk_role: user.fk_role ? user.fk_role.toString() : "",
    });
    setIsEditing(true);
  };

  const resetUserForm = () => {
    setFormData({
      pk_utilisateur: "",
      email: "",
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-white">
      <h1 className="text-3xl font-bold">Interface de Développement (Dev Only)</h1>

      {/* SECTION 1: GESTION UTILISATEURS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded shadow border">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? "Modifier Utilisateur" : "Ajouter Utilisateur"}
          </h2>
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                className="w-full border p-2 rounded"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
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
              <label className="block text-sm font-medium">ID Badge</label>
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
                {isEditing ? "Mettre à jour" : "Créer Utilisateur"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetUserForm}
                  className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white p-6 rounded shadow border overflow-auto max-h-[500px]">
          <h2 className="text-xl font-semibold mb-4">Liste Utilisateurs</h2>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Email</th>
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
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.prenom} {user.nom}</td>
                  <td className="p-2">{user.id_badge}</td>
                  <td className="p-2">{user.nom_role || "-"}</td>
                  <td className="p-2">
                    <button onClick={() => handleEditUser(user)} className="text-blue-600 hover:underline">
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: GESTION ROLES & ACCES */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        
        {/* Créer Rôle */}
        <div className="bg-white p-6 rounded shadow border">
          <h2 className="text-xl font-semibold mb-4">Créer un Rôle</h2>
          <form onSubmit={handleCreateRole} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Nom du Rôle</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="Ex: Admin, Staff..."
                required
              />
            </div>
            <button type="submit" className="w-full px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700">
              Ajouter Rôle
            </button>
          </form>
          <div className="mt-4">
            <h3 className="font-medium text-sm text-gray-600 mb-2">Rôles existants:</h3>
            <div className="flex flex-wrap gap-2">
              {data.roles.map(r => (
                <span key={r.pk_role} className="px-2 py-1 bg-gray-100 rounded text-xs border">
                  {r.nom_role}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Créer Porte */}
        <div className="bg-white p-6 rounded shadow border">
          <h2 className="text-xl font-semibold mb-4">Créer une Porte</h2>
          <form onSubmit={handleCreateDoor} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">ID (Optionnel)</label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={newDoorId}
                onChange={(e) => setNewDoorId(e.target.value)}
                placeholder="Auto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Titre de la Porte</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={newDoor}
                onChange={(e) => setNewDoor(e.target.value)}
                placeholder="Ex: Entrée Principale..."
                required
              />
            </div>
            <button type="submit" className="w-full px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700">
              Ajouter Porte
            </button>
          </form>
          <div className="mt-4">
            <h3 className="font-medium text-sm text-gray-600 mb-2">Portes existantes:</h3>
            <div className="flex flex-wrap gap-2">
              {data.portes.map(p => (
                <span key={p.pk_porte} className="px-2 py-1 bg-gray-100 rounded text-xs border">
                  #{p.pk_porte} {p.titre}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Assigner Porte -> Utilisateur */}
        <div className="bg-white p-6 rounded shadow border">
          <h2 className="text-xl font-semibold mb-4">Accès Direct (User ↔ Porte)</h2>
          <form onSubmit={handleAssignUserDoor} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Utilisateur</label>
              <select
                className="w-full border p-2 rounded"
                value={assignUserDoor.userId}
                onChange={(e) => setAssignUserDoor({ ...assignUserDoor, userId: e.target.value })}
                required
              >
                <option value="">Choisir...</option>
                {data.users.map(u => (
                  <option key={u.pk_utilisateur} value={u.pk_utilisateur}>
                    {u.prenom} {u.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Porte</label>
              <select
                className="w-full border p-2 rounded"
                value={assignUserDoor.doorId}
                onChange={(e) => setAssignUserDoor({ ...assignUserDoor, doorId: e.target.value })}
                required
              >
                <option value="">Choisir...</option>
                {data.portes.map(p => (
                  <option key={p.pk_porte} value={p.pk_porte}>
                    {p.titre}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">
              Assigner Accès
            </button>
          </form>
          <div className="mt-4 max-h-32 overflow-auto text-xs">
            <h3 className="font-medium text-gray-600 mb-1">Accès directs actuels:</h3>
            <ul className="list-disc pl-4">
              {data.userDoors.map((ud, i) => (
                <li key={i}>{ud.prenom} {ud.nom} ↔ {ud.titre}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Assigner Porte -> Rôle */}
        <div className="bg-white p-6 rounded shadow border">
          <h2 className="text-xl font-semibold mb-4">Accès par Rôle (Rôle ↔ Porte)</h2>
          <form onSubmit={handleAssignRoleDoor} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Rôle</label>
              <select
                className="w-full border p-2 rounded"
                value={assignRoleDoor.roleId}
                onChange={(e) => setAssignRoleDoor({ ...assignRoleDoor, roleId: e.target.value })}
                required
              >
                <option value="">Choisir...</option>
                {data.roles.map(r => (
                  <option key={r.pk_role} value={r.pk_role}>
                    {r.nom_role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Porte</label>
              <select
                className="w-full border p-2 rounded"
                value={assignRoleDoor.doorId}
                onChange={(e) => setAssignRoleDoor({ ...assignRoleDoor, doorId: e.target.value })}
                required
              >
                <option value="">Choisir...</option>
                {data.portes.map(p => (
                  <option key={p.pk_porte} value={p.pk_porte}>
                    {p.titre}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700">
              Assigner Accès
            </button>
          </form>
          <div className="mt-4 max-h-32 overflow-auto text-xs">
            <h3 className="font-medium text-gray-600 mb-1">Accès par rôle actuels:</h3>
            <ul className="list-disc pl-4">
              {data.roleDoors.map((rd, i) => (
                <li key={i}>{rd.nom_role} ↔ {rd.titre}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* SECTION 3: LOGS & POINTAGES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pointages */}
        <div className="bg-white p-6 rounded shadow border overflow-auto max-h-[500px]">
          <h2 className="text-xl font-semibold mb-4">Derniers Pointages</h2>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Utilisateur</th>
                <th className="p-2">Date</th>
                <th className="p-2">Entrée</th>
                <th className="p-2">Sortie</th>
              </tr>
            </thead>
            <tbody>
              {data.pointages.map((pt) => (
                <tr key={pt.pk_pointage} className="border-b hover:bg-gray-50">
                  <td className="p-2">{pt.prenom} {pt.nom}</td>
                  <td className="p-2">{new Date(pt.date_pointage).toLocaleDateString()}</td>
                  <td className="p-2">{new Date(pt.heure_entree).toLocaleTimeString()}</td>
                  <td className="p-2">{pt.heure_sortie ? new Date(pt.heure_sortie).toLocaleTimeString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Logs */}
        <div className="bg-white p-6 rounded shadow border overflow-auto max-h-[500px]">
          <h2 className="text-xl font-semibold mb-4">Logs Système</h2>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Type</th>
                <th className="p-2">Action</th>
                <th className="p-2">Détails</th>
              </tr>
            </thead>
            <tbody>
              {data.logs?.map((log) => (
                <tr key={log.pk_log} className="border-b hover:bg-gray-50">
                  <td className="p-2">{new Date(log.date_action).toLocaleString()}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        log.event_type === "error"
                          ? "bg-red-100 text-red-800"
                          : log.event_type === "warning"
                          ? "bg-yellow-100 text-yellow-800"
                          : log.event_type === "access"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {log.event_type}
                    </span>
                  </td>
                  <td className="p-2">{log.action}</td>
                  <td className="p-2">
                    {log.nom ? `${log.prenom} ${log.nom}` : "-"}
                    {log.porte_titre ? ` - ${log.porte_titre}` : ""}
                  </td>
                </tr>
              ))}
              {(!data.logs || data.logs.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    Aucun log récent
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
