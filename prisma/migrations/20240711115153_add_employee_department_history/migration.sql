-- Step 1: Add EmployeeStatus enum and status field
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
ALTER TABLE "Employee" ADD COLUMN "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE';

-- Step 2: Rename departmentId to currentDepartmentId
ALTER TABLE "Employee" RENAME COLUMN "departmentId" TO "currentDepartmentId";

-- Step 3: Create EmployeeDepartmentHistory table
CREATE TABLE "EmployeeDepartmentHistory" (
  "id" SERIAL PRIMARY KEY,
  "employeeId" INTEGER NOT NULL,
  "departmentId" INTEGER NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endDate" TIMESTAMP(3),
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id"),
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
);

-- Step 4: Populate EmployeeDepartmentHistory with current data
INSERT INTO "EmployeeDepartmentHistory" ("employeeId", "departmentId", "startDate")
SELECT "id", "currentDepartmentId", CURRENT_TIMESTAMP FROM "Employee";

-- Optional: Update the relation name in Department if necessary
-- This might not be needed depending on how Prisma handles relation names
-- ALTER TABLE "Department" RENAME CONSTRAINT "Department_employees_fkey" TO "Department_currentEmployees_fkey";