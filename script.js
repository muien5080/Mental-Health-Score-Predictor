/* ==========================================================================
   Mental Health Score Prediction — Application Logic
   Vanilla JS only. Talks to the FastAPI backend at API_BASE.
   ========================================================================== */

'use strict';

// --------------------------------------------------------------------------
// Configuration
// --------------------------------------------------------------------------

const API_BASE = 'http://127.0.0.1:8000';
const PREDICT_URL = `${API_BASE}/predict`;

// This frontend calls /predict with POST. The backend as originally supplied
// defines /predict as a GET endpoint, which cannot work with a JSON body from
// fetch(). See the chat response / corrected main.py for the required fix.

// Field bounds mirrored from the (corrected) backend Pydantic model.
// physical_activity_hours / sleep_hours_per_night assume the corrected
// `le=24` bound — update these if you choose different limits when you
// patch main.py.
const LIMITS = {
  age: { min: 10, max: 100 },
  avg_daily_usage_hours: { min: 0, max: 24 },
  daily_unlocks: { min: 0, max: Infinity },
  study_hours: { min: 0, max: 24 },
  physical_activity_hours: { min: 0, max: 24 },
  sleep_hours_per_night: { min: 0, max: 24 },
};

// Predicted score scale. The training data's Mental_Health_Score column
// ranges from ~3.6 to ~9.4, which indicates a 0–10 scale rather than 0–100.
const SCORE_SCALE_MAX = 10;

// Quartiles of Mental_Health_Score observed in the training CSV (not
// invented, not clinical — purely descriptive of the training sample).
const SCORE_QUARTILES = { q1: 5.1, median: 6.1, q3: 7.1 };

// --------------------------------------------------------------------------
// DOM references
// --------------------------------------------------------------------------

const form = document.getElementById('assessmentForm');
const steps = Array.from(document.querySelectorAll('.form-step'));
const progressSteps = Array.from(document.querySelectorAll('.progress-step'));
const progressFill = document.getElementById('progressFill');
const progressFill2 = document.getElementById('progressFill2');
const formBanner = document.getElementById('formBanner');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const startAssessmentBtn = document.getElementById('startAssessmentBtn');

const resultSection = document.getElementById('result');
const assessmentSection = document.getElementById('assessment');

const gaugeFill = document.getElementById('gaugeFill');
const gaugeScore = document.getElementById('gaugeScore');
const gaugeScale = document.getElementById('gaugeScale');
const interpretationLabel = document.getElementById('interpretationLabel');
const interpretationText = document.getElementById('interpretationText');

const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

let currentStep = 1;
let isSubmitting = false;

// --------------------------------------------------------------------------
// Init
// --------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initGauge();
  initSliders();
  checkBackendHealth();

  startAssessmentBtn.addEventListener('click', () => {
    assessmentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.querySelectorAll('.step-next').forEach((btn) => {
    btn.addEventListener('click', () => goToStep(Number(btn.dataset.next)));
  });
  document.querySelectorAll('.step-back').forEach((btn) => {
    btn.addEventListener('click', () => goToStep(Number(btn.dataset.back), { skipValidation: true }));
  });

  form.addEventListener('submit', handleSubmit);
  resetBtn.addEventListener('click', resetAssessment);
});

// --------------------------------------------------------------------------
// Backend health check
// --------------------------------------------------------------------------

