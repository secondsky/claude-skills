# PyTorch Model Training

Complete neural network training with PyTorch.

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report
import matplotlib.pyplot as plt

# Set device
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

# Generate sample data
np.random.seed(42)
torch.manual_seed(42)

X = np.random.randn(1000, 20).astype(np.float32)
y = (X[:, 0] + X[:, 1] * 2 + np.random.randn(1000) * 0.1 > 0).astype(np.float32)

# Split and scale
X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3, random_state=42)
X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42)

scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_val = scaler.transform(X_val)
X_test = scaler.transform(X_test)

# Create DataLoaders
train_dataset = TensorDataset(
    torch.tensor(X_train, dtype=torch.float32),
    torch.tensor(y_train, dtype=torch.float32).unsqueeze(1)
)
val_dataset = TensorDataset(
    torch.tensor(X_val, dtype=torch.float32),
    torch.tensor(y_val, dtype=torch.float32).unsqueeze(1)
)
test_dataset = TensorDataset(
    torch.tensor(X_test, dtype=torch.float32),
    torch.tensor(y_test, dtype=torch.float32).unsqueeze(1)
)

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=32)
test_loader = DataLoader(test_dataset, batch_size=32)


class NeuralNetwork(nn.Module):
    def __init__(self, input_dim, hidden_dims=[64, 32, 16], dropout=0.3):
        super().__init__()

        layers = []
        prev_dim = input_dim

        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(dropout)
            ])
            prev_dim = hidden_dim

        layers.append(nn.Linear(prev_dim, 1))
        layers.append(nn.Sigmoid())

        self.model = nn.Sequential(*layers)

    def forward(self, x):
        return self.model(x)


class Trainer:
    def __init__(self, model, device, learning_rate=0.001):
        self.model = model.to(device)
        self.device = device
        self.criterion = nn.BCELoss()
        self.optimizer = optim.Adam(model.parameters(), lr=learning_rate)
        self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer, mode='min', factor=0.2, patience=5
        )
        self.history = {'train_loss': [], 'val_loss': [], 'train_acc': [], 'val_acc': []}

    def train_epoch(self, train_loader):
        self.model.train()
        total_loss = 0
        predictions = []
        targets = []

        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(self.device), y_batch.to(self.device)

            self.optimizer.zero_grad()
            outputs = self.model(X_batch)
            loss = self.criterion(outputs, y_batch)
            loss.backward()
            self.optimizer.step()

            total_loss += loss.item()
            predictions.extend((outputs > 0.5).cpu().numpy())
            targets.extend(y_batch.cpu().numpy())

        avg_loss = total_loss / len(train_loader)
        accuracy = accuracy_score(targets, predictions)
        return avg_loss, accuracy

    def validate(self, val_loader):
        self.model.eval()
        total_loss = 0
        predictions = []
        targets = []

        with torch.no_grad():
            for X_batch, y_batch in val_loader:
                X_batch, y_batch = X_batch.to(self.device), y_batch.to(self.device)
                outputs = self.model(X_batch)
                loss = self.criterion(outputs, y_batch)

                total_loss += loss.item()
                predictions.extend((outputs > 0.5).cpu().numpy())
                targets.extend(y_batch.cpu().numpy())

        avg_loss = total_loss / len(val_loader)
        accuracy = accuracy_score(targets, predictions)
        return avg_loss, accuracy

    def fit(self, train_loader, val_loader, epochs=100, patience=10):
        best_val_loss = float('inf')
        patience_counter = 0

        for epoch in range(epochs):
            train_loss, train_acc = self.train_epoch(train_loader)
            val_loss, val_acc = self.validate(val_loader)

            self.history['train_loss'].append(train_loss)
            self.history['val_loss'].append(val_loss)
            self.history['train_acc'].append(train_acc)
            self.history['val_acc'].append(val_acc)

            self.scheduler.step(val_loss)

            print(f"Epoch {epoch+1}/{epochs} - "
                  f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f}, "
                  f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}")

            # Early stopping
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
                torch.save(self.model.state_dict(), 'best_model.pt')
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(f"Early stopping at epoch {epoch + 1}")
                    break

        # Load best model
        self.model.load_state_dict(torch.load('best_model.pt'))

    def evaluate(self, test_loader):
        self.model.eval()
        predictions = []
        probabilities = []
        targets = []

        with torch.no_grad():
            for X_batch, y_batch in test_loader:
                X_batch = X_batch.to(self.device)
                outputs = self.model(X_batch)
                probabilities.extend(outputs.cpu().numpy())
                predictions.extend((outputs > 0.5).cpu().numpy())
                targets.extend(y_batch.numpy())

        print("\nTest Results:")
        print(classification_report(targets, predictions))
        print(f"AUC-ROC: {roc_auc_score(targets, probabilities):.4f}")


# Train
model = NeuralNetwork(input_dim=20)
trainer = Trainer(model, device)
trainer.fit(train_loader, val_loader, epochs=100, patience=10)
trainer.evaluate(test_loader)
```

## Dependencies

```txt
torch>=2.0.0
scikit-learn>=1.3.0
matplotlib>=3.7.0
numpy>=1.24.0
```
