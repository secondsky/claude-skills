# TensorFlow/Keras Model Training

Complete neural network training with Keras API.

```python
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

# Generate sample data
np.random.seed(42)
X = np.random.randn(1000, 20)
y = (X[:, 0] + X[:, 1] * 2 + np.random.randn(1000) * 0.1 > 0).astype(int)

# Split and scale
X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3, random_state=42)
X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42)

scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_val = scaler.transform(X_val)
X_test = scaler.transform(X_test)


def create_model(input_dim, learning_rate=0.001):
    """Create a neural network model."""
    model = keras.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(64, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(32, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.2),
        layers.Dense(16, activation='relu'),
        layers.Dense(1, activation='sigmoid')
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=learning_rate),
        loss='binary_crossentropy',
        metrics=['accuracy', keras.metrics.AUC(name='auc')]
    )

    return model


# Define callbacks
early_stopping = callbacks.EarlyStopping(
    monitor='val_loss',
    patience=10,
    restore_best_weights=True
)

reduce_lr = callbacks.ReduceLROnPlateau(
    monitor='val_loss',
    factor=0.2,
    patience=5,
    min_lr=0.0001
)

model_checkpoint = callbacks.ModelCheckpoint(
    'best_model.keras',
    monitor='val_auc',
    mode='max',
    save_best_only=True
)

tensorboard = callbacks.TensorBoard(
    log_dir='./logs',
    histogram_freq=1
)


# Train model
model = create_model(X_train.shape[1])

history = model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=100,
    batch_size=32,
    callbacks=[early_stopping, reduce_lr, model_checkpoint, tensorboard],
    verbose=1
)


# Evaluate
test_results = model.evaluate(X_test, y_test, verbose=0)
print(f"Test Loss: {test_results[0]:.4f}")
print(f"Test Accuracy: {test_results[1]:.4f}")
print(f"Test AUC: {test_results[2]:.4f}")


# Plot training history
def plot_history(history):
    fig, axes = plt.subplots(1, 3, figsize=(15, 4))

    # Loss
    axes[0].plot(history.history['loss'], label='Train')
    axes[0].plot(history.history['val_loss'], label='Validation')
    axes[0].set_title('Loss')
    axes[0].legend()

    # Accuracy
    axes[1].plot(history.history['accuracy'], label='Train')
    axes[1].plot(history.history['val_accuracy'], label='Validation')
    axes[1].set_title('Accuracy')
    axes[1].legend()

    # AUC
    axes[2].plot(history.history['auc'], label='Train')
    axes[2].plot(history.history['val_auc'], label='Validation')
    axes[2].set_title('AUC')
    axes[2].legend()

    plt.tight_layout()
    plt.savefig('training_history.png')
    plt.show()


plot_history(history)


# Save model for production
model.save('final_model.keras')

# Convert to TFLite for mobile deployment
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()
with open('model.tflite', 'wb') as f:
    f.write(tflite_model)
```

## Custom Training Loop

```python
@tf.function
def train_step(model, x, y, optimizer, loss_fn, train_acc_metric):
    with tf.GradientTape() as tape:
        predictions = model(x, training=True)
        loss = loss_fn(y, predictions)

    gradients = tape.gradient(loss, model.trainable_variables)
    optimizer.apply_gradients(zip(gradients, model.trainable_variables))

    train_acc_metric.update_state(y, predictions)
    return loss


def custom_training(model, train_dataset, val_dataset, epochs=50):
    optimizer = keras.optimizers.Adam(learning_rate=0.001)
    loss_fn = keras.losses.BinaryCrossentropy()
    train_acc_metric = keras.metrics.BinaryAccuracy()
    val_acc_metric = keras.metrics.BinaryAccuracy()

    for epoch in range(epochs):
        # Training
        for x_batch, y_batch in train_dataset:
            loss = train_step(model, x_batch, y_batch, optimizer, loss_fn, train_acc_metric)

        train_acc = train_acc_metric.result()
        train_acc_metric.reset_states()

        # Validation
        for x_batch, y_batch in val_dataset:
            predictions = model(x_batch, training=False)
            val_acc_metric.update_state(y_batch, predictions)

        val_acc = val_acc_metric.result()
        val_acc_metric.reset_states()

        print(f"Epoch {epoch + 1}: Train Acc = {train_acc:.4f}, Val Acc = {val_acc:.4f}")
```

## Dependencies

```txt
tensorflow>=2.15.0
scikit-learn>=1.3.0
matplotlib>=3.7.0
numpy>=1.24.0
```
