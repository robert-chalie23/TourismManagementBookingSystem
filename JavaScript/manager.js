
/**
 * Represents a manager who can generate tour reports.
 */
class Manager {

/**
 * Creates a manager profile.
 * @param {number|string} managerId - Manager identifier.
 * @param {string} managerName - Manager's display name.
 */
constructor(managerId, managerName) {

this.managerId = managerId;
this.managerName = managerName;
}

/**
 * Creates the standard tour report status message.
 * @returns {string} A message confirming report generation.
 */
generateReport() {

return "Tour report generated";
}
}