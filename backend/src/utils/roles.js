const ROLE_USER = 'USER';
const ROLE_DRIVER = 'DRIVER';
const ROLE_ADMIN = 'ADMIN';

function isAdminUser(user) {
  return !!user && (user.role === ROLE_ADMIN || user.isAdmin === true);
}

module.exports = {
  ROLE_USER,
  ROLE_DRIVER,
  ROLE_ADMIN,
  isAdminUser,
};
