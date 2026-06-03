-- Habilitar extensión btree_gist para soportar exclusiones avanzadas
-- (ej. prevención de double-booking en citas médicas)
CREATE EXTENSION IF NOT EXISTS btree_gist;
