ALTER TABLE "Ticket" ADD COLUMN "teamLeader" TEXT NOT NULL DEFAULT '';

-- Se filtra y agrupa por team leader en el panel de admin.
CREATE INDEX "Ticket_teamLeader_idx" ON "Ticket"("teamLeader");
