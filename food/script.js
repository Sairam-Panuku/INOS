document.addEventListener("DOMContentLoaded", function () {
    fetch('/get_diseases')
        .then(response => response.json())
        .then(data => {
            let datalist = document.getElementById("disease-options");
            data.diseases.forEach(disease => {
                let option = document.createElement("option");
                option.value = disease;
                datalist.appendChild(option);
            });
        })
        .catch(error => console.error("Error fetching diseases:", error));
});

function getMealRecommendation() {
    let gender = document.getElementById("gender").value;
    let age = document.getElementById("age");
    let disease = document.getElementById("disease");

    let ageValue = age.value.trim();
    let diseaseValue = disease.value.trim();

    let valid = true;

    
    resetInputStyle(age);
    resetInputStyle(disease);

    //  age is missing
    if (!ageValue) {
        showError(age, "⚠ Please enter Age");
        valid = false;
    }

    //  disease is missing
    if (!diseaseValue) {
        showError(disease, "⚠ Please enter Disease");
        valid = false;
    }


    if (!valid) return;

    document.getElementById("wait-message").style.display = "block";
    document.getElementById("meal-container").style.display = "none";

    fetch('/get_meal_recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender: gender, age: ageValue, disease: diseaseValue })
    })
    .then(response => response.json())
    .then(data => {
        setTimeout(() => {
            document.getElementById("wait-message").style.display = "none";

            if (data.error) {
                alert("Error: " + data.error);
            } else {
                document.getElementById("meal-container").style.display = "block";
                document.getElementById("morning-meal").textContent = data.morning_meal;
                document.getElementById("afternoon-meal").textContent = data.afternoon_meal;
                document.getElementById("night-meal").textContent = data.night_meal;
            }
        }, 3000); 
    })
    .catch(error => console.error("Error fetching meals:", error));
}

// Show error with blinking effect
function showError(inputElement, errorMessage) {
    inputElement.placeholder = errorMessage;
    inputElement.classList.add("input-error");

    
    setTimeout(() => {
        inputElement.classList.remove("input-error");
    }, 1000);
}

// Reset input style
function resetInputStyle(inputElement) {
    inputElement.placeholder = "";
    inputElement.classList.remove("input-error");
}
document.addEventListener("DOMContentLoaded", function() {
    const genderInput = document.getElementById("gender");
    const ageInput = document.getElementById("age");
    const diseaseInput = document.getElementById("disease");

    // Function to update input color dynamically
    function updateInputColor(input, color) {
        input.style.backgroundColor = color;
        input.style.color = "white"; 
    }

    // Gender Change Event
    genderInput.addEventListener("change", function() {
        if (this.value === "male") {
            updateInputColor(this, "rgba(0, 0, 255, 0.5)"); 
        } else if (this.value === "female") {
            updateInputColor(this, "rgba(255, 105, 180, 0.5)"); 
        } else {
            updateInputColor(this, "rgba(128, 0, 128, 0.5)"); 
        }
    });

    // Age Change Event
    ageInput.addEventListener("input", function() {
        updateInputColor(this, "rgba(255, 165, 0, 0.5)"); 
    });

    // Disease Change Event
    diseaseInput.addEventListener("input", function() {
        updateInputColor(this, "rgba(255, 0, 0, 0.5)"); 
    });
});

    

