/*
  Warnings:

  - You are about to drop the column `name` on the `Imagen` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Imagen" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaSubida" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Imagen" ("descripcion", "fechaSubida", "id", "url") SELECT "descripcion", "fechaSubida", "id", "url" FROM "Imagen";
DROP TABLE "Imagen";
ALTER TABLE "new_Imagen" RENAME TO "Imagen";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
