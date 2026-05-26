# BDS (Bon de Sortie) Module — Claude Code Implementation Prompt

## Context

You are working on a Next.js 14 (App Router) application for TOUBA OIL S.A.U. — a Senegalese petroleum company. The stack is TypeScript, Prisma ORM, PostgreSQL, NextAuth for auth, and shadcn/ui + Tailwind for the frontend. **All UI text must be in French.** All code must be fully type-safe (no `any` unless absolutely unavoidable in Prisma transaction callbacks).

The application already has working modules for EDB (purchase requisitions), ODM (mission orders), and BDC (cash vouchers). The BDS module follows the **exact same patterns** as BDC — same page layout, routing structure, component architecture, and API patterns. Use `app/(utilisateur)/bdc/` as your primary reference for file structure and styling.

---

## 1. PRISMA SCHEMA CHANGES

### 1.1 Add to `enum Role`

```prisma
GARDIEN    // New role: site security, can only mark BDS as completed/returned
```

### 1.2 Add to `enum Access`

```prisma
APPROVE_BDS          // Auto-validate own BDS on creation + validate others' BDS
VIEW_ALL_BDS         // See all BDS across all departments (overrides dept scoping)
CREATE_BDS_MATERIEL  // Can create material/vehicle BDS (access-based, not role-based)
```

### 1.3 New enums

```prisma
enum BDSType {
  PERSONNEL    // Employee exit authorization
  MATERIEL     // Material/vehicle exit authorization
}

enum BDSStatus {
  SUBMITTED    // Awaiting validation
  VALIDATED    // Approved by validator
  COMPLETED    // Gardien confirmed sortie (departure)
  RETURNED     // Gardien confirmed retour (only if heureRetour was set at creation)
  REJECTED     // Rejected by validator
}

enum BDSEventType {
  SUBMITTED
  VALIDATED
  COMPLETED
  RETURNED
  REJECTED
  UPDATED
}
```

### 1.4 Add to `enum NotificationType`

```prisma
BDS_CREATED
BDS_VALIDATED
BDS_COMPLETED
BDS_RETURNED
BDS_REJECTED
```

### 1.5 New models

```prisma
model BonDeSortie {
  id                     Int          @id @default(autoincrement())
  bdsId                  String       @unique  // Format: BDS-2026-001
  type                   BDSType               // PERSONNEL or MATERIEL
  motif                  String                // Reason for exit
  destination            String?               // Where they're going (optional)
  date                   DateTime              // Date of the sortie
  heureSortie            String?               // Planned departure time HH:MM (optional)
  heureRetour            String?               // Planned return time HH:MM (optional)
  heureSortieEffective   String?               // Actual departure time — filled by Gardien
  heureRetourEffective   String?               // Actual return time — filled by Gardien (only if heureRetour was set)
  comment                String?

  // PERSONNEL-specific fields
  employees              Json?                 // Array of {name: string, role: string}

  // MATERIEL-specific fields
  vehicule               String?               // Vehicle reference/plate
  chauffeur              String?               // Driver name
  items                  Json?                 // Array of {quantite: number, designation: string, observations?: string}
  nombreColis            Int?                  // Number of packages

  status                 BDSStatus    @default(SUBMITTED)
  createdAt              DateTime     @default(now())
  updatedAt              DateTime     @updatedAt

  // Relations
  departmentId           Int
  department             Department   @relation(fields: [departmentId], references: [id])
  creatorId              Int
  creator                Employee     @relation("BDSCreator", fields: [creatorId], references: [id])
  userCreatorId          Int
  userCreator            User         @relation("BDSUserCreator", fields: [userCreatorId], references: [id])
  validatorId            Int?
  validator              User?        @relation("BDSValidator", fields: [validatorId], references: [id])
  rejectorId             Int?
  rejector               User?        @relation("BDSRejector", fields: [rejectorId], references: [id])
  completedById          Int?
  completedBy            User?        @relation("BDSCompleter", fields: [completedById], references: [id])
  completedAt            DateTime?
  returnedById           Int?
  returnedBy             User?        @relation("BDSReturner", fields: [returnedById], references: [id])
  returnedAt             DateTime?
  rejectionReason        String?

  notifications          Notification[]
  auditLogs              BonDeSortieAuditLog[]
}

model BonDeSortieAuditLog {
  id             Int            @id @default(autoincrement())
  bonDeSortieId  Int
  bonDeSortie    BonDeSortie    @relation(fields: [bonDeSortieId], references: [id])
  userId         Int
  user           User           @relation(fields: [userId], references: [id])
  eventType      BDSEventType
  eventAt        DateTime       @default(now())
  details        Json?
}
```

