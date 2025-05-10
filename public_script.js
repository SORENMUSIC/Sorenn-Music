// Firebase configuration (replace with your config)
const firebaseConfig = {
    // Paste your Firebase config object here
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const uploadForm = document.getElementById('uploadForm');
    const musicStream = document.getElementById('musicStream');
    const userMenu = document.getElementById('userMenu');
    const userEmail = document.getElementById('userEmail');
    const logoutBtn = document.getElementById('logoutBtn');
    const authSection = document.getElementById('authSection');
    const showLogin = document.getElementById('showLogin');
    const showSignup = document.getElementById('showSignup');

    // Toggle between login and signup forms
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });

    // Check auth state
    auth.onAuthStateChanged((user) => {
        if (user) {
            authSection.classList.add('hidden');
            userMenu.classList.remove('hidden');
            userEmail.textContent = user.email;
            fetchMusic();
        } else {
            authSection.classList.remove('hidden');
            userMenu.classList.add('hidden');
            musicStream.innerHTML = '<p class="text-center">Please log in to view music.</p>';
        }
    });

    // Sign-up
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        auth.createUserWithEmailAndPassword(email, password)
            .then(() => {
                alert('Account created successfully! Please login.');
                signupForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
                document.getElementById('signupEmail').value = '';
                document.getElementById('signupPassword').value = '';
            })
            .catch((error) => {
                alert(error.message);
            });
    });

    // Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                document.getElementById('loginEmail').value = '';
                document.getElementById('loginPassword').value = '';
            })
            .catch((error) => {
                alert(error.message);
            });
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            musicStream.innerHTML = '<p class="text-center">Please log in to view music.</p>';
        });
    });

    // Upload music
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            alert('Please login to upload music.');
            return;
        }

        const formData = new FormData(uploadForm);
        formData.append('userEmail', user.email);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (response.ok) {
            alert('Upload successful!');
            uploadForm.reset();
            fetchMusic();
        } else {
            alert(result.error);
        }
    });

    // Fetch and display music with individual links
    async function fetchMusic() {
        const snapshot = await db.collection('music').get();
        musicStream.innerHTML = '';
        snapshot.forEach((doc) => {
            const track = doc.data();
            const card = document.createElement('div');
            card.className = 'bg-gray-800 p-4 rounded-lg shadow-md';
            card.innerHTML = `
                <a href="/track/${doc.id}" class="block">
                    <img src="${track.coverUrl || 'https://via.placeholder.com/150'}" alt="${track.title} cover" class="w-full h-40 object-cover rounded-t-lg">
                    <div class="p-4">
                        <h3 class="text-lg font-semibold">${track.title}</h3>
                        <p class="text-sm text-gray-400">${track.artist} - ${track.genre}</p>
                        <p class="text-sm text-gray-400">${track.type.charAt(0).toUpperCase() + track.type.slice(1)}</p>
                        <audio controls class="w-full mt-2">
                            <source src="${track.audioUrl}" type="audio/mpeg">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                </a>
            `;
            musicStream.appendChild(card);
        });
    }
});