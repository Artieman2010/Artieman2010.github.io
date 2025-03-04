// DOM Element References
const siteInput = document.getElementById("site-input");
const blockDurationInput = document.getElementById("block-duration");
const siteList = document.getElementById("site-list");
const addSiteButton = document.getElementById("add-site");
const categoryDropdown = document.getElementById("category-dropdown");
const toggleGooseButton = document.getElementById("toggle-goose");

const addMemesButton = document.getElementById("add-memes");
const memeList = document.getElementById("meme-list");
const toggleMemesButton = document.getElementById("toggle-memes");
const memeUploadInput = document.getElementById("meme-upload");

const toggleSoundButton = document.getElementById("toggle-sound");

// Constants
const MEME_LIMIT = 20;
const TIER_DATA = {
  newbie: { threshold: 0, next: 1, color: '#cccccc', name: 'Newbie' },
  rookie: { threshold: 1, next: 3, color: '#90caf9', name: 'Rookie' },
  expert: { threshold: 3, next: 10, color: '#a5d6a7', name: 'Expert' },
  master: { threshold: 10, next: null, color: '#ffcc80', name: 'Master' }
};
const socialMediaSites = [
  "www.facebook.com", "www.x.com", "www.twitter.com", "www.instagram.com", "www.linkedin.com",
  "www.snapchat.com", "www.pinterest.com", "www.tiktok.com", "www.reddit.com",
  "www.whatsapp.com", "www.telegram.org", "www.tumblr.com", "www.flickr.com"
];
const newsSites = [
  "www.cnn.com", "www.bbc.com", "www.nytimes.com", "www.theguardian.com",
  "www.washingtonpost.com", "www.forbes.com", "www.reuters.com", "www.aljazeera.com",
  "www.bbc.co.uk", "www.huffpost.com", "www.usatoday.com", "www.bloomberg.com",
  "www.abcnews.go.com", "www.news.yahoo.com", "www.nbcnews.com", "www.economist.com",
  "www.foxnews.com", "www.newsmax.com", "www.cbsnews.com", "www.npr.org",
  "www.thehill.com", "www.marketwatch.com", "www.time.com", "www.msnbc.com",
  "www.thetelegraph.co.uk", "www.sky.com", "www.independent.co.uk", "www.theage.com.au",
  "www.smh.com.au", "www.thewrap.com", "www.dailybeast.com", "www.latimes.com",
  "www.nydailynews.com", "www.charlotteobserver.com", "www.thedailybeast.com",
  "www.dailymail.co.uk", "www.thetimes.co.uk", "www.lemonde.fr", "www.spiegel.de",
  "www.welt.de", "www.scmp.com", "www.hindustantimes.com", "www.ndtv.com",
  "www.theeconomictimes.com", "www.businessinsider.com", "www.ft.com", "www.reuters.co.uk"
];
const onlineGamingSites = [
  "www.steam.com", "www.leagueoflegends.com", "www.fortnite.com", "www.epicgames.com",
  "www.minecraft.net", "www.riotgames.com", "www.battle.net", "www.blizzard.com",
  "www.roblox.com", "www.electronicarts.com", "www.nintendo.com", "www.playstation.com",
  "www.xbox.com", "www.origin.com", "www.gamespot.com", "www.ign.com", "www.gamefaqs.gamespot.com",
  "www.poki.com", "www.armor-games.com", "www.kongregate.com", "www.addictinggames.com",
  "www.newgrounds.com", "www.miniclip.com", "www.y8.com", "www.nitrome.com", "www.unblockedgames66.com",
  "www.coolmathgames.com", "www.plays.org", "www.gog.com", "www.bigfishgames.com", "www.itch.io",
  "www.gamesradar.com", "www.spilgames.com", "www.freetoplaygames.com", "www.adultswim.com/games",
  "www.jackboxgames.com", "www.kongregate.com", "www.gameinformer.com", "www.metacritic.com/games",
  "www.mmo-champion.com", "www.wowhead.com", "www.mmo-sites.com", "www.zylom.com", "www.skidrowgames.com",
  "www.moddb.com", "www.gamesindustry.biz", "www.gamerant.com", "www.grindinggear.com",
  "www.horrorgames.com", "www.mobilegames.com", "www.friv.com"
];

// Add this near the top with other constants
const LOADING_SPINNER = `<div class="loading-spinner"></div>`;

// Add near the top with other constants
const CACHE_KEY = 'cachedScoreData';

// Tab Management
function initializeTabs() {
  document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(`${tabId}-tab`).classList.add('active');
      });
    });
  });
}

// Site Blocking Management
class SiteBlockManager {
  static loadBlockedSites() {
    chrome.storage.local.get(["blockedSites"], (result) => {
      let sites = result.blockedSites || [];
      const now = Date.now();

      sites = sites.map(site => ({
        ...site,
        isExpired: site.expiresAt && site.expiresAt <= now
      }));

      chrome.storage.local.set({ blockedSites: sites }, () => {
        SiteBlockManager.renderSiteList(sites);
      });
    });
  }

