USE db_badge_system;
-- Roles
INSERT INTO t_role (nom_role)
VALUES ('admin'),
    ('employee');
-- Utilisateurs
INSERT INTO t_utilisateur (email, prenom, nom, password, id_badge, fk_role)
VALUES (
        'alice.dupont@example.com',
        'Alice',
        'Dupont',
        'password123',
        1001,
        (
            SELECT pk_role
            FROM t_role
            WHERE nom_role = 'employee'
        )
    ),
    (
        'bob.martin@example.com',
        'Bob',
        'Martin',
        'password123',
        1002,
        (
            SELECT pk_role
            FROM t_role
            WHERE nom_role = 'admin'
        )
    );
-- Portes (identifiant numérique du lecteur)
INSERT INTO t_porte (pk_porte, titre, description)
VALUES (
        1024,
        'Porte Principale',
        'Porte principale du bâtiment'
    );
-- Accès via rôle (les employés peuvent ouvrir la porte 1024)
INSERT INTO tr_role_porte (fk_role, fk_porte)
VALUES (
        (
            SELECT pk_role
            FROM t_role
            WHERE nom_role = 'employee'
        ),
        1024
    );
-- Accès direct utilisateur (donner accès explicite à Alice)
INSERT INTO tr_utilisateur_porte (fk_utilisateur, fk_porte)
VALUES (
        (
            SELECT pk_utilisateur
            FROM t_utilisateur
            WHERE prenom = 'Alice'
                AND nom = 'Dupont'
        ),
        1024
    );
-- Pointage: Alice arrive le matin et part le soir
-- Pointage: Alice arrive le matin et part le soir
-- NOTE: la colonne `date_pointage` est requise dans le schéma, on la met égale à `heure_entree` pour le test
INSERT INTO t_pointage (
        fk_utilisateur,
        date_pointage,
        heure_entree,
        heure_sortie,
        duree_minutes
    )
VALUES (
        (
            SELECT pk_utilisateur
            FROM t_utilisateur
            WHERE prenom = 'Alice'
                AND nom = 'Dupont'
        ),
        '2025-12-15 08:30:00',
        '2025-12-15 08:30:00',
        '2025-12-15 17:15:00',
        525
    );
-- Logs: ouverture de la porte par Alice
INSERT INTO t_logs (action, event_type, fk_utilisateur, fk_porte)
VALUES (
        'ouverture porte',
        'access',
        (
            SELECT pk_utilisateur
            FROM t_utilisateur
            WHERE prenom = 'Alice'
                AND nom = 'Dupont'
        ),
        1024
    );
-- Exemple: pointage enregistrement dans logs
INSERT INTO t_logs (action, event_type, fk_utilisateur)
VALUES (
        'pointage entree',
        'access',
        (
            SELECT pk_utilisateur
            FROM t_utilisateur
            WHERE prenom = 'Alice'
                AND nom = 'Dupont'
        )
    ),
    (
        'pointage sortie',
        'access',
        (
            SELECT pk_utilisateur
            FROM t_utilisateur
            WHERE prenom = 'Alice'
                AND nom = 'Dupont'
        )
    );