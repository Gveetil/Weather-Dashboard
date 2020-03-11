// the format used to display the date and time intervals
const errorNoResultsFound = "No results found for this City !";
const errorConnecting = "Unable to retrieve weather data!<br>";
const weatherIconUrl = "http://openweathermap.org/img/wn/icon_name.png";
const uvIndexScaleColors = {
    0: "green", // low 0-3
    3: "yellow", // moderate 3-6
    6: "orange", // high 6-8
    8: "red", // very high 9-11
    11: "purple" //extreme > 11
}

$(document).ready(function () {
    // UI Elements referenced by this code
    var searchResultsContainerEl = $("#searchResultsContainer");
    var errorMessageDisplayEl = $("#errorMessage");
    var searchHistoryListEl = $("#searchHistory");
    var weatherHelper = new WeatherHelper();
    var selectedCity = "";

    function getUVData(latitude, longitude) {
        $("#forecastUVIndex").text("").css("backgroundColor", "");
        var queryURL = weatherHelper.buildUVIndexURL(latitude, longitude);
        $.ajax({
            url: queryURL,
            method: "GET"
        }).then(updateUVIndex)
            .catch($("#forecastUVIndex").text("--"));
    }

    function updateUVIndex(response) {
        var uvIndex = parseFloat(response.value);
        $("#forecastUVIndex").text(uvIndex);
        var uvColorIndexKey = 0;
        for (const key in uvIndexScaleColors) {
            if (uvIndex <= key) {
                // limit found, so break the loop
                break;
            }
            uvColorIndexKey = key;
        }
        $("#forecastUVIndex").css("backgroundColor", uvIndexScaleColors[uvColorIndexKey]);
    }

    function loadWeatherForCity(cityName) {
        var queryURL = weatherHelper.buildWeatherURL(cityName);
        $.ajax({
            url: queryURL,
            method: "GET"
        }).then(updatePage)
            .catch(onError);
    }

    function updatePage(weatherData) {
        var searchCity = weatherData.name + ", " + weatherData.sys.country;
        $("#forecastCity").text(searchCity);
        var forecastDate = new Date(weatherData.dt * 1000);
        $("#forecastDate").text(weatherHelper.formatDate(forecastDate));
        console.log(weatherData);
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
        $("#forecastUVIndex").text("");
        $("#forecastUVIndex").css("backgroundColor", "");
        getUVData(weatherData.coord.lat, weatherData.coord.lon)
        searchResultsContainerEl.show();
        // Add city to search history
        weatherHelper.addCity(searchCity);
        renderSearchHistory();
    }

    function renderSearchHistory() {
        var cityList = weatherHelper.getCities();
        searchHistoryListEl.empty();
        cityList.forEach(element => {
            var searchItem = $("<button class='list-group-item list-group-item-action'>");
            searchItem.text(element);
            searchItem.attr("data-city", element);
            searchHistoryListEl.append(searchItem);
        });
        if (selectedCity != "") {
            searchHistoryListEl.find("[data-city='" + selectedCity + "']").addClass("active");
        }
    }

    function initializeSearch() {
        // Select the last searched city as the default when page loads up
        var cityList = weatherHelper.getCities();
        if (cityList.length > 0)
            selectedCity = cityList[0];
        renderSearchHistory();
        if (selectedCity != "") {
            loadWeatherForCity(selectedCity);
        }
    }

    function showErrorPane(errorMessage) {
        searchResultsContainerEl.hide();
        errorMessageDisplayEl.show();
        errorMessageDisplayEl.html(errorMessage);
    }

    function onError(xhr, status, exception) {
        if (xhr.status == 404)
            showErrorPane(errorNoResultsFound);
        else
            showErrorPane(errorConnecting + exception);
    }


    function searchHistoryListClick(event) {
        event.preventDefault();
        if ($(event.target).is("button")) {
            selectedCity = $(event.target).attr("data-city");
            loadWeatherForCity(selectedCity);
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
    initializeSearch()
});
