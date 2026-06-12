// // ========================================== 
// // 1. CONFIGURATION 
// // ========================================== 
// const API_BASE_URL =  'http://192.168.216.1:3000/api'//'http://localhost:3000/api'; // Change this when deploying 
 
// // TODO: Replace with your Firebase Web Config 
// const firebaseConfig = {
//   apiKey: "AIzaSyBAW4QPXcZtFcPnNyduVzhfI4cHyHNR6FM",
//   authDomain: "stock-analyzer-001-334e6.firebaseapp.com",
//   projectId: "stock-analyzer-001-334e6",
//   storageBucket: "stock-analyzer-001-334e6.firebasestorage.app",
//   messagingSenderId: "120181856561",
//   appId: "1:120181856561:web:a24a80b83076ef37e57810",
//   measurementId: "G-7W15CJBDVH"
// };
// // Initialize Firebase 
// firebase.initializeApp(firebaseConfig); 
 
// let currentDeviceToken = null; 
// let selectedSymbol = null; 
 
// // ========================================== 
// // 2. DOM ELEMENTS 
// // ========================================== 
// const ui = { 
//     setupView: document.getElementById('notification-setup'), 
//     appView: document.getElementById('app-area'), 
//     btnEnableNotif: document.getElementById('enable-notifications'), 
//     searchInput: document.getElementById('stock-search'), 
//     searchResults: document.getElementById('search-results'), 
//     conditionSelect: document.getElementById('condition'), 
//     targetPriceInput: document.getElementById('target-price'), 
//     btnCreateAlert: document.getElementById('create-alert'), 
//     formMessage: document.getElementById('form-message'), 
//     alertsList: document.getElementById('alerts-list') 
// }; 
 
// // ========================================== 
// // 3. PWA & NOTIFICATION SETUP 
// // ========================================== 
// // Initialize Firebase
// firebase.initializeApp(firebaseConfig);

// const messaging = firebase.messaging();

// // Register service worker
// navigator.serviceWorker.register("/firebase-messaging-sw.js")
//   .then((registration) => {
//     console.log("Service Worker registered:", registration.scope);

//     // Get token
//     messaging.getToken({
//       vapidKey: "BOwFsqRlLNsaW2cNZT60-ptrYAGX4gHzh297eg3h8KXQSqj8R5fUDtfZpB27pxN4zan61b5divIcXye9nTbdGKM",
//       serviceWorkerRegistration: registration
//     })
//     .then((token) => {
//       if (token) {
//         console.log("✅ FCM Token:", token);
//       } else {
//         console.log("❌ No token available");
//       }
//     })
//     .catch((err) => {
//       console.log("❌ Token error:", err);
//     });

//   })
//   .catch((err) => {
//     console.log("❌ SW registration failed:", err);
//   });

// // Foreground messages
// messaging.onMessage((payload) => {
//   console.log("📩 Message received:", payload);
// }); 
// ui.btnEnableNotif.addEventListener('click', async () => { 
//     try { 
//         const permission = await Notification.requestPermission(); 
//         if (permission === 'granted') { 
//             // Get FCM Token 
//             // TODO: Replace VAPID_KEY with your Public Key generated from Firebase Console -> Cloud Messaging 
//             const token = await messaging.getToken({ vapidKey: 'BOwFsqRlLNsaW2cNZT60-ptrYAGX4gHzh297eg3h8KXQSqj8R5fUDtfZpB27pxN4zan61b5divIcXye9nTbdGKM' }); 
//             if (token) { 
//                 currentDeviceToken = token; 
//                 ui.setupView.classList.add('hidden'); 
//                 ui.appView.classList.remove('hidden'); 
//                 fetchAlerts(); 
//             } 
//         } else { 
//             alert('Notifications are required for alerts to work.'); 
//         } 
//     } catch (error) { 
//         console.error('Error getting token:', error); 
//     } 
// }); 
 
// // Handle Foreground Messages 
// messaging.onMessage((payload) => { 
//     console.log('Message received. ', payload); 
//     // Refresh alerts list to show triggered status 
//     fetchAlerts();  
//     // Native browser notification (if page is open but unfocused) 
//     new Notification(payload.notification.title, { 
//         body: payload.notification.body 
//     }); 
// }); 
 
// // ========================================== 
// // 4. STOCK SEARCH (Debounced) 
// // ========================================== 
// let searchTimeout; 
// ui.searchInput.addEventListener('input', (e) => { 
//     clearTimeout(searchTimeout); 
//     const query = e.target.value.trim(); 
     
//     if (query.length < 2) { 
//         ui.searchResults.classList.add('hidden'); 
//         return; 
//     } 
 
//     // Debounce API calls 
//     searchTimeout = setTimeout(async () => { 
//         try { 
//             const res = await fetch(`${API_BASE_URL}/alerts/search?q=${query}`); 
//             const stocks = await res.json(); 
             
