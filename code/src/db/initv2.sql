CREATE DATABASE elouantercier_badge_system DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_general_ci;
ALTER DATABASE elouantercier_badge_system CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE elouantercier_badge_system;
CREATE TABLE t_role (
    pk_role INT PRIMARY KEY AUTO_INCREMENT,
    nom_role VARCHAR(30) NOT NULL UNIQUE
) ENGINE = InnoDB;
CREATE TABLE t_utilisateur (
    pk_utilisateur INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(50) NOT NULL UNIQUE,
    prenom VARCHAR(15) NOT NULL,
    nom VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    id_badge VARCHAR(50) NOT NULL UNIQUE,
    date_creation DATE DEFAULT CURRENT_DATE,
    taux_horaire DECIMAL(6, 2) DEFAULT 0,
    fk_role INT,
    CONSTRAINT fk_utilisateur_role FOREIGN KEY (fk_role) REFERENCES t_role(pk_role)
) ENGINE = InnoDB;
CREATE TABLE t_porte (
    pk_porte INT PRIMARY KEY,
    titre VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    token_auth VARCHAR(100) DEFAULT NULL
) ENGINE = InnoDB;
CREATE TABLE t_logs (
    pk_log INT PRIMARY KEY AUTO_INCREMENT,
    action VARCHAR(255) NOT NULL,
    event_type ENUM('info', 'warning', 'error', 'access') NOT NULL DEFAULT 'info',
    date_action DATETIME DEFAULT CURRENT_TIMESTAMP,
    fk_utilisateur INT,
    fk_porte INT DEFAULT NULL,
    CONSTRAINT fk_logs_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES t_utilisateur(pk_utilisateur),
    CONSTRAINT fk_logs_porte FOREIGN KEY (fk_porte) REFERENCES t_porte(pk_porte)
) ENGINE = InnoDB;
CREATE TABLE t_pointage (
    pk_pointage INT PRIMARY KEY AUTO_INCREMENT,
    fk_utilisateur INT NOT NULL,
    date_pointage DATETIME NOT NULL,
    heure_entree DATETIME NOT NULL,
    heure_sortie DATETIME DEFAULT NULL,
    duree_minutes INT DEFAULT NULL,
    CONSTRAINT fk_pointage_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES t_utilisateur(pk_utilisateur)
) ENGINE = InnoDB;
CREATE TABLE t_salaire (
    pk_salaire INT PRIMARY KEY AUTO_INCREMENT,
    fk_utilisateur INT NOT NULL,
    periode VARCHAR(20) NOT NULL,
    heures_total DECIMAL(6, 2) NOT NULL,
    montant DECIMAL(10, 2) NOT NULL,
    date_calcule DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_salaire_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES t_utilisateur(pk_utilisateur)
) ENGINE = InnoDB;
CREATE TABLE tr_role_porte (
    fk_role INT NOT NULL,
    fk_porte INT NOT NULL,
    CONSTRAINT pk_role_porte PRIMARY KEY (fk_role, fk_porte),
    CONSTRAINT fk_role_porte_role FOREIGN KEY (fk_role) REFERENCES t_role(pk_role) ON DELETE CASCADE,
    CONSTRAINT fk_role_porte_porte FOREIGN KEY (fk_porte) REFERENCES t_porte(pk_porte) ON DELETE CASCADE
) ENGINE = InnoDB;
CREATE TABLE tr_utilisateur_porte (
    fk_utilisateur INT NOT NULL,
    fk_porte INT NOT NULL,
    CONSTRAINT pk_utilisateur_porte PRIMARY KEY (fk_utilisateur, fk_porte),
    CONSTRAINT fk_utilisateur_porte_user FOREIGN KEY (fk_utilisateur) REFERENCES t_utilisateur(pk_utilisateur) ON DELETE CASCADE,
    CONSTRAINT fk_utilisateur_porte_porte FOREIGN KEY (fk_porte) REFERENCES t_porte(pk_porte) ON DELETE CASCADE
) ENGINE = InnoDB;
INSERT INTO t_role (nom_role)
VALUES ('admin'),
    ('employee'),
    ('guest');
-- Utilisateurs
INSERT INTO `t_utilisateur` (
        `pk_utilisateur`,
        `email`,
        `prenom`,
        `nom`,
        `password`,
        `id_badge`,
        `date_creation`,
        `taux_horaire`,
        `fk_role`
    )
VALUES (
        1,
        'admin@test.ch',
        'elouan',
        'tercier',
        '$2b$10$tLj0PkxajsJTjYRjcp4Js.7ajtkGO9d8OHEAbGEwqiHN5d.RGqpFu',
        '5f00d0d997',
        '2025-12-15',
        0.00,
        1
    );