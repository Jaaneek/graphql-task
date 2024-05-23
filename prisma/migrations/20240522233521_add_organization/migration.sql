/*
  Warnings:

  - Added the required column `organizationId` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Organization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfJoining" DATETIME NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "salary" REAL NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "Employee_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Employee" ("dateOfBirth", "dateOfJoining", "department", "firstName", "id", "lastName", "salary", "title") SELECT "dateOfBirth", "dateOfJoining", "department", "firstName", "id", "lastName", "salary", "title" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
PRAGMA foreign_key_check("Employee");
PRAGMA foreign_keys=ON;