//             ui.searchResults.innerHTML = ''; 
//             if (stocks.length > 0) { 
//                 stocks.forEach(stock => { 
//                     // Only show stocks/ETFs 
//                     if(!stock.shortname) return;  
                     
//                     const div = document.createElement('div'); 
//                     div.className = 'dropdown-item'; 
//                     div.innerHTML = `<strong>${stock.symbol}</strong> - ${stock.shortname}`; 
//                     div.addEventListener('click', () => { 
//                         selectedSymbol = stock.symbol; 
//                         ui.searchInput.value = stock.symbol; 
//                         ui.searchResults.classList.add('hidden'); 
//                     }); 
//                     ui.searchResults.appendChild(div); 
//                 }); 
//                 ui.searchResults.classList.remove('hidden'); 
//             } else { 
//                 ui.searchResults.classList.add('hidden'); 
//             } 
//         } catch (err) { 
//             console.error('Search error:', err); 
//         } 
//     }, 500); 
// }); 
 
// // Hide dropdown when clicking outside 
// document.addEventListener('click', (e) => { 
//     if (!ui.searchInput.contains(e.target) && !ui.searchResults.contains(e.target)) { 
//         ui.searchResults.classList.add('hidden'); 
//     } 
// }); 
 
// // ========================================== 
// // 5. ALERT MANAGEMENT 
// // ========================================== 
// ui.btnCreateAlert.addEventListener('click', async () => { 
//     if (!selectedSymbol || !ui.targetPriceInput.value) { 
//         showMessage('Please select a stock and enter a target price', 'error'); 
//         return; 
//     } 
 
//     ui.btnCreateAlert.disabled = true; 
//     ui.btnCreateAlert.textContent = 'Creating...'; 
 
//     const payload = { 
//         symbol: selectedSymbol, 
//         condition: ui.conditionSelect.value, 
//         targetPrice: parseFloat(ui.targetPriceInput.value), 
//         deviceToken: currentDeviceToken 
//     }; 
 
//     try { 
//         const res = await fetch(`${API_BASE_URL}/alerts`, { 
//             method: 'POST', 
//             headers: { 'Content-Type': 'application/json' }, 
//             body: JSON.stringify(payload) 
//         }); 
 
//         if (res.ok) { 
//             showMessage('Alert created successfully!', 'success'); 
//             ui.searchInput.value = ''; 
//             ui.targetPriceInput.value = ''; 
//             selectedSymbol = null; 
//             fetchAlerts(); 
//         } else { 
//             throw new Error('Failed to create alert'); 
//         } 
//     } catch (err) { 
//         showMessage(err.message, 'error'); 
//     } finally { 
//         ui.btnCreateAlert.disabled = false; 
//         ui.btnCreateAlert.textContent = 'Create Alert'; 
//     } 
// }); 
 
// async function fetchAlerts() { 
//     if (!currentDeviceToken) return; 
     
//     try { 
//         const res = await fetch(`${API_BASE_URL}/alerts?deviceToken=${currentDeviceToken}`); 
//         const alerts = await res.json(); 
         
//         ui.alertsList.innerHTML = ''; 
//         if (alerts.length === 0) { 
//             ui.alertsList.innerHTML = '<p class="text-muted">No alerts set yet.</p>'; 
//             return; 
//         } 
 
//         alerts.forEach(alert => { 
//             const div = document.createElement('div'); 
//             div.className = `alert-item ${alert.triggered ? 'triggered' : 'active'}`; 
             
//             const badgeClass = alert.triggered ? 'triggered' : 'active'; 
//             const badgeText = alert.triggered ? 'Triggered' : 'Monitoring'; 
 
//             div.innerHTML = ` 
//                 <div> 
//                     <div class="symbol">${alert.symbol}</div> 
//                     <div class="text-muted text-sm">Condition: ${alert.condition} 
// $${alert.targetPrice}</div> 
//                 </div> 
//                 <span class="badge ${badgeClass}">${badgeText}</span> 
//             `; 
//             ui.alertsList.appendChild(div); 
//         }); 
//     } catch (err) { 
//         console.error('Failed to fetch alerts', err); 
//     } 
// } 
 
// function showMessage(text, type) { 
//     ui.formMessage.textContent = text; 
//     ui.formMessage.className = `message ${type}`; 
//     setTimeout(() => { ui.formMessage.textContent = ''; }, 3000); 
// } 
 const API_BASE_URL = 'https://stock-alert-system-fctp.onrender.com/api';//https://localhost:3000/api' // Change this when running on localhost

