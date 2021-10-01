// https://stackoverflow.com/questions/49971575/chrome-fetch-api-cannot-load-file-how-to-workaround
if (/^file:\/\/\//.test(location.href) && /chrome/i.test(navigator.userAgent)) {
    let path = './';
    let orig = fetch;
    window.fetch = (resource) => ((/^[^/:]*:/.test(resource)) ?
        orig(resource) :
        new Promise(function(resolve, reject) {
            let request = new XMLHttpRequest();

            let fail = (error) => {reject(error)};
            ['error', 'abort'].forEach((event) => { request.addEventListener(event, fail); });

            let pull = (expected) => (new Promise((resolve, reject) => {
                if (expected == 'json') {
                    try {
                        resolve(JSON.parse(request.response))
                    } catch(e) {}
                }
                if (
                    request.responseType == expected ||
                    (expected == 'text' && !request.responseType)
                )
                    resolve(request.response);
                else
                    reject(request.responseType);
            }));

            request.addEventListener('load', () => (resolve({
                arrayBuffer : () => (pull('arraybuffer')),
                blob        : () => (pull('blob')),
                text        : () => (pull('text')),
                json        : () => (pull('json'))
            })));
            request.open('GET', resource.replace(/^\//, path));
            request.send();
        })
    );
}