### 1.6 Update existing models

**User model** — add these relation fields:

```prisma
createdBds        BonDeSortie[]           @relation("BDSUserCreator")
validatedBds      BonDeSortie[]           @relation("BDSValidator")
rejectedBds       BonDeSortie[]           @relation("BDSRejector")
completedBds      BonDeSortie[]           @relation("BDSCompleter")
returnedBds       BonDeSortie[]           @relation("BDSReturner")
bdsAuditLogs      BonDeSortieAuditLog[]
```

**Employee model** — add:

```prisma
createdBds        BonDeSortie[]           @relation("BDSCreator")
```

**Department model** — add:

```prisma
bds               BonDeSortie[]
```

**Notification model** — add:

```prisma
bonDeSortieId     Int?
bonDeSortie       BonDeSortie?            @relation(fields: [bonDeSortieId], references: [id])
```

### 1.7 Migration

After updating the schema, run:

```bash
npx prisma migrate dev --name added_bds_module
npx prisma generate
```

---

## 2. BACKEND — API ROUTES & UTILS

### 2.1 `app/api/bds/utils/bds-util.ts`

Follow the exact same pattern as `app/api/bdc/utils/bdc-util.ts`. Implement:

- `generateBDSId()` — generates `BDS-YYYY-NNN` sequential IDs (same pattern as `generateBDCId`)
- `createNotification(tx, type, message, recipientIds, bdsId)` — same as BDC but uses `bonDeSortieId`
- `logBDSEvent(tx, bdsId, userId, eventType, details?)` — audit log helper
- `createBDS(input: CreateBDSInput)` — creation logic with auto-validation:
  - If user has `APPROVE_BDS` access → status = `VALIDATED` immediately
  - If user role is `DIRECTEUR`, `DAF`, `DCM`, `DOG`, `DRH`, `DG`, `ADMIN` → status = `VALIDATED`
  - If user role is `RESPONSABLE` → status = `SUBMITTED` (needs director validation)
  - If user role is `USER` → status = `SUBMITTED` (self-request, needs higher-up validation)
  - Send notifications to appropriate validators
- `validateBDS(bdsId, userId, userRole)` — SUBMITTED → VALIDATED
- `rejectBDS(bdsId, userId, rejectionReason)` — SUBMITTED → REJECTED
- `completeBDS(bdsId, userId, heureSortieEffective)` — VALIDATED → COMPLETED (Gardien marks sortie). The `heureSortieEffective` is the actual departure time string (HH:MM or ISO).
- `returnBDS(bdsId, userId, heureRetourEffective)` — COMPLETED → RETURNED (Gardien marks return). **Only allowed if the BDS has `heureRetour` set at creation.** The `heureRetourEffective` is the actual return time.
- `updateBDS(bdsId, userId, data)` — only if status is SUBMITTED
- `deleteBDS(bdsId, userId)` — only if status is SUBMITTED
- `getBDSWithDetails(bdsId, userId, userRole)` — fetch with all relations, respecting access control

**TypeScript types for input:**

