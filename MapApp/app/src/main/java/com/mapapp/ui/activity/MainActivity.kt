package com.mapapp.ui.activity

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.adapter.FragmentStateAdapter
import com.mapapp.databinding.ActivityMainBinding
import com.mapapp.ui.fragment.HomeFragment
import com.mapapp.ui.fragment.MessageFragment
import com.mapapp.ui.fragment.MyFragment
import com.mapapp.ui.fragment.ServiceFragment

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var currentTab = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupViewPager()
        setupBottomNavigation()
        selectTab(0)
    }

    private fun setupViewPager() {
        binding.viewPager.adapter = ViewPagerAdapter(this)
        binding.viewPager.isUserInputEnabled = false
        binding.viewPager.registerOnPageChangeCallback(object : androidx.viewpager2.widget.ViewPager2.OnPageChangeCallback() {
            override fun onPageSelected(position: Int) {
                updateTabUI(position)
            }
        })
    }

    private fun setupBottomNavigation() {
        binding.tabHome.setOnClickListener { selectTab(0) }
        binding.tabService.setOnClickListener { selectTab(1) }
        binding.tabPublish.setOnClickListener {
            Toast.makeText(this, "发布功能", Toast.LENGTH_SHORT).show()
        }
        binding.tabMessage.setOnClickListener { selectTab(2) }
        binding.tabMy.setOnClickListener { selectTab(3) }
    }

    private fun selectTab(position: Int) {
        currentTab = position
        binding.viewPager.currentItem = position
        updateTabUI(position)
    }

    private fun updateTabUI(position: Int) {
        val tabs = listOf(
            binding.ivHome to binding.tvHome,
            binding.ivService to binding.tvService,
            binding.ivMessage to binding.tvMessage,
            binding.ivMy to binding.tvMy
        )

        tabs.forEachIndexed { index, (icon, text) ->
            val isSelected = index == position
            icon.setColorFilter(
                if (isSelected) getColor(com.mapapp.R.color.colorAccent) else getColor(com.mapapp.R.color.tab_unselected)
            )
            text.setTextColor(
                if (isSelected) getColor(com.mapapp.R.color.colorAccent) else getColor(com.mapapp.R.color.tab_unselected)
            )
        }
    }

    inner class ViewPagerAdapter(fa: FragmentActivity) : FragmentStateAdapter(fa) {
        override fun getItemCount(): Int = 4

        override fun createFragment(position: Int): Fragment {
            return when (position) {
                0 -> HomeFragment()
                1 -> ServiceFragment()
                2 -> MessageFragment()
                3 -> MyFragment()
                else -> HomeFragment()
            }
        }
    }
}
