package com.mapapp.ui.fragment

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.mapapp.R
import com.mapapp.ui.adapter.MessageAdapter

class MessageFragment : Fragment() {

    private var messageData = mutableMapOf<Int, List<Int>>()
    private var selectedBubble = 1
    private var currentMessages = mutableListOf<Int>()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_message, container, false)

        initData()
        setupBubbles(view)
        setupAddButton(view)
        setupMessageList(view)

        return view
    }

    private fun initData() {
        messageData[1] = (1..12).toList()
        messageData[2] = (1..5).toList()
        messageData[3] = (1..6).toList()
        messageData[4] = (1..4).toList()
        currentMessages = messageData[1]?.toMutableList() ?: mutableListOf()
    }

    private fun setupBubbles(view: View) {
        val bubbles = listOf(
            view.findViewById<View>(R.id.bubble_1),
            view.findViewById<View>(R.id.bubble_2),
            view.findViewById<View>(R.id.bubble_3),
            view.findViewById<View>(R.id.bubble_4)
        )

        bubbles.forEachIndexed { index, bubble ->
            bubble.setOnClickListener {
                selectedBubble = index + 1
                updateBubbleSelection(bubbles, index)
                switchMessages(index + 1)
            }
        }

        updateBubbleSelection(bubbles, 0)
    }

    private fun updateBubbleSelection(bubbles: List<View>, selectedIndex: Int) {
        bubbles.forEachIndexed { index, bubble ->
            if (index == selectedIndex) {
                bubble.scaleX = 1.1f
                bubble.scaleY = 1.1f
                bubble.elevation = 4f
            } else {
                bubble.scaleX = 1f
                bubble.scaleY = 1f
                bubble.elevation = 0f
            }
        }
    }

    private fun switchMessages(bubbleId: Int) {
        currentMessages = messageData[bubbleId]?.toMutableList() ?: mutableListOf()
        setupMessageList(requireView())
    }

    private fun setupAddButton(view: View) {
        val addBtn = view.findViewById<View>(R.id.add_btn)
        val addMenuOverlay = view.findViewById<View>(R.id.add_menu_overlay)

        addBtn.setOnClickListener {
            addMenuOverlay.visibility = View.VISIBLE
        }

        addMenuOverlay.setOnClickListener {
            addMenuOverlay.visibility = View.GONE
        }
    }

    private fun setupMessageList(view: View) {
        val recyclerView = view.findViewById<androidx.recyclerview.widget.RecyclerView>(R.id.message_list)
        recyclerView.layoutManager = LinearLayoutManager(context)
        recyclerView.adapter = MessageAdapter(
            currentMessages,
            { position -> Toast.makeText(context, "置顶消息 $position", Toast.LENGTH_SHORT).show() },
            { position -> Toast.makeText(context, "标为未读 $position", Toast.LENGTH_SHORT).show() },
            { position ->
                currentMessages.removeAt(position)
                setupMessageList(view)
                Toast.makeText(context, "删除消息", Toast.LENGTH_SHORT).show()
            }
        )
    }
}