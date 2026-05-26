package com.mapapp.ui.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.mapapp.R

class MessageAdapter(
    private val items: List<Int>,
    private val onPin: (Int) -> Unit,
    private val onUnread: (Int) -> Unit,
    private val onDelete: (Int) -> Unit
) : RecyclerView.Adapter<MessageAdapter.ViewHolder>() {

    private val colors = listOf("#007AFF", "#34C759", "#FF9500", "#FF3B30", "#AF52DE", "#FF2D92", "#5AC8FA", "#FFCC00")

    inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val avatar = itemView.findViewById<View>(R.id.avatar)
        val contentWrapper = itemView.findViewById<View>(R.id.content_wrapper)
        val pinBtn = itemView.findViewById<View>(R.id.pin_btn)
        val unreadBtn = itemView.findViewById<View>(R.id.unread_btn)
        val deleteBtn = itemView.findViewById<View>(R.id.delete_btn)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_message, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.avatar.setBackgroundColor(android.graphics.Color.parseColor(colors[position % colors.size]))
        
        holder.pinBtn.setOnClickListener { onPin(position) }
        holder.unreadBtn.setOnClickListener { onUnread(position) }
        holder.deleteBtn.setOnClickListener { onDelete(position) }
    }

    override fun getItemCount() = items.size
}