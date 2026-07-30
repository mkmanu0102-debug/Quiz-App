// Dev Local Server URL (uncomment Render URL for production)
// const BASE_URL = 'http://10.163.234.213:5000/api';
const BASE_URL = 'https://quiz-app-bjet.onrender.com/api';

export const api = {
  register: async (name, emailOrPhone, password) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emailOrPhone, password }),
    });
    return res.json();
  },

  verifyOtp: async (emailOrPhone, otp) => {
    const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, otp }),
    });
    return res.json();
  },

  login: async (emailOrPhone, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, password }),
    });
    return res.json();
  },

  getQuizzes: async (token) => {
    const res = await fetch(`${BASE_URL}/quiz`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  getQuestions: async (quizId, token) => {
    const res = await fetch(`${BASE_URL}/quiz/${quizId}/questions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  submitResult: async (quizId, score, total, percentage, token) => {
    const res = await fetch(`${BASE_URL}/quiz/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quiz_id: quizId, score, total, percentage }),
    });
    return res.json();
  },

  getLeaderboard: async (token) => {
    const res = await fetch(`${BASE_URL}/quiz/leaderboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  getHistory: async (token) => {
    const res = await fetch(`${BASE_URL}/quiz/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  generateQuiz: async (topic, numQuestions, difficulty, category, token) => {
    const res = await fetch(`${BASE_URL}/admin/generate-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ topic, numQuestions, difficulty, category }),
    });
    return res.json();
  },

  getAdminQuizzes: async (token) => {
    const res = await fetch(`${BASE_URL}/admin/quizzes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  deleteQuiz: async (quizId, token) => {
    const res = await fetch(`${BASE_URL}/admin/quiz/${quizId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  updateQuiz: async (quizId, title, category, difficulty, token) => {
    const res = await fetch(`${BASE_URL}/admin/quiz/${quizId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, category, difficulty }),
    });
    return res.json();
  },

  forgotPassword: async (emailOrPhone) => {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone }),
    });
    return res.json();
  },

  resetPassword: async (emailOrPhone, otp, newPassword) => {
    const res = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, otp, newPassword }),
    });
    return res.json();
  },

  createQuiz: async (title, category, difficulty, questions, token) => {
    const res = await fetch(`${BASE_URL}/admin/create-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, category, difficulty, questions }),
    });
    return res.json();
  },
};