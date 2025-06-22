/*
  Warnings:

  - The primary key for the `Imagen` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `descripcion` on the `Imagen` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Imagen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "fechaSubida" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Imagen" ("fechaSubida", "id", "url") SELECT "fechaSubida", "id", "url" FROM "Imagen";
DROP TABLE "Imagen";
ALTER TABLE "new_Imagen" RENAME TO "Imagen";
CREATE UNIQUE INDEX "Imagen_url_key" ON "Imagen"("url");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
