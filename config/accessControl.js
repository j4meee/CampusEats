export const USER_ROLES = ["student", "vendor", "admin"];

export const USER_STATUSES = ["active", "pending", "disabled"];

export const VENDOR_STAFF_TYPES = ["cashier", "chef"];

export const PRIVILEGES = {
  VIEW_MENU: "view_menu",
  MANAGE_MENU: "manage_menu",
  PLACE_ORDERS: "place_orders",
  VIEW_OWN_ORDERS: "view_own_orders",
  MANAGE_ORDERS: "manage_orders",
  VIEW_VENDOR_DASHBOARD: "view_vendor_dashboard",
  VIEW_ADMIN_DASHBOARD: "view_admin_dashboard",
  MANAGE_USERS: "manage_users",
  MANAGE_ACCESS_CONTROL: "manage_access_control",
};

export const ROLE_PRIVILEGES = {
  student: [
    PRIVILEGES.VIEW_MENU,
    PRIVILEGES.PLACE_ORDERS,
    PRIVILEGES.VIEW_OWN_ORDERS,
  ],
  vendor: [
    PRIVILEGES.VIEW_MENU,
    PRIVILEGES.MANAGE_MENU,
    PRIVILEGES.MANAGE_ORDERS,
    PRIVILEGES.VIEW_VENDOR_DASHBOARD,
  ],
  admin: Object.values(PRIVILEGES),
};

export const getRolePrivileges = (role) => ROLE_PRIVILEGES[role] || [];

export const hasPrivilege = (role, privilege) => getRolePrivileges(role).includes(privilege);
