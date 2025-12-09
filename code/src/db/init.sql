CREATE DATABASE db_projet;
USE db_projet;

CREATE TABLE t_role (
    pk_role INT PRIMARY KEY AUTO_INCREMENT,
    nom_role VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE t_utilisateur (
    pk_utilisateur INT PRIMARY KEY AUTO_INCREMENT,
    prenom VARCHAR(15) NOT NULL,
    nom VARCHAR(20) NOT NULL,
    id_badge INT NOT NULL UNIQUE,
    date_creation DATE DEFAULT (CURRENT_DATE),
    taux_horaire DECIMAL(6,2) NOT NULL DEFAULT 0,  
    fk_role INT,

    CONSTRAINT unique_client UNIQUE (nom, prenom),
    CONSTRAINT fk_utilisateur_role FOREIGN KEY (fk_role)
        REFERENCES t_role(pk_role)
);

CREATE TABLE t_logs (
    pk_log INT PRIMARY KEY AUTO_INCREMENT,
    action VARCHAR(255) NOT NULL,
    date_action DATETIME DEFAULT CURRENT_TIMESTAMP,
    fk_utilisateur INT,

    CONSTRAINT fk_logs_utilisateur FOREIGN KEY (fk_utilisateur)
        REFERENCES t_utilisateur(pk_utilisateur)
);


CREATE TABLE t_pointage (
    pk_pointage INT PRIMARY KEY AUTO_INCREMENT,
    fk_utilisateur INT NOT NULL,
    heure_entree DATETIME NOT NULL,
    heure_sortie DATETIME DEFAULT NULL,
    duree_minutes INT DEFAULT NULL,   

    CONSTRAINT fk_pointage_utilisateur FOREIGN KEY (fk_utilisateur)
        REFERENCES t_utilisateur(pk_utilisateur)
);

CREATE TABLE t_salaire (
    pk_salaire INT PRIMARY KEY AUTO_INCREMENT,
    fk_utilisateur INT NOT NULL,
    periode VARCHAR(20) NOT NULL,      
    heures_total DECIMAL(6,2) NOT NULL,
    montant DECIMAL(10,2) NOT NULL,    
    date_calcule DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_salaire_utilisateur FOREIGN KEY (fk_utilisateur)
        REFERENCES t_utilisateur(pk_utilisateur)
);


CREATE TABLE t_phidget (
    pk_phidget INT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(50) NOT NULL,       
    description VARCHAR(255)
);
