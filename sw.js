var cacheName = '2';

var urlsToCache = [
  '/tabata-timer/',
  '/tabata-timer/airhorn.wav',
  '/tabata-timer/bell.wav',
  '/tabata-timer/offline.html'
];

self.addEventListener('install', event => {
  function onInstall(event) {
    return caches.open(cacheName)
      .then(cache => cache.addAll(urlsToCache));
  }
  event.waitUntil(
    onInstall(event)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  function onActivate (event) {
    return caches.keys()
      .then(cacheKeys => {
        var oldCacheKeys = cacheKeys.filter(key => key.indexOf(cacheName) !== 0);
        var deletePromises = oldCacheKeys.map(oldKey => caches.delete(oldKey));
        return Promise.all(deletePromises);
      });
  }
  event.waitUntil(
    onActivate(event)
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  function onFetch (event) {
    var request = event.request;
    // Cache first
    event.respondWith(fetchFromCache(event)
      .catch(() => fetch(request))
      .then(response => addToCache(request, response))
      .catch(() => offlineResponse())
    )
  }
  onFetch(event);
});

function addToCache(request, response) {
  var copy = response.clone(); // Because responses can only be used once
  caches.open(cacheName)
    .then(cache => {
      cache.put(request, copy);
    });
  return response;
}

function fetchFromCache(event) {
  return caches.match(event.request)
    .then(response => {
      if(!response) {
        // A synchronous error that will kick off the catch handler
        throw Error(`${event.request.url} not found in cache`);
      }
    return response;
  });
}

function offlineResponse () {
  if(resourceType === 'content' || resourceType === 'networkOnly') {
    return caches.match('/offline.html');
  }
  return undefined;
}
