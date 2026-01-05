"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  pk_utilisateur: number;
  email: string;
  prenom: string;
  nom: string;
  id_badge: string | null;
  fk_role: number | null;
  taux_horaire?: number | string | null;
};

type Porte = {
  pk_porte: number;
  titre: string;
  description?: string | null;
};

type UserPorte = {
  fk_utilisateur: number;
  fk_porte: number;
  nom_porte?: string;
};

type Role = {
  pk_role: number;
  nom_role: string;
};

type RolePorte = {
  fk_role: number;
  fk_porte: number;
};

type DoorForm = {
  pk_porte: number | null;
  titre: string;
  description: string;
};

type RoleForm = {
  pk_role: number | null;
  nom_role: string;
};

type UserForm = {
  email: string;
  prenom: string;
  nom: string;
  password: string;
  id_badge: string;
  taux_horaire: string;
  fk_role: number | null;
};

type UserEditForm = {
  email: string;
  prenom: string;
  nom: string;
  id_badge: string;
  taux_horaire: string;
  password: string;
  fk_role: number | null;
};

async function fetchUsers(): Promise<User[]> {
  const response = await fetch("/api/admin/users", { cache: "no-store" });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Impossible de récupérer les utilisateurs");
  }

  return response.json();
}

async function fetchPortes(): Promise<Porte[]> {
  const response = await fetch("/api/admin/portes", { cache: "no-store" });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Impossible de récupérer les portes");
  }
  return response.json();
}

async function fetchUserPortes(userId: number): Promise<UserPorte[]> {
  const response = await fetch(`/api/admin/users/porte?userid=${userId}`, { cache: "no-store" });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Impossible de récupérer les accès de l'utilisateur");
  }
  return response.json();
}

async function fetchRoles(): Promise<Role[]> {
  const response = await fetch("/api/admin/roles", { cache: "no-store" });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Impossible de récupérer les rôles");
  }
  return response.json();
}

async function fetchRolePortes(roleId: number): Promise<RolePorte[]> {
  const response = await fetch(`/api/admin/roles/porte?roleid=${roleId}`, { cache: "no-store" });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Impossible de récupérer les accès du rôle");
  }
  return response.json();
}

