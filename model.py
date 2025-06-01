import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import LabelEncoder
from scipy.sparse import csr_matrix
from sklearn.decomposition import TruncatedSVD

# Load the dataset
file_path = r"Major Diseases.csv"
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

# Step 1: Show available diseases
unique_diseases = sorted(data['Disease'].unique())
print("\nAvailable Diseases:")
for i, disease in enumerate(unique_diseases, 1):
    print(f"{i}. {disease}")

# Step 2: Take user inputs
gender_input = input("\nEnter Gender (Male/Female): ").strip().capitalize()
disease_choice = int(input("Select a disease by number: "))

# Validate disease selection
if 1 <= disease_choice <= len(unique_diseases):
    disease_input = unique_diseases[disease_choice - 1]
else:
    print("Invalid choice! Exiting...")
    exit()

# Handle unseen labels
if disease_input in disease_encoder.classes_:
    user_disease_encoded = disease_encoder.transform([disease_input])[0]
else:
    print("Unknown disease! Exiting...")
    exit()

if gender_input in gender_encoder.classes_:
    user_gender_encoded = gender_encoder.transform([gender_input])[0]
else:
    print("Invalid gender! Exiting...")
    exit()

# Content-Based Filtering
user_features = np.array([[user_disease_encoded, user_gender_encoded]])
meal_features = data[['Disease_Encoded', 'Gender_Encoded']]
content_scores = cosine_similarity(user_features, meal_features)[0]

# Collaborative Filtering
def collaborative_filtering(meal_column):
    interaction_matrix = data.pivot_table(index='Disease', columns=meal_column, values=f'{meal_column}_Encoded', fill_value=0)
    interaction_matrix_sparse = csr_matrix(interaction_matrix)
    svd = TruncatedSVD(n_components=10)
    latent_matrix = svd.fit_transform(interaction_matrix_sparse)
    return cosine_similarity(latent_matrix[0].reshape(1, -1), latent_matrix).flatten()

collab_scores_morning = collaborative_filtering("Morning_Meal")
collab_scores_afternoon = collaborative_filtering("Afternoon_Meal")
collab_scores_night = collaborative_filtering("Night_Meal")

# Ensure same length
min_length = min(len(content_scores), len(collab_scores_morning))

final_scores_morning = (content_scores[:min_length] + collab_scores_morning[:min_length]) / 2
final_scores_afternoon = (content_scores[:min_length] + collab_scores_afternoon[:min_length]) / 2
final_scores_night = (content_scores[:min_length] + collab_scores_night[:min_length]) / 2

# Randomize Recommendations
top_N = 500
random_top_morning = np.random.choice(np.argsort(final_scores_morning)[-top_N:], 1)[0]
random_top_afternoon = np.random.choice(np.argsort(final_scores_afternoon)[-top_N:], 1)[0]
random_top_night = np.random.choice(np.argsort(final_scores_night)[-top_N:], 1)[0]

# Decode Meal Names
morning_meal = meal_encoders['Morning_Meal'].inverse_transform([data['Morning_Meal_Encoded'].iloc[random_top_morning]])[0]
afternoon_meal = meal_encoders['Afternoon_Meal'].inverse_transform([data['Afternoon_Meal_Encoded'].iloc[random_top_afternoon]])[0]
night_meal = meal_encoders['Night_Meal'].inverse_transform([data['Night_Meal_Encoded'].iloc[random_top_night]])[0]

# Display Recommendations
print("\n🍽️ Recommended Meals:")
print(f"🌅 Morning Meal: {morning_meal}")
print(f"🌞 Afternoon Meal: {afternoon_meal}")
print(f"🌙 Night Meal: {night_meal}")
