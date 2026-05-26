package com.mapapp.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.mapapp.databinding.ItemServiceCardBinding
import com.mapapp.model.MapPoint

class ServiceCardAdapter(
    private val onItemClick: (MapPoint, String) -> Unit
) : ListAdapter<MapPoint, ServiceCardAdapter.ServiceCardViewHolder>(ServiceCardDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ServiceCardViewHolder {
        val binding = ItemServiceCardBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ServiceCardViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ServiceCardViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ServiceCardViewHolder(
        private val binding: ItemServiceCardBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(point: MapPoint) {
            binding.tvTitle.text = point.name
            binding.tvAuthor.text = point.author
            binding.tvLikes.text = "${point.likes} 赞"
            binding.tvLocation.text = point.address

            binding.cardMedia.setOnClickListener {
                onItemClick(point, "media")
            }

            binding.cardContent.setOnClickListener {
                onItemClick(point, "content")
            }

            binding.btnReserve.setOnClickListener {
                onItemClick(point, "reserve")
            }
        }
    }

    class ServiceCardDiffCallback : DiffUtil.ItemCallback<MapPoint>() {
        override fun areItemsTheSame(oldItem: MapPoint, newItem: MapPoint): Boolean {
            return oldItem._id == newItem._id
        }

        override fun areContentsTheSame(oldItem: MapPoint, newItem: MapPoint): Boolean {
            return oldItem == newItem
        }
    }
}
