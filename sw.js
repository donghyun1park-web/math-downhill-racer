const CACHE_NAME = "math-tower-v8";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./src/game.css",
  "./src/main.js",
  "./src/stageLogic.js",
  "./src/audioFeedback.js",
  "./assets/icon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/maskable-512.png",
  "./assets/sprites/mtb_cockpit.svg",
  "./assets/sprites/rider.svg",
  "./assets/sprites/rider_boost.svg",
  "./assets/sprites/rider_jump.svg",
  "./assets/sprites/rider_mtb_large.svg",
  "./assets/sprites/rider_mtb_lean_left.svg",
  "./assets/sprites/rider_mtb_lean_right.svg",
  "./assets/sprites/rider_mtb_boost.svg",
  "./assets/sprites/rider_mtb_jump.svg",
  "./assets/sprites/rider_mtb_land.svg",
  "./assets/sprites/rider_mtb_slide.svg",
  "./assets/sprites/rider_mtb_boost_large.svg",
  "./assets/sprites/rider_mtb_jump_large.svg",
  "./assets/sprites/bike_shadow.svg",
  "./assets/sprites/boost_flame.svg",
  "./assets/environment/pine_tree.svg",
  "./assets/environment/snow_bank.svg",
  "./assets/environment/course_flag.svg",
  "./assets/environment/rock.svg",
  "./assets/environment/ice_patch.svg",
  "./assets/environment/jump_ramp.svg",
  "./assets/ui/speedometer_panel.svg",
  "./assets/ui/boost_icon.svg",
  "./assets/ui/temp_icon.svg",
  "./assets/ui/star_full.svg",
  "./assets/ui/star_empty.svg",
  "./assets/ui/logo_badge.svg",
  "./assets/ui/button_start.svg",
  "./assets/ui/button_blue.svg",
  "./assets/ui/button_dark.svg",
  "./assets/ui/math_gate_frame.svg",
  "./assets/ui/problem_banner.svg",
  "./assets/ui/jump_button.svg",
  "./assets/environment/course_arrow.svg",
  "./assets/environment/course_fence.svg",
  "./assets/environment/mountain_layer.svg",
  "./assets/environment/mtb_track_tape.svg",
  "./assets/environment/mtb_track_tape_left.svg",
  "./assets/environment/mtb_track_tape_right.svg",
  "./assets/environment/mtb_course_pole.svg",
  "./assets/environment/mtb_course_arrow_blue.svg",
  "./assets/environment/mtb_course_arrow_orange.svg",
  "./assets/environment/mtb_jump_ramp.svg",
  "./assets/environment/mtb_tire_tracks.svg",
  "./assets/environment/mtb_bank_curve.svg",
  "./assets/environment/mtb_course_marker.svg",
  "./assets/environment/mtb_pine_near.svg",
  "./assets/environment/mtb_pine_far.svg",
  "./assets/environment/mtb_snow_bank_large.svg",
  "./assets/environment/mtb_snow_bank_small.svg",
  "./assets/environment/mtb_rock_trackside.svg",
  "./assets/environment/mtb_ice_patch_trackside.svg",
  "./assets/environment/mtb_banner_math_speed.svg",
  "./assets/environment/mtb_checkpoint_flag.svg",
  "./assets/environment/mtb_spectator_flag.svg",
  "./assets/effects/boost_spark.svg",
  "./assets/tower/blocks/block_normal.svg",
  "./assets/tower/blocks/block_selected.svg",
  "./assets/tower/blocks/block_correct.svg",
  "./assets/tower/blocks/block_wrong.svg",
  "./assets/tower/blocks/block_cracked.svg",
  "./assets/tower/blocks/block_locked.svg",
  "./assets/tower/blocks/block_glass_normal.svg",
  "./assets/tower/blocks/block_glass_selected.svg",
  "./assets/tower/blocks/block_glass_correct.svg",
  "./assets/tower/blocks/block_glass_wrong.svg",
  "./assets/tower/blocks/block_glass_cracked.svg",
  "./assets/tower/blocks/block_glass_locked.svg",
  "./assets/tower/character/player_idle.svg",
  "./assets/tower/character/player_jump.svg",
  "./assets/tower/character/player_land.svg",
  "./assets/tower/character/player_wrong.svg",
  "./assets/tower/character/player_celebrate.svg",
  "./assets/tower/background/cloud_far.svg",
  "./assets/tower/background/cloud_near.svg",
  "./assets/tower/background/distant_tower.svg",
  "./assets/tower/background/floating_island.svg",
  "./assets/tower/background/depth_fog.svg",
  "./assets/tower/background/ground_hills.svg",
  "./assets/tower/background/cloud_band.svg",
  "./assets/tower/background/upper_sky_glow.svg",
  "./assets/tower/background/star_field.svg",
  "./assets/tower/background/moon_or_planet_far.svg",
  "./assets/tower/effects/landing_dust.svg",
  "./assets/tower/effects/correct_sparkle.svg",
  "./assets/tower/effects/wrong_crack_flash.svg",
  "./assets/tower/effects/floor_up_glow.svg",
  "./assets/tower/ui/star_glow.svg",
  "./vendor/phaser.min.js"
];

const OPTIONAL_ASSETS = [
  "./assets/sprites/generated/mtb_cockpit_normal.png",
  "./assets/sprites/generated/mtb_cockpit_left.png",
  "./assets/sprites/generated/mtb_cockpit_right.png",
  "./assets/sprites/generated/mtb_cockpit_boost.png",
  "./assets/sprites/generated/mtb_cockpit_jump.png",
  "./assets/sprites/generated/mtb_cockpit_land.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(CORE_ASSETS).then(() =>
        Promise.allSettled(OPTIONAL_ASSETS.map((asset) => cache.add(asset)))
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
