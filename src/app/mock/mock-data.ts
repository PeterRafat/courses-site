import { Course, CourseVideo, Quiz, Question, User, Answer } from '../models/entities';

export const USE_MOCK = false;

export const mockUsers: User[] = [
  { userId: 1, fullName: 'Test User', phone: '01000000000', email: 'user@test.com', createdAt: new Date().toISOString(), isActive: true }
];

export const mockCourses: Course[] = [
  { courseId: 1, courseName: 'Angular Basics', courseImage: '/download (4).jfif', description: 'Intro to Angular standalone components', price: 199.99, isFree: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { courseId: 2, courseName: 'Advanced .NET API', courseImage: '/download.png', description: 'Building robust APIs with ASP.NET Core', price: 299.99, isFree: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const mockVideos: CourseVideo[] = [
  { videoId: 1, courseId: 1, videoTitle: 'Intro', videoUrl: 'https://www.youtube.com/watch?v=7VvAi6ZbZio', duration: 300, orderIndex: 1 },
  { videoId: 2, courseId: 1, videoTitle: 'Standalone Components', videoUrl: 'https://example.com/video2', duration: 600, orderIndex: 2 }
];

export const mockQuizzes: Quiz[] = [
  { quizId: 1, courseId: 1, quizTitle: 'Angular Quiz', description: 'Basic questions', totalQuestions: 3, passingScore: 70, timeLimit: 10, isActive: true }
];

export const mockQuestions: Question[] = [
  { questionId: 1, quizId: 1, questionText: 'Angular uses TypeScript?', questionType: 2, orderIndex: 1 },
  { questionId: 2, quizId: 1, questionText: 'Standalone components need NgModule?', questionType: 1, orderIndex: 2 },
  { questionId: 3, quizId: 1, questionText: 'Select all features of Router', questionType: 3, orderIndex: 3 }
];

export const mockAnswers: Answer[] = [
  { answerId: 1, questionId: 1, answerText: 'True', isCorrect: true, orderIndex: 1 },
  { answerId: 2, questionId: 1, answerText: 'False', isCorrect: false, orderIndex: 2 },

  { answerId: 3, questionId: 2, answerText: 'Yes, always required', isCorrect: false, orderIndex: 1 },
  { answerId: 4, questionId: 2, answerText: 'No, standalone removes need', isCorrect: true, orderIndex: 2 },

  { answerId: 5, questionId: 3, answerText: 'Lazy loading', isCorrect: true, orderIndex: 1 },
  { answerId: 6, questionId: 3, answerText: 'Navigation guards', isCorrect: true, orderIndex: 2 },
  { answerId: 7, questionId: 3, answerText: 'Database migrations', isCorrect: false, orderIndex: 3 },
  { answerId: 8, questionId: 3, answerText: 'Link preloading', isCorrect: true, orderIndex: 4 }
];