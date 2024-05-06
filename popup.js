const DEFAULT_SSO_PROVIDERS = ["Google", "Facebook", "Apple", "Microsoft", "LinkedIn", "GitHub"];
const ssoProviderSelect = document.getElementById('sso-provider');
const newProviderDiv = document.getElementById('new-provider-div');
const newProviderInput = document.getElementById('new-provider');
const loginsDiv = document.getElementById('logins');
const providersDiv = document.getElementById('providers');
let cachedLogins = [];
let cachedProviders = [];

async function getFromStorage(key, defaultValue=undefined) {
    const stored = await chrome.storage.sync.get(key);
    console.log(stored);
    return stored[key] || defaultValue;
}

async function deleteSsoProvider(provider) {
    const providers = await getFromStorage("ssoProviders", []);
    const newProviders = providers.filter(p => p !== provider);
    await chrome.storage.sync.set({ ssoProviders: newProviders });
    initializeSsoProviderList();
}

async function initializeSsoProviderList() {
    cachedProviders.forEach(provider => {
        const deleteButton = document.getElementById(`delete-${provider}`);
        deleteButton.removeEventListener('click', () => deleteSsoProvider(provider));
    });

    let ssoProviders = await getFromStorage("ssoProviders");
    if (!ssoProviders) {
        ssoProviders = DEFAULT_SSO_PROVIDERS;
        await chrome.storage.sync.set({ ssoProviders });
    }
    
    ssoProviderSelect.innerHTML = ssoProviders.map(provider => (
        `<option value="${provider}">${provider}</option>`
    )).join('') + "<option value=\"New\">New</option>";

    providersDiv.innerHTML = ssoProviders.map(provider => (
        `<div style="padding:5px;height:2em;">
            <button style="display:inline-block;padding:1px;margin-right:5px;" id="delete-${provider}">
                <span class="material-symbols-outlined" style="font-size:1.25em;padding:0px;">delete</span>
            </button><nobr /><p style="display:inline-block;margin-bottom:0.5em;">${provider}</p>
        </div>`
    )).join('') || "No providers found";
    ssoProviders.forEach(provider => {
        const deleteButton = document.getElementById(`delete-${provider}`);
        deleteButton.addEventListener('click', () => deleteSsoProvider(provider));
    });

    cachedProviders = ssoProviders;
};

async function deleteLogin(site, ssoProvider) {
    const logins = await getFromStorage("logins", []);
    const newLogins = logins.filter(login => login.site !== site || login.ssoProvider !== ssoProvider);
    await chrome.storage.sync.set({ logins: newLogins });
    initializeLoginList();
}

async function initializeLoginList() {
    cachedLogins.forEach(login => {
        const deleteButton = document.getElementById(`delete-${login.site}-${login.ssoProvider}`);
        deleteButton.removeEventListener('click', () => deleteLogin(login.site, login.ssoProvider));
    });
    const logins = await getFromStorage("logins", []);
    loginsDiv.innerHTML = logins.map(login => (
        `<div style="padding:5px;height:2em;">
            <button style="display:inline-block;padding:1px;margin-right:5px;" id="delete-${login.site}-${login.ssoProvider}">
                <span class="material-symbols-outlined" style="font-size:1.25em;padding:0px;">delete</span>
            </button><nobr /><p style="display:inline-block;margin-bottom:0.5em;">${login.site} - ${login.ssoProvider}</p>
        </div>`
    )).join('') || "No logins found";
    logins.forEach(login => {
        const deleteButton = document.getElementById(`delete-${login.site}-${login.ssoProvider}`);
        deleteButton.addEventListener('click', () => deleteLogin(login.site, login.ssoProvider));
    });
    cachedLogins = logins;
}

async function handleProviderChange() {
    newProviderDiv.hidden = ssoProviderSelect.value !== "New";
};

async function handleSave() {
    let ssoProvider = ssoProviderSelect.value;
    const site = document.getElementById('site').value;
    if (!site) {
        alert("Please enter the site");
        return;
    }
    if (!ssoProvider) {
        alert("Please select the SSO provider");
        return;
    }
    if (ssoProvider === "New") {
        ssoProvider = newProviderInput.value;
        if (!ssoProvider) {
            alert("Please enter the new SSO provider");
            return;
        }
        const ssoProviders = await getFromStorage("ssoProviders") || DEFAULT_SSO_PROVIDERS;
        ssoProviders.push(ssoProvider);
        await chrome.storage.sync.set({ ssoProviders });
        await initializeSsoProviderList();
    }
    const logins = await getFromStorage("logins", []);
    logins.push({ ssoProvider, site });
    await chrome.storage.sync.set({ logins });
    initializeLoginList();
};

initializeSsoProviderList();
initializeLoginList();
ssoProviderSelect.addEventListener('change', handleProviderChange);
document.getElementById('save').addEventListener('click', handleSave);