export default function DashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [portes, setPortes] = useState<Porte[]>([]);
  const [userPortes, setUserPortes] = useState<UserPorte[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePortes, setRolePortes] = useState<RolePorte[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [savingDoorId, setSavingDoorId] = useState<number | null>(null);
  const [roleSelection, setRoleSelection] = useState<number | null>(null);
  const [doorsModalOpen, setDoorsModalOpen] = useState(false);
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [doorForm, setDoorForm] = useState<DoorForm>({ pk_porte: null, titre: "", description: "" });
  const [roleForm, setRoleForm] = useState<RoleForm>({ pk_role: null, nom_role: "" });
  const [doorError, setDoorError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [doorSaving, setDoorSaving] = useState(false);
  const [roleSaving, setRoleSaving] = useState(false);
  const [doorDeletingId, setDoorDeletingId] = useState<number | null>(null);
  const [roleDeletingId, setRoleDeletingId] = useState<number | null>(null);
  const [linkRoleId, setLinkRoleId] = useState<number | null>(null);
  const [linkRolePortes, setLinkRolePortes] = useState<RolePorte[]>([]);
  const [linkSavingDoorId, setLinkSavingDoorId] = useState<number | null>(null);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState<UserForm>({
    email: "",
    prenom: "",
    nom: "",
    password: "",
    id_badge: "",
    taux_horaire: "",
    fk_role: null,
  });
  const [userError, setUserError] = useState<string | null>(null);
  const [userSaving, setUserSaving] = useState(false);
  const [userEditForm, setUserEditForm] = useState<UserEditForm | null>(null);
  const [userEditError, setUserEditError] = useState<string | null>(null);
  const [userEditSaving, setUserEditSaving] = useState(false);
  const [showUserEditForm, setShowUserEditForm] = useState(false);
  const [showRoleEdit, setShowRoleEdit] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([fetchUsers(), fetchRoles()])
      .then(([usersData, rolesData]) => {
        if (!active) return;
        setUsers(usersData);
        setRoles(rolesData);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Une erreur est survenue");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) => {
      const haystack = `${user.prenom} ${user.nom} ${user.email}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [search, users]);

  const roleLabel = (role: number | null) => {
    if (role === 1) return "Admin";
    if (role === null || role === undefined) return "Aucun rôle";
    return "Employé";
  };

  const handlePresence = (userId: number) => {
    // ici appeler pour la présense
  };

  const handleAccess = (user: User) => {
    setSelectedUser(user);
    setRoleSelection(user.fk_role ?? null);
    setShowUserEditForm(false);
    setShowRoleEdit(false);
    setUserEditForm({
      email: user.email,
      prenom: user.prenom,
      nom: user.nom,
      id_badge: user.id_badge || "",
      taux_horaire: user.taux_horaire ? String(user.taux_horaire) : "",
      password: "",
      fk_role: user.fk_role ?? null,
    });
  };

  useEffect(() => {
    if (!selectedUser) return;

    let active = true;
    setAccessLoading(true);
    setAccessError(null);

    Promise.all([
      fetchPortes(),
      fetchUserPortes(selectedUser.pk_utilisateur),
      fetchRoles(),
    ])
      .then(([portesData, userPortesData, rolesData]) => {
        if (!active) return;
        setPortes(portesData);
        setUserPortes(userPortesData);
        setRoles(rolesData);
      })
      .catch((err) => {
        if (!active) return;
        setAccessError(err.message || "Erreur lors du chargement des accès");
      })
      .finally(() => {
        if (!active) return;
        setAccessLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedUser]);

  useEffect(() => {
    if (!roleSelection) {
      setRolePortes([]);
      return;
    }
    let active = true;
    fetchRolePortes(roleSelection)
      .then((data) => {
        if (!active) return;
        setRolePortes(data);
      })
      .catch((err) => {
        if (!active) return;
        setAccessError(err.message || "Erreur lors du chargement des accès de rôle");
      });
    return () => {
      active = false;
    };
  }, [roleSelection]);

  useEffect(() => {
    if (!linkRoleId) {
      setLinkRolePortes([]);
      return;
    }
    let active = true;
    fetchRolePortes(linkRoleId)
      .then((data) => {
        if (!active) return;
        setLinkRolePortes(data);
      })
      .catch((err) => {
        if (!active) return;
        setRoleError(err.message || "Erreur lors du chargement des accès de rôle");
      });
    return () => {
      active = false;
    };
  }, [linkRoleId]);

  const hasDirectAccessToDoor = (porteId: number) => userPortes.some((p) => p.fk_porte === porteId);
  const hasRoleAccessToDoor = (porteId: number) => rolePortes.some((p) => p.fk_porte === porteId);

  const handleToggleDoor = async (porteId: number, hasAccess: boolean) => {
    if (!selectedUser) return;
    if (hasRoleAccessToDoor(porteId)) return; // accès via rôle non éditable ici
    setSavingDoorId(porteId);
    try {
      if (hasAccess) {
        const res = await fetch(`/api/admin/users/porte?userid=${selectedUser.pk_utilisateur}&porteid=${porteId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(await res.text());
        setUserPortes((prev) => prev.filter((p) => p.fk_porte !== porteId));
      } else {
        const res = await fetch("/api/admin/users/porte", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fk_utilisateur: selectedUser.pk_utilisateur, fk_porte: porteId }),
        });
        if (!res.ok) throw new Error(await res.text());
        setUserPortes((prev) => [...prev, { fk_utilisateur: selectedUser.pk_utilisateur, fk_porte: porteId }]);
      }
    } catch (err: any) {
      setAccessError(err.message || "Erreur lors de la mise à jour de l'accès");
    } finally {
      setSavingDoorId(null);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    setSavingRole(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pk_utilisateur: selectedUser.pk_utilisateur,
          email: selectedUser.email,
          prenom: selectedUser.prenom,
          nom: selectedUser.nom,
          id_badge: selectedUser.id_badge,
          taux_horaire: selectedUser.taux_horaire ?? 0,
          fk_role: roleSelection,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      setUsers((prev) =>
        prev.map((u) =>
          u.pk_utilisateur === selectedUser.pk_utilisateur ? { ...u, fk_role: roleSelection ?? null } : u
        )
      );
      setSelectedUser((prev) => (prev ? { ...prev, fk_role: roleSelection ?? null } : prev));
      setShowRoleEdit(false);
    } catch (err: any) {
      setAccessError(err.message || "Erreur lors de la mise à jour du rôle");
    } finally {
      setSavingRole(false);
    }
  };

  const loadPortes = async () => {
    const data = await fetchPortes();
    setPortes(data);
  };

  const loadRoles = async () => {
    const data = await fetchRoles();
    setRoles(data);
  };

  const loadUsers = async () => {
    const data = await fetchUsers();
    setUsers(data);
  };

  const handleDoorSubmit = async () => {
    if (!doorForm.titre.trim()) {
      setDoorError("Le titre est requis");
      return;
    }
    setDoorSaving(true);
    setDoorError(null);
    try {
      if (doorForm.pk_porte) {
        const res = await fetch("/api/admin/portes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pk_porte: doorForm.pk_porte,
            titre: doorForm.titre,
            description: doorForm.description || null,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetch("/api/admin/portes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titre: doorForm.titre,
            description: doorForm.description || null,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      await loadPortes();
      setDoorForm({ pk_porte: null, titre: "", description: "" });
    } catch (err: any) {
      setDoorError(err.message || "Erreur lors de l'enregistrement de la porte");
    } finally {
      setDoorSaving(false);
    }
  };

  const handleDoorDelete = async (id: number) => {
    setDoorDeletingId(id);
    try {
      const res = await fetch(`/api/admin/portes?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await loadPortes();
    } catch (err: any) {
      setDoorError(err.message || "Erreur lors de la suppression");
    } finally {
      setDoorDeletingId(null);
    }
  };

  const handleRoleSubmit = async () => {
    if (!roleForm.nom_role.trim()) {
      setRoleError("Le nom du rôle est requis");
      return;
    }
    if (roleForm.pk_role === 1) {
      setRoleError("Le rôle admin ne peut pas être renommé.");
      return;
    }
    setRoleSaving(true);
    setRoleError(null);
    try {
      if (roleForm.pk_role) {
        const res = await fetch("/api/admin/roles", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pk_role: roleForm.pk_role, nom_role: roleForm.nom_role }),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetch("/api/admin/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom_role: roleForm.nom_role }),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      await loadRoles();
      setRoleForm({ pk_role: null, nom_role: "" });
    } catch (err: any) {
      setRoleError(err.message || "Erreur lors de l'enregistrement du rôle");
    } finally {
      setRoleSaving(false);
    }
  };

  const handleRoleDelete = async (id: number) => {
    setRoleDeletingId(id);
    try {
      const res = await fetch(`/api/admin/roles?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await loadRoles();
      if (linkRoleId === id) {
        setLinkRoleId(null);
        setLinkRolePortes([]);
      }
    } catch (err: any) {
      setRoleError(err.message || "Erreur lors de la suppression du rôle");
    } finally {
      setRoleDeletingId(null);
    }
  };

  const handleToggleRoleDoor = async (porteId: number, hasAccess: boolean) => {
    if (!linkRoleId) return;
    setLinkSavingDoorId(porteId);
    try {
      if (hasAccess) {
        const res = await fetch(`/api/admin/roles/porte?fk_role=${linkRoleId}&fk_porte=${porteId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(await res.text());
        setLinkRolePortes((prev) => prev.filter((p) => p.fk_porte !== porteId));
      } else {
        const res = await fetch("/api/admin/roles/porte", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fk_role: linkRoleId, fk_porte: porteId }),
        });
        if (!res.ok) throw new Error(await res.text());
        setLinkRolePortes((prev) => [...prev, { fk_role: linkRoleId, fk_porte: porteId }]);
      }
    } catch (err: any) {
      setRoleError(err.message || "Erreur lors de la mise à jour des accès du rôle");
    } finally {
      setLinkSavingDoorId(null);
    }
  };

  const resetUserForm = () => {
    setUserForm({
      email: "",
      prenom: "",
      nom: "",
      password: "",
      id_badge: "",
      taux_horaire: "",
      fk_role: null,
    });
  };

  const handleUserSubmit = async () => {
    if (!userForm.email.trim() || !userForm.prenom.trim() || !userForm.nom.trim() || !userForm.password.trim() || !userForm.id_badge.trim()) {
      setUserError("Email, prénom, nom, mot de passe et badge sont requis.");
      return;
    }

    setUserSaving(true);
    setUserError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userForm.email.trim(),
          prenom: userForm.prenom.trim(),
          nom: userForm.nom.trim(),
          password: userForm.password,
          id_badge: userForm.id_badge.trim(),
          taux_horaire: userForm.taux_horaire === "" ? null : Number(userForm.taux_horaire),
          fk_role: userForm.fk_role ?? null,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      await loadUsers();
      resetUserForm();
      setAddUserModalOpen(false);
    } catch (err: any) {
      setUserError(err.message || "Erreur lors de la création de l'utilisateur");
    } finally {
      setUserSaving(false);
    }
  };

  const handleUserUpdate = async () => {
    if (!selectedUser || !userEditForm) return;
    if (!userEditForm.email.trim() || !userEditForm.prenom.trim() || !userEditForm.nom.trim() || !userEditForm.id_badge.trim()) {
      setUserEditError("Email, prénom, nom et badge sont requis.");
      return;
    }

    setUserEditSaving(true);
    setUserEditError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pk_utilisateur: selectedUser.pk_utilisateur,
          email: userEditForm.email.trim(),
          prenom: userEditForm.prenom.trim(),
          nom: userEditForm.nom.trim(),
          password: userEditForm.password || undefined,
          id_badge: userEditForm.id_badge.trim(),
          taux_horaire: userEditForm.taux_horaire === "" ? null : Number(userEditForm.taux_horaire),
          fk_role: roleSelection,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      setUsers((prev) =>
        prev.map((u) =>
          u.pk_utilisateur === selectedUser.pk_utilisateur
            ? {
                ...u,
                email: userEditForm.email.trim(),
                prenom: userEditForm.prenom.trim(),
                nom: userEditForm.nom.trim(),
                id_badge: userEditForm.id_badge.trim(),
                taux_horaire: userEditForm.taux_horaire === "" ? null : Number(userEditForm.taux_horaire),
                fk_role: roleSelection ?? null,
              }
            : u
        )
      );

      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              email: userEditForm.email.trim(),
              prenom: userEditForm.prenom.trim(),
              nom: userEditForm.nom.trim(),
              id_badge: userEditForm.id_badge.trim(),
              taux_horaire: userEditForm.taux_horaire === "" ? null : Number(userEditForm.taux_horaire),
              fk_role: roleSelection ?? null,
            }
          : prev
      );

      setUserEditForm((prev) => (prev ? { ...prev, password: "" } : prev));
      setShowUserEditForm(false);
    } catch (err: any) {
      setUserEditError(err.message || "Erreur lors de la mise à jour de l'utilisateur");
    } finally {
      setUserEditSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.15em] text-slate-500">Administration</p>
            <h1 className="text-3xl font-semibold text-white">Tableau de bord</h1>
            <p className="text-sm text-slate-400">Vue rapide des collaborateurs et actions fréquentes.</p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-black/30">
            <p className="text-sm font-semibold text-white">Actions rapides</p>
            <p className="text-xs text-slate-400 mb-4">Administration des ressources.</p>
            <div className="flex flex-col gap-3">
              <button
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-800"
                onClick={() => {
                  setDoorsModalOpen(true);
                  loadPortes();
                }}
              >
                Gérer les portes
              </button>
              <button
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-800"
                onClick={() => {
                  setRolesModalOpen(true);
                  loadRoles();
                  loadPortes();
                }}
              >
                Gérer les rôles
              </button>
              <button
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-800"
                onClick={() => router.push("/logs")}
              >
                Gestion des logs
              </button>
            </div>
          </aside>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Employés</h2>
                <p className="text-sm text-slate-400">Nom, prénom, email et rôle. Filtrez en direct.</p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                <label className="group relative w-full sm:w-72">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par nom ou email"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 shadow-inner shadow-black/30 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                  />
                </label>
                <button
                  className="whitespace-nowrap rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-500"
                  onClick={() => {
                    resetUserForm();
                    setUserError(null);
                    setAddUserModalOpen(true);
                    loadRoles();
                  }}
                >
                  Ajouter un utilisateur
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="grid grid-cols-[1.2fr_1.5fr_0.9fr_1fr] items-center bg-slate-800/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                <span>Identité</span>
                <span>Email</span>
                <span>Rôle</span>
                <span className="text-right">Actions</span>
              </div>

              {loading && (
                <div className="p-6 text-sm text-slate-400">Chargement des utilisateurs…</div>
              )}

              {error && !loading && (
                <div className="p-6 text-sm text-red-300">{error}</div>
              )}

              {!loading && !error && filteredUsers.length === 0 && (
                <div className="p-6 text-sm text-slate-400">Aucun utilisateur ne correspond à votre recherche.</div>
              )}

              <ul className="divide-y divide-slate-800">
                {!loading && !error &&
                  filteredUsers.map((user) => (
                    <li
                      key={user.pk_utilisateur}
                      className="grid grid-cols-[1.2fr_1.5fr_0.9fr_1fr] items-center gap-3 px-4 py-4 text-sm text-slate-200 hover:bg-slate-800/40"
                    >
                      <div>
                        <p className="font-semibold text-white">{user.prenom} {user.nom}</p>
                        <p className="text-xs text-slate-400">Badge: {user.id_badge || "—"}</p>
                      </div>
                      <div className="truncate text-slate-300">{user.email}</div>
                      <div>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200">
                          {roleLabel(user.fk_role)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handlePresence(user.pk_utilisateur)}
                          className="rounded-lg border border-indigo-500/60 px-3 py-2 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-600 hover:text-white"
                        >
                          Voir les présences
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAccess(user)}
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
                        >
                          Gérer
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {addUserModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-8">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-black/40">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Nouvel utilisateur</p>
                <h3 className="text-2xl font-semibold text-white">Créer un compte</h3>
                <p className="text-sm text-slate-400">Email, badge, mot de passe, rôle optionnel.</p>
              </div>
              <button
                className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-200 transition hover:bg-slate-800"
                onClick={() => {
                  setAddUserModalOpen(false);
                  resetUserForm();
                  setUserError(null);
                }}
              >
                Fermer
              </button>
            </div>

            {userError && <p className="mb-3 text-sm text-red-300">{userError}</p>}

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={userForm.prenom}
                onChange={(e) => setUserForm((p) => ({ ...p, prenom: e.target.value }))}
                placeholder="Prénom"
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
              />
              <input
                value={userForm.nom}
                onChange={(e) => setUserForm((p) => ({ ...p, nom: e.target.value }))}
                placeholder="Nom"
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
              />
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email professionnel"
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 sm:col-span-2"
              />
              <input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Mot de passe initial"
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
              />
              <input
                value={userForm.id_badge}
                onChange={(e) => setUserForm((p) => ({ ...p, id_badge: e.target.value }))}
                placeholder="ID badge"
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
              />
              <input
                type="number"
                value={userForm.taux_horaire}
                onChange={(e) => setUserForm((p) => ({ ...p, taux_horaire: e.target.value }))}
                placeholder="Taux horaire (CHF, optionnel)"
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
              />
              <select
                value={userForm.fk_role === null ? "" : userForm.fk_role}
                onChange={(e) => setUserForm((p) => ({ ...p, fk_role: e.target.value ? Number(e.target.value) : null }))}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
              >
                <option value="">Aucun rôle (accès manuel)</option>
                {roles.map((role) => (
                  <option key={role.pk_role} value={role.pk_role}>{role.nom_role}</option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                onClick={() => {
                  resetUserForm();
                  setUserError(null);
                }}
                disabled={userSaving}
              >
                Réinitialiser
              </button>
              <button
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                onClick={handleUserSubmit}
                disabled={userSaving}
              >
                {userSaving ? "Création…" : "Créer l'utilisateur"}
              </button>
            </div>
          </div>
        </div>
      )}

      {doorsModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-8">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-black/40">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Gestion des portes</p>
                <h3 className="text-2xl font-semibold text-white">Ajouter, modifier ou supprimer</h3>
              </div>
              <button
                className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-200 transition hover:bg-slate-800"
                onClick={() => {
                  setDoorsModalOpen(false);
                  setDoorForm({ pk_porte: null, titre: "", description: "" });
                  setDoorError(null);
                }}
              >
                Fermer
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Portes existantes</p>
                  <button
                    className="text-xs text-indigo-300 underline"
                    onClick={loadPortes}
                  >
                    Rafraîchir
                  </button>
                </div>
                <div className="max-h-80 space-y-2 overflow-auto pr-1">
                  {portes.map((porte) => (
                    <div
                      key={porte.pk_porte}
                      className="flex items-start justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{porte.titre}</p>
                        {porte.description && (
                          <p className="text-xs text-slate-400">{porte.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 transition hover:bg-slate-800"
                          onClick={() => setDoorForm({ pk_porte: porte.pk_porte, titre: porte.titre, description: porte.description || "" })}
                        >
                          Éditer
                        </button>
                        <button
                          className="rounded-lg border border-red-500 px-3 py-1 text-xs text-red-200 transition hover:bg-red-600 hover:text-white"
                          disabled={doorDeletingId === porte.pk_porte}
                          onClick={() => handleDoorDelete(porte.pk_porte)}
                        >
                          {doorDeletingId === porte.pk_porte ? "…" : "Supprimer"}
                        </button>
                      </div>
                    </div>
                  ))}
                  {portes.length === 0 && (
                    <p className="text-xs text-slate-400">Aucune porte définie.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-sm font-semibold text-white">{doorForm.pk_porte ? "Modifier une porte" : "Ajouter une porte"}</p>
                {doorError && <p className="mt-2 text-xs text-red-300">{doorError}</p>}
                <div className="mt-3 flex flex-col gap-3">
                  <input
                    value={doorForm.titre}
                    onChange={(e) => setDoorForm((p) => ({ ...p, titre: e.target.value }))}
                    placeholder="Titre"
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                  />
                  <textarea
                    value={doorForm.description}
                    onChange={(e) => setDoorForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Description (optionnel)"
                    className="min-h-[80px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                      onClick={() => setDoorForm({ pk_porte: null, titre: "", description: "" })}
                      disabled={doorSaving}
                    >
                      Réinitialiser
                    </button>
                    <button
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                      onClick={handleDoorSubmit}
                      disabled={doorSaving}
                    >
                      {doorSaving ? "Sauvegarde…" : doorForm.pk_porte ? "Mettre à jour" : "Créer"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {rolesModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-8">
          <div className="w-full max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-black/40">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Gestion des rôles</p>
                <h3 className="text-2xl font-semibold text-white">Ajouter, modifier, lier aux portes</h3>
              </div>
              <button
                className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-200 transition hover:bg-slate-800"
                onClick={() => {
                  setRolesModalOpen(false);
                  setRoleForm({ pk_role: null, nom_role: "" });
                  setRoleError(null);
                  setLinkRoleId(null);
                  setLinkRolePortes([]);
                }}
              >
                Fermer
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Rôles</p>
                  <button
                    className="text-xs text-indigo-300 underline"
                    onClick={loadRoles}
                  >
                    Rafraîchir
                  </button>
                </div>
                <div className="max-h-80 space-y-2 overflow-auto pr-1">
                  {roles.map((role) => (
                    <div
                      key={role.pk_role}
                      className="flex items-start justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold text-white">{role.nom_role}</p>
                        <button
                          className={`w-fit rounded-lg border px-2 py-1 text-[11px] ${linkRoleId === role.pk_role ? "border-indigo-400 text-indigo-200" : "border-slate-700 text-slate-300"}`}
                          onClick={() => setLinkRoleId(role.pk_role)}
                        >
                          {linkRoleId === role.pk_role ? "Accès en cours" : "Gérer les accès"}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 transition hover:bg-slate-800"
                          onClick={() => {
                            setRoleForm({ pk_role: role.pk_role, nom_role: role.nom_role });
                            setLinkRoleId(role.pk_role);
                          }}
                        >
                          Éditer
                        </button>
                        <button
                          className="rounded-lg border border-red-500 px-3 py-1 text-xs text-red-200 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
                          disabled={roleDeletingId === role.pk_role || role.pk_role === 1}
                          onClick={() => handleRoleDelete(role.pk_role)}
                        >
                          {roleDeletingId === role.pk_role ? "…" : "Supprimer"}
                        </button>
                      </div>
                    </div>
                  ))}
                  {roles.length === 0 && (
                    <p className="text-xs text-slate-400">Aucun rôle défini.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-sm font-semibold text-white">{roleForm.pk_role ? "Modifier un rôle" : "Ajouter un rôle"}</p>
                {roleError && <p className="mt-2 text-xs text-red-300">{roleError}</p>}
                <div className="mt-3 flex flex-col gap-3">
                  <input
                    value={roleForm.nom_role}
                    onChange={(e) => setRoleForm((p) => ({ ...p, nom_role: e.target.value }))}
                    placeholder="Nom du rôle"
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                      onClick={() => setRoleForm({ pk_role: null, nom_role: "" })}
                      disabled={roleSaving}
                    >
                      Réinitialiser
                    </button>
                    <button
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                      onClick={handleRoleSubmit}
                      disabled={roleSaving}
                    >
                      {roleSaving ? "Sauvegarde…" : roleForm.pk_role ? "Mettre à jour" : "Créer"}
                    </button>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Lier le rôle à des portes</p>
                    {linkRoleId ? (
                      <span className="text-xs text-slate-400">Rôle sélectionné : {roles.find((r) => r.pk_role === linkRoleId)?.nom_role || ""}</span>
                    ) : (
                      <span className="text-xs text-slate-500">Sélectionnez un rôle dans la liste</span>
                    )}
                  </div>
                  {roleError && <p className="mb-2 text-xs text-red-300">{roleError}</p>}
                  <div className="max-h-64 space-y-2 overflow-auto pr-1">
                    {portes.map((porte) => {
                      const hasAccess = linkRolePortes.some((p) => p.fk_porte === porte.pk_porte);
                      return (
                        <div
                          key={porte.pk_porte}
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">{porte.titre}</p>
                            {porte.description && <p className="text-xs text-slate-400">{porte.description}</p>}
                          </div>
                          <button
                            className={`${hasAccess ? "border border-red-400 text-red-200 hover:bg-red-500 hover:text-white" : "bg-emerald-600 text-white hover:bg-emerald-500"} rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-60`}
                            disabled={!linkRoleId || linkSavingDoorId === porte.pk_porte}
                            onClick={() => handleToggleRoleDoor(porte.pk_porte, hasAccess)}
                          >
                            {linkSavingDoorId === porte.pk_porte ? "…" : hasAccess ? "Retirer" : "Ajouter"}
                          </button>
                        </div>
                      );
                    })}
                    {portes.length === 0 && (
                      <p className="text-xs text-slate-400">Aucune porte définie.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-black/40">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Gestion des accès</p>
                <h3 className="text-2xl font-semibold text-white">{selectedUser.prenom} {selectedUser.nom}</h3>
                <p className="text-sm text-slate-400">{selectedUser.email}</p>
              </div>
              <button
                className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-200 transition hover:bg-slate-800"
                onClick={() => {
                  setSelectedUser(null);
                  setShowRoleEdit(false);
                  setShowUserEditForm(false);
                  setUserEditError(null);
                  setAccessError(null);
                }}
              >
                Fermer
              </button>
            </div>

            <div className="grid gap-3 text-sm text-slate-200">
              <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/50 px-4 py-3">
                <span className="text-slate-400">Badge</span>
                <span className="font-semibold text-white">{selectedUser.id_badge || "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/50 px-4 py-3">
                <span className="text-slate-400">Rôle</span>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-100">
                  {roleLabel(selectedUser.fk_role)}
                </span>
              </div>
         
              <div className="flex flex-wrap items-center gap-3">
   
                <button
                  className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                  onClick={() => {
                    setUserEditError(null);
                    setShowUserEditForm(true);
                    setUserEditForm({
                      email: selectedUser.email,
                      prenom: selectedUser.prenom,
                      nom: selectedUser.nom,
                      id_badge: selectedUser.id_badge || "",
                      taux_horaire: selectedUser.taux_horaire ? String(selectedUser.taux_horaire) : "",
                      password: "",
                      fk_role: selectedUser.fk_role ?? null,
                    });
                  }}
                >
                  Modifier l'utilisateur
                </button>
              </div>

              {showUserEditForm && (
                <div className="rounded-2xl border border-slate-800 bg-slate-800/50 px-4 py-4 text-slate-100">
                  <p className="text-sm font-semibold">Informations utilisateur</p>
                  {userEditError && <p className="mt-2 text-xs text-red-300">{userEditError}</p>}
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input
                      value={userEditForm?.prenom || ""}
                      onChange={(e) => setUserEditForm((p) => (p ? { ...p, prenom: e.target.value } : p))}
                      placeholder="Prénom"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                    />
                    <input
                      value={userEditForm?.nom || ""}
                      onChange={(e) => setUserEditForm((p) => (p ? { ...p, nom: e.target.value } : p))}
                      placeholder="Nom"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                    />
                    <input
                      type="email"
                      value={userEditForm?.email || ""}
                      onChange={(e) => setUserEditForm((p) => (p ? { ...p, email: e.target.value } : p))}
                      placeholder="Email"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 sm:col-span-2"
                    />
                    <input
                      value={userEditForm?.id_badge || ""}
                      onChange={(e) => setUserEditForm((p) => (p ? { ...p, id_badge: e.target.value } : p))}
                      placeholder="ID badge"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                    />
                    <input
                      type="number"
                      value={userEditForm?.taux_horaire || ""}
                      onChange={(e) => setUserEditForm((p) => (p ? { ...p, taux_horaire: e.target.value } : p))}
                      placeholder="Taux horaire (optionnel)"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                    />
                    <input
                      type="password"
                      value={userEditForm?.password || ""}
                      onChange={(e) => setUserEditForm((p) => (p ? { ...p, password: e.target.value } : p))}
                      placeholder="Nouveau mot de passe (optionnel)"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                    />
                    <select
                      value={roleSelection === null ? "" : roleSelection}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        setRoleSelection(val);
                        setUserEditForm((p) => (p ? { ...p, fk_role: val } : p));
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                    >
                      <option value="">Aucun rôle</option>
                      {roles.map((role) => (
                        <option key={role.pk_role} value={role.pk_role}>{role.nom_role}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                      onClick={() => {
                        setShowUserEditForm(false);
                        setUserEditError(null);
                      }}
                      disabled={userEditSaving}
                    >
                      Fermer
                    </button>
                    <button
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                      onClick={handleUserUpdate}
                      disabled={userEditSaving}
                    >
                      {userEditSaving ? "Mise à jour…" : "Mettre à jour"}
                    </button>
                  </div>
                </div>
              )}
         

              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 px-4 py-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Accès aux portes</p>
                  {accessLoading && <span className="text-xs text-slate-400">Chargement…</span>}
                </div>
                {accessError && <p className="mb-2 text-xs text-red-300">{accessError}</p>}
                <div className="flex flex-col gap-2 max-h-64 overflow-auto pr-1">
                  {portes.map((porte) => {
                    const hasRoleAccess = hasRoleAccessToDoor(porte.pk_porte);
                    const hasDirectAccess = hasDirectAccessToDoor(porte.pk_porte);
                    const effectiveAccess = hasRoleAccess || hasDirectAccess;
                    return (
                      <div
                        key={porte.pk_porte}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{porte.titre}</p>
                          {porte.description && <p className="text-xs text-slate-400">{porte.description}</p>}
                          {hasRoleAccess && (
                            <p className="text-[11px] font-semibold text-emerald-300">Accès via rôle</p>
                          )}
                        </div>
                        <button
                          className={`${hasRoleAccess ? "border border-emerald-500 text-emerald-200" : effectiveAccess ? "border border-red-400 text-red-200 hover:bg-red-500 hover:text-white" : "bg-emerald-600 text-white hover:bg-emerald-500"} rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-60`}
                          disabled={savingDoorId === porte.pk_porte || hasRoleAccess}
                          onClick={() => handleToggleDoor(porte.pk_porte, effectiveAccess)}
                        >
                          {savingDoorId === porte.pk_porte
                            ? "…"
                            : hasRoleAccess
                              ? "Via rôle"
                              : effectiveAccess
                                ? "Retirer"
                                : "Ajouter"}
                        </button>
                      </div>
                    );
                  })}
                  {portes.length === 0 && !accessLoading && (
                    <p className="text-xs text-slate-400">Aucune porte définie.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                onClick={() => {
                  setSelectedUser(null);
                  setShowUserEditForm(false);
                  setUserEditError(null);
                  setShowRoleEdit(false);
                }}
              >
                Fermer
              </button>
          {/*     <button
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white opacity-70"
                disabled
              >
                Sauvegarder (à brancher)
              </button> */}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
