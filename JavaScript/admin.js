
/**
 * Represents an administrator with user-management capabilities.
 * @extends User
 */
class Admin extends User {

/**
 * Creates an administrator profile.
 * @param {number|string} id - Administrator identifier.
 * @param {string} name - Administrator's display name.
 * @param {string} email - Administrator's contact email address.
 */
constructor(id, name, email) {
super(id, name, email);
}

/**
 * Returns the status message for the user-management action.
 * @returns {string} A message confirming the management action.
 */
manageUsers() {

return "Admin is managing users";
}
}