  static renderSiteList(sites) {
    siteList.innerHTML = "";

    const selectAllCheckbox = document.createElement("input");
    selectAllCheckbox.type = "checkbox";
    selectAllCheckbox.id = "select-all-checkbox";
    const selectAllLabel = document.createElement("label");
    selectAllLabel.textContent = "Select All";
    selectAllLabel.setAttribute("for", "select-all-checkbox");

    const refreshButton = document.createElement("button");
    refreshButton.id = "refresh-button";
    refreshButton.innerHTML = `<i class="fas fa-sync-alt"></i> Refresh`;
    refreshButton.addEventListener("click", () => {
      refreshButton.innerHTML = "Loading...";
      setTimeout(() => {
        SiteBlockManager.loadBlockedSites();
        refreshButton.innerHTML = `<i class="fas fa-sync-alt"></i> Refresh`;
      }, 500);
    });

    const controlContainer = document.createElement("div");
    controlContainer.style.display = "flex";
    controlContainer.style.justifyContent = "space-between";
    controlContainer.style.alignItems = "center";
    controlContainer.style.width = "100%";

    const selectAllContainer = document.createElement("div");
    selectAllContainer.appendChild(selectAllCheckbox);
    selectAllContainer.appendChild(selectAllLabel);
    controlContainer.appendChild(selectAllContainer);
    controlContainer.appendChild(refreshButton);

    siteList.appendChild(controlContainer);
    siteList.appendChild(document.createElement("br"));

    selectAllCheckbox.addEventListener("change", () => {
      const checkboxes = document.querySelectorAll(".site-checkbox");
      checkboxes.forEach((checkbox) => {
        checkbox.checked = selectAllCheckbox.checked;
        const row = checkbox.closest("li");
        if (checkbox.checked) {
          row.classList.add("selected");
        } else {
          row.classList.remove("selected");
        }
        const checkboxes = document.querySelectorAll(".site-checkbox:checked");
        SiteBlockManager.helperchangeextendanddelete(checkboxes);
      });
    });

    sites.forEach((site) => {
      const li = document.createElement("li");
      li.classList.add("site-item");

      const siteCheckbox = document.createElement("input");
      siteCheckbox.type = "checkbox";
      siteCheckbox.classList.add("site-checkbox");
      siteCheckbox.value = site.name;
      siteCheckbox.addEventListener("change", () => {
        if (siteCheckbox.checked) {
          li.classList.add("selected");
          SiteBlockManager.handleCheckBoxChangeExtra();
        } else {
          li.classList.remove("selected");
          SiteBlockManager.handleCheckBoxChangeExtra();
        }
      });

      li.appendChild(siteCheckbox);

      const siteName = document.createElement("span");
      siteName.textContent = site.name;

      // Update display text based on expiry and isExpired flag
      if (site.expiresAt) {
        if (site.isExpired) {
          siteName.textContent += " (Deletable)";
        } else {
          const timeLeft = Math.max(0, site.expiresAt - Date.now());
          if (timeLeft < 3600000) {
            siteName.textContent += " (Expiring soon)";
          } else {
            siteName.textContent += ` (expires in ${Math.ceil(timeLeft / 3600000)} hours)`;
          }
        }
      } else {
        siteName.textContent += " (Deletable)";
      }

      li.appendChild(siteName);

      const extendButton = document.createElement("button");
      extendButton.innerHTML = `<i class="fas fa-clock"></i> Extend 3 Hours`;
      extendButton.addEventListener("click", () => SiteBlockManager.extendBlock(site.name, 3 * 3600000));
      li.appendChild(extendButton);

      const deleteButton = document.createElement("button");
      deleteButton.innerHTML = `<i class="fas fa-trash"></i> Delete`;

      // Update delete button state based on expiry and isExpired flag
      if (site.expiresAt && !site.isExpired) {
        deleteButton.classList.add("disabled");
        deleteButton.setAttribute("disabled", "true");
      } else {
        deleteButton.addEventListener("click", () => SiteBlockManager.deleteSite(site.name));
      }

      li.appendChild(deleteButton);
      siteList.appendChild(li);
    });

    const deleteSelectedButton = document.createElement("button");
    deleteSelectedButton.id = "delete-selected";
    deleteSelectedButton.classList.add("delete-selected");
    deleteSelectedButton.innerHTML = `<i class="fas fa-trash"></i> Delete Selected Sites`;
    deleteSelectedButton.addEventListener("click", SiteBlockManager.deleteSelectedSites);
    siteList.appendChild(deleteSelectedButton);

    const extendSelectedButton = document.createElement("button");
    extendSelectedButton.id = "extend-selected";
    extendSelectedButton.classList.add("extend-selected");
    extendSelectedButton.innerHTML = `<i class="fas fa-clock"></i> Extend Block Time for Selected Sites (3 hours)`;
    extendSelectedButton.addEventListener("click", SiteBlockManager.extendSelectedSites);
    siteList.appendChild(extendSelectedButton);

    SiteBlockManager.handleCheckBoxChangeExtra();
  }

