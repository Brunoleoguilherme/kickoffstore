/** Minimum staff roles (see CLAUDE.md "Regras de autenticação e autorização"). */
export const STAFF_ROLE_CODES = [
  'customer',
  'support',
  'warehouse',
  'catalog',
  'finance',
  'fiscal',
  'manager',
  'admin',
] as const

export type RoleCode = (typeof STAFF_ROLE_CODES)[number]

/** Granular permissions (see docs/05-seguranca-lgpd.md §5). */
export const PERMISSION_CODES = [
  'users.manage',
  'roles.manage',
  'customers.read',
  'catalog.read',
  'catalog.write',
  'catalog.publish',
  'inventory.read',
  'inventory.move',
  'inventory.adjust',
  'orders.read',
  'orders.manage',
  'orders.cancel',
  'finance.read',
  'finance.reconcile',
  'refunds.approve',
  'fiscal.read',
  'fiscal.issue',
  'fiscal.cancel',
  'audit.read',
] as const

export type PermissionCode = (typeof PERMISSION_CODES)[number]
