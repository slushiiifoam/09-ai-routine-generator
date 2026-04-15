const routineForm = document.getElementById('routineForm');
const timeOfDaySelect = document.getElementById('timeOfDay');
const focusAreaSelect = document.getElementById('focusArea');
const timeAvailableSelect = document.getElementById('timeAvailable');
const energyLevelSelect = document.getElementById('energyLevel');
const activityCheckboxes = document.querySelectorAll('input[name="activities"]');
const routinePreferencesKey = 'routinePreferences';

function getSavedRoutinePreferences() {
  const savedPreferences = localStorage.getItem(routinePreferencesKey);

  return savedPreferences ? JSON.parse(savedPreferences) : null;
}

function saveRoutinePreferences() {
  const selectedActivityElements = document.querySelectorAll('input[name="activities"]:checked');
  const preferredActivities = Array.from(selectedActivityElements).map((activity) => activity.value);

  const routinePreferences = {
    timeOfDay: timeOfDaySelect.value,
    focusArea: focusAreaSelect.value,
    timeAvailable: timeAvailableSelect.value,
    energyLevel: energyLevelSelect.value,
    preferredActivities
  };

  localStorage.setItem(routinePreferencesKey, JSON.stringify(routinePreferences));
}

function restoreRoutinePreferences() {
  const savedPreferences = getSavedRoutinePreferences();

  if (!savedPreferences) {
    return;
  }

  timeOfDaySelect.value = savedPreferences.timeOfDay || timeOfDaySelect.value;
  focusAreaSelect.value = savedPreferences.focusArea || focusAreaSelect.value;
  timeAvailableSelect.value = savedPreferences.timeAvailable || timeAvailableSelect.value;
  energyLevelSelect.value = savedPreferences.energyLevel || energyLevelSelect.value;

  const preferredActivities = savedPreferences.preferredActivities || [];
  activityCheckboxes.forEach((checkbox) => {
    checkbox.checked = preferredActivities.includes(checkbox.value);
  });
}

restoreRoutinePreferences();

routineForm.addEventListener('change', saveRoutinePreferences);

// Add an event listener to the form that runs when the form is submitted
routineForm.addEventListener('submit', async (e) => {
  // Prevent the form from refreshing the page
  e.preventDefault();
  
  // Get values from all form inputs
  const timeOfDay = timeOfDaySelect.value;
  const focusArea = focusAreaSelect.value;
  const timeAvailable = timeAvailableSelect.value;
  const energyLevel = energyLevelSelect.value;
  const selectedActivityElements = document.querySelectorAll('input[name="activities"]:checked');
  const preferredActivities = Array.from(selectedActivityElements).map((activity) => activity.value);
  const activitiesText = preferredActivities.length > 0
    ? preferredActivities.join(', ')
    : 'No specific activities selected';
  
  // Find the submit button and update its appearance to show loading state
  const button = document.querySelector('button[type="submit"]');
  button.textContent = 'Generating...';
  button.disabled = true;
  
  try {    
    // Make the API call to OpenAI's chat completions endpoint
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [      
          { role: 'system', content: `You are a helpful assistant that creates quick, focused daily routines. Always keep routines short, realistic, and tailored to the user's preferences.` },
          {
            role: 'user',
            content: `Plan a personalized daily routine using these preferences:
Time of day: ${timeOfDay}
Focus area: ${focusArea}
Time available: ${timeAvailable} minutes
Energy level: ${energyLevel}
Preferred activities: ${activitiesText}

Please provide a clear, step-by-step routine that:
1. Fits exactly within the available time.
2. Matches the user's current energy level.
3. Prioritizes the chosen focus area.
4. Uses preferred activities when possible.
5. Includes short time estimates for each step.`
          }
        ],
        temperature: 0.7,
        max_completion_tokens: 500
      })
    });
    
    // Convert API response to JSON and get the generated routine
    const data = await response.json();
    const routine = data.choices[0].message.content;
    
    // Show the result section and display the routine
    document.getElementById('result').classList.remove('hidden');
    document.getElementById('routineOutput').textContent = routine;
    
  } catch (error) {
    // If anything goes wrong, log the error and show user-friendly message
    console.error('Error:', error);
    document.getElementById('routineOutput').textContent = 'Sorry, there was an error generating your routine. Please try again.';
  } finally {
    // Always reset the button back to its original state using innerHTML to render the icon
    button.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate My Routine';
    button.disabled = false;
  }
});
