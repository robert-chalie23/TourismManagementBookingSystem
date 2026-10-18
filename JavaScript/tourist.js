
/**
 * Stores a user's identity and private contact email.
 */
class User {

#email;

/**
 * Creates a user profile.
 * @param {number|string} id - User identifier.
 * @param {string} name - User's display name.
 * @param {string} email - User's contact email address.
 */
constructor(id, name, email) {

this.id = id;
this.name = name;
this.#email = email;
}

/**
 * Returns the user's contact email address.
 * @returns {string} The current email address.
 */
getEmail() {
return this.#email;
}

/**
 * Replaces the user's contact email address.
 * @param {string} newEmail - The replacement email address.
 * @returns {void}
 */
setEmail(newEmail) {
this.#email = newEmail;
}
}

/**
 * Represents a tourist user with a contact phone number.
 */
class Tourist extends User {

/**
 * Creates a tourist profile.
 * @param {number|string} id - Tourist identifier.
 * @param {string} name - Tourist's display name.
 * @param {string} email - Tourist's contact email address.
 * @param {string} phone - Tourist's contact phone number.
 */
constructor(id, name, email, phone) {
super(id, name, email);
this.phone = phone;
}

/**
 * Returns the tourist's display name for their profile.
 * @returns {string} The tourist's name.
 */
viewProfile() {
return this.name;
}
}