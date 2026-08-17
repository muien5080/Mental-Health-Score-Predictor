# Mental-Health-Score-Predictor

# 🧠 Mental Health Score Predictor

A Machine Learning web application that predicts a **mental health score** based on user-provided input features.

The project uses a **Random Forest Regression** model trained on a dataset obtained from **Kaggle**. The trained ML model is served through a **FastAPI backend**, serialized using **Joblib**, and deployed on **Render**. The frontend is hosted separately as a **Render Static Site**.

## 🚀 Live Demo

**Live Application:**
https://mentalhealthscore-predictor.onrender.com

> **Note:** Since the backend is deployed on Render's free tier, the service may take some time to respond after being inactive.

---

## 📌 Project Overview

Mental health is influenced by several personal, social, and lifestyle-related factors. This project demonstrates how machine learning can be used to analyze these factors and predict a numerical mental health score.

The complete application follows this workflow:

```text
User Input
    ↓
Frontend / Static Website
    ↓
FastAPI Backend
    ↓
Preprocessing
    ↓
Random Forest Regression Model
    ↓
Predicted Mental Health Score
    ↓
Response to Frontend
```

---

## ✨ Features

* 📊 Machine Learning-based mental health score prediction
* 🌲 Random Forest Regression algorithm
* 📁 Dataset sourced from Kaggle
* ⚡ FastAPI REST API backend
* 💾 Model saved and loaded using Joblib
* 🌐 Separate frontend and backend deployment
* ☁️ Deployed on Render
* 🆓 Built and deployed using Render's free tier
* 🔗 Publicly accessible web application

---

## 🛠️ Tech Stack

### Machine Learning

* Python
* Pandas
* NumPy
* Scikit-learn
* Random Forest Regression
* Joblib

### Backend

* FastAPI
* Uvicorn
* Python

### Frontend

* HTML
* CSS
* JavaScript

### Deployment

* Render Web Service — FastAPI backend
* Render Static Site — frontend

Render supports FastAPI applications as Web Services and static HTML/CSS/JavaScript applications as Static Sites.

---

## 📂 Project Structure

```text
mental-health-score-predictor/
│
├── backend/
│   ├── main.py
│   ├── Mental_Health_Model.pkl
│
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── notebooks/
│   └── Mental_Health_Test.ipynb
│
├── data/
│   └── dataset.csv
│
├── README.md
└── .gitignore
```

> Update the folder/file names above if your actual repository structure is different.

---

## 🤖 Machine Learning Model

### Algorithm

The project uses **Random Forest Regression** to predict the mental health score.

Random Forest is an ensemble learning algorithm that combines multiple decision trees to produce a more robust prediction than a single decision tree.

### Why Random Forest?

Random Forest was selected because it:

* Handles non-linear relationships well
* Can work with multiple input features
* Is relatively robust to noise
* Generally performs well on tabular datasets
* Reduces overfitting compared with a single decision tree


---

## 📊 Dataset

The dataset used for this project was obtained from **Kaggle**.

The dataset contains factors that can be used to estimate a person's mental health score.

Before training the model, the dataset was processed and prepared for machine learning.

### Dataset Processing

Typical preprocessing steps used in the project include:

* Loading the dataset
* Cleaning the data
* Handling missing values where required
* Selecting relevant features
* Separating input features and target variable
* Splitting the data into training and testing sets
* Training the regression model

> **Dataset Source:** Kaggle
> https://www.kaggle.com/datasets/shivasingh4945/student-social-media-and-mental-health-impact

---

## 🔌 FastAPI Backend

The machine learning model is exposed through a **FastAPI** backend.

The backend:

1. Receives user input through an API request.
2. Processes the input.
3. Loads the trained Joblib model.
4. Passes the input to the Random Forest Regression model.
5. Generates the predicted mental health score.
6. Returns the prediction to the frontend.

A simplified API workflow looks like:

```text
POST Request
     ↓
FastAPI Endpoint
     ↓
Validate Input
     ↓
Load ML Model
     ↓
Generate Prediction
     ↓
JSON Response
```

The backend is deployed as a Render Web Service. Render specifically recommends Web Services for APIs and applications such as FastAPI that need server-side processing.

---

## 💾 Model Serialization

The trained machine learning model is saved using **Joblib**.

Example:

```python
import joblib

joblib.dump(model, "model.joblib")
```

The FastAPI backend can then load the saved model:

```python
import joblib

model = joblib.load("model.joblib")
```

This makes it possible to use the trained model for predictions without training it again whenever the API receives a request.

---

## 🌐 Deployment

The application is deployed using **Render**.

Two Render services are used:

### 1. Backend — Render Web Service

The FastAPI application is deployed as a Web Service.

```text
FastAPI
   ↓
Render Web Service
   ↓
Public API
```

### 2. Frontend — Render Static Site

The frontend is deployed separately as a Static Site.

```text
HTML / CSS / JavaScript
          ↓
Render Static Site
          ↓
User Interface
```

Render provides free deployment options for both Web Services and Static Sites.

### ⚠️ Free Tier Consideration

The backend uses Render's free Web Service tier. Free web services can **spin down after 15 minutes without inbound traffic**, so the first request after inactivity can take longer while the service starts again.

This project is intended primarily as a **learning, portfolio, and demonstration project**, rather than a production healthcare application.

---

## 💻 Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/muien5080/Mental-Health-Score-Predictor.git
cd Mental-Health-Score-Predictor.git
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

Activate it:

**Windows**

```bash
venv\Scripts\activate
```

**Linux / macOS**

```bash
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the FastAPI server

```bash
uvicorn main:app --reload
```

The API will be available locally at:

```text
http://127.0.0.1:8000
```

FastAPI also provides interactive API documentation, typically available at:

```text
http://127.0.0.1:8000/docs
```

---

## 🔮 Example Prediction Flow

A user enters the required information through the frontend:

```text
User Input
    ↓
Frontend
    ↓
POST /predict
    ↓
FastAPI
    ↓
Random Forest Model
    ↓
Predicted Score
```

Example response:

```json
{
    "predicted_score": 7.42
}
```

> The exact request fields and response format depend on the implementation of the API.


---

## ⚠️ Disclaimer

This project is intended for **educational and demonstration purposes only**.

The predicted score should **not be considered a medical diagnosis, professional mental health assessment, or substitute for advice from a qualified healthcare professional**.

The model's predictions are dependent on the dataset and training process and may not accurately represent an individual's actual mental health condition.

---

## 👨‍💻 Author

**Mohammed Muien**

Built as a Machine Learning project to demonstrate:

* Machine Learning model development
* Regression algorithms
* Model serialization
* REST API development with FastAPI
* Frontend/backend integration
* Cloud deployment with Render
