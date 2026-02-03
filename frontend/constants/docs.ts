export const DOCS: Record<string, { title: string, description: string, guide: string }> = {
    cleaning: {
        title: "Cleaning Engine",
        description: "Transform and sanitize artifacts for model readiness.",
        guide: `
### Why do we clean data?
Raw data is often "noisy" or incomplete. If you feed bad data into a model, you get bad results (Garbage In, Garbage Out).

### Operations Explained:
**1. Drop Missing Values**
- **What it does**: Deletes any row that has an empty (null) cell.
- **When to use**: If you have a massive dataset and only a few rows are missing data.
- **Button**: Click 'Apply Mutation' after selecting this to purge empty rows.

**2. Fill Missing (Mean/Median)**
- **What it does**: Instead of deleting rows, it fills gaps with the "average" value.
- **When to use**: When you want to keep as much data as possible.
- **Button**: Fill Mean is best for bell-curve data; Median is better if you have extreme outliers.

**3. Remove Outliers**
- **What it does**: Detects points that are "too far" from the average and removes them.
- **Benefit**: Prevents the model from being confused by rare, extreme events.
        `
    },
    features: {
        title: "Mutation Wizard",
        description: "Evolve raw columns into high-signal feature vectors.",
        guide: `
### What are Features?
Features are the specific pieces of information a model uses to make a prediction. 

### Core Transformations:
**1. Standard Scaler (Z-Score)**
- **Concept**: If one column is "Age" (0-100) and another is "Income" (0-200,000), the model might think Income is 2000x more important. Scaling makes them both oscillate between roughly -3 and 3.
- **Rule of Thumb**: Always scale for SVM and KNN models.

**2. PCA (Dimension Reduction)**
- **Concept**: Imagine trying to describe a 3D object with a 2D shadow. PCA finds the "best shadows" of your data to simplify it.
- **When to use**: When you have 50+ columns and training is taking too long.

**3. One-Hot Encoding**
- **Concept**: Computers don't understand "Red", "Blue", "Green". One-Hot turns them into columns of 1s and 0s.
        `
    },
    training: {
        title: "Neural Forge",
        description: "Fit mathematical architectures to your data patterns.",
        guide: `
### The Training Protocol
Training is the process of finding the "best fit" lines or boundaries in your data.

### Parameters Defined:
- **Tree Count (n_estimators)**: In Random Forests, this is how many "experts" we consult. More is usually better but slower.
- **Max Depth**: How complex the experts are. Too deep means they "memorize" the data (Overfitting), which is bad!
- **Learning Rate**: How fast the model changes its mind during training.

### Iterative Feedback:
Watch the **Terminal Console** during training. It shows the hardware initializing and the logic matrix being calculated in real-time.
        `
    },
    evaluation: {
        title: "Telemetry Lab",
        description: "Verify logic integrity using statistical benchmarks.",
        guide: `
### How to judge a model?
A piece of code can "work" but still be useless. We use metrics to see how often it's right.

### Key Metrics:
**1. Accuracy**
- **What it is**: The percentage of correct guesses.
- **Caveat**: If 99% of your data is "Safe" and 1% is "Fraud", an accuracy of 99% is actually terrible if it missed all the fraud!

**2. Precision vs Recall**
- **Precision**: Of all the times the model predicted "Positive", how many were actually correct? (Low false alarms).
- **Recall**: Of all the actual "Positive" cases, how many did the model find? (No missed cases).

**3. Confusion Matrix**
- **Definition**: A grid showing exactly where the model got confused. The diagonal shows correct predictions.
        `
    },
    deployment: {
        title: "Production Gateway",
        description: "Interface with live inference nodes for real-world predictions.",
        guide: `
### Deployment Protocol
Once a model is trained, it's ready to "graduate" from the lab to the real world. This page allows you to test that transition.

### How to use:
**1. Select Logic Artifact**
- Choose one of your trained models from the dropdown. 
- The system will automatically fetch the model's "Feature Schema" (what inputs it expects).

**2. Dynamic Input Form**
- Instead of writing code, simply type values into the boxes.
- **Example**: If predicting House Prices, you might enter "Rooms: 3", "Size: 1500".

**3. Transmit Request**
- Clicking this sends your data to the backend inference engine.
- The model will return a prediction (e.g., "$450,000" or "Spam email").

### Integration:
- On the right, you'll see a **CURL** command. 
- You can copy-paste this into your own website or app to use this exact model in your own software!
        `
    }
};
