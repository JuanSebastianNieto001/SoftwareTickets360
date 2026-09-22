-- Explicacion que deja el admin cuando cierra un ticket fuera de los tiempos
-- del SLA. Default '' para no romper los tickets cerrados antes de que
-- existiera el campo (quedan sin justificacion, que es lo correcto: nadie
-- se la pidio en su momento).
ALTER TABLE "Ticket" ADD COLUMN "justificacionSla" TEXT NOT NULL DEFAULT '';
