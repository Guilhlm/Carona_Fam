export const ROLE_USER = 'USER';
export const ROLE_DRIVER = 'DRIVER';
export const ROLE_ADMIN = 'ADMIN';

export function isAdminUser(user) {
  return !!user && (user.role === ROLE_ADMIN || user.isAdmin === true);
}