  static addSite() {
    const newSiteName = siteInput.value.trim();
    const blockDuration = blockDurationInput.value.trim();
    const category = document.getElementById("category-dropdown").value;

    if (/^\d+$/.test(newSiteName) && (category === "custom" || category === "")) {
      alert("The input cannot be only a number. Please enter a valid website or keyword.");
      return;
    }
    if (newSiteName.replace(/\s/g, '') === '' && (category === "custom" || category === "")) {
      alert("Please enter a valid website or keyword.");
      return;
    }
    const durationInHours = blockDuration === "" || isNaN(blockDuration) || Number(blockDuration) <= 0 ? 0 : parseInt(blockDuration);

    let sitesToAdd = [];
    if (category === "social-media") {
      sitesToAdd = socialMediaSites;
    } else if (category === "news-sites") {
      sitesToAdd = newsSites;
    } else if (category === "online-gaming") {
      sitesToAdd = onlineGamingSites;
    } else if (category === "custom" || category === "") {
      sitesToAdd = [newSiteName];
    }

    const now = Date.now();
    const newSites = sitesToAdd.map((site) => ({
      name: site,
      expiresAt: durationInHours > 0 ? now + durationInHours * 3600000 : null,
    }));

    chrome.storage.local.get(["blockedSites"], (result) => {
      const sites = result.blockedSites || [];
      newSites.forEach((newSite) => {
        const existingIndex = sites.findIndex(site => site.name === newSite.name);

        if (existingIndex !== -1) {
          const existingSite = sites[existingIndex];

          if ((existingSite.expiresAt && newSite.expiresAt && existingSite.expiresAt < newSite.expiresAt) ||
            (!existingSite.expiresAt && newSite.expiresAt)) {
            sites[existingIndex] = newSite;
          }
        } else {
          sites.push(newSite);
        }
      });

      chrome.storage.local.set({ blockedSites: sites }, () => {
        SiteBlockManager.loadBlockedSites();
      });
    });

    siteInput.value = "";
    blockDurationInput.value = "";
  }

  static deleteSite(siteName) {
    chrome.storage.local.get(["blockedSites"], (result) => {
      const sites = result.blockedSites || [];
      const updatedSites = sites.filter((site) => site.name !== siteName.toLowerCase());
      chrome.storage.local.set({ blockedSites: updatedSites }, () => {
        SiteBlockManager.loadBlockedSites();
      });
    });
  }

  static extendBlock(siteName, additionalTime) {
    chrome.storage.local.get(["blockedSites"], (result) => {
      const sites = result.blockedSites || [];
      const site = sites.find((s) => s.name === siteName.toLowerCase());
      if (site) {
        const now = Date.now();
        // If expired or no expiry time, use current time as base
        site.expiresAt = Math.max(site.expiresAt || now, now) + additionalTime;
        chrome.storage.local.set({ blockedSites: sites }, () => {
          SiteBlockManager.loadBlockedSites();
        });
      }
    });
  }

  static extendSelectedSites() {
    const selectedSites = [];
    const checkboxes = document.querySelectorAll(".site-checkbox:checked");

    checkboxes.forEach((checkbox) => {
      selectedSites.push(checkbox.value);
    });

    if (selectedSites.length > 0) {
      chrome.storage.local.get(["blockedSites"], (result) => {
        const sites = result.blockedSites || [];
        const now = Date.now();
        selectedSites.forEach((siteName) => {
          const site = sites.find((s) => s.name === siteName);
          if (site) {
            // If expired or no expiry time, use current time as base
            site.expiresAt = Math.max(site.expiresAt || now, now) + (3 * 3600000);
          }
        });

        chrome.storage.local.set({ blockedSites: sites }, () => {
          SiteBlockManager.loadBlockedSites();
        });
      });
    }
  }

  static deleteSelectedSites() {
    const selectedSites = [];
    const checkboxes = document.querySelectorAll(".site-checkbox:checked");

    checkboxes.forEach((checkbox) => {
      selectedSites.push(checkbox.value);
    });

    if (selectedSites.length > 0) {
      chrome.storage.local.get(["blockedSites"], (result) => {
        const sites = result.blockedSites || [];
        const updatedSites = sites.filter((site) => !selectedSites.includes(site.name) || Math.max(0, site.expiresAt - Date.now()) > 0);
        const unabletoDeleteSites = sites.filter((site) => selectedSites.includes(site.name) && Math.max(0, site.expiresAt - Date.now()) > 0);

        chrome.storage.local.set({ blockedSites: updatedSites }, () => {
          SiteBlockManager.loadBlockedSites();
        });

        if (unabletoDeleteSites.length > 0) {
          const unableToDeleteSiteNames = unabletoDeleteSites.map(site => site.name).join(", ");
          alert(`The following sites/keywords could not be deleted as their expiry has not been reached: ${unableToDeleteSiteNames}`);
        }
      });
    }
  }

  static helperchangeextendanddelete(query) {
    if (query.length === 0) {
      document.getElementById("delete-selected").classList.add("disabled");
      document.getElementById("delete-selected").setAttribute("disabled", "true");
      document.getElementById("extend-selected").classList.add("disabled");
      document.getElementById("extend-selected").setAttribute("disabled", "true");
    } else {
      document.getElementById("delete-selected").classList.remove("disabled");
      document.getElementById("delete-selected").removeAttribute("disabled");
      document.getElementById("extend-selected").classList.remove("disabled");
      document.getElementById("extend-selected").removeAttribute("disabled");
    }
  }

  static handleCheckBoxChangeExtra() {
    const checkboxes = document.querySelectorAll(".site-checkbox:checked");
    SiteBlockManager.helperchangeextendanddelete(checkboxes);

    chrome.storage.local.get(["blockedSites"], (result) => {
      const sites = result.blockedSites || [];
      if (sites.length === checkboxes.length) {
        document.getElementById("select-all-checkbox").checked = true;
      } else {
        document.getElementById("select-all-checkbox").checked = false;
      }
    });
  }

  
}

