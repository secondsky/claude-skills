---
name: ml-model-training
description: Trains machine learning models with data preparation, algorithm selection, and evaluation using scikit-learn, PyTorch, and TensorFlow. Use when building predictive models, implementing classification/regression, or training neural networks.
---

# ML Model Training

Train machine learning models with proper data handling and evaluation.

## Training Workflow

1. Data Preparation → 2. Feature Engineering → 3. Model Selection → 4. Training → 5. Evaluation

## Data Preparation

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder

# Load and clean data
df = pd.read_csv('data.csv')
df = df.dropna()

# Encode categorical variables
le = LabelEncoder()
df['category'] = le.fit_transform(df['category'])

# Split data (70/15/15)
X = df.drop('target', axis=1)
y = df['target']
X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3)
X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5)

# Scale features
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_val = scaler.transform(X_val)
X_test = scaler.transform(X_test)
```

## Scikit-learn Training

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_val)
print(classification_report(y_val, y_pred))
```

## PyTorch Training

```python
import torch
import torch.nn as nn

class Model(nn.Module):
    def __init__(self, input_dim):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )

    def forward(self, x):
        return self.layers(x)

model = Model(X_train.shape[1])
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
criterion = nn.BCELoss()

for epoch in range(100):
    model.train()
    optimizer.zero_grad()
    output = model(X_train_tensor)
    loss = criterion(output, y_train_tensor)
    loss.backward()
    optimizer.step()
```

## Evaluation Metrics

| Task | Metrics |
|------|---------|
| Classification | Accuracy, Precision, Recall, F1, AUC-ROC |
| Regression | MSE, RMSE, MAE, R² |

## Best Practices

- Use cross-validation for robust evaluation
- Track experiments with MLflow
- Save model checkpoints
- Monitor for overfitting
- Document hyperparameters
