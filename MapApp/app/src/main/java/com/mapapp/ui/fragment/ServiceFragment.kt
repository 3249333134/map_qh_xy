package com.mapapp.ui.fragment

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.StaggeredGridLayoutManager
import com.google.android.material.chip.Chip
import com.mapapp.R
import com.mapapp.databinding.FragmentServiceBinding
import com.mapapp.model.Category
import com.mapapp.model.MapPoint
import com.mapapp.model.Location
import com.mapapp.ui.adapter.ServiceCardAdapter

class ServiceFragment : Fragment() {

    private var _binding: FragmentServiceBinding? = null
    private val binding get() = _binding!!

    private lateinit var serviceAdapter: ServiceCardAdapter
    private var servicePoints = mutableListOf<MapPoint>()
    private var categories = mutableListOf<Category>()
    private var activeCategory = "all"

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentServiceBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        setupCategoryTabs()
        setupDragView()
        setupClickListeners()
        loadMockData()
    }

    private fun setupRecyclerView() {
        serviceAdapter = ServiceCardAdapter { point, type ->
            when (type) {
                "media" -> {
                    Toast.makeText(requireContext(), "查看详情: ${point.name}", Toast.LENGTH_SHORT).show()
                }
                "content" -> {
                    Toast.makeText(requireContext(), "点击地图定位", Toast.LENGTH_SHORT).show()
                }
                "reserve" -> {
                    Toast.makeText(requireContext(), "预约: ${point.name}", Toast.LENGTH_SHORT).show()
                }
            }
        }

        binding.recyclerServices.apply {
            layoutManager = StaggeredGridLayoutManager(2, StaggeredGridLayoutManager.VERTICAL)
            adapter = serviceAdapter
        }
    }

    private fun setupCategoryTabs() {
        categories = mutableListOf(
            Category("all", "全部"),
            Category("restaurant", "餐饮"),
            Category("hotel", "酒店"),
            Category("hospital", "医院"),
            Category("bank", "银行"),
            Category("shop", "商店")
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
        val params = binding.contentContainer.layoutParams
        params.height = resources.displayMetrics.heightPixels / 2
        binding.contentContainer.layoutParams = params
    }

    private fun setupClickListeners() {
        binding.btnLocation.setOnClickListener {
            Toast.makeText(requireContext(), "定位功能", Toast.LENGTH_SHORT).show()
        }

        binding.btnAction.setOnClickListener {
            Toast.makeText(requireContext(), "服务操作", Toast.LENGTH_SHORT).show()
        }
    }

    private fun loadMockData() {
        servicePoints = mutableListOf(
            MapPoint(_id = "s1", name = "麦当劳", author = "商家", likes = 50, type = "restaurant",
                location = Location(coordinates = listOf(116.4074, 39.9042))),
            MapPoint(_id = "s2", name = "肯德基", author = "商家", likes = 45, type = "restaurant",
                location = Location(coordinates = listOf(116.4100, 39.9060))),
            MapPoint(_id = "s3", name = "如家酒店", author = "商家", likes = 30, type = "hotel",
                location = Location(coordinates = listOf(116.4050, 39.9020))),
            MapPoint(_id = "s4", name = "北京医院", author = "商家", likes = 20, type = "hospital",
                location = Location(coordinates = listOf(116.4150, 39.9080))),
            MapPoint(_id = "s5", name = "工商银行", author = "商家", likes = 15, type = "bank",
                location = Location(coordinates = listOf(116.4080, 39.9050))),
            MapPoint(_id = "s6", name = "便利店", author = "商家", likes = 40, type = "shop",
                location = Location(coordinates = listOf(116.4060, 39.9070)))
        )
        serviceAdapter.submitList(servicePoints.toList())
    }

    private fun filterByCategory(categoryId: String) {
        if (categoryId == "all") {
            serviceAdapter.submitList(servicePoints.toList())
        } else {
            serviceAdapter.submitList(servicePoints.filter { it.type == categoryId })
        }
    }

    override fun onResume() {
        super.onResume()
    }

    override fun onPause() {
        super.onPause()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}