// Meme Management
class MemeManager {
  static renderMemeList(memes) {
    memeList.innerHTML = "";
    memes.forEach((meme, index) => {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.alignItems = "center";
      li.style.marginBottom = "10px";

      const img = document.createElement("img");
      img.src = meme;
      img.style.width = "100px";
      img.style.height = "100px";
      img.style.objectFit = "cover";
      img.style.marginRight = "10px";
      img.style.borderRadius = "5px";
      img.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.style.backgroundColor = "#ff4d4d";
      deleteButton.style.color = "#fff";
      deleteButton.style.border = "none";
      deleteButton.style.padding = "5px 10px";
      deleteButton.style.borderRadius = "5px";
      deleteButton.style.cursor = "pointer";
      deleteButton.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
      deleteButton.addEventListener("click", () => {
        MemeManager.deleteMeme(index);
      });

      li.appendChild(img);
      li.appendChild(deleteButton);
      memeList.appendChild(li);
    });
    MemeManager.updateMemeCounter(memes.length);
    MemeManager.updateDropdownToggleText(memes.length);

    let memeCounter = document.getElementById("meme-counter");
    if (!memeCounter) {
      memeCounter = document.createElement("div");
      memeCounter.id = "meme-counter";
      memeCounter.style.marginTop = "10px";
      memeList.parentElement.insertBefore(memeCounter, memeList.nextSibling);
    }
    memeCounter.textContent = `${memes.length}/${MEME_LIMIT} Memes`;
  }

  static deleteMeme(index) {
    chrome.storage.local.get(['customMemes'], (result) => {
      const memes = result.customMemes || [];
      memes.splice(index, 1);
      chrome.storage.local.set({ customMemes: memes }, () => {
        MemeManager.renderMemeList(memes);
        MemeManager.updateDropdownToggleText(memes.length);
      });
    });
  }

  static updateMemeCounter(count) {
    const counter = document.getElementById("meme-counter");
    if (counter) {
      counter.textContent = `${count}/${MEME_LIMIT} Memes`;
    }
    MemeManager.updateDropdownToggleText(count);
  }

  static updateDropdownToggleText(count) {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    if (dropdownToggle) {
      dropdownToggle.textContent = count === 0 ? "Upload Your Memes (No Memes Stored Currently)" : "Upload Your Memes";
    }
  }

  static initializeMemeInterval() {
    const memeIntervalInput = document.getElementById("meme-interval");
    memeIntervalInput.addEventListener('change', () => {
      const memeInterval = parseInt(memeIntervalInput.value) * 1000;
      if (memeInterval >= 5000) {
        chrome.storage.local.set({ memeInterval });
      } else {
        alert("The time between each meme must be at least 5 seconds.");
        memeIntervalInput.value = "5";
      }
    });
  }

  static handleMemeUpload(files) {
    const memeURLs = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = function(event) {
            memeURLs.push(event.target.result);
            if (memeURLs.length === files.length) {
                chrome.storage.local.get(['customMemes'], (result) => {
                    const existingMemes = result.customMemes || [];
                    const totalMemes = existingMemes.length + memeURLs.length;
                    if (totalMemes > MEME_LIMIT) {
                        alert(`You can only upload up to ${MEME_LIMIT} memes. You have ${existingMemes.length} memes already.`);
                        return;
                    }
                    const updatedMemes = [...existingMemes, ...memeURLs].slice(0, MEME_LIMIT);
                    chrome.storage.local.set({ customMemes: updatedMemes }, () => {
                        MemeManager.renderMemeList(updatedMemes);
                        MemeManager.updateMemeCounter(updatedMemes.length);
                    });
                });
            }
        };
        reader.readAsDataURL(file);
    }
  }
}

// Referral System
class ReferralSystem {
  static generateRandomUserID() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  static handleReferralLogic(captchaToken) {
    chrome.storage.local.get(['referralLinks', 'userID'], function (result) {
      let userID = result.userID;
      if (!userID) {
        userID = ReferralSystem.generateRandomUserID();
        chrome.storage.local.set({ userID: userID });
      }

      const existingLinks = result.referralLinks || [];

      if (existingLinks.length >= 2) {
        ReferralSystem.displayExistingLinks(existingLinks);
        alert('Maximum number of referral links (2) already created');
        return;
      }

      const refCode = ReferralSystem.generateReferralCode();
      const referralLink = `https://share.escapegoose.com?ref=${refCode}`;

      const updatedLinks = [...existingLinks, {
        code: refCode,
        url: referralLink,
        createdAt: Date.now()
      }];

      chrome.storage.local.set({ referralLinks: updatedLinks }, () => {
        ReferralSystem.displayExistingLinks(updatedLinks);
        console.log(JSON.stringify({
          userID: userID,
          refCode: refCode,
          captchaToken: captchaToken
        }));
     fetch('https://escapegooserefer.arthur-luksol.workers.dev', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userID: userID,
            refCode: refCode,
            captchaToken: captchaToken,
          }),
        });
        
      });
    });
  }

  static displayExistingLinks(links) {
    const oldContainers = document.querySelectorAll('.referral-link-container');
    oldContainers.forEach(container => container.remove());

    const linksContainer = document.createElement('div');
    linksContainer.className = 'referral-link-container';
    linksContainer.style.marginTop = '15px';

    links.forEach((link, index) => {
      const linkElement = document.createElement('div');
      linkElement.style.marginBottom = '10px';
      linkElement.style.display = 'flex';
      linkElement.style.alignItems = 'center';
      linkElement.style.gap = '10px';

      const input = document.createElement('input');
      input.type = 'text';
      input.value = link.url;
      input.readOnly = true;
      input.style.width = '300px';

      const copyButton = document.createElement('button');
      copyButton.textContent = 'Copy';
      copyButton.style.width = 'auto';
      copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(link.url);
      });

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.style.width = 'auto';
      deleteButton.style.backgroundColor = '#ff4d4d';
      deleteButton.addEventListener('click', () => {
        ReferralSystem.deleteReferralLink(index);
      });

      linkElement.appendChild(input);
      linkElement.appendChild(copyButton);
      linkElement.appendChild(deleteButton);
      linksContainer.appendChild(linkElement);
    });

    document.getElementById('track-referral').insertAdjacentElement('afterend', linksContainer);
  }

  static deleteReferralLink(index) {
    chrome.storage.local.get(['referralLinks'], function (result) {
      const links = result.referralLinks || [];
      const updatedLinks = links.filter((_, i) => i !== index);
      chrome.storage.local.set({ referralLinks: updatedLinks }, () => {
        ReferralSystem.displayExistingLinks(updatedLinks);
      });
    });
  }

  static generateReferralCode() {
    const length = 8;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static loadExistingReferralLinks() {
    chrome.storage.local.get(['referralLinks'], function (result) {
      if (result.referralLinks && result.referralLinks.length > 0) {
        ReferralSystem.displayExistingLinks(result.referralLinks);
      }
    });
  }
}

