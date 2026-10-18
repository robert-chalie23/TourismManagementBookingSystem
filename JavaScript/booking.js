/**
 * Represents a validated tour booking request.
 * @class
 * @property {string} name - Customer's full name.
 * @property {string} email - Customer's email address.
 * @property {string} phone - Customer's contact phone number.
 * @property {string} date - Requested tour date in YYYY-MM-DD format.
 * @property {string} tour - Name of the selected tour.
 * @property {string} createdAt - ISO timestamp when the request was created.
 */
class Booking {

/**
 * Creates a booking record from the customer's submitted details.
 * @param {string} name - Customer's full name.
 * @param {string} email - Customer's email address.
 * @param {string} phone - Customer's contact phone number.
 * @param {string} date - Requested tour date in YYYY-MM-DD format.
 * @param {string} tour - Name of the selected tour.
 */
constructor(name, email, phone, date, tour) {

this.name = name;
this.email = email;
this.phone = phone;
this.date = date;
this.tour = tour;
this.createdAt = new Date().toISOString();
}

/**
 * Creates the confirmation text shown after a booking is saved.
 * @returns {string} A readable summary of this booking request.
 */
bookingSummary() {

return `
Booking request saved on this device

Name: ${this.name}
Email: ${this.email}
Phone: ${this.phone}
Tour: ${this.tour}
Date: ${this.date}
This is a request only; contact the tour provider to confirm.
`;
}
}

/**
 * Selects a tour in the booking form and moves focus to that form.
 * @param {string} tourName - Name of the tour selected by the user.
 * @returns {void}
 */
function selectTour(tourName){

const selectedTour = document.getElementById("selectedTour");
selectedTour.value = tourName;
const output = document.getElementById("output");
output.textContent = "";
output.classList.remove("booking-error");
document.getElementById("bookingData").hidden = true;
document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
selectedTour.focus({ preventScroll: true });
}

// Make each tour card select that tour when its button is clicked.
document.querySelectorAll(".tour-select").forEach(function(card){

card.addEventListener("click", function(){
selectTour(card.dataset.tour);
});
});

// Open the browser database used to keep custom tour photos between visits.
const photoDatabase = new Promise(function(resolve, reject){
const request = indexedDB.open("vanuatu-tour-photos", 1);

request.onupgradeneeded = function(){
request.result.createObjectStore("tourPhotos", { keyPath: "tour" });
};
request.onsuccess = function(){
resolve(request.result);
};
request.onerror = function(){
reject(request.error);
};
});

/**
 * Updates a tour card with a selected image and descriptive alt text.
 * @param {HTMLElement} card - Tour card whose photo should be replaced.
 * @param {File} file - Image file to preview.
 * @returns {void}
 */
function displayTourPhoto(card, file){
const photo = card.querySelector(".tour-photo");

// Release the previous preview URL before creating a new one to avoid leaking memory.
if (photo.dataset.objectUrl) {
URL.revokeObjectURL(photo.dataset.objectUrl);
}

photo.dataset.objectUrl = URL.createObjectURL(file);
photo.src = photo.dataset.objectUrl;
photo.alt = "User-selected photo for " + card.dataset.tourCard;
}

/**
 * Finds the photo upload control associated with a tour.
 * @param {string} tourName - Tour name used to identify its upload control.
 * @returns {Element|undefined} Matching control, or undefined if none exists.
 */
function findPhotoControl(tourName){
return Array.from(document.querySelectorAll(".photo-control"))
.find(function(control){
return control.dataset.tourControl === tourName;
});
}

// Restore saved photos and their status labels when the page loads.
photoDatabase.then(function(database){
const request = database.transaction("tourPhotos", "readonly")
.objectStore("tourPhotos")
.getAll();

request.onsuccess = function(){
request.result.forEach(function(savedPhoto){
const card = Array.from(document.querySelectorAll(".tour-card"))
.find(function(item){
return item.dataset.tourCard === savedPhoto.tour;
});

if (card) {
displayTourPhoto(card, savedPhoto.image);
}

const control = findPhotoControl(savedPhoto.tour);
if (control) {
control.querySelector(".photo-status").textContent = "Saved on this device";
}
});
};
}).catch(function(){
document.querySelectorAll(".photo-control .photo-status").forEach(function(status){
status.textContent = "Photo storage is unavailable in this browser";
});
});

// Validate selected images before saving them to local browser storage.
document.querySelectorAll(".image-input").forEach(function(input){
input.addEventListener("change", async function(){
const file = input.files[0];
const tourName = input.dataset.tour;
const card = Array.from(document.querySelectorAll(".tour-card"))
.find(function(item){
return item.dataset.tourCard === tourName;
});

const status = input.closest(".photo-control").querySelector(".photo-status");

if (!file) {
return;
}

if (!file.type.startsWith("image/")) {
status.textContent = "Choose an image file";
input.value = "";
return;
}

if (file.size > 10 * 1024 * 1024) {
status.textContent = "Choose an image smaller than 10 MB";
input.value = "";
return;
}

// Keep the user informed when browser storage is unavailable or the image save fails.
try {
const database = await photoDatabase;
const transaction = database.transaction("tourPhotos", "readwrite");
transaction.objectStore("tourPhotos").put({
tour: tourName,
image: file
});

await new Promise(function(resolve, reject){
transaction.oncomplete = resolve;
transaction.onerror = function(){
reject(transaction.error);
};
transaction.onabort = function(){
reject(transaction.error);
};
});

displayTourPhoto(card, file);
status.textContent = "Saved on this device";
} catch (error) {
status.textContent = "Could not save this image in the browser";
}

input.value = "";
});
});

// Prevent booking dates earlier than the user's current local date.
const dateInput = document.getElementById("date");
const today = new Date();
dateInput.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