// TODO: Replace with your actual Firebase Web Config
const firebaseConfig = {
    apiKey: "AIzaSyBAW4QPXcZtFcPnNyduVzhfI4cHyHNR6FM",
    authDomain: "stock-analyzer-001-334e6.firebaseapp.com",
    projectId: "stock-analyzer-001-334e6",
    storageBucket: "stock-analyzer-001-334e6.firebasestorage.app",
    messagingSenderId: "120181856561",
    appId: "1:120181856561:web:a24a80b83076ef37e57810",
    measurementId: "G-7W15CJBDVH"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

let currentDeviceToken = null;
let selectedSymbol = null;
let globeInitialized = false;

const ui = {
    setupView: document.getElementById('notification-setup'),
    appView: document.getElementById('app-area'),
    btnEnableNotif: document.getElementById('enable-notifications'),
    searchInput: document.getElementById('stock-search'),
    searchResults: document.getElementById('search-results'),
    alertTypeSelect: document.getElementById('alert-type'),
    conditionalInputs: document.getElementById('conditional-inputs'),
    intervalInputs: document.getElementById('interval-inputs'),
    intervalMinutesInput: document.getElementById('interval-minutes'),
    conditionSelect: document.getElementById('condition'),
    targetPriceInput: document.getElementById('target-price'),
    btnCreateAlert: document.getElementById('create-alert'),
    formMessage: document.getElementById('form-message'),
    alertsList: document.getElementById('alerts-list')
};

// ==========================================
// THREE.JS HOLOGRAPHIC GLOBE & STARS
// ==========================================
function startGlobeOnce() {
    if (globeInitialized) return;
    globeInitialized = true;
    initThreeJSGlobe();
}

function initThreeJSGlobe() {
    const container = document.getElementById('threejs-container');
    if (!container || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Inner Solid Core
    const coreGeometry = new THREE.SphereGeometry(1.8, 32, 32);
    const coreMaterial = new THREE.MeshPhongMaterial({
        color: 0x001a0d,
        emissive: 0x00ff88,
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.95
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    globeGroup.add(core);

    // Outer Wireframe Shell
    const wireGeometry = new THREE.SphereGeometry(1.9, 16, 16);
    const wireMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        wireframe: true,
        transparent: true,
        opacity: 0.4
    });
    const wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
    globeGroup.add(wireframe);

    // Orbiting Data Ring
    const ringGeometry = new THREE.RingGeometry(2.3, 2.35, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00d9ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2; // Lay flat
    
    // Add Orbiting Data Nodes to Ring
    for(let i = 0; i < 12; i++){
        const node = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x00ff88 })
        );
        const angle = (i / 12) * Math.PI * 2;
        node.position.set(Math.cos(angle) * 2.3, 0, Math.sin(angle) * 2.3);
        ring.add(node);
    }
    globeGroup.add(ring);

    // Add Star Particles Background
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    for(let i = 0; i < 1500; i++){
        starVertices.push(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100
        );
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0x00d9ff, size: 0.12 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x00ff88, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    camera.position.z = 7.5; // Moved back slightly to accommodate larger container

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        core.rotation.y += 0.002;
        wireframe.rotation.y += 0.005;
        wireframe.rotation.x += 0.001;
        stars.rotation.y += 0.0005; // Animate Stars
        
        globeGroup.rotation.z = 23.5 * Math.PI / 180;
        globeGroup.rotation.y += 0.001;

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

// ==========================================
// CARD HOVER PHYSICS
// ==========================================
function apply3DEffects() {
    document.querySelectorAll(".glass-card").forEach(card => {
        if (card.dataset.tiltApplied === "true") return;
        card.dataset.tiltApplied = "true";
        
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotateY = ((x / rect.width) - 0.5) * 15; 
            const rotateX = ((y / rect.height) - 0.5) * -15;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
            card.style.boxShadow = `0 15px 30px rgba(0, 255, 136, 0.08)`;
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
            card.style.boxShadow = `0 10px 30px rgba(0,0,0,.3)`; 
        });
    });
}

apply3DEffects();

// ==========================================
// CORE APP LOGIC
// ==========================================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(err => console.error('SW Error:', err));
}

ui.btnEnableNotif.addEventListener('click', async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;
            const token = await messaging.getToken({ 
                vapidKey: "BOwFsqRlLNsaW2cNZT60-ptrYAGX4gHzh297eg3h8KXQSqj8R5fUDtfZpB27pxN4zan61b5divIcXye9nTbdGKM", // <-- Paste your VAPID Key here
                serviceWorkerRegistration: registration 
            });
            
            if (token) {
                currentDeviceToken = token;
                ui.setupView.classList.add('hidden');
                ui.appView.classList.remove('hidden');
                
                // CRITICAL FIX: Render the globe AFTER the container is unhidden
                requestAnimationFrame(() => {
                    startGlobeOnce();
                });

                fetchAlerts();
            }
        }
    } catch (error) { console.error('Token Error:', error); }
});