// Shop System
class ShopSystem {
  static shopItems = {
    rainbow: {
      requiredTier: 'rookie',
      id: 'rainbow',
      enabled: false,
      unlocked: false
    },
    army: {
      requiredTier: 'expert',
      id: 'army',
      enabled: false,
      unlocked: false
    },
    disco: {
      requiredTier: 'master',
      id: 'disco',
      enabled: false,
      unlocked: false
    }
  };

  static loadShopItems() {
    chrome.storage.local.get(['shopItems'], (result) => {
      if (result.shopItems) {
        // Preserve both enabled and unlocked states
        Object.keys(result.shopItems).forEach(item => {
          if (result.shopItems[item].unlocked) {
            ShopSystem.shopItems[item].unlocked = true;
          }
          if (result.shopItems[item].enabled) {
            ShopSystem.shopItems[item].enabled = true;
          }
        });
      }
      ShopSystem.updateShopUI();
    });
  }

  static updateShopUI() {
    const currentTier = ShopSystem.getCurrentTier();

    Object.keys(ShopSystem.shopItems).forEach(item => {
      const buyBtn = document.getElementById(`buy-${item}`);
      const toggleBtn = document.getElementById(`toggle-${item}`);
      if (!buyBtn || !toggleBtn) return;

      const toggleContainer = toggleBtn.closest('.switch');
      const itemCard = buyBtn.closest('.shop-item');
      if (!toggleContainer || !itemCard) return;

      // If already unlocked, show toggle regardless of current tier
      if (ShopSystem.shopItems[item].unlocked) {
        buyBtn.style.display = 'none';
        toggleContainer.style.display = 'block';
        toggleBtn.disabled = false;
        toggleBtn.checked = ShopSystem.shopItems[item].enabled;
        itemCard.classList.remove('locked');
        return;
      }

      // Otherwise, check tier requirements
      if (currentTier === 'loading') {
        buyBtn.style.display = 'block';
        buyBtn.disabled = true;
        buyBtn.innerHTML = `${LOADING_SPINNER} Loading...`;
        toggleContainer.style.display = 'none';
        itemCard.classList.add('locked');
      } else {
        const tierMet = ShopSystem.isTierHighEnough(currentTier, ShopSystem.shopItems[item].requiredTier);
        
        if (tierMet) {
          itemCard.classList.remove('locked');
          buyBtn.disabled = false;
          buyBtn.style.display = 'block';
          buyBtn.textContent = 'Unlock Feature';
          toggleContainer.style.display = 'none';
        } else {
          itemCard.classList.add('locked');
          buyBtn.style.display = 'block';
          buyBtn.disabled = true;
          buyBtn.textContent = `Unlock at ${ShopSystem.capitalizeFirstLetter(ShopSystem.shopItems[item].requiredTier)} Tier`;
          toggleContainer.style.display = 'none';
        }
      }
    });

    chrome.storage.local.set({ shopItems: ShopSystem.shopItems });
  }

  static unlockItem(item) {
    const currentTier = ShopSystem.getCurrentTier();

    if (currentTier === 'loading') {
      alert('Please wait while your tier is loading...');
      return;
    }

    if (ShopSystem.isTierHighEnough(currentTier, ShopSystem.shopItems[item].requiredTier)) {
      const toggleBtn = document.getElementById(`toggle-${item}`);
      const buyBtn = document.getElementById(`buy-${item}`);
      const toggleContainer = toggleBtn.closest('.switch');

      buyBtn.style.display = 'none';
      toggleContainer.style.display = 'block';
      toggleBtn.disabled = false;
      toggleBtn.checked = true;
      ShopSystem.shopItems[item].enabled = true;
      ShopSystem.shopItems[item].unlocked = true; // Set unlocked state

      chrome.storage.local.set({ shopItems: ShopSystem.shopItems });
    } else {
      alert(`You need to reach ${ShopSystem.capitalizeFirstLetter(ShopSystem.shopItems[item].requiredTier)} tier to unlock this feature!`);
    }
  }

