
const YOUTUBE_API_KEY = "AIzaSyBi6BS_DwRefSvBtE6KuFJHaU5bugn7CaY";

// Food APIs
const FOOD_APIS = [
    "https://www.themealdb.com/api/json/v1/1/search.php?s=",
    "https://api.spoonacular.com/recipes/complexSearch?apiKey=b69a8cce3f4341eabd55d09c38547969&query=",
    "https://api.sampleapis.com/recipes/recipes",
    "https://www.fruityvice.com/api/fruit/",
    "https://www.edamam.com/api/recipes/v2?type=public&q="
];


const LANGUAGES = {
    en: "English",
    hi: "Hindi",
    te: "Telugu",
    ta: "Tamil",
    ml: "Malayalam",
    kn: "Kannada"
};


const chatBox = document.getElementById("chat-box");
const inputField = document.getElementById("user-input");
const sendButton = document.getElementById("send-btn");
const stopButton = document.getElementById("stop-btn");
const regenerateButton = document.getElementById("regenerate-btn");
const languageSelect = document.getElementById("language-select");


Object.keys(LANGUAGES).forEach(lang => {
    let option = document.createElement("option");
    option.value = lang;
    option.textContent = LANGUAGES[lang];
    languageSelect.appendChild(option);
});

let chatActive = true;  
let previousQuery = "";  


function sendMessage() {
    const message = inputField.value.trim();
    if (message === "") return;


    displayMessage(`${message}`, "user-message");


    fetchFoodInfo(message);


    inputField.value = "";
}


function displayMessage(text, className) {
    let messageDiv = document.createElement("div");
    messageDiv.className = className;
    messageDiv.innerHTML = text.replace(/\n/g, "<br>");
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}


async function fetchFoodInfo(query) {
    if (query === previousQuery) {
        query += " different";  
    }
    previousQuery = query;

    const selectedLang = languageSelect.value; 
    let translatedQuery = query;

    
    if (selectedLang !== "en") {
        translatedQuery = await translateMessage(query, selectedLang);
    }

    displayMessage("🔍 Searching for recipes...", "bot-message");

    for (let api of FOOD_APIS) {
        try {
            let response = await fetch(api + translatedQuery);
            let data = await response.json();

            if (data.meals || data.hits || data.recipes) {
                let filteredRecipe = filterRecipe(query, data);
                if (filteredRecipe) {
                    displayRecipeDetails(filteredRecipe);
                    fetchYouTubeVideo(filteredRecipe.name, selectedLang);
                    return;
                }
            }
        } catch (error) {
            console.error("API Fetch Error:", error);
        }
    }

    displayMessage("❌ Sorry, no recipes found. Try another search.", "bot-message");
}


function filterRecipe(query, data) {
    let allRecipes = data.meals || data.hits?.map(hit => hit.recipe) || data.recipes || [];
    return allRecipes.find(recipe => recipe.strMeal?.toLowerCase().includes(query.toLowerCase()) || recipe.label?.toLowerCase().includes(query.toLowerCase()));
}


function displayRecipeDetails(recipe) {
    let recipeMessage = `🍲 <span class="recipe-name">${recipe.strMeal || recipe.label}</span><br>`;
    recipeMessage += `🔗 <a href="${recipe.strSource || recipe.url || '#'}" target="_blank">Full Recipe</a><br>`;
    recipeMessage += `🥣 <span class="ingredient-label">Ingredients:</span><br>`;

    if (recipe.ingredients) {
        recipe.ingredients.forEach(ing => {
            recipeMessage += `- ${ing}<br>`;
        });
    } else {
        for (let i = 1; i <= 20; i++) {
            if (recipe[`strIngredient${i}`]) {
                recipeMessage += `- ${recipe[`strIngredient${i}`]} (${recipe[`strMeasure${i}`] || ""})<br>`;
            }
        }
    }
    
    if (recipe.strInstructions) {
        recipeMessage += `📜 <span class="step-label">Step-by-Step Cooking Process:</span><br> ${recipe.strInstructions.replace(/\n/g, '<br>')}<br>`;
    }
    
    displayMessage(recipeMessage, "bot-message");
}


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


async function translateMessage(text, targetLang) {
    try {
        let response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
        let data = await response.json();
        return data.responseData.translatedText;
    } catch (error) {
        console.error("Translation API Error:", error);
        return text;
    }
}


sendButton.addEventListener("click", sendMessage);


inputField.addEventListener("keypress", (event) => {
    if (event.key === "Enter") sendMessage();
});


stopButton.addEventListener("click", () => {
    chatActive = false;
    displayMessage("⏹️ Chat stopped.", "bot-message");
});


regenerateButton.addEventListener("click", () => {
    displayMessage("🔄 Generating new suggestions...", "bot-message");
    fetchFoodInfo(previousQuery);  
});

