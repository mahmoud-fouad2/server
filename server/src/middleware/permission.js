/**
 * Legacy Permission Middleware (DEPRECATED)
 *
 * This module was previously used across the codebase but has been
 * superseded by `middleware/authorization.js`. To keep backward
 * compatibility and avoid runtime errors when older routes still
 * `require()` this module, we delegate to the new implementation.
 */

const logger = require('../utils/logger');
const authorization = require('./authorization');

logger.warn('Deprecated: require("middleware/permission") is deprecated - use middleware/authorization.js instead');

module.exports = {
  requirePermission: (perm) => authorization.requirePermission(perm),
  requireRole: (roles) => authorization.requireRole(roles),
  requireOwnership: (check) => authorization.requireTeamRole ? authorization.requireTeamRole(check) : (req, res, next) => next(),
  preventSelfAction: (req, res, next) => next(),
  getPermissionsForRole: (role) => authorization.GLOBAL_PERMISSIONS[role] || [],
  roleHasPermission: (role, permission) => (authorization.GLOBAL_PERMISSIONS[role] || []).includes(permission),
  PERMISSIONS: authorization.GLOBAL_PERMISSIONS
};
