from flask import Flask, send_from_directory, request, jsonify
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder

app = Flask(__name__, static_url_path='', static_folder='.')

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/food')
def food():
    return send_from_directory('food', 'food.html')

# Load dataset
data = pd.read_csv(r"food/Major Diseases.csv", encoding='ISO-8859-1')

# Encode categorical values
disease_encoder = LabelEncoder()
gender_encoder = LabelEncoder()

data['Disease_Encoded'] = disease_encoder.fit_transform(data['Disease'])
data['Gender_Encoded'] = gender_encoder.fit_transform(data['Gender'])

@app.route('/get_meal_recommendations', methods=['POST'])
def get_meal_recommendations():
    try:
        user_data = request.json
        gender_input = user_data.get("gender")
        disease_input = user_data.get("disease")

        if disease_input not in data['Disease'].values:
            return jsonify({"error": "Disease not found"}), 400
        
        filtered_data = data[(data['Disease'] == disease_input) & (data['Gender'] == gender_input)]

        if filtered_data.empty:
            return jsonify({"error": "No meals found for this input"}), 400

        # Randomly select a row from filtered dataset
        random_row = filtered_data.sample(n=1)

        morning_meal = random_row["Morning_Meal"].values[0]
        afternoon_meal = random_row["Afternoon_Meal"].values[0]
        night_meal = random_row["Night_Meal"].values[0]

        return jsonify({
            "morning_meal": morning_meal,
            "afternoon_meal": afternoon_meal,
            "night_meal": night_meal
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_diseases', methods=['GET'])
def get_diseases():
    unique_diseases = data['Disease'].unique().tolist()
    return jsonify({"diseases": unique_diseases})

if __name__ == '__main__':
    app.run(debug=True)