async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/`, { method: 'GET' });
    if (res.ok) {
      setStatus('connected', 'Backend connected');
    } else {
      setStatus('error', `Backend responded (${res.status})`);
    }
  } catch (err) {
    setStatus('error', 'Backend unreachable');
  }
}

function setStatus(state, label) {
  statusDot.classList.remove('connected', 'error');
  if (state === 'connected' || state === 'error') statusDot.classList.add(state);
  statusText.textContent = label;
}

// --------------------------------------------------------------------------
// Sliders — keep the visible value + track fill in sync
// --------------------------------------------------------------------------

function initSliders() {
  const sliderConfigs = [
    { input: 'usageHours', output: 'usageHoursValue', suffix: ' hrs' },
    { input: 'studyHours', output: 'studyHoursValue', suffix: ' hrs' },
    { input: 'activityHours', output: 'activityHoursValue', suffix: ' hrs' },
    { input: 'sleepHours', output: 'sleepHoursValue', suffix: ' hrs' },
  ];

  sliderConfigs.forEach(({ input, output, suffix }) => {
    const inputEl = document.getElementById(input);
    const outputEl = document.getElementById(output);
    const sync = () => {
      const value = Number(inputEl.value);
      outputEl.textContent = `${value.toFixed(1)}${suffix}`;
      const min = Number(inputEl.min);
      const max = Number(inputEl.max);
      const pct = ((value - min) / (max - min)) * 100;
      inputEl.style.setProperty('--fill', `${pct}%`);
    };
    inputEl.addEventListener('input', sync);
    sync();
  });
}

// --------------------------------------------------------------------------
// Wizard navigation
// --------------------------------------------------------------------------

function goToStep(targetStep, { skipValidation = false } = {}) {
  if (!skipValidation) {
    const result = validateStep(currentStep);
    if (!result.valid) {
      renderStepErrors(result.errors);
      return;
    }
  }
  clearBanner();

  steps.forEach((fieldset) => {
    const isTarget = Number(fieldset.dataset.step) === targetStep;
    fieldset.classList.toggle('active', isTarget);
    fieldset.disabled = !isTarget;
  });

  progressSteps.forEach((el) => {
    const stepNum = Number(el.dataset.step);
    el.classList.toggle('active', stepNum === targetStep);
    el.classList.toggle('done', stepNum < targetStep);
  });

  progressFill.style.width = targetStep >= 2 ? '100%' : '0%';
  progressFill2.style.width = targetStep >= 3 ? '100%' : '0%';

  currentStep = targetStep;

  const heading = document.getElementById(`step${targetStep}-heading`);
  if (heading) heading.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// --------------------------------------------------------------------------
// Validation
// --------------------------------------------------------------------------

const STEP_FIELDS = {
  1: ['age', 'gender', 'country', 'academic_level'],
  2: ['most_used_platform', 'purpose_of_use', 'avg_daily_usage_hours', 'daily_unlocks'],
  3: ['study_hours', 'physical_activity_hours', 'sleep_hours_per_night', 'stress_level'],
};

function validateStep(stepNum) {
  const errors = {};
  STEP_FIELDS[stepNum].forEach((fieldName) => {
    const message = validateField(fieldName);
    if (message) errors[fieldName] = message;
  });
  return { valid: Object.keys(errors).length === 0, errors };
}

function validateAllSteps() {
  let allErrors = {};
  let firstErrorStep = null;
  [1, 2, 3].forEach((stepNum) => {
    const { errors } = validateStep(stepNum);
    if (Object.keys(errors).length > 0 && firstErrorStep === null) {
      firstErrorStep = stepNum;
    }
    allErrors = { ...allErrors, ...errors };
  });
  return { valid: Object.keys(allErrors).length === 0, errors: allErrors, firstErrorStep };
}

function validateField(fieldName) {
  const el = form.elements[fieldName];
  if (!el) return null;
  const value = el.value;

  if (['gender', 'country', 'academic_level', 'most_used_platform', 'purpose_of_use', 'stress_level'].includes(fieldName)) {
    if (!value) return 'Please select an option.';
    return null;
  }

  if (fieldName === 'age') {
    if (value === '') return 'Age is required.';
    const n = Number(value);
    if (!Number.isInteger(n)) return 'Age must be a whole number.';
    if (n < LIMITS.age.min || n > LIMITS.age.max) {
      return `Age must be between ${LIMITS.age.min} and ${LIMITS.age.max}.`;
    }
    return null;
  }

  if (fieldName === 'daily_unlocks') {
    if (value === '') return 'This field is required.';
    const n = Number(value);
    if (!Number.isInteger(n)) return 'Enter a whole number.';
    if (n < LIMITS.daily_unlocks.min) return 'Must be 0 or greater.';
    return null;
  }

  if (['avg_daily_usage_hours', 'study_hours', 'physical_activity_hours', 'sleep_hours_per_night'].includes(fieldName)) {
    const n = Number(value);
    const { min, max } = LIMITS[fieldName];
    if (Number.isNaN(n) || n < min || n > max) {
      return `Must be between ${min} and ${max} hours.`;
    }
    return null;
  }

  return null;
}

function renderStepErrors(errors) {
  Object.keys(errors).forEach((fieldName) => {
    showFieldError(fieldName, errors[fieldName]);
  });
}

function showFieldError(fieldName, message) {
  const errorMap = {
    age: 'age', gender: 'gender', country: 'country', academic_level: 'academicLevel',
    most_used_platform: 'platform', purpose_of_use: 'purpose', avg_daily_usage_hours: 'usageHours',
    daily_unlocks: 'unlocks', study_hours: 'studyHours', physical_activity_hours: 'activityHours',
    sleep_hours_per_night: 'sleepHours', stress_level: 'stress',
  };
  const domId = errorMap[fieldName];
  const errorEl = document.getElementById(`${domId}-error`);
  const fieldEl = document.getElementById(domId);
  if (errorEl) errorEl.textContent = message;
  if (fieldEl) fieldEl.closest('.field').classList.add('invalid');
}

function clearAllErrors() {
  document.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; });
  document.querySelectorAll('.field.invalid').forEach((el) => el.classList.remove('invalid'));
}

function clearBanner() {
  formBanner.hidden = true;
  formBanner.textContent = '';
}

function showBanner(message) {
  formBanner.textContent = message;
  formBanner.hidden = false;
  formBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// --------------------------------------------------------------------------
// Submit
// --------------------------------------------------------------------------

async function handleSubmit(event) {
  event.preventDefault();
  if (isSubmitting) return;

  clearAllErrors();
  clearBanner();

  const { valid, errors, firstErrorStep } = validateAllSteps();
  if (!valid) {
    goToStep(firstErrorStep, { skipValidation: true });
    renderStepErrors(errors);
    showBanner('Please fix the highlighted fields before continuing.');
    return;
  }

  setSubmitting(true);

  try {
    const payload = buildPayload();
    const response = await fetch(PREDICT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await extractErrorMessage(response);
      throw new Error(message);
    }

    const data = await response.json();

    if (typeof data.predicted_mh_score !== 'number' || Number.isNaN(data.predicted_mh_score)) {
      throw new Error('The backend returned a response without a valid predicted_mh_score.');
    }

    showResult(data.predicted_mh_score);
    setStatus('connected', 'Backend connected');
  } catch (err) {
    handleSubmitError(err);
  } finally {
    setSubmitting(false);
  }
}

function buildPayload() {
  // NOTE: deliberately NOT using FormData here. FormData excludes any field
  // inside a disabled <fieldset> (per the HTML spec, disabled controls are
  // not "successful controls"). Since the wizard disables the fieldsets for
  // steps you've navigated away from, FormData would silently drop step 1
  // and step 2 values by the time you submit on step 3. Reading straight
  // from form.elements works because JS can still read .value on a disabled
  // element even though the browser won't submit it natively.
  return {
    age: Number(form.elements['age'].value),
    gender: form.elements['gender'].value,
    country: form.elements['country'].value,
    academic_level: form.elements['academic_level'].value,
    most_used_platform: form.elements['most_used_platform'].value,
    purpose_of_use: form.elements['purpose_of_use'].value,
    avg_daily_usage_hours: Number(form.elements['avg_daily_usage_hours'].value),
    daily_unlocks: Number(form.elements['daily_unlocks'].value),
    study_hours: Number(form.elements['study_hours'].value),
    physical_activity_hours: Number(form.elements['physical_activity_hours'].value),
    sleep_hours_per_night: Number(form.elements['sleep_hours_per_night'].value),
    stress_level: form.elements['stress_level'].value,
  };
}

async function extractErrorMessage(response) {
  try {
    const body = await response.json();
    if (Array.isArray(body.detail)) {
      // FastAPI/Pydantic validation error shape
      const parts = body.detail.map((d) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : 'field';
        return `${field}: ${d.msg}`;
      });
      return `The backend rejected the request — ${parts.join('; ')}.`;
    }
    if (typeof body.detail === 'string') {
      return `The backend rejected the request — ${body.detail}`;
    }
  } catch (_) {
    // response wasn't JSON
  }
  return `The backend returned an error (HTTP ${response.status}).`;
}

function handleSubmitError(err) {
  let message;
  if (err instanceof TypeError) {
    // fetch() throws a bare TypeError for network failures / blocked CORS requests
    message = `Could not reach the backend at ${API_BASE}. Make sure the FastAPI server is running and that CORS is enabled, then try again.`;
  } else {
    message = err.message || 'Something went wrong while getting your prediction.';
  }
  setStatus('error', 'Backend unreachable');
  showBanner(message);
}

function setSubmitting(state) {
  isSubmitting = state;
  submitBtn.disabled = state;
  submitBtn.classList.toggle('loading', state);
}

// --------------------------------------------------------------------------
// Result / gauge
// --------------------------------------------------------------------------

const GAUGE_RADIUS = 94;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

function initGauge() {
  gaugeFill.style.strokeDasharray = `${GAUGE_CIRCUMFERENCE}`;
  gaugeFill.style.strokeDashoffset = `${GAUGE_CIRCUMFERENCE}`;
}

function showResult(score) {
  const clamped = Math.max(0, Math.min(SCORE_SCALE_MAX, score));
  const fraction = clamped / SCORE_SCALE_MAX;
  const offset = GAUGE_CIRCUMFERENCE * (1 - fraction);

  gaugeScore.textContent = Number.isInteger(score) ? String(score) : score.toFixed(1);
  gaugeScale.textContent = `out of ${SCORE_SCALE_MAX}`;

  // color shifts from teal (higher) to amber (lower) along the gauge
  const gaugeColor = fraction >= 0.6 ? 'var(--teal)' : fraction >= 0.35 ? 'var(--purple)' : 'var(--amber)';
  gaugeFill.style.stroke = gaugeColor;

  requestAnimationFrame(() => {
    gaugeFill.style.strokeDashoffset = `${offset}`;
  });

  const { label, text } = getInterpretation(score);
  interpretationLabel.textContent = label;
  interpretationText.textContent = text;

  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getInterpretation(score) {
  const { q1, median, q3 } = SCORE_QUARTILES;
  if (score < q1) {
    return {
      label: 'Lower reported range',
      text: `Your predicted score falls below the bottom quarter of the training sample (below ${q1}). This is a model estimate, not a diagnosis — consider talking to someone you trust or a professional if you're struggling.`,
    };
  }
  if (score < q3) {
    return {
      label: 'Typical / mid reported range',
      text: `Your predicted score sits within the middle half of the training sample (between ${q1} and ${q3}, median ${median}).`,
    };
  }
  return {
    label: 'Higher reported range',
    text: `Your predicted score falls above the top quarter of the training sample (above ${q3}).`,
  };
}

// --------------------------------------------------------------------------
// Reset
// --------------------------------------------------------------------------

function resetAssessment() {
  form.reset();
  clearAllErrors();
  clearBanner();
  initSliders();
  goToStep(1, { skipValidation: true });

  resultSection.hidden = true;
  gaugeFill.style.transition = 'none';
  gaugeFill.style.strokeDashoffset = `${GAUGE_CIRCUMFERENCE}`;
  requestAnimationFrame(() => {
    gaugeFill.style.transition = '';
  });

  assessmentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}