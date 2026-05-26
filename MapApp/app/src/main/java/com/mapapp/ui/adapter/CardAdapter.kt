package com.mapapp.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.mapapp.databinding.ItemCardBinding
import com.mapapp.model.MapPoint

class CardAdapter(
    private val onItemClick: (MapPoint, String) -> Unit
) : ListAdapter<MapPoint, CardAdapter.CardViewHolder>(CardDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CardViewHolder {
        val binding = ItemCardBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return CardViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CardViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class CardViewHolder(
        private val binding: ItemCardBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(point: MapPoint) {
            binding.tvTitle.text = point.name
            binding.tvAuthor.text = point.author
            binding.tvLikes.text = "${point.likes} 赞"
            binding.tvLocation.text = point.address.ifEmpty {
                "${point.location.latitude.toString().take(6)}, ${point.location.longitude.toString().take(6)}"
            }

            binding.cardMedia.setOnClickListener {
                onItemClick(point, "media")
            }

            binding.cardContent.setOnClickListener {
                onItemClick(point, "content")
            }
        }
    }

    class CardDiffCallback : DiffUtil.ItemCallback<MapPoint>() {
        override fun areItemsTheSame(oldItem: MapPoint, newItem: MapPoint): Boolean {
            return oldItem._id == newItem._id
        }

        override fun areContentsTheSame(oldItem: MapPoint, newItem: MapPoint): Boolean {
            return oldItem == newItem
        }
    }
}
