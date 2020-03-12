/** Key used to access the local storage */
const localStorageKey = "citySearchHistory";
/** API Key used to access open weather map data */
const openWeatherMapAppId = "fb8e1ba542118d601b955536ee62bba6";

/** This class provides utility methods to work with the weather data in cities and save / retrieve them from local storage */
class WeatherHelper {
    /**
    * Initialize the list of cities searched
    */
    constructor() {
        this.cityList = JSON.parse(window.localStorage.getItem(localStorageKey));
        if (this.cityList == null) {
            this.cityList = [];
        }
    }

    /** Save the city search history list into local storage */
    saveData() {
        window.localStorage.setItem(localStorageKey, JSON.stringify(this.cityList));
    }

    /** Adds a new city to the local storage
     * @param {string} city the city to be added 
     * @returns {boolean} true if city was newly added, else false
     */
    addCity(city) {
        // Check if city has already been searched for
        for (var index in this.cityList) {
            if (this.cityList[index] == city) {
                return false;
            }
        }
        this.cityList.unshift(city);
        // Truncate array to limit elements to 10 cities
        if (this.cityList.length > 10)
            this.cityList.length = 10;
        this.saveData();
        return true;
    }

    /** Gets the list of cities searched
     * @returns {Array.<string>} list of cities 
     */
    getCities() {
        return this.cityList;
    }

    /**
     * Builds the open weather map query URL to retrieve the weather details for a given city
     * @param {string} city the city to search for
     * @returns {string} city weather query URL
     */
    buildWeatherURL(city) {
        var queryURL = "https://api.openweathermap.org/data/2.5/weather?";
        var queryParams = {
            "q": city,
            "units": "imperial",
            "appid": openWeatherMapAppId
        };
        return queryURL + $.param(queryParams);
    }

    /**
     * Builds the open weather map query URL to retrieve the UV Index for a given location
     * @param {string} latitude latitude of the location 
     * @param {string} longitude longitude of the location 
     * @returns {string} UV Index query URL
     */
    buildUVIndexURL(latitude, longitude) {
        var queryURL = "https://api.openweathermap.org/data/2.5/uvi?";
        var queryParams = {
            "lat": latitude,
            "lon": longitude,
            "appid": openWeatherMapAppId
        };
        return queryURL + $.param(queryParams);
    }

    /**
     * Builds the open weather map query URL to retrieve the five day forecast for a given location
     * @param {string} city the city to look for
     * @returns {string} Five Day Forecast query URL
     */
    buildFiveDayForecastURL(city) {
        var queryURL = "https://api.openweathermap.org/data/2.5/forecast?";
        var queryParams = {
            "q": city,
            "units": "imperial",
            "appid": openWeatherMapAppId
        };
        return queryURL + $.param(queryParams);
    }

    /**
     * Returns the given date in M/D/YYYY format
     * @param {*} date the date to be formatted
     * @returns {string} the formatted date
     */
    formatDate(date) {
        return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
    }
}