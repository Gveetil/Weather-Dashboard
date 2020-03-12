// Note: This javascript file references classes and functions from weather-helper.js 

// Error messages
const errorNoResultsFound = "No results found for this City !";
const errorConnecting = "Unable to retrieve weather data!<br>";
const errorForecastNotFound = "Unable to retrieve Forecast data!";
// Weather icon image url
const weatherIconUrl = "https://openweathermap.org/img/w/icon_name.png";
// UV Index scale with colors
const uvIndexScaleColors = {
    0: "green", // low 0-3
    3: "gold", // moderate 3-6
    6: "orange", // high 6-8
    8: "red", // very high 9-11
    11: "purple" //extreme > 11
}

$(document).ready(function () {
    // UI Elements referenced by this code
    var searchResultsContainerEl = $("#searchResultsContainer");
    var errorMessageDisplayEl = $("#errorMessage");
    var searchHistoryListEl = $("#searchHistory");
    var fiveDayForecastDisplayEl = $("#fiveDayForecast");
    var forecastUVIndexEl = $("#forecastUVIndex");
    var weatherHelper = new WeatherHelper();

    /**
     * Makes an AJAX request to the open weather API to retrieve the UV Index and displays results 
     * @param {*} latitude the latitude of the city to be queried
     * @param {*} longitude the longitude of the city to be queried
     */
    function loadUVData(latitude, longitude) {
        forecastUVIndexEl.text("").css("backgroundColor", "");
        var queryURL = weatherHelper.buildUVIndexURL(latitude, longitude);
        $.ajax({
            url: queryURL,
            method: "GET"
        }).then(renderUVIndex)
            .catch(() => forecastUVIndexEl.text(" N/A ").css("backgroundColor", "grey"));
    }

    /**
     * renders the UV Index for a selected city based on the data returned from the API  
     * @param {object} response the UV Index data from the weather API 
     */
    function renderUVIndex(response) {
        var uvIndex = parseFloat(response.value);
        forecastUVIndexEl.text(uvIndex);
        // Update background color of UV Index field 
        var uvColorIndexKey = 0;
        for (const key in uvIndexScaleColors) {
            if (uvIndex <= key) {
                // limit found, so break the loop
                break;
            }
            uvColorIndexKey = key;
        }
        forecastUVIndexEl.css("backgroundColor", uvIndexScaleColors[uvColorIndexKey]);
    }

    /**
     * Makes an AJAX request to the open weather API for a five day forecast and displays results 
     * @param {string} cityName the name of the city to be queried
     */
    function loadFiveDayForecast(cityName) {
        fiveDayForecastDisplayEl.empty();
        var queryURL = weatherHelper.buildFiveDayForecastURL(cityName);
        $.ajax({
            url: queryURL,
            method: "GET"
        }).then(renderFiveDayForecast)
            .catch(() => fiveDayForecastDisplayEl.text(errorForecastNotFound));
    }

    /**
     * renders the five day weather forecast cards based on the data returned from the API  
     * @param {object} weatherData the 5-day forecast data from the weather API 
     */
    function renderFiveDayForecast(weatherData) {
        // The current 5-day Forecast data is hourly, so calculate midday based on the city being queried
        var middayOffset = Math.floor((weatherData.city.sunset - weatherData.city.sunrise) / 2);
        var currentMidday = weatherData.city.sunrise + middayOffset;
        var nextMidday = currentMidday + (24 * 60 * 60); // Move to the next day
        var daysRendered = 0;
        for (let index = 0; index < weatherData.list.length; index++) {
            // Ignore all data until midday is reached
            if (weatherData.list[index].dt > nextMidday) {
                createForecastCard(weatherData.list[index]);
                daysRendered++;
                nextMidday += 24 * 60 * 60; // Move to the next day
            }
        }
        // If only 4 days have rendered, display the data for the last / 5th day at the latest available time interval 
        if (daysRendered == 4) {
            createForecastCard(weatherData.list[weatherData.list.length - 1]);
        }
    }

    /**
     * creates and renders a forecast card based on the data provided  
     * @param {object} forecast the data for a single day from the 5-day forecast API 
     */
    function createForecastCard(forecast) {
        var forecastDate = new Date(forecast.dt * 1000);
        var forecastCard = $("<div class='card text-white bg-primary mr-4 mb-4'>");
        var forecastCardBody = $("<div class='card-body'>");
        forecastCardBody.append($("<h5 class='card-title'>" + weatherHelper.formatDate(forecastDate) + "</h5>"));
        var forecastImage = $("<img alt='Weather Icon' class='mb-2'>");
        if (forecast.weather != undefined && forecast.weather.length > 0
            && forecast.weather[0].icon != undefined) {
            forecastImage.attr("src", weatherIconUrl.replace("icon_name", forecast.weather[0].icon));
        }
        forecastCardBody.append(forecastImage);
        var temperature = parseFloat(forecast.main.temp).toFixed(1);
        forecastCardBody.append($("<p class='card-text'>Temp: " + temperature + " °F</p>"));
        forecastCardBody.append($("<p class='card-text'>Humidity: " + forecast.main.humidity + " %</p>"));
        forecastCard.append(forecastCardBody);
        fiveDayForecastDisplayEl.append(forecastCard)
    }

    /**
     * Makes an AJAX request to the open weather API for a given city and displays results 
     * @param {string} cityName the name of the city to be queried
     */
    function loadWeatherForCity(cityName) {
        var queryURL = weatherHelper.buildWeatherURL(cityName);
        $.ajax({
            url: queryURL,
            method: "GET"
        }).then(renderWeatherForCity)
            .catch((xhr, status, exception) => {
                if (xhr.status == 404)
                    showErrorPane(errorNoResultsFound);
                else
                    showErrorPane(errorConnecting + exception);
            });
    }

    /**
     * renders city weather information based on the data returned from the API for a given city 
     * @param {object} weatherData the weather API data for a city
     */
    function renderWeatherForCity(weatherData) {
        var selectedCity = weatherData.name + ", " + weatherData.sys.country;
        $("#forecastCity").text(selectedCity);
        var forecastDate = new Date(weatherData.dt * 1000);
        $("#forecastDate").text(weatherHelper.formatDate(forecastDate));
        if (weatherData.weather != undefined && weatherData.weather.length > 0
            && weatherData.weather[0].icon != undefined) {
            $("#forecastIcon").attr("src", weatherIconUrl.replace("icon_name", weatherData.weather[0].icon));
            $("#forecastIcon").show();
        }
        else {
            $("#forecastIcon").hide();
        }
        $("#forecastTemperature").text(parseFloat(weatherData.main.temp).toFixed(1));
        $("#forecastHumidity").text(weatherData.main.humidity);
        $("#forecastWindSpeed").text(parseFloat(weatherData.wind.speed).toFixed(1));
        // Load UV Index Data
        forecastUVIndexEl.text("");
        forecastUVIndexEl.css("backgroundColor", "");
        loadUVData(weatherData.coord.lat, weatherData.coord.lon);
        // Load Five day forecast
        loadFiveDayForecast(selectedCity);
        searchResultsContainerEl.show();
        errorMessageDisplayEl.hide();
        // Add city to storage and update search history only if city added is new 
        if (weatherHelper.addCity(selectedCity)) {
            renderSearchHistory();
            $("#searchCity").val("");
        }
        // Set city as active in the search history list
        searchHistoryListEl.find(".active").removeClass("active");
        searchHistoryListEl.find("[data-city='" + selectedCity + "']").addClass("active");
    }

    /**
     * Displays an error message and hides weather data
     * @param {string} errorMessage the message to be displayed
     */
    function showErrorPane(errorMessage) {
        searchResultsContainerEl.hide();
        errorMessageDisplayEl.show();
        errorMessageDisplayEl.html(errorMessage);
    }

    /** Displays the search history from the local storage */
    function renderSearchHistory() {
        var cityList = weatherHelper.getCities();
        searchHistoryListEl.empty();
        cityList.forEach(element => {
            var searchItem = $("<button class='list-group-item list-group-item-action mr-auto'>");
            searchItem.text(element);
            searchItem.attr("data-city", element);
            searchHistoryListEl.append(searchItem);
        });
    }

    /** Initializes the screen when this page is loaded up for the first time */
    function initializeSearch() {
        renderSearchHistory();
        // Select the last searched city as the default when page loads up
        var cityList = weatherHelper.getCities();
        if (cityList.length > 0)
            loadWeatherForCity(cityList[0]);
    }

    function searchHistoryListClick(event) {
        event.preventDefault();
        if ($(event.target).is("button")) {
            var eventCity = $(event.target).attr("data-city");
            loadWeatherForCity(eventCity);
        }
    }

    function searchButtonClick(event) {
        event.preventDefault();
        var cityName = $("#searchCity").val().trim();
        if (cityName == "") {
            alert("Please enter a City to search for!");
            return;
        }
        loadWeatherForCity(cityName);
    }

    //Event Handlers
    $("#runSearch").on("click", searchButtonClick);
    searchHistoryListEl.on("click", searchHistoryListClick);

    // Call initialize on load of page
    initializeSearch()
});
