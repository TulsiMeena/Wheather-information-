package com.example.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.*
import com.example.data.repository.WeatherRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class WeatherViewModel(
    private val repository: WeatherRepository = WeatherRepository()
) : ViewModel() {

    private val _selectedCity = MutableStateFlow(repository.defaultCities[0]) // New Delhi
    val selectedCity: StateFlow<City> = _selectedCity.asStateFlow()

    private val _weatherData = MutableStateFlow<WeatherData?>(null)
    val weatherData: StateFlow<WeatherData?> = _weatherData.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _favoriteCities = MutableStateFlow(repository.defaultCities.filter { it.isFavorite })
    val favoriteCities: StateFlow<List<City>> = _favoriteCities.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _searchResults = MutableStateFlow<List<City>>(emptyList())
    val searchResults: StateFlow<List<City>> = _searchResults.asStateFlow()

    private val _tempUnit = MutableStateFlow(TemperatureUnit.CELSIUS)
    val tempUnit: StateFlow<TemperatureUnit> = _tempUnit.asStateFlow()

    private val _windUnit = MutableStateFlow(WindSpeedUnit.KMH)
    val windUnit: StateFlow<WindSpeedUnit> = _windUnit.asStateFlow()

    private val _activeTab = MutableStateFlow(AppTab.TODAY)
    val activeTab: StateFlow<AppTab> = _activeTab.asStateFlow()

    private var searchJob: Job? = null

    init {
        loadWeatherForCity(_selectedCity.value)
    }

    fun selectCity(city: City) {
        _selectedCity.value = city
        _searchQuery.value = ""
        _searchResults.value = emptyList()
        _activeTab.value = AppTab.TODAY
        loadWeatherForCity(city)
    }

    fun refreshWeather() {
        loadWeatherForCity(_selectedCity.value)
    }

    private fun loadWeatherForCity(city: City) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val data = repository.getWeatherData(city)
                _weatherData.value = data
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun toggleFavorite(city: City) {
        val current = _favoriteCities.value.toMutableList()
        val index = current.indexOfFirst { it.name == city.name && it.country == city.country }
        if (index >= 0) {
            current.removeAt(index)
        } else {
            current.add(city.copy(isFavorite = true))
        }
        _favoriteCities.value = current
    }

    fun isFavorite(city: City): Boolean {
        return _favoriteCities.value.any { it.name == city.name && it.country == city.country }
    }

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
        searchJob?.cancel()
        if (query.trim().isEmpty()) {
            _searchResults.value = emptyList()
            return
        }
        searchJob = viewModelScope.launch {
            delay(300) // Debounce
            val results = repository.searchCities(query)
            _searchResults.value = results
        }
    }

    fun setActiveTab(tab: AppTab) {
        _activeTab.value = tab
    }

    fun setTempUnit(unit: TemperatureUnit) {
        _tempUnit.value = unit
    }

    fun setWindUnit(unit: WindSpeedUnit) {
        _windUnit.value = unit
    }

    fun formatTemp(celsius: Double): String {
        return when (_tempUnit.value) {
            TemperatureUnit.CELSIUS -> "${Math.round(celsius)}°C"
            TemperatureUnit.FAHRENHEIT -> "${Math.round(celsius * 9.0 / 5.0 + 32.0)}°F"
        }
    }

    fun formatWind(kmh: Double): String {
        return when (_windUnit.value) {
            WindSpeedUnit.KMH -> "${Math.round(kmh)} km/h"
            WindSpeedUnit.MPH -> "${Math.round(kmh * 0.621371)} mph"
        }
    }
}
