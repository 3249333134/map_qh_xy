package com.mapapp.ui.fragment

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.StaggeredGridLayoutManager
import com.mapapp.R
import com.mapapp.ui.adapter.FavoriteAdapter

class MyFragment : Fragment() {

    private var activeModule = "favorite"
    private var favoriteData = mutableListOf<com.mapapp.model.FavoriteItem>()
    private lateinit var favoriteAdapter: FavoriteAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_my, container, false)

        loadMockData()
        setupTabs(view)
        setupFavoriteList(view)

        return view
    }

    private fun loadMockData() {
        favoriteData = mutableListOf(
            com.mapapp.model.FavoriteItem("f1", "收藏1", "作者1", "2024-01-01"),
            com.mapapp.model.FavoriteItem("f2", "收藏2", "作者2", "2024-01-02"),
            com.mapapp.model.FavoriteItem("f3", "收藏3", "作者3", "2024-01-03"),
            com.mapapp.model.FavoriteItem("f4", "收藏4", "作者4", "2024-01-04"),
            com.mapapp.model.FavoriteItem("f5", "收藏5", "作者5", "2024-01-05"),
            com.mapapp.model.FavoriteItem("f6", "收藏6", "作者6", "2024-01-06")
        )
    }

    private fun setupTabs(view: View) {
        val tabs = listOf(
            view.findViewById<View>(R.id.tab_favorite),
            view.findViewById<View>(R.id.tab_date),
            view.findViewById<View>(R.id.tab_location)
        )
        val tabTexts = listOf("收藏", "日程", "位置")

        tabs.forEachIndexed { index, tab ->
            tab.setOnClickListener {
                activeModule = when (index) {
                    0 -> "favorite"
                    1 -> "date"
                    else -> "location"
                }
                updateTabSelection(tabs, index)
                Toast.makeText(context, tabTexts[index], Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun updateTabSelection(tabs: List<View>, selectedIndex: Int) {
        tabs.forEachIndexed { index, tab ->
            val textView = (tab as ViewGroup).getChildAt(0) as TextView
            if (index == selectedIndex) {
                textView.setTextColor(resources.getColor(R.color.chip_selected))
            } else {
                textView.setTextColor(resources.getColor(R.color.chip_text))
            }
        }
    }

    private fun setupFavoriteList(view: View) {
        val recyclerView = view.findViewById<androidx.recyclerview.widget.RecyclerView>(R.id.recycler_favorites)
        recyclerView.layoutManager = StaggeredGridLayoutManager(2, StaggeredGridLayoutManager.VERTICAL)
        
        favoriteAdapter = FavoriteAdapter { item ->
            Toast.makeText(context, "点击收藏: ${item.title}", Toast.LENGTH_SHORT).show()
        }
        
        recyclerView.adapter = favoriteAdapter
        favoriteAdapter.submitList(favoriteData)
    }
}