
/**
 * Represents a tour guide and the language they speak.
 */
class TourGuide {

    /**
     * Creates a tour guide profile.
     * @param {number|string} guideId - Guide identifier.
     * @param {string} guideName - Guide's display name.
     * @param {string} language - Language spoken by the guide.
     */
    constructor(guideId, guideName, language) {

        this.guideId = guideId;
        this.guideName = guideName;
        this.language = language;

    }

    /**
     * Returns the guide's display name.
     * @returns {string} The guide's name.
     */
    displayGuide() {

        return this.guideName;

    }
}