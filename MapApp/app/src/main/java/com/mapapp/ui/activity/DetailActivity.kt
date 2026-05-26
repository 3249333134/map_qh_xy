package com.mapapp.ui.activity

import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.mapapp.databinding.ActivityDetailBinding
import com.mapapp.model.MapPoint

class DetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDetailBinding

    companion object {
        private const val EXTRA_POINT = "extra_point"

        fun createIntent(context: Context, point: MapPoint): Intent {
            return Intent(context, DetailActivity::class.java).apply {
                putExtra(EXTRA_POINT, point)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val point = intent.getSerializableExtra(EXTRA_POINT) as? MapPoint

        setupToolbar()
        displayDetail(point)
    }

    private fun setupToolbar() {
        binding.btnBack.setOnClickListener {
            finish()
        }
    }

    private fun displayDetail(point: MapPoint?) {
        point?.let {
            binding.tvTitle.text = it.name
            binding.tvAuthor.text = it.author
            binding.tvAddress.text = it.address
            binding.tvLikes.text = "${it.likes} 赞"
            binding.tvDescription.text = it.description.ifEmpty { "暂无描述" }
        }
    }
}
