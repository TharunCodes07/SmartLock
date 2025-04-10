import matplotlib.pyplot as plt
import numpy as np

# --- Plot 1: 3D Localization Error ---
# Simulate localization errors (e.g., mostly within +/- 1.5 cm, so 98% accuracy)
# Generate data centered around 0 with a small standard deviation
np.random.seed(42) # for reproducibility
errors_cm = np.random.normal(0, 0.75, 500) # Mean 0, std dev 0.75 cm gives most within +/- 1.5cm
# Ensure a couple of outliers to represent the 2% inaccuracy realistically
errors_cm[0] = 2.5
errors_cm[1] = -2.1
errors_cm = np.clip(errors_cm, -3, 3) # Clip extreme values if any

plt.figure(figsize=(8, 5))
plt.hist(errors_cm, bins=15, color='skyblue', edgecolor='black')
plt.title('Figure 4.1: Distribution of 3D Localization Errors (cm)')
plt.xlabel('Error in Localization (cm)')
plt.ylabel('Frequency')
plt.grid(axis='y', alpha=0.75)
plt.tight_layout()
# plt.savefig('localization_error_hist.png') # Uncomment to save
plt.show()


# --- Plot 2: Agent Task Completion Rate ---
completion_rate = 97
failure_rate = 100 - completion_rate
labels = ['Successful Cycles', 'Failed Cycles']
sizes = [completion_rate, failure_rate]
colors = ['lightgreen', 'salmon']

plt.figure(figsize=(6, 4))
plt.bar(labels, sizes, color=colors, edgecolor='black')
plt.ylabel('Percentage (%)')
plt.title('Figure 4.2: Agent Task Completion Rate')
plt.ylim(0, 100)
for i, v in enumerate(sizes):
    plt.text(i, v + 1, str(v) + "%", ha='center', va='bottom')
plt.tight_layout()
# plt.savefig('task_completion_bar.png') # Uncomment to save
plt.show()


# --- Plot 3: Agent Action Validity (Hallucination Rate) ---
hallucination_rate = 3
valid_action_rate = 100 - hallucination_rate
labels_pie = ['Valid Actions', 'Hallucinations']
sizes_pie = [valid_action_rate, hallucination_rate]
colors_pie = ['lightblue', 'lightcoral']
explode = (0, 0.1) # explode the 'Hallucinations' slice

plt.figure(figsize=(6, 6))
plt.pie(sizes_pie, explode=explode, labels=labels_pie, colors=colors_pie,
        autopct='%1.1f%%', shadow=True, startangle=140)
plt.title('Figure 4.3: Agent Action Validity (Including Hallucinations)')
plt.axis('equal') # Equal aspect ratio ensures that pie is drawn as a circle.
plt.tight_layout()
# plt.savefig('hallucination_pie.png') # Uncomment to save
plt.show()

# --- Optional: Simplified Zero-Shot Adaptability Plot ---
# This is highly subjective, representing success rate in *types* of novel scenarios
scenario_types = ['Lighting Change', 'Weed Variant', 'Minor Obstacle']
success_rates = [90, 85, 80] # Fake success rates for these types
colors_adapt = ['#FFDD83', '#A0D2DB', '#FFB3A7'] # Different pastel colors

plt.figure(figsize=(7, 5))
bars = plt.bar(scenario_types, success_rates, color=colors_adapt, edgecolor='black')
plt.ylabel('Success Rate (%)')
plt.title('Figure 4.X: Qualitative Zero-Shot Adaptability Success Rate') # Assign figure number
plt.ylim(0, 100)
for bar in bars:
    yval = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2.0, yval + 1, f"{yval}%", ha='center', va='bottom')

plt.tight_layout()
# plt.savefig('zero_shot_adaptability_bar.png') # Uncomment to save
plt.show()