messaging.onMessage((payload) => {
    fetchAlerts(); 
    showToast(payload.notification.title, payload.notification.body);
});

ui.alertTypeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'interval') {
        ui.conditionalInputs.classList.add('hidden');
        ui.intervalInputs.classList.remove('hidden');
    } else {
        ui.conditionalInputs.classList.remove('hidden');
        ui.intervalInputs.classList.add('hidden');
    }
});

let searchTimeout;
ui.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    if (query.length < 2) return ui.searchResults.classList.add('hidden');

    searchTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/alerts/search?q=${query}`);
            const stocks = await res.json();
            ui.searchResults.innerHTML = '';
            
            if (stocks.length > 0) {
                stocks.forEach(stock => {
                    if(!stock.shortname) return; 
                    const div = document.createElement('div');
                    div.className = 'dropdown-item';
                    div.innerHTML = `<strong>${stock.symbol}</strong> - ${stock.shortname}`;
                    div.addEventListener('click', () => {
                        selectedSymbol = stock.symbol;
                        ui.searchInput.value = stock.symbol;
                        ui.searchResults.classList.add('hidden');
                    });
                    ui.searchResults.appendChild(div);
                });
                ui.searchResults.classList.remove('hidden');
            }
        } catch (err) {}
    }, 500);
});

document.addEventListener('click', (e) => {
    if (!ui.searchInput.contains(e.target) && !ui.searchResults.contains(e.target)) ui.searchResults.classList.add('hidden');
});

ui.btnCreateAlert.addEventListener('click', async () => {
    if (!selectedSymbol) return showMessage('Select a stock from the dropdown', 'error');

    const alertType = ui.alertTypeSelect.value;
    const payload = { symbol: selectedSymbol, alertType, deviceToken: currentDeviceToken };

    if (alertType === 'condition') {
        if (!ui.targetPriceInput.value) return showMessage('Enter target price', 'error');
        payload.condition = ui.conditionSelect.value;
        payload.targetPrice = parseFloat(ui.targetPriceInput.value);
    } else {
        const mins = parseInt(ui.intervalMinutesInput.value);
        if (!mins || mins < 1) return showMessage('Enter valid minutes', 'error');
        payload.intervalMinutes = mins;
    }

    ui.btnCreateAlert.disabled = true;

    try {
        const res = await fetch(`${API_BASE_URL}/alerts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showMessage('Alert successfully deployed!', 'success');
            ui.searchInput.value = ''; ui.targetPriceInput.value = ''; ui.intervalMinutesInput.value = ''; selectedSymbol = null;
            fetchAlerts();
        } else { throw new Error('Failed to save'); }
    } catch (err) { showMessage(err.message, 'error'); } 
    finally { ui.btnCreateAlert.disabled = false; }
});

async function fetchAlerts() {
    if (!currentDeviceToken) return;
    try {
        const res = await fetch(`${API_BASE_URL}/alerts?deviceToken=${currentDeviceToken}`);
        const alerts = await res.json();
        
        ui.alertsList.innerHTML = alerts.length === 0 ? '<p style="color: #b0b0b0;">No active deployments.</p>' : '';

        alerts.forEach(alert => {
            const div = document.createElement('div');
            const isCond = alert.alertType === 'condition';
            const desc = isCond ? `Condition: ${alert.condition} $${alert.targetPrice}` : `Recurring: Every ${alert.intervalMinutes} mins`;
            const badgeText = isCond ? (alert.triggered ? 'TRIGGERED' : 'MONITORING') : 'RECURRING';
            const badgeColor = isCond && alert.triggered ? '#ff4444' : '#00ff88';
            
            div.className = `alert-card glass-card`; 
            
            div.innerHTML = `
                <h3>${alert.symbol}</h3>
                <div class="alert-status-text">${desc}</div>
                <div style="color: ${badgeColor}; font-weight: bold; font-size: 0.85rem; letter-spacing: 1px;">
                    ● ${badgeText}
                </div>
                <button class="btn-cancel" onclick="cancelAlert('${alert._id}')">Terminate</button>
            `;
            ui.alertsList.appendChild(div);
        });

        apply3DEffects();

    } catch (err) {}
}

window.cancelAlert = async (id) => {
    if (!confirm('Terminate this monitoring sequence?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/alerts/${id}`, { method: 'DELETE' });
        if (res.ok) fetchAlerts();
    } catch (err) { showMessage('Termination failed', 'error'); }
};

function showMessage(text, type) {
    ui.formMessage.textContent = text;
    ui.formMessage.className = `message ${type}`;
    setTimeout(() => { ui.formMessage.textContent = ''; }, 3000);
}

function showToast(title, body) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<strong>${title}</strong><div style="margin-top: 5px; color: #b0b0b0;">${body}</div>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}