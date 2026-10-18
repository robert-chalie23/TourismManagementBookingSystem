const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const javascriptDirectory = path.join(__dirname, "..", "JavaScript");

function loadScripts(context, fileNames) {
    fileNames.forEach(function(fileName) {
        const source = fs.readFileSync(
            path.join(javascriptDirectory, fileName),
            "utf8"
        );
        vm.runInContext(source, context, { filename: fileName });
    });
}

test("user, tourist, guide, manager, and admin methods return expected values", function() {
    const context = vm.createContext({});
    loadScripts(context, [
        "tourist.js",
        "tourguide.js",
        "manager.js",
        "admin.js"
    ]);

    const results = vm.runInContext(`(() => {
        const user = new User(1, "Alex", "alex@example.com");
        user.setEmail("alex.new@example.com");
        const tourist = new Tourist(2, "Sam", "sam@example.com", "123456789");
        const guide = new TourGuide(3, "Taylor", "Bislama");
        const manager = new Manager(4, "Morgan");
        const admin = new Admin(5, "Jordan", "jordan@example.com");
        return {
            email: user.getEmail(),
            touristName: tourist.viewProfile(),
            guideName: guide.displayGuide(),
            managerReport: manager.generateReport(),
            adminMessage: admin.manageUsers(),
            adminEmail: admin.getEmail()
        };
    })()`, context);

    assert.deepEqual({ ...results }, {
        email: "alex.new@example.com",
        touristName: "Sam",
        guideName: "Taylor",
        managerReport: "Tour report generated",
        adminMessage: "Admin is managing users",
        adminEmail: "jordan@example.com"
    });
});

function createBookingContext() {
    const values = new Map();
    const listeners = {};
    const makeElement = function() {
        return {
            value: "",
            min: "",
            hidden: false,
            textContent: "",
            dataset: {},
            classList: {
                add: function() {},
                remove: function() {}
            },
            addEventListener: function(type, handler) {
                listeners[type] = handler;
            },
            setCustomValidity: function() {},
            focus: function() {},
            scrollIntoView: function() {}
        };
    };
    const elements = new Map();
    [
        "selectedTour",
        "output",
        "bookingData",
        "booking",
        "date",
        "bookingForm",
        "bookingJson",
        "name",
        "email",
        "phone"
    ].forEach(function(id) {
        elements.set(id, makeElement());
    });
    elements.get("bookingForm").reportValidity = function() {
        return true;
    };

    const tourButtons = [
        "Mount Yasur",
        "Scuba Dive",
        "Mele Cascades",
        "Land Diving"
    ].map(function(tour) {
        return { dataset: { tour: tour }, addEventListener: function() {} };
    });
    const context = vm.createContext({
        document: {
            getElementById: function(id) {
                return elements.get(id);
            },
            querySelectorAll: function(selector) {
                if (selector === ".tour-select") {
                    return tourButtons;
                }
                return [];
            }
        },
        indexedDB: {
            open: function() {
                return {};
            }
        },
        localStorage: {
            getItem: function(key) {
                return values.has(key) ? values.get(key) : null;
            },
            setItem: function(key, value) {
                values.set(key, value);
            }
        }
    });

    loadScripts(context, ["booking.js"]);
    vm.runInContext(`globalThis.bookingTestApi = {
        Booking,
        validateName,
        validateEmail,
        validatePhone,
        readStoredBookings,
        saveBookingRequest
    }`, context);

    return { context: context, values: values };
}

test("booking summary includes the submitted details", function() {
    const { context } = createBookingContext();
    const result = vm.runInContext(`(() => {
        const booking = new bookingTestApi.Booking(
            "Alex Example",
            "alex@example.com",
            "+678 555 1234",
            "2027-03-14",
            "Mount Yasur"
        );
        return { summary: booking.bookingSummary(), createdAt: booking.createdAt };
    })()`, context);

    assert.match(result.summary, /Name: Alex Example/);
    assert.match(result.summary, /Email: alex@example\.com/);
    assert.match(result.summary, /Phone: \+678 555 1234/);
    assert.match(result.summary, /Tour: Mount Yasur/);
    assert.match(result.summary, /Date: 2027-03-14/);
    assert.doesNotThrow(function() {
        new Date(result.createdAt).toISOString();
    });
});

test("booking validators accept supported values and reject invalid values", function() {
    const { context } = createBookingContext();
    const results = vm.runInContext(`({
        validName: bookingTestApi.validateName("Anne-Marie O'Neil"),
        invalidName: bookingTestApi.validateName("A"),
        validEmail: bookingTestApi.validateEmail("visitor@example.com"),
        invalidEmail: bookingTestApi.validateEmail("visitor.example.com"),
        validPhone: bookingTestApi.validatePhone("+678 (555) 1234"),
        invalidPhone: bookingTestApi.validatePhone("123-ABC")
    })`, context);

    assert.deepEqual({ ...results }, {
        validName: true,
        invalidName: false,
        validEmail: true,
        invalidEmail: false,
        validPhone: true,
        invalidPhone: false
    });
});

test("booking storage reads empty and saved arrays and appends a booking", function() {
    const { context, values } = createBookingContext();
    const api = context.bookingTestApi;
    const storageKey = "vanuatuTourBookings";

    assert.deepEqual(Array.from(api.readStoredBookings()), []);
    values.set(storageKey, JSON.stringify([{ name: "Earlier booking" }]));

    const booking = new api.Booking(
        "Alex Example",
        "alex@example.com",
        "5551234567",
        "2027-03-14",
        "Scuba Dive"
    );
    api.saveBookingRequest(booking);

    const saved = JSON.parse(values.get(storageKey));
    assert.equal(saved.length, 2);
    assert.equal(saved[1].name, "Alex Example");
    assert.equal(saved[1].tour, "Scuba Dive");
});

test("booking storage reports malformed data and storage write failures", function() {
    const { context, values } = createBookingContext();
    const api = context.bookingTestApi;
    const storageKey = "vanuatuTourBookings";

    values.set(storageKey, "{invalid json");
    assert.throws(function() {
        api.readStoredBookings();
    }, /Saved booking data could not be read/);

    values.set(storageKey, "{}");
    assert.throws(function() {
        api.readStoredBookings();
    }, /not a JSON array/);

    values.delete(storageKey);
    context.localStorage.setItem = function() {
        throw vm.runInContext('new Error("quota exceeded")', context);
    };
    const booking = new api.Booking(
        "Alex Example",
        "alex@example.com",
        "5551234567",
        "2027-03-14",
        "Scuba Dive"
    );
    assert.throws(function() {
        api.saveBookingRequest(booking);
    }, /Your booking could not be saved.*quota exceeded/);
});