  static toggleItem(item, enabled) {
    ShopSystem.shopItems[item].enabled = enabled;
    // Keep unlocked state true even when toggled off
    ShopSystem.shopItems[item].unlocked = true;
    chrome.storage.local.set({ shopItems: ShopSystem.shopItems });
  }

  static isTierHighEnough(currentTier, requiredTier) {
    if (currentTier === 'loading') return false;
    const tiers = ['newbie', 'rookie', 'expert', 'master'];
    const currentIndex = tiers.indexOf(currentTier);
    const requiredIndex = tiers.indexOf(requiredTier);
    return currentIndex >= requiredIndex;
  }

  static getCurrentTier() {
    const scoreElement = document.getElementById('score-value');
    if (!scoreElement) return 'loading';
    
    const score = scoreElement.textContent;
    if (score === 'Loading...' || !ShopSystem.tierLoaded) {
        return 'loading';
    }
    return ScoreSystem.calculateTierProgress(parseInt(score)).currentTier;
  }

  static capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

// Score System
class ScoreSystem {
  static async fetchScore(searchTerm) {
    try {
      const response =await fetch(`https://escapegooserefer.arthur-luksol.workers.dev?search=${searchTerm}`);
    
      const score = await response.text();
      return score;
    } catch (error) {
      console.error('Error fetching score:', error);
      return '0';
    }
  }

  static async trackScore() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['userID'], function (result) {
        let userID = result.userID;
        if (!userID) {
          userID = ReferralSystem.generateRandomUserID();
          chrome.storage.local.set({ userID: userID });
        }
        resolve(ScoreSystem.fetchScore(userID));
      });
    });
  }

  static async updateScoreDisplay() {
    // Get and display cached data first
    chrome.storage.local.get([CACHE_KEY], (result) => {
      const cachedData = result[CACHE_KEY];
      if (cachedData) {
        ScoreSystem.updateUIWithScore(cachedData);
      }
    });

    // Set loading state
    const peopleHelped = document.getElementById('people-helped');
    const scoreValue = document.getElementById('score-value');
    const progressBar = document.getElementById('tier-progress');
    
    if (!peopleHelped || !scoreValue || !progressBar) {
      console.log('Required score elements not found');
      return;
    }

    const progressBarParent = progressBar.parentElement;
    if (!progressBarParent) {
      console.log('Progress bar parent not found');
      return;
    }
    
    // Only show loading spinner if no cached data
    if (!peopleHelped.textContent || peopleHelped.textContent === 'Loading...') {
      peopleHelped.innerHTML = LOADING_SPINNER;
      scoreValue.innerHTML = LOADING_SPINNER;
      progressBarParent.classList.add('loading');
    }
    
    // Fetch new data
    ScoreSystem.trackScore().then(result => {
      if (result && !result.includes('<!DOCTYPE')) {
        // Cache the new score
        chrome.storage.local.set({ [CACHE_KEY]: result });
        
        // Update UI with new score
        ScoreSystem.updateUIWithScore(result);
      }
    });
  }

  static updateUIWithScore(scoreValue) {
    ShopSystem.tierLoaded = true;

    // Remove loading states
    document.getElementById('tier-progress').parentElement.classList.remove('loading');
    document.getElementById('people-helped').textContent = scoreValue;
    document.getElementById('score-value').textContent = scoreValue;

    const score = parseFloat(scoreValue);
    const { currentTier, nextThreshold, progress, name, color } = ScoreSystem.calculateTierProgress(score);

    // Update tier badge
    const badgeEl = document.getElementById('tier-badge');
    badgeEl.textContent = name;
    badgeEl.className = currentTier === 'newbie' ? '' : `${currentTier}-badge`;
    badgeEl.style.backgroundColor = color;

    // Update progress bar
    const progressEl = document.getElementById('tier-progress');
    progressEl.style.width = `${progress}%`;
    progressEl.style.backgroundColor = color;

    // Update tier label and next goal
    const tierLabelEl = document.querySelector('.tier-label');
    const nextGoalEl = document.getElementById('next-goal');

    if (nextThreshold) {
      const remaining = nextThreshold - score;
      tierLabelEl.textContent = `Progress to ${ShopSystem.capitalizeFirstLetter(TIER_DATA[currentTier].next ? Object.keys(TIER_DATA)[Object.keys(TIER_DATA).indexOf(currentTier) + 1] : currentTier)}: ${Math.floor(progress)}%`;
      nextGoalEl.textContent = `${remaining} more points needed for next tier!`;
    } else {
      tierLabelEl.textContent = 'Master Tier Achieved!';
      nextGoalEl.textContent = 'Congratulations! You\'ve reached the highest tier! 🎉';
    }

    // Update shop UI based on new tier
    ShopSystem.updateShopUI();

    // Trigger tier-specific animations or effects
    if (progressEl.style.width === '100%') {
      progressEl.classList.add('progress-complete');
    } else {
      progressEl.classList.remove('progress-complete');
    }
  }

  static calculateTierProgress(score) {
    for (const [tier, data] of Object.entries(TIER_DATA)) {
      if (data.next === null || score < data.next) {
        const baseThreshold = data.threshold || 0;
        const progress = data.next
          ? ((score - baseThreshold) / (data.next - baseThreshold)) * 100
          : 100;

        return {
          currentTier: tier,
          nextThreshold: data.next,
          progress: Math.min(Math.max(progress, 0), 100),
          name: data.name,
          color: data.color
        };
      }
    }
  }
}

