const CACHE_NAME = "mantravoice-v1";

const FILES_TO_CACHE = [
  "/mantravoice/",
  "/mantravoice/index.html",
  "/mantravoice/style.css",
  "/mantravoice/app.js",
  "/mantravoice/manifest.json",
  "/mantravoice/icon-192.png",
  "/mantravoice/icon-512.png"
];


/* ================================
   INSTALL
================================ */

self.addEventListener("install", function(event) {

  event.waitUntil(

    caches.open(CACHE_NAME).then(function(cache) {

      return cache.addAll(FILES_TO_CACHE);

    })

  );

  self.skipWaiting();

});


/* ================================
   ACTIVATE
================================ */

self.addEventListener("activate", function(event) {

  event.waitUntil(

    caches.keys().then(function(names) {

      return Promise.all(

        names.map(function(name) {

          if (name !== CACHE_NAME) {

            return caches.delete(name);

          }

        })

      );

    })

  );

  self.clients.claim();

});


/* ================================
   FETCH
================================ */

self.addEventListener("fetch", function(event) {

  event.respondWith(

    caches.match(event.request).then(function(response) {

      if (response) {

        return response;

      }

      return fetch(event.request);

    })

  );

});
