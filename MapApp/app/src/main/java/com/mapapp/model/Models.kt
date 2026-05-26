package com.mapapp.model

import java.io.Serializable

data class MapPoint(
    val _id: String = "",
    val name: String = "",
    val title: String = "",
    val author: String = "",
    val description: String = "",
    val address: String = "",
    val likes: Int = 0,
    val type: String = "normal",
    val location: Location = Location(),
    val mediaUrl: String = "",
    val images: List<String> = emptyList()
) : Serializable

data class Location(
    val type: String = "Point",
    val coordinates: List<Double> = emptyList()
) : Serializable {
    val longitude: Double get() = coordinates.getOrNull(0) ?: 0.0
    val latitude: Double get() = coordinates.getOrNull(1) ?: 0.0
}

data class Category(
    val id: String,
    val name: String,
    val icon: String = ""
)

data class MarkerItem(
    val id: String,
    val latitude: Double,
    val longitude: Double,
    val title: String,
    val address: String = "",
    val pointId: String = ""
)

data class TrackPoint(
    val coordinate: List<Double>,
    val label: String = "",
    val energy: Int = 0
)

data class UserInfo(
    val id: String = "",
    val name: String = "用户",
    val avatar: String = "",
    val followers: Int = 0,
    val following: Int = 0,
    val posts: Int = 0
)

data class Message(
    val id: String,
    val name: String,
    val avatar: String = "",
    val lastMessage: String = "",
    val time: String = "",
    val unread: Int = 0
)

data class FavoriteItem(
    val id: String,
    val title: String,
    val description: String,
    val date: String
) : Serializable
