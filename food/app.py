from flask import Flask, render_template, request, jsonify, send_from_directory
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import LabelEncoder
from scipy.sparse import csr_matrix
from sklearn.decomposition import TruncatedSVD

app = Flask(__name__)

# Load dataset
file_path = "food/Major Diseases.csv"
data = pd.read_csv(file_path, encoding='ISO-8859-1')

# Encode categorical features
disease_encoder = LabelEncoder()
gender_encoder = LabelEncoder()
meal_encoders = {
    "Morning_Meal": LabelEncoder(),
    "Afternoon_Meal": LabelEncoder(),
    "Night_Meal": LabelEncoder()
}

data['Disease_Encoded'] = disease_encoder.fit_transform(data['Disease'])
data['Gender_Encoded'] = gender_encoder.fit_transform(data['Gender'])
data['Morning_Meal_Encoded'] = meal_encoders['Morning_Meal'].fit_transform(data['Morning_Meal'])
data['Afternoon_Meal_Encoded'] = meal_encoders['Afternoon_Meal'].fit_transform(data['Afternoon_Meal'])
data['Night_Meal_Encoded'] = meal_encoders['Night_Meal'].fit_transform(data['Night_Meal'])

@app.route('/food')
def food():
    return send_from_directory('food', 'food.html')

@app.route('/get_diseases', methods=['GET'])
def get_diseases():
    diseases = sorted(data['Disease'].unique())
    return jsonify(diseases)

@app.route('/recommend', methods=['POST'])
def recommend():
    user_gender = request.json.get('gender')
    disease_input = request.json.get('disease')

    if disease_input in disease_encoder.classes_:
        user_disease_encoded = disease_encoder.transform([disease_input])[0]
    else:
        return jsonify({"error": "Invalid disease selection!"}), 400

    if user_gender in gender_encoder.classes_:
        user_gender_encoded = gender_encoder.transform([user_gender])[0]
    else:
        return jsonify({"error": "Invalid gender selection!"}), 400

    user_features = np.array([[user_disease_encoded, user_gender_encoded]])
    meal_features = data[['Disease_Encoded', 'Gender_Encoded']]
    content_scores = cosine_similarity(user_features, meal_features)[0]

    def collaborative_filtering(meal_column):
        interaction_matrix = data.pivot_table(index='Disease', columns=meal_column, values=f'{meal_column}_Encoded', fill_value=0)
        interaction_matrix_sparse = csr_matrix(interaction_matrix)
        svd = TruncatedSVD(n_components=10)
        latent_matrix = svd.fit_transform(interaction_matrix_sparse)
        return cosine_similarity(latent_matrix[0].reshape(1, -1), latent_matrix).flatten()

    collab_scores_morning = collaborative_filtering("Morning_Meal")
    collab_scores_afternoon = collaborative_filtering("Afternoon_Meal")
    collab_scores_night = collaborative_filtering("Night_Meal")

    min_length = min(len(content_scores), len(collab_scores_morning))
    final_scores_morning = (content_scores[:min_length] + collab_scores_morning[:min_length]) / 2
    final_scores_afternoon = (content_scores[:min_length] + collab_scores_afternoon[:min_length]) / 2
    final_scores_night = (content_scores[:min_length] + collab_scores_night[:min_length]) / 2

    random_top_morning = np.random.choice(np.argsort(final_scores_morning)[-500:], 1)[0]
    random_top_afternoon = np.random.choice(np.argsort(final_scores_afternoon)[-500:], 1)[0]
    random_top_night = np.random.choice(np.argsort(final_scores_night)[-500:], 1)[0]

    morning_meal = meal_encoders['Morning_Meal'].inverse_transform([data['Morning_Meal_Encoded'].iloc[random_top_morning]])[0]
    afternoon_meal = meal_encoders['Afternoon_Meal'].inverse_transform([data['Afternoon_Meal_Encoded'].iloc[random_top_afternoon]])[0]
    night_meal = meal_encoders['Night_Meal'].inverse_transform([data['Night_Meal_Encoded'].iloc[random_top_night]])[0]

    return jsonify({
        "morning_meal": morning_meal,
        "afternoon_meal": afternoon_meal,
        "night_meal": night_meal
    })

if __name__ == '__main__':
    app.run(debug=True)
