const CACHEKEY = "cache-v1"
if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("sw-worker.js")
        .then(reg => {
            // регистрация сработала
            console.log("Registration succeeded. Scope is " + reg.scope);
        })
        .catch(error => {
            // регистрация прошла неудачно
            console.log("Registration failed with " + error);
        });
}

const initCache = () => {
    return caches.open(CACHEKEY).then(cache => {
        return cache.addAll([
            "index.html",
            "index.js",
            // "../server/index.js",
            "style/style.css",
            "assets/Search_Magnifying_Glass.svg",
            "assets/5556468.png",
            "assets/double-ticks.png",
            "assets/More_Vertical.svg",
            "assets/video_btn.svg",
            "assets/mic_white.svg",
            " assets/play.svg",
            "assets/pause.svg"
        ]);
    }, (error) => {
        console.log(error)
    })
}
const tryNetwork = (req, timeout) => {
    console.log(req)
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(reject, timeout);
        fetch(req).then((res) => {
            clearTimeout(timeoutId);
            const responseClone = res.clone();
            caches.open(CACHEKEY).then((cache) => {
                cache.put(req, responseClone)
            })
            resolve(res)
        },reject)
    })
}

self.addEventListener('install', (e) => {
    console.log("installed")
    e.waitUntil(initCache())
})
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== CACHEKEY) {
                    return caches.delete(key);
                }
            }))
        })
    )
})
self.addEventListener("fetch", (e) => {
    console.log("try network")
    e.respondWith(tryNetwork(e.request, 400).catch(() => getFromCache(e.request)));
})