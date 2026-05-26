package com.mapapp.ui.fragment

import android.os.Bundle
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.StaggeredGridLayoutManager
import com.google.android.material.chip.Chip
import com.mapapp.R
import com.mapapp.databinding.FragmentHomeSimpleBinding
import com.mapapp.model.Category
import com.mapapp.model.MapPoint
import com.mapapp.model.Location
import com.mapapp.ui.activity.DetailActivity
import com.mapapp.ui.adapter.CardAdapter
import kotlin.math.abs

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeSimpleBinding? = null
    private val binding get() = _binding!!

    private lateinit var cardAdapter: CardAdapter
    private var mapPoints = mutableListOf<MapPoint>()
    private var categories = mutableListOf<Category>()
    private var activeCategory = "all"
    
    private var minHeight = 0
    private var maxHeight = 0
    private var initialY = 0f
    private var initialHeight = 0

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeSimpleBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        val displayMetrics = resources.displayMetrics
        val screenHeight = displayMetrics.heightPixels
        minHeight = screenHeight / 3
        maxHeight = (screenHeight * 0.67).toInt()
        
        setupRecyclerView()
        setupCategoryTabs()
        setupDragView()
        setupClickListeners()
        loadMockData()
        
        val params = binding.contentContainer.layoutParams
        params.height = screenHeight / 2
        binding.contentContainer.layoutParams = params
    }

    private fun setupRecyclerView() {
        cardAdapter = CardAdapter { point, type ->
            when (type) {
                "media" -> {
                    val intent = DetailActivity.createIntent(requireContext(), point)
                    startActivity(intent)
                }
                "content" -> {
                    Toast.makeText(requireContext(), "地图定位: ${point.name}", Toast.LENGTH_SHORT).show()
                }
            }
        }

        binding.recyclerCards.layoutManager = StaggeredGridLayoutManager(2, StaggeredGridLayoutManager.VERTICAL)
        binding.recyclerCards.adapter = cardAdapter
    }

    private fun setupCategoryTabs() {
        categories = mutableListOf(
            Category("all", "全部"),
            Category("food", "美食"),
            Category("scenery", "风景"),
            Category("culture", "文化"),
            Category("entertainment", "娱乐"),
            Category("shopping", "购物")
        )

        binding.chipGroupCategories.removeAllViews()
        categories.forEachIndexed { index, category ->
            val chip = Chip(requireContext()).apply {
                text = category.name
                isCheckable = true
                isChecked = index == 0
                setOnCheckedChangeListener { _, isChecked ->
                    if (isChecked) {
                        activeCategory = category.id
                        filterByCategory(category.id)
                    }
                }
            }
            binding.chipGroupCategories.addView(chip)
        }
    }

    private fun setupDragView() {
        binding.dragHandle.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialY = event.rawY
                    initialHeight = binding.contentContainer.height
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val deltaY = initialY - event.rawY
                    var newHeight = initialHeight + deltaY.toInt()
                    newHeight = newHeight.coerceIn(minHeight, maxHeight)
                    val params = binding.contentContainer.layoutParams
                    params.height = newHeight
                    binding.contentContainer.layoutParams = params
                    true
                }
                else -> false
            }
        }
    }

    private fun setupClickListeners() {
        binding.btnLocation.setOnClickListener {
            Toast.makeText(requireContext(), "定位功能", Toast.LENGTH_SHORT).show()
        }

        binding.btnAction.setOnClickListener {
            Toast.makeText(requireContext(), "操作按钮", Toast.LENGTH_SHORT).show()
        }

        binding.etSearch.setOnClickListener {
            Toast.makeText(requireContext(), "搜索功能", Toast.LENGTH_SHORT).show()
        }
    }

    private fun loadMockData() {
        mapPoints = mutableListOf(
            MapPoint(_id = "1", name = "美丽的公园", author = "小明", likes = 128, 
                description = "一个非常美丽的公园，适合周末游玩", 
                address = "北京市朝阳区", 
                location = Location(coordinates = listOf(116.4074, 39.9042))),
            MapPoint(_id = "2", name = "历史博物馆", author = "小红", likes = 89, 
                description = "展示丰富历史文物的博物馆", 
                address = "北京市东城区", 
                location = Location(coordinates = listOf(116.4100, 39.9100))),
            MapPoint(_id = "3", name = "特色小吃街", author = "小刚", likes = 256, 
                description = "各种北京特色小吃应有尽有", 
                address = "北京市西城区", 
                location = Location(coordinates = listOf(116.3800, 39.9200))),
            MapPoint(_id = "4", name = "现代艺术馆", author = "小美", likes = 67, 
                description = "展示当代艺术作品的画廊", 
                address = "北京市海淀区", 
                location = Location(coordinates = listOf(116.3200, 39.9500))),
            MapPoint(_id = "5", name = "城市广场", author = "小华", likes = 145, 
                description = "城市中心的大型广场", 
                address = "北京市丰台区", 
                location = Location(coordinates = listOf(116.2800, 39.8500))),
            MapPoint(_id = "6", name = "湖边咖啡馆", author = "小李", likes = 98, 
                description = "环境优雅的湖边咖啡馆", 
                address = "北京市通州区", 
                location = Location(coordinates = listOf(116.6500, 39.9000)))
        )
        cardAdapter.submitList(mapPoints.toList())
    }

    private fun filterByCategory(categoryId: String) {
        if (categoryId == "all") {
            cardAdapter.submitList(mapPoints.toList())
        } else {
            cardAdapter.submitList(mapPoints.filter { it._id.hashCode() % 2 == 0 })
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