```typescript
interface CreateBDSInput {
  type: BDSType;
  motif: string;
  destination?: string;
  date: Date;
  heureSortie?: string;
  heureRetour?: string;
  comment?: string;
  // PERSONNEL fields
  employees?: Array<{ name: string; role: string }>;
  // MATERIEL fields
  vehicule?: string;
  chauffeur?: string;
  items?: Array<{ quantite: number; designation: string; observations?: string }>;
  nombreColis?: number;
  // System fields
  departmentId: number;
  creatorId: number;       // Employee ID
  userCreatorId: number;   // User ID
}
```

### 2.2 `app/api/bds/route.ts`

Follow the exact same pattern as `app/api/bdc/route.ts`. Implement:

**POST** — Create BDS
- Validate with zod schemas
- For `MATERIEL` type: check user has `CREATE_BDS_MATERIEL` access
- For `PERSONNEL` type: any authenticated user can create (self-request or for others if RESPONSABLE+)
- Call `createBDS()`

**GET** — List/fetch BDS
- If `?id=` param → fetch single BDS with details
- Otherwise → paginated list with filters: `page`, `pageSize`, `search`, `timeRange`, `department`, `status`, `type` (PERSONNEL/MATERIEL)
- **Access control for list:**
  - `GARDIEN` → sees ALL BDS across all departments (they're at the gate)
  - `ADMIN`, `DG` → sees all BDS
  - Any user with `VIEW_ALL_BDS` access → sees all BDS
  - `DIRECTEUR`, `DAF`, `DCM`, `DOG`, `DRH` → sees BDS in their department
  - `RESPONSABLE` → sees BDS in their department
  - `USER` → sees only their own BDS
- Include relations: `department`, `creator`, `userCreator`, `validator`, `rejector`, `completedBy`, `returnedBy`, `auditLogs`

**PUT** — Actions via `?id=X&action=Y`
- `action=validate` — validate BDS (requires APPROVE_BDS access OR director+ role in department)
- `action=reject` — reject BDS (same auth as validate)
- `action=complete` — mark as sorti (GARDIEN only). Request body: `{ heureSortieEffective?: string }` (if not provided, use current time)
- `action=return` — mark return (GARDIEN only). Request body: `{ heureRetourEffective?: string }` (if not provided, use current time). **Reject if BDS has no `heureRetour` set.**
- `action=update` — update BDS (creator only, status must be SUBMITTED)

**DELETE** — Delete BDS (ADMIN or creator, status must be SUBMITTED)

### 2.3 `app/api/dashboard/bds-data/route.ts`

Follow the pattern of `app/api/dashboard/bdc-data/route.ts`. Returns KPI counts:
- `total` — total BDS count
- `submitted` — count with status SUBMITTED
- `validated` — count with status VALIDATED
- `completed` — count with status COMPLETED (+ RETURNED)

Apply the same role-based filtering as the main GET route. Accept `timeRange` and `type` (PERSONNEL/MATERIEL) query params.

---

## 3. FRONTEND — PAGE & COMPONENTS

### 3.1 File structure

Create under `app/(utilisateur)/bds/`:

```
app/(utilisateur)/bds/
├── page.tsx              # Main BDS page
├── types/
│   └── bds.ts            # TypeScript types
└── components/
    ├── BDSTableRow.tsx    # Table row component
    ├── BDSDetails.tsx     # Detail card (right panel)
    ├── BDSForm.tsx        # Creation dialog (with tabs for Personnel/Matériel)
    └── BDSKPICards.tsx    # KPI summary cards
```

### 3.2 `app/(utilisateur)/bds/types/bds.ts`

```typescript
import { BDSStatus, BDSType } from "@prisma/client";

export type BDSItem = {
  quantite: number;
  designation: string;
  observations?: string;
};

export type EmployeeInfo = {
  name: string;
  role: string;
};

export type BDS = {
  id: number;
  bdsId: string;
  type: BDSType;
  motif: string;
  destination?: string | null;
  date: string;
  heureSortie?: string | null;
  heureRetour?: string | null;
  heureSortieEffective?: string | null;
  heureRetourEffective?: string | null;
  comment?: string | null;
  employees?: EmployeeInfo[] | null;
  vehicule?: string | null;
  chauffeur?: string | null;
  items?: BDSItem[] | null;
  nombreColis?: number | null;
  status: BDSStatus;
  createdAt: string;
  updatedAt: string;
  departmentId: number;
  department: { id: number; name: string };
  creator: { id: number; name: string; email: string };
  userCreator: { id: number; name: string; email: string };
  validator?: { id: number; name: string; email: string } | null;
  rejector?: { id: number; name: string; email: string } | null;
  completedBy?: { id: number; name: string; email: string } | null;
  returnedBy?: { id: number; name: string; email: string } | null;
  completedAt?: string | null;
  returnedAt?: string | null;
  rejectionReason?: string | null;
  auditLogs?: Array<{
    id: number;
    eventType: string;
    eventAt: string;
    user: { id: number; name: string };
    details?: any;
  }>;
};
```

### 3.3 `app/(utilisateur)/bds/page.tsx` — Main Page

**Clone the exact layout and styling of `app/(utilisateur)/bdc/page.tsx`** with these modifications:

- **Title**: "Bons de Sortie" instead of "Bons de Caisse"
- **Tabs at the top** (using shadcn `Tabs` component): `Personnel` | `Matériel`
  - The active tab determines the `type` query param sent to the API
  - Both the KPI cards and the table filter based on the active tab
- **KPI Cards row** (above the table): 4 small cards showing Total, Soumis, Validé, Complété (Sorti)
  - Fetch from `/api/dashboard/bds-data?timeRange=X&type=Y`
  - Use icons: `FileText` for total, `Clock` for soumis, `CheckCircle` for validé, `LogOut` for complété
- **Below the KPIs**: Same 2/3 + 1/3 grid layout as BDC
  - Left: BDS table with columns: `# ID / Créateur`, `Motif`, `Département`, `Date`, `Statut`
  - Right: BDS detail card when one is selected
- **Filters**: Same as BDC — search, time range, department (for allowed roles), status filter
- **"Nouveau BDS" button**: Opens the BDSForm dialog
- The entire page state (search, filters, pagination) resets when switching tabs

**For the GARDIEN role specifically**: The Gardien sees the same page BUT:
- No "Nouveau BDS" button (they can't create)
- No department filter (they see all departments)
- Default tab shows all types
- The table defaults to showing VALIDATED status BDS (their work queue)

### 3.4 `app/(utilisateur)/bds/components/BDSKPICards.tsx`

A row of 4 compact cards:

```
[Total: 42] [Soumis: 8] [Validé: 12] [Complété: 22]
```

Each card has an icon, label, and count. Use the same card styling as dashboard metric cards but smaller/more compact (similar to how summary stats appear in existing pages). Fetch data from `/api/dashboard/bds-data`.

### 3.5 `app/(utilisateur)/bds/components/BDSForm.tsx`

A dialog form for creating a new BDS. **Inside the dialog**, use tabs to switch between Personnel and Matériel forms:

**Tab: Personnel**
- `motif` (required) — text input: "Motif de la sortie"
- `destination` (optional) — text input
- `date` (required) — date picker, defaults to today
- `heureSortie` (optional) — time input (HH:MM)
- `heureRetour` (optional) — time input (HH:MM)
- `employees` — dynamic array of `{name, role}` (same pattern as BDC employees field). Pre-populate with the current user's name and job title if role is USER (self-request).
- `comment` (optional) — textarea

**Tab: Matériel** (only visible if user has `CREATE_BDS_MATERIEL` access)
- `motif` (required) — text input
- `destination` (optional) — text input
- `date` (required) — date picker
- `heureSortie` (optional) — time input
- `heureRetour` (optional) — time input
- `vehicule` (optional) — text input: "Véhicule (immatriculation)"
- `chauffeur` (optional) — text input: "Chauffeur"
- `items` — dynamic array of `{quantite, designation, observations?}` (similar to BDC expenses but with quantity/designation/observations columns)
- `nombreColis` (optional) — number input: "Nombre de colis"
- `comment` (optional) — textarea

Use zod for validation. The form submits to `POST /api/bds`.

### 3.6 `app/(utilisateur)/bds/components/BDSTableRow.tsx`

Clone from `BDCTableRow.tsx`. Columns:
- `# BDS-ID` + creator name below (smaller text)
- `Motif` (truncated)
- `Département`
- `Date` (formatted)
- `Statut` (using StatusBadge component — see status mapping below)

Status label mapping:
- `SUBMITTED` → "Soumis" (blue)
- `VALIDATED` → "Validé" (green)
- `COMPLETED` → "Sorti" (orange)
- `RETURNED` → "Retourné" (purple)
- `REJECTED` → "Rejeté" (red)

### 3.7 `app/(utilisateur)/bds/components/BDSDetails.tsx`

Clone from `BDCDetails.tsx`. The detail card shows:

**Header**: BDS ID, status badge, type badge (Personnel/Matériel)

**Info section**: Creator, department, date, heureSortie, heureRetour, destination

**Conditional sections based on type:**
- **PERSONNEL**: Employees table (name, role)
- **MATERIEL**: Vehicle info, chauffeur, items table (quantité, désignation, observations), nombre de colis

**Effective times section** (shown only when filled):
- `heureSortieEffective` — "Heure de sortie effective: HH:MM" + who marked it
- `heureRetourEffective` — "Heure de retour effective: HH:MM" + who marked it

**Comment section** (if present)

**Rejection reason** (if rejected, shown in red)

**Approval chain / audit trail**: Show validator, completedBy, returnedBy with names

**Action buttons** (conditional on role + status):

For **validators** (APPROVE_BDS access or director+ roles):
- "Valider" button — when status is SUBMITTED → opens confirm dialog
- "Rejeter" button — when status is SUBMITTED → opens reject dialog with reason textarea

For **GARDIEN** role:
- "Marquer comme sortie" button — when status is VALIDATED → opens dialog with **3 buttons**:
  - "Annuler" — closes dialog
  - "Valider (heure/date)" — shows date+time picker, then submits with custom time
  - "Valider maintenant" — submits with current timestamp
- "Marquer le retour" button — when status is COMPLETED **AND** the BDS has `heureRetour` set → opens similar dialog with 3 buttons (Annuler, Valider heure/date, Valider maintenant)

For **creator** (when status is SUBMITTED):
- "Modifier" / "Supprimer" buttons

For **ADMIN**:
- "Supprimer" button (always available)

---

## 4. NAVIGATION & ROUTING

### 4.1 `lib/menu-list.ts`

Add BDS menu item to ALL menu lists (admin, management, magasinier, user):

```typescript
{
  href: "/bds",
  label: "Bons de sortie",
  active: pathname.includes("/bds"),
  icon: LogOut,  // from lucide-react (or DoorOpen)
  submenus: []
}
```

Place it right after the "Bons de caisse" entry in each menu list.

### 4.2 Create `getGardienMenuList` in `lib/menu-list.ts`

The Gardien gets a minimal menu with ONLY the BDS page:

```typescript
export function getGardienMenuList(pathname: string): Group[] {
  return [
    {
      menus: [
        {
          href: "/bds",
          label: "Bons de sortie",
          active: pathname.includes("/bds"),
          icon: LogOut,
          submenus: []
        },
      ]
    },
  ];
}
```

### 4.3 Update `app/hooks/use-allowed-roles.ts`

Add `GARDIEN` handling. The Gardien should NOT be in `allowedReadRoles` (no admin dashboard). Add a new flag:

```typescript
const gardienRoles = ["GARDIEN"];
return {
  // ... existing flags ...
  hasGardienAccess: session?.user?.role && gardienRoles.includes(session.user.role as string),
};
```

### 4.4 Update `components/user-panel/menu.tsx`

Add the Gardien menu list to the menu selection logic:

```typescript
const menuList = hasReadAccess
  ? getAdminMenuList(pathname)
  : hasMagasinierAccess
  ? getMagasinierMenuList(pathname)
  : hasGardienAccess
  ? getGardienMenuList(pathname)
  : getUserMenuList(pathname);
```

### 4.5 Update `app/api/auth/[...nextauth]/auth-options.ts`

The session callbacks already pass `role` and `access`. No changes needed here, but verify the Gardien role is handled correctly in the `isSimpleUser` logic — a Gardien IS a simple user (limited access).

---

## 5. ACCESS CONTROL SUMMARY (for reference during implementation)

### Who can CREATE:
- **BDS Personnel**: Any authenticated user (USER can self-request; RESPONSABLE+ can create for others)
- **BDS Matériel**: Only users with `CREATE_BDS_MATERIEL` access
- **GARDIEN**: Cannot create any BDS

### Who can VIEW:
- `USER`, `RESPONSABLE` → only their own BDS
- `DIRECTEUR`, `DAF`, `DCM`, `DOG`, `DRH` → all BDS in their department
- `DG`, `ADMIN` → all BDS across all departments
- `GARDIEN` → all BDS across all departments (needs to see them to process)
- Any user with `VIEW_ALL_BDS` → all BDS across all departments
- A user with `APPROVE_BDS` + `VIEW_ALL_BDS` → effectively same power as admin/DG

### Who can VALIDATE/REJECT:
- Users with `APPROVE_BDS` access
- `DIRECTEUR`, `DAF`, `DCM`, `DOG`, `DRH` (within their department scope)
- `DG`, `ADMIN` (any BDS)

### Auto-validation on creation:
- Users with `APPROVE_BDS` access → BDS created with status = VALIDATED
- `DIRECTEUR`, `DAF`, `DCM`, `DOG`, `DRH`, `DG`, `ADMIN` → BDS created with status = VALIDATED

### Who can COMPLETE (mark sortie) / RETURN (mark retour):
- **GARDIEN only** — this is their sole function in the app

---

## 6. ADDITIONAL NOTES

- **StatusBadge component**: Reuse `app/dashboard/etats/components/StatusBadge.tsx`. Add BDS status mappings to it, or create a local status badge helper in the BDS components. The status labels and colors are:
  - SUBMITTED → "Soumis" (blue)
  - VALIDATED → "Validé" (green)
  - COMPLETED → "Sorti" (orange)
  - RETURNED → "Retourné" (purple)
  - REJECTED → "Rejeté" (red)

- **Notification messages**: Add BDS notification message generation to `app/api/utils/notificationMessage.ts` following the existing pattern for BDC/ODM/EDB.

- **Time format**: All time fields (`heureSortie`, `heureRetour`, `heureSortieEffective`, `heureRetourEffective`) are stored as strings in `HH:MM` format.

- **ID generation**: `BDS-YYYY-NNN` format, same sequential logic as `BDC-YYYY-NNN` in `generateBDCId()`.

- **Gardien "Valider maintenant" vs "Valider (heure/date)"**: "Valider maintenant" captures `new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })` and sends it. "Valider (heure/date)" opens inline date+time pickers and sends the user-selected value.

- **Return tracking**: The "Marquer le retour" button on a COMPLETED BDS should ONLY be visible/enabled if the original `heureRetour` field was set during creation. If no return time was planned, the BDS stays at COMPLETED as its final state.

- **Do NOT create a separate Gardien page.** The Gardien uses the same `/bds` page — the page conditionally hides/shows UI elements based on the `GARDIEN` role (no create button, no department filter, defaults to VALIDATED status filter).

- **All toast messages, dialog titles, button labels, form labels, placeholders, and error messages must be in French.**

- **Responsive design**: Follow the same responsive patterns as the BDC page. On mobile, the detail panel becomes a dialog/modal (same as BDC).
