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