// Settings Management
class SettingsManager {
  static initializeSettings() {
    // Initialize sound setting
    chrome.storage.local.get(['isSoundEnabled'], (result) => {
      toggleSoundButton.checked = result.isSoundEnabled || false;
    });

    // Initialize memes setting
    chrome.storage.local.get(['isMemesEnabled'], (result) => {
      if (result.isMemesEnabled === undefined) {
        chrome.storage.local.set({ isMemesEnabled: false });
        toggleMemesButton.checked = false;
      } else {
        toggleMemesButton.checked = result.isMemesEnabled;
      }
    });

    // Initialize meme interval
    const memeIntervalInput = document.getElementById("meme-interval");
    memeIntervalInput.value = 300;
    chrome.storage.local.get(['memeInterval'], (result) => {
      memeIntervalInput.value = result.memeInterval ? result.memeInterval / 1000 : 300;
    });

    // Initialize goose setting
    chrome.storage.local.get(['isGooseEnabled'], (result) => {
      toggleGooseButton.checked = result.isGooseEnabled || false;
    });
  }

  static toggleGoose(isEnabled) {
    chrome.storage.local.set({ isGooseEnabled: isEnabled });
  }

  static updateGooseToggle() {
    chrome.storage.local.get(['isGooseEnabled'], (result) => {
      toggleGooseButton.checked = result.isGooseEnabled || false;
    });
  }
}

// Goal Management
class GoalManager {
    static initializeGoals() {
        const addGoalButton = document.getElementById('add-goal');
        const goalsList = document.getElementById('goals-list');

        // Check if we're on a page with goals functionality
        if (!addGoalButton || !goalsList) {
            return;
        }

        addGoalButton.addEventListener('click', () => GoalManager.addGoal());

        // Load existing goals
        chrome.storage.local.get(['goals'], (result) => {
            const goals = result.goals || [];
            goals.forEach(goal => GoalManager.renderGoal(goal));
        });
    }

    static addGoal() {
        const goal = {
            id: Date.now(),
            content: 'New Goal',
            interval: 60,
            lastShown: 0
        };

        chrome.storage.local.get(['goals'], (result) => {
            const goals = result.goals || [];
            goals.push(goal);
            chrome.storage.local.set({ goals }, () => {
                GoalManager.renderGoal(goal, true);
            });
        });
    }

    static renderGoal(goal, isNew = false) {
        const goalsList = document.getElementById('goals-list');
        if (!goalsList) return;

        const li = document.createElement('li');
        li.className = 'goal-item';
        li.dataset.id = goal.id;

        // Add a checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'goal-checkbox';
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                GoalManager.deleteGoal(goal.id);
                li.style.opacity = '0';
                setTimeout(() => li.remove(), 300);
            }
        });

        // Add labels and content
        const contentLabel = document.createElement('span');
        contentLabel.textContent = 'Goal: ';
        contentLabel.className = 'goal-label';

        const content = document.createElement('div');
        content.className = 'goal-content';
        content.contentEditable = true;
        content.textContent = goal.content;

        const intervalLabel = document.createElement('span');
        intervalLabel.textContent = 'Show every: ';
        intervalLabel.className = 'goal-label';

        const interval = document.createElement('input');
        interval.type = 'number';
        interval.className = 'goal-interval';
        interval.value = goal.interval;
        interval.min = 10;
        
        const secondsLabel = document.createElement('span');
        secondsLabel.textContent = ' seconds';
        secondsLabel.className = 'goal-label';

        // Create wrapper for interval inputs
        const intervalWrapper = document.createElement('div');
        intervalWrapper.className = 'interval-wrapper';
        intervalWrapper.appendChild(intervalLabel);
        intervalWrapper.appendChild(interval);
        intervalWrapper.appendChild(secondsLabel);

        li.appendChild(checkbox);
        li.appendChild(contentLabel);
        li.appendChild(content);
        li.appendChild(intervalWrapper);

        goalsList.appendChild(li);

        if (isNew) {
            content.focus();
            document.execCommand('selectAll', false, null);
        }

        // Keep existing event listeners
        content.addEventListener('blur', () => {
            GoalManager.updateGoal(goal.id, content.textContent, parseInt(interval.value));
        });

        content.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                content.blur();
            }
        });

        interval.addEventListener('change', () => {
            if (interval.value < 10) interval.value = 10;
            GoalManager.updateGoal(goal.id, content.textContent, parseInt(interval.value));
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'icon-button goal-delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', () => {
            GoalManager.deleteGoal(goal.id);
            li.remove();
        });

        li.appendChild(deleteBtn);
    }

    static updateGoal(id, content, interval) {
        chrome.storage.local.get(['goals'], (result) => {
            const goals = result.goals || [];
            const index = goals.findIndex(g => g.id === id);
            if (index !== -1) {
                goals[index].content = content;
                goals[index].interval = interval;
                chrome.storage.local.set({ goals });
            }
        });
    }

    static deleteGoal(id) {
        chrome.storage.local.get(['goals'], (result) => {
            const goals = result.goals || [];
            const updatedGoals = goals.filter(g => g.id !== id);
            chrome.storage.local.set({ goals: updatedGoals });
        });
    }
}

