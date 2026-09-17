package com.example

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.data.model.AppTab
import com.example.ui.screens.*
import com.example.ui.theme.*
import com.example.ui.viewmodel.WeatherViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                WeatherAppContent()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WeatherAppContent(
    viewModel: WeatherViewModel = viewModel()
) {
    val context = LocalContext.current
    val selectedCity by viewModel.selectedCity.collectAsStateWithLifecycle()
    val weatherData by viewModel.weatherData.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val isLocating by viewModel.isLocating.collectAsStateWithLifecycle()
    val isCurrentLoc by viewModel.isCurrentLocationSelected.collectAsStateWithLifecycle()
    val activeTab by viewModel.activeTab.collectAsStateWithLifecycle()
    val favoriteCities by viewModel.favoriteCities.collectAsStateWithLifecycle()
    val searchQuery by viewModel.searchQuery.collectAsStateWithLifecycle()
    val searchResults by viewModel.searchResults.collectAsStateWithLifecycle()
    val tempUnit by viewModel.tempUnit.collectAsStateWithLifecycle()
    val windUnit by viewModel.windUnit.collectAsStateWithLifecycle()

    // Location Permission Launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        val coarseGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] ?: false
        if (fineGranted || coarseGranted) {
            viewModel.setLocationPermissionGranted(true, context)
        }
    }

    // Ask for exact location on initial startup
    LaunchedEffect(Unit) {
        val finePerm = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
        val coarsePerm = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION)
        if (finePerm == PackageManager.PERMISSION_GRANTED || coarsePerm == PackageManager.PERMISSION_GRANTED) {
            viewModel.setLocationPermissionGranted(true, context)
        } else {
            permissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
    }

    // Refresh rotation animation
    val infiniteTransition = rememberInfiniteTransition(label = "refresh_rotate")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotate_angle"
    )

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepNavy),
        containerColor = DeepNavy,
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = if (isCurrentLoc) Icons.Default.NearMe else Icons.Default.LocationOn,
                            contentDescription = null,
                            tint = SkyCyan,
                            modifier = Modifier.size(20.dp)
                        )
                        Column {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = selectedCity.name,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                if (isCurrentLoc) {
                                    Surface(
                                        shape = RoundedCornerShape(4.dp),
                                        color = SkyCyan.copy(alpha = 0.2f)
                                    ) {
                                        Text(
                                            text = "GPS",
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = SkyCyan,
                                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                        )
                                    }
                                }
                            }
                            Text(
                                text = selectedCity.country,
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary,
                                fontSize = 11.sp
                            )
                        }
                    }
                },
                actions = {
                    // Quick GPS Location Re-acquire button
                    IconButton(
                        onClick = {
                            val finePerm = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
                            val coarsePerm = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION)
                            if (finePerm == PackageManager.PERMISSION_GRANTED || coarsePerm == PackageManager.PERMISSION_GRANTED) {
                                viewModel.fetchCurrentLocation(context)
                            } else {
                                permissionLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.ACCESS_COARSE_LOCATION
                                    )
                                )
                            }
                        },
                        modifier = Modifier
                            .size(36.dp)
                            .testTag("appbar_gps_button")
                    ) {
                        if (isLocating) {
                            CircularProgressIndicator(
                                color = SkyCyan,
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(16.dp)
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Default.MyLocation,
                                contentDescription = "Detect Exact Location",
                                tint = if (isCurrentLoc) SkyCyan else TextSecondary,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }

                    // Refresh Button
                    IconButton(
                        onClick = { viewModel.refreshWeather(context) },
                        modifier = Modifier
                            .size(36.dp)
                            .testTag("refresh_weather_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = stringResource(R.string.refresh_weather),
                            tint = SkyCyan,
                            modifier = if (isLoading) Modifier.rotate(rotation).size(18.dp) else Modifier.size(18.dp)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DeepSurface,
                    titleContentColor = TextPrimary
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = DeepSurface,
                tonalElevation = 4.dp,
                modifier = Modifier
                    .height(64.dp)
                    .testTag("main_bottom_nav")
            ) {
                NavigationBarItem(
                    selected = activeTab == AppTab.TODAY,
                    onClick = { viewModel.setActiveTab(AppTab.TODAY) },
                    icon = {
                        Icon(
                            imageVector = if (activeTab == AppTab.TODAY) Icons.Default.CloudQueue else Icons.Outlined.CloudQueue,
                            contentDescription = stringResource(R.string.tab_today),
                            modifier = Modifier.size(20.dp)
                        )
                    },
                    label = { Text(stringResource(R.string.tab_today), fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = DeepNavy,
                        selectedTextColor = SkyCyan,
                        indicatorColor = SkyCyan,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary
                    ),
                    modifier = Modifier.testTag("nav_item_today")
                )

                NavigationBarItem(
                    selected = activeTab == AppTab.FORECAST,
                    onClick = { viewModel.setActiveTab(AppTab.FORECAST) },
                    icon = {
                        Icon(
                            imageVector = if (activeTab == AppTab.FORECAST) Icons.Default.CalendarMonth else Icons.Outlined.CalendarMonth,
                            contentDescription = stringResource(R.string.tab_forecast),
                            modifier = Modifier.size(20.dp)
                        )
                    },
                    label = { Text(stringResource(R.string.tab_forecast), fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = DeepNavy,
                        selectedTextColor = SkyCyan,
                        indicatorColor = SkyCyan,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary
                    ),
                    modifier = Modifier.testTag("nav_item_forecast")
                )

                NavigationBarItem(
                    selected = activeTab == AppTab.AIR_QUALITY,
                    onClick = { viewModel.setActiveTab(AppTab.AIR_QUALITY) },
                    icon = {
                        Icon(
                            imageVector = if (activeTab == AppTab.AIR_QUALITY) Icons.Default.Air else Icons.Outlined.Air,
                            contentDescription = stringResource(R.string.tab_aqi),
                            modifier = Modifier.size(20.dp)
                        )
                    },
                    label = { Text(stringResource(R.string.tab_aqi), fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = DeepNavy,
                        selectedTextColor = SkyCyan,
                        indicatorColor = SkyCyan,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary
                    ),
                    modifier = Modifier.testTag("nav_item_aqi")
                )

                NavigationBarItem(
                    selected = activeTab == AppTab.CITIES,
                    onClick = { viewModel.setActiveTab(AppTab.CITIES) },
                    icon = {
                        Icon(
                            imageVector = if (activeTab == AppTab.CITIES) Icons.Default.LocationCity else Icons.Outlined.LocationCity,
                            contentDescription = stringResource(R.string.tab_cities),
                            modifier = Modifier.size(20.dp)
                        )
                    },
                    label = { Text(stringResource(R.string.tab_cities), fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = DeepNavy,
                        selectedTextColor = SkyCyan,
                        indicatorColor = SkyCyan,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary
                    ),
                    modifier = Modifier.testTag("nav_item_cities")
                )

                NavigationBarItem(
                    selected = activeTab == AppTab.SETTINGS,
                    onClick = { viewModel.setActiveTab(AppTab.SETTINGS) },
                    icon = {
                        Icon(
                            imageVector = if (activeTab == AppTab.SETTINGS) Icons.Default.Settings else Icons.Outlined.Settings,
                            contentDescription = stringResource(R.string.tab_settings),
                            modifier = Modifier.size(20.dp)
                        )
                    },
                    label = { Text(stringResource(R.string.tab_settings), fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = DeepNavy,
                        selectedTextColor = SkyCyan,
                        indicatorColor = SkyCyan,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary
                    ),
                    modifier = Modifier.testTag("nav_item_settings")
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            DeepNavy,
                            DeepSurface,
                            Color(0xFF070D1E)
                        )
                    )
                )
        ) {
            val currentWeather = weatherData
            if (currentWeather == null) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        CircularProgressIndicator(
                            color = SkyCyan,
                            strokeWidth = 2.5.dp,
                            modifier = Modifier.size(36.dp)
                        )
                        Text(
                            text = "Loading Weather Data...",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary,
                            fontSize = 13.sp
                        )
                    }
                }
            } else {
                when (activeTab) {
                    AppTab.TODAY -> {
                        HomeScreen(
                            weather = currentWeather,
                            viewModel = viewModel,
                            onRequestLocationPermission = {
                                permissionLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.ACCESS_COARSE_LOCATION
                                    )
                                )
                            },
                            onNavigateToForecast = { viewModel.setActiveTab(AppTab.FORECAST) }
                        )
                    }
                    AppTab.FORECAST -> {
                        ForecastScreen(
                            weather = currentWeather,
                            viewModel = viewModel
                        )
                    }
                    AppTab.AIR_QUALITY -> {
                        AirQualityScreen(
                            airQuality = currentWeather.airQuality,
                            cityName = currentWeather.city.name
                        )
                    }
                    AppTab.CITIES -> {
                        CitiesScreen(
                            viewModel = viewModel,
                            selectedCity = selectedCity,
                            favoriteCities = favoriteCities,
                            searchQuery = searchQuery,
                            searchResults = searchResults,
                            onCitySelected = { city -> viewModel.selectCity(city) },
                            onRequestLocationPermission = {
                                permissionLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.ACCESS_COARSE_LOCATION
                                    )
                                )
                            }
                        )
                    }
                    AppTab.SETTINGS -> {
                        SettingsScreen(
                            viewModel = viewModel,
                            tempUnit = tempUnit,
                            windUnit = windUnit
                        )
                    }
                }
            }
        }
    }
}
