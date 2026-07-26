-- Migration 001: Ajouter la colonne 'annee' à la table 'projets'
-- Date: 2026-07-26
-- Description: Ajout de la colonne année pour tracker l'année des projets

-- Ajouter la colonne 'annee' à la table 'projets'
ALTER TABLE projets ADD COLUMN annee INT DEFAULT NULL AFTER unite;

-- Créer un index sur la colonne annee pour les recherches
CREATE INDEX idx_annee ON projets(annee);

-- Afficher la structure mise à jour
DESCRIBE projets;
