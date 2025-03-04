const defaultMemes = [
    'memes/Meme1.png', 'memes/Meme2.png', 'memes/Meme3.png',
    'memes/Meme5.png', 'memes/Meme6.png', 'memes/Meme7.png', 'memes/GooseDance.gif'
];
// Function to generate a very random userID
function generateRandomUserID() {
  return 'user_' + Math.random().toString(36).substr(2, 9);
}


chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      const isGooseEnabled = true;
      chrome.storage.local.set({ isGooseEnabled: isGooseEnabled });
  
        chrome.storage.local.set({ customMemes: defaultMemes });

        // First check if user has installed before
        chrome.cookies.get({
            url: 'https://artieman2010.github.io/',
            name: 'hasInstalled'
        }, (installedCookie) => {
            if (!installedCookie) {
                // Only track new installations
                chrome.cookies.get({
                    url: 'https://artieman2010.github.io/',
                    name: 'referralCode'
                }, (cookie) => {
                    if (cookie) {
                        fetch('https://escapegooserefer.arthur-luksol.workers.dev', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userID: cookie.value,
                                refCode: "install",
                                captchaToken: ""
                            }),
                        });
                    }
                });

                // Set the installed cookie with 1 year expiration
                chrome.cookies.set({
                    url: 'https://artieman2010.github.io/',
                    name: 'hasInstalled',
                    value: 'true',
                    expirationDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
                });
            }
        });

        const userID = generateRandomUserID();
        chrome.storage.local.set({ userID: userID }, () => {
            console.log('UserID set to', userID);
        });

        chrome.tabs.create({ url: "startup.html", active: true });
    }
});

