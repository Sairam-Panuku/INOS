// API Keys
const YOUTUBE_API_KEY = "AIzaSyBi6BS_DwRefSvBtE6KuFJHaU5bugn7CaY";

// Free Food APIs (Removed Spoonacular)
const FOOD_APIS = [
    "https://www.themealdb.com/api/json/v1/1/search.php?s=",
    "https://api.edamam.com/api/recipes/v2?type=public&q=",
    "https://www.fruityvice.com/api/fruit/",
    "https://api.sampleapis.com/recipes/recipes"
];

// Supported Languages
const LANGUAGES = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    hi: "Hindi",
    zh: "Chinese"
};

// UI Elements
const chatBox = document.getElementById("chat-box");
const inputField = document.getElementById("user-input");
const sendButton = document.getElementById("send-btn");
const languageSelect = document.getElementById("language-select");

// Populate language dropdown
Object.keys(LANGUAGES).forEach(lang => {
    let option = document.createElement("option");
    option.value = lang;
    option.textContent = LANGUAGES[lang];
    languageSelect.appendChild(option);
});

// Function to send user message
function sendMessage() {
    const message = inputField.value.trim();
    if (message === "") return;

    // Display user message
    displayMessage(message, "user-message");

    // Process chatbot response
    fetchFoodInfo(message);

    // Clear input field
    inputField.value = "";
}

// Function to display messages in chat
function displayMessage(text, className) {
    let messageDiv = document.createElement("div");
    messageDiv.className = className;
    messageDiv.textContent = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Fetch meal details from free food APIs
async function fetchFoodInfo(query) {
    displayMessage("🔍 Searching for recipes...", "bot-message");

    for (let api of FOOD_APIS) {
        try {
            let response = await fetch(api + query);
            let data = await response.json();

            if (data.meals || data.hits || data.recipes) {
                displayRecipeDetails(data);
                fetchYouTubeVideo(query);
                return;
            }
        } catch (error) {
            console.error("API Fetch Error:", error);
        }
    }

    displayMessage("❌ No recipes found. Try another search.", "bot-message");
}

// Display recipe details
function displayRecipeDetails(data) {
    let recipe = data.meals ? data.meals[0] : data.hits ? data.hits[0].recipe : data.recipes ? data.recipes[0] : null;
    if (!recipe) return;

    let recipeMessage = `🍲 **${recipe.strMeal || recipe.label}**\n`;
    recipeMessage += `🔗 [Full Recipe]( ${recipe.strSource || recipe.url || '#'})\n`;
    displayMessage(recipeMessage, "bot-message");
}

// Fetch YouTube Video for the recipe
async function fetchYouTubeVideo(query) {
    try {
        let response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}+recipe&type=video&key=${YOUTUBE_API_KEY}&maxResults=5`);
        let data = await response.json();

        if (data.items.length > 0) {
            let videoId = data.items[0].id.videoId;
            document.getElementById("video-frame").src = `https://www.youtube.com/embed/${videoId}`;
        }
    } catch (error) {
        console.error("YouTube API Error:", error);
    }
}

// Send button event
sendButton.addEventListener("click", sendMessage);