// Cache form elements because validation and submission use them repeatedly.
const bookingForm = document.getElementById("bookingForm");
const output = document.getElementById("output");
const bookingData = document.getElementById("bookingData");
const bookingJson = document.getElementById("bookingJson");
const bookingStorageKey = "vanuatuTourBookings";
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const tourInput = document.getElementById("selectedTour");
const availableTours = Array.from(document.querySelectorAll(".tour-select"))
    .map(function(button) {
        return button.dataset.tour;
    });

// Regular expressions define which names, email addresses and phone numbers are accepted.
/**
 * Checks whether a name uses accepted letters and punctuation and is 2-60 characters long.
 * @param {string} value - Trimmed name to validate.
 * @returns {boolean} True when the name matches the accepted format.
 */
function validateName(value) {
    return /^[\p{L}][\p{L}\p{M}' -]{1,59}$/u.test(value);
}

/**
 * Checks whether an email address has a valid basic email structure.
 * @param {string} value - Trimmed email address to validate.
 * @returns {boolean} True when the address matches the accepted format.
 */
function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(value);
}

/**
 * Checks the phone number's allowed characters and digit count.
 * @param {string} value - Trimmed phone number to validate.
 * @returns {boolean} True when it contains 7-15 digits and only allowed formatting.
 */
function validatePhone(value) {
    const digits = value.replace(/\D/g, "");
    return /^\+?[0-9][0-9\s().-]*$/.test(value) &&
        digits.length >= 7 &&
        digits.length <= 15;
}

/**
 * Sets or clears the browser's custom validation message for an input.
 * @param {HTMLInputElement} input - Form control receiving the message.
 * @param {string} message - Message to display, or an empty string to clear it.
 * @returns {void}
 */
function setValidationMessage(input, message) {
    input.setCustomValidity(message);
}

// Update browser-native validation feedback as the user edits each field.
nameInput.addEventListener("input", function() {
    const value = nameInput.value.trim();
    setValidationMessage(
        nameInput,
        value && !validateName(value)
            ? "Enter a name using letters, spaces, apostrophes or hyphens (2-60 characters)."
            : ""
    );
});

emailInput.addEventListener("input", function() {
    const value = emailInput.value.trim();
    setValidationMessage(
        emailInput,
        value && !validateEmail(value)
            ? "Enter a valid email address."
            : ""
    );
});

phoneInput.addEventListener("input", function() {
    const value = phoneInput.value.trim();
    setValidationMessage(
        phoneInput,
        value && !validatePhone(value)
            ? "Enter a phone number with 7-15 digits; +, spaces, parentheses, dots and hyphens are allowed."
            : ""
    );
});

tourInput.addEventListener("input", function() {
    setValidationMessage(
        tourInput,
        tourInput.value && !availableTours.includes(tourInput.value)
            ? "Choose a destination using one of the tour cards above."
            : ""
    );
});

/**
 * Reads saved booking records from localStorage.
 * @returns {Booking[]} Previously saved booking objects, or an empty array.
 * @throws {Error} If storage cannot be read or does not contain a JSON array.
 */
function readStoredBookings() {
    // Guard against corrupt localStorage data so the form still behaves predictably.
    try {
        const storedValue = localStorage.getItem(bookingStorageKey);
        if (storedValue === null) {
            return [];
        }

        const bookings = JSON.parse(storedValue);
        if (!Array.isArray(bookings)) {
            throw new Error("Saved booking data is not a JSON array.");
        }

        return bookings;
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown storage error.";
        throw new Error("Saved booking data could not be read. " + message);
    }
}

/**
 * Adds a booking to the JSON array in localStorage.
 * @param {Booking} booking - Validated booking record to save.
 * @returns {void}
 * @throws {Error} If existing data cannot be read or storage fails.
 */
function saveBookingRequest(booking) {
    // Store the latest booking as JSON so the app can recover it later without a backend.
    try {
        const bookings = readStoredBookings();
        bookings.push(booking);
        localStorage.setItem(bookingStorageKey, JSON.stringify(bookings, null, 2));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown storage error.";
        throw new Error("Your booking could not be saved in this browser: " + message);
    }
}

// Stop normal form navigation, validate the request, save it, and show the result.
document
.getElementById("bookingForm")
.addEventListener("submit", function(event){

    event.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const date = dateInput.value;
    const tour = tourInput.value.trim();

    // Validate each field before creating the booking object.
    setValidationMessage(nameInput, !validateName(name)
        ? "Enter a name using letters, spaces, apostrophes or hyphens (2-60 characters)."
        : "");
    setValidationMessage(emailInput, !validateEmail(email)
        ? "Enter a valid email address."
        : "");
    setValidationMessage(phoneInput, !validatePhone(phone)
        ? "Enter a phone number with 7-15 digits; +, spaces, parentheses, dots and hyphens are allowed."
        : "");
    setValidationMessage(dateInput, !date || date < dateInput.min
        ? "Choose today or a future date."
        : "");
    setValidationMessage(tourInput, !availableTours.includes(tour)
        ? "Choose a destination using one of the tour cards above."
        : "");

    if (!bookingForm.reportValidity()) {
        return;
    }

    const booking = new Booking(name, email, phone, date, tour);
    try {
        saveBookingRequest(booking);
    } catch (error) {
        output.classList.add("booking-error");
        output.textContent = error instanceof Error
            ? error.message
            : "Could not save your booking request in this browser. Please try again.";
        bookingData.hidden = true;
        return;
    }

    output.classList.remove("booking-error");
    output.textContent = booking.bookingSummary();
    bookingJson.textContent = JSON.stringify(booking, null, 2);
    bookingData.hidden = false;
});