// Event Listeners
function initializeEventListeners() {
  // Site blocking listeners
  if (addSiteButton) {
    addSiteButton.addEventListener("click", SiteBlockManager.addSite);
  }

  // Meme listeners
  if (toggleMemesButton) {
    toggleMemesButton.addEventListener('click', () => {
      const isMemesEnabled = toggleMemesButton.checked;
      chrome.storage.local.set({ isMemesEnabled });
    });
  }

  // Goose listeners
  if (toggleGooseButton) {
    toggleGooseButton.addEventListener('click', () => {
      const isGooseEnabled = toggleGooseButton.checked;
      SettingsManager.toggleGoose(isGooseEnabled);
    });
  }

  // Dropdown listener
  const dropdownToggle = document.querySelector('.dropdown-toggle');
  if (dropdownToggle) {
    dropdownToggle.addEventListener('click', function () {
      this.parentElement.classList.toggle('show');
    });
  }

  // Referral system listeners
  const trackReferralButton = document.getElementById('track-referral');
  if (trackReferralButton) {
    trackReferralButton.addEventListener('click', () => {
      const existingCaptcha = document.getElementById('hcaptcha-container');
      if (existingCaptcha) {
        existingCaptcha.remove();
      }
      const captchaContainer = document.createElement('div');
      captchaContainer.id = 'hcaptcha-container';
      const captchaPlace = document.getElementById('captchaPlace');
      if (captchaPlace) {
        captchaPlace.appendChild(captchaContainer);
        
        // Only render hCaptcha if the container exists
        if (window.hcaptcha) {
          hcaptcha.render('hcaptcha-container', {
            sitekey: '18629b2c-fc8e-4f64-a596-984cc8aefa26',
            callback: (token) => {
              ReferralSystem.handleReferralLogic(token);
              captchaContainer.remove();
            },
            'error-callback': () => {
              alert('hCaptcha verification failed. Please try again.');
              captchaContainer.remove();
            },
            'expired-callback': () => {
              alert('hCaptcha token expired. Please complete the verification again.');
              captchaContainer.remove();
            }
          });
        }
      }
    });
  }

  // Shop item listeners
  Object.keys(ShopSystem.shopItems).forEach(item => {
    const buyBtn = document.getElementById(`buy-${item}`);
    const toggleBtn = document.getElementById(`toggle-${item}`);

    if (buyBtn) {
      buyBtn.addEventListener('click', () => ShopSystem.unlockItem(item));
    }
    if (toggleBtn) {
      toggleBtn.addEventListener('change', (e) => ShopSystem.toggleItem(item, e.target.checked));
    }
  });

  // Settings listeners
  if (toggleSoundButton) {
    toggleSoundButton.addEventListener('click', () => {
      const isSoundEnabled = toggleSoundButton.checked;
      chrome.storage.local.set({ isSoundEnabled });
    });
  }

  if (categoryDropdown) {
    categoryDropdown.addEventListener("change", function() {
      if (siteInput) {
        siteInput.disabled = !(categoryDropdown.value === "custom" || categoryDropdown.value === "");
      }
    });
  }

  // Meme upload handler
  if (memeUploadInput) {
    memeUploadInput.addEventListener('change', () => {
      const files = memeUploadInput.files;
      if (files) {
        MemeManager.handleMemeUpload(files);
      }
    });
  }
}

// Initialization with safety checks
function initialize() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAfterLoad);
  } else {
    initializeAfterLoad();
  }
}

function initializeAfterLoad() {
  // Only initialize components if their required elements exist
  if (document.querySelector('.tab-button')) {
    initializeTabs();
  }

  initializeEventListeners();

  if (document.querySelector('.control-panel')) {
    SettingsManager.initializeSettings();
    SettingsManager.updateGooseToggle();
  }

  if (document.getElementById('meme-interval')) {
    MemeManager.initializeMemeInterval();
  }

  if (document.getElementById('site-list')) {
    SiteBlockManager.loadBlockedSites();
  }

  if (document.getElementById('score-value')) {
    ScoreSystem.updateScoreDisplay();
  }

  if (document.querySelector('.shop-item')) {
    ShopSystem.loadShopItems();
  }

  if (document.getElementById('track-referral')) {
    ReferralSystem.loadExistingReferralLinks();
  }

  if (document.getElementById('goals-list')) {
    GoalManager.initializeGoals();
  }

  // Load initial memes with safety check
  if (document.getElementById('meme-list')) {
    chrome.storage.local.get(['customMemes'], (result) => {
      const memes = result.customMemes || [];
      MemeManager.renderMemeList(memes);
      MemeManager.updateDropdownToggleText(memes.length);
    });
  }

  // Set up score update interval only if score display exists
  if (document.getElementById('score-value')) {
    setInterval(ScoreSystem.updateScoreDisplay, 30000);
  }
}

// Start the application safely
initialize();

// Tab functionality
document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      console.log(`Tab button clicked: ${button.getAttribute('data-tab')}`); // Debugging statement

      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      const tabContent = document.getElementById(`${tabId}-tab`);
      if (tabContent) {
        tabContent.classList.add('active');
        console.log(`Tab content activated: ${tabId}-tab`); // Debugging statement
      } else {
        console.error(`Tab content not found: ${tabId}-tab`); // Debugging statement
      }
    });
  });
});

// Example of how to manually trigger the "Escape Score" tab for testing
document.addEventListener('DOMContentLoaded', () => {
  const escapeScoreTabButton = document.querySelector('.tab-button[data-tab="escape-score"]');
  if (escapeScoreTabButton) {
    escapeScoreTabButton.click();
  } else {
    console.error('Escape Score tab button not found'); // Debugging statement
  }
});