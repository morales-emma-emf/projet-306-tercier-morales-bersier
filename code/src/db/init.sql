CREATE DATABASE elouantercier_badge_system;
USE elouantercier_badge_system;
CREATE TABLE t_role (
    pk_role INT PRIMARY KEY AUTO_INCREMENT,
    nom_role VARCHAR(30) NOT NULL UNIQUE
);
CREATE TABLE t_utilisateur (
    pk_utilisateur INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(50) NOT NULL UNIQUE,
    prenom VARCHAR(15) NOT NULL,
    nom VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    id_badge VARCHAR(50) NOT NULL UNIQUE,
    date_creation DATE DEFAULT (CURRENT_DATE),
    taux_horaire DECIMAL(6, 2) NOT NULL DEFAULT 0,
    fk_role INT,
    CONSTRAINT unique_client UNIQUE (nom, prenom),
    CONSTRAINT fk_utilisateur_role FOREIGN KEY (fk_role) REFERENCES t_role(pk_role)
);
CREATE TABLE t_porte (
    pk_porte INT PRIMARY KEY AUTO_INCREMENT,
    titre VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    token_auth VARCHAR(100) DEFAULT NULL
);
CREATE TABLE t_logs (
    pk_log INT PRIMARY KEY AUTO_INCREMENT,
    action VARCHAR(255) NOT NULL,
    event_type ENUM('info', 'warning', 'error', 'access') NOT NULL DEFAULT 'info',
    date_action DATETIME DEFAULT CURRENT_TIMESTAMP,
    fk_utilisateur INT,
    fk_porte INT DEFAULT NULL,
    CONSTRAINT fk_logs_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES t_utilisateur(pk_utilisateur),
    CONSTRAINT fk_logs_porte FOREIGN KEY (fk_porte) REFERENCES t_porte(pk_porte)
);
CREATE TABLE t_pointage (
    pk_pointage INT PRIMARY KEY AUTO_INCREMENT,
    fk_utilisateur INT NOT NULL,
    date_pointage DATETIME NOT NULL,
    heure_entree DATETIME NOT NULL,
    heure_sortie DATETIME DEFAULT NULL,
    duree_minutes INT DEFAULT NULL,
    CONSTRAINT fk_pointage_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES t_utilisateur(pk_utilisateur)
);
CREATE TABLE t_salaire (
    pk_salaire INT PRIMARY KEY AUTO_INCREMENT,
    fk_utilisateur INT NOT NULL,
    periode VARCHAR(20) NOT NULL,
    heures_total DECIMAL(6, 2) NOT NULL,
    montant DECIMAL(10, 2) NOT NULL,
    date_calcule DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_salaire_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES t_utilisateur(pk_utilisateur)
);
CREATE TABLE tr_role_porte (
    fk_role INT NOT NULL,
    fk_porte INT NOT NULL,
    CONSTRAINT pk_role_porte PRIMARY KEY (fk_role, fk_porte),
    CONSTRAINT fk_role_porte_role FOREIGN KEY (fk_role) REFERENCES t_role(pk_role) ON DELETE CASCADE,
    CONSTRAINT fk_role_porte_porte FOREIGN KEY (fk_porte) REFERENCES t_porte(pk_porte) ON DELETE CASCADE
);
CREATE TABLE tr_utilisateur_porte (
    fk_utilisateur INT NOT NULL,
    fk_porte INT NOT NULL,
    CONSTRAINT pk_utilisateur_porte PRIMARY KEY (fk_utilisateur, fk_porte),
    CONSTRAINT fk_utilisateur_porte_user FOREIGN KEY (fk_utilisateur) REFERENCES t_utilisateur(pk_utilisateur) ON DELETE CASCADE,
    CONSTRAINT fk_utilisateur_porte_porte FOREIGN KEY (fk_porte) REFERENCES t_porte(pk_porte) ON DELETE CASCADE
);