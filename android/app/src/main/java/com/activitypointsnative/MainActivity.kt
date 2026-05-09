package com.activitypointsnative

import android.animation.AnimatorListenerAdapter
import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.animation.AnticipateInterpolator
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "ActivityPointsNative"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    // installSplashScreen() MUST be called before super.onCreate()
    val splashScreen = installSplashScreen()

    super.onCreate(savedInstanceState)

    // Custom exit animation (Android 12+ only)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      splashScreen.setOnExitAnimationListener { splashScreenViewProvider ->
        val splashScreenView = splashScreenViewProvider.view
        val iconView = splashScreenViewProvider.iconView

        val scaleX = ObjectAnimator.ofFloat(iconView, View.SCALE_X, 1f, 0f)
        val scaleY = ObjectAnimator.ofFloat(iconView, View.SCALE_Y, 1f, 0f)
        val fadeIcon = ObjectAnimator.ofFloat(iconView, View.ALPHA, 1f, 0f)
        val fadeBackground = ObjectAnimator.ofFloat(splashScreenView, View.ALPHA, 1f, 0f)

        val iconAnimator = AnimatorSet().apply {
          playTogether(scaleX, scaleY, fadeIcon)
          duration = 400
          interpolator = AnticipateInterpolator()
        }

        val bgAnimator = AnimatorSet().apply {
          play(fadeBackground)
          duration = 500
          startDelay = 200
        }

        AnimatorSet().apply {
          playTogether(iconAnimator, bgAnimator)
          addListener(object : AnimatorListenerAdapter() {
            override fun onAnimationEnd(animation: android.animation.Animator) {
              splashScreenViewProvider.remove()
            }
          })
          start()
        }
      }
    }
  }
}
