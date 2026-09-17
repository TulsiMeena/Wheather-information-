package com.example.ui.viewmodel

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Geocoder
import android.location.Location
import android.location.LocationManager
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.*
import com.example.data.repository.WeatherRepository
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Locale

class WeatherViewModel(
    private val repository: WeatherRepository = WeatherRepository()
) : ViewModel() {

    private val _selectedCity = MutableStateFlow(repository.defaultCities[0]) // New Delhi default fallback
    val selectedCity: StateFlow<City> = _selectedCity.asStateFlow()

    private val _weatherData = MutableStateFlow<WeatherData?>(null)
    val weatherData: StateFlow<WeatherData?> = _weatherData.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _isLocating = MutableStateFlow(false)
    val isLocating: StateFlow<Boolean> = _isLocating.asStateFlow()

    private val _hasLocationPermission = MutableStateFlow(false)
    val hasLocationPermission: StateFlow<Boolean> = _hasLocationPermission.asStateFlow()

    private val _isCurrentLocationSelected = MutableStateFlow(false)
    val isCurrentLocationSelected: StateFlow<Boolean> = _isCurrentLocationSelected.asStateFlow()

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

    fun setLocationPermissionGranted(granted: Boolean, context: Context? = null) {
        _hasLocationPermission.value = granted
        if (granted && context != null) {
            fetchCurrentLocation(context)
        }
    }

    @SuppressLint("MissingPermission")
    fun fetchCurrentLocation(context: Context) {
        val appContext = context.applicationContext
        val finePerm = ContextCompat.checkSelfPermission(appContext, Manifest.permission.ACCESS_FINE_LOCATION)
        val coarsePerm = ContextCompat.checkSelfPermission(appContext, Manifest.permission.ACCESS_COARSE_LOCATION)

        if (finePerm != PackageManager.PERMISSION_GRANTED && coarsePerm != PackageManager.PERMISSION_GRANTED) {
            _hasLocationPermission.value = false
            return
        }

        _hasLocationPermission.value = true
        _isLocating.value = true

        val fusedClient = LocationServices.getFusedLocationProviderClient(appContext)
        val cts = CancellationTokenSource()

        // Safety timeout (10s) to prevent infinite loading spinner if GPS is disabled or slow
        viewModelScope.launch {
            delay(10000)
            if (_isLocating.value) {
                try { cts.cancel() } catch (_: Exception) {}
                _isLocating.value = false
            }
        }

        fusedClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, cts.token)
            .addOnSuccessListener { loc: Location? ->
                if (loc != null) {
                    processResolvedLocation(loc.latitude, loc.longitude, appContext)
                } else {
                    // Fallback to lastLocation or LocationManager
                    fusedClient.lastLocation.addOnSuccessListener { lastLoc: Location? ->
                        if (lastLoc != null) {
                            processResolvedLocation(lastLoc.latitude, lastLoc.longitude, appContext)
                        } else {
                            fallbackToLocationManager(appContext)
                        }
                    }.addOnFailureListener {
                        fallbackToLocationManager(appContext)
                    }
                }
            }
            .addOnFailureListener {
                fallbackToLocationManager(appContext)
            }
    }

    @SuppressLint("MissingPermission")
    private fun fallbackToLocationManager(context: Context) {
        val appContext = context.applicationContext
        val lm = appContext.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        val loc = lm?.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            ?: lm?.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            ?: lm?.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER)

        if (loc != null) {
            processResolvedLocation(loc.latitude, loc.longitude, appContext)
        } else {
            _isLocating.value = false
        }
    }

    private fun processResolvedLocation(lat: Double, lon: Double, context: Context) {
        val appContext = context.applicationContext
        viewModelScope.launch(Dispatchers.IO) {
            var cityName = "Current Location"
            var countryName = "Detected GPS"

            try {
                val geocoder = Geocoder(appContext, Locale.getDefault())
                @Suppress("DEPRECATION")
                val addresses = geocoder.getFromLocation(lat, lon, 1)
                val addr = addresses?.firstOrNull()
                if (addr != null) {
                    cityName = addr.locality
                        ?: addr.subAdminArea
                        ?: addr.adminArea
                        ?: "Local Area"
                    countryName = addr.countryName ?: "GPS"
                }
            } catch (_: Exception) {
                // Fallback to coordinate label if reverse geocoding offline
                cityName = String.format(Locale.US, "GPS (%.2f, %.2f)", lat, lon)
            }

            val currentCity = City(
                id = "current_gps_location",
                name = cityName,
                country = countryName,
                lat = lat,
                lon = lon,
                isFavorite = false
            )

            withContext(Dispatchers.Main) {
                _isCurrentLocationSelected.value = true
                _selectedCity.value = currentCity
                _isLocating.value = false
                loadWeatherForCity(currentCity)
            }
        }
    }

    fun selectCity(city: City) {
        _isCurrentLocationSelected.value = (city.id == "current_gps_location")
        _selectedCity.value = city
        _searchQuery.value = ""
        _searchResults.value = emptyList()
        _activeTab.value = AppTab.TODAY
        loadWeatherForCity(city)
    }

    fun refreshWeather(context: Context? = null) {
        if (_isCurrentLocationSelected.value && context != null && _hasLocationPermission.value) {
            fetchCurrentLocation(context)
        } else {
            loadWeatherForCity(_selectedCity.value)
        }
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
            delay(300)
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
            TemperatureUnit.CELSIUS -> "${Math.round(celsius)}°"
            TemperatureUnit.FAHRENHEIT -> "${Math.round(celsius * 9.0 / 5.0 + 32.0)}°"
        }
    }

    fun formatTempWithUnit(celsius: Double): String {
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
