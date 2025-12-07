export interface User {
  userId: number;
  fullName: string;
  phone: string;
  email: string;
  role?: string;
  createdAt: string;
  isActive: boolean;
}

export interface Course {
  courseId: number;
  courseName: string;
  courseImage: string;
  description: string;
  price: number;
  isFree: boolean;
  createdAt: string;
  updatedAt: string;
  videoCount?: number;
  quizCount?: number;
}

export interface CourseVideo {
  videoId: number;
  courseId: number;
  videoTitle: string;
  videoUrl: string;
  duration: number;
  orderIndex: number;
}

export interface UserCourse {
  userCourseId: number;
  userId: number;
  courseId: number;
  addedAt: string;
  isActive: boolean;
  completionPercentage: number;
  completedAt?: string | null;
}

export interface Quiz {
  quizId: number;
  courseId: number;
  quizTitle: string;
  description: string;
  totalQuestions: number;
  passingScore: number;
  timeLimit: number;
  isActive: boolean;
}

export interface Question {
  questionId: number;
  quizId: number;
  questionText: string;
  questionType: number;
  orderIndex: number;
}

// QuestionType mapping used across the app and API:
// 0 = Multiple choice (choice/select), 1 = True/False
export enum QuestionType {
  MultipleChoice = 0,
  TrueFalse = 1
}

export interface Answer {
  answerId: number;
  questionId: number;
  answerText: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface UserQuizAttempt {
  attemptId: number;
  userId: number;
  quizId: number;
  startedAt: string;
  completedAt?: string | null;
  score: number;
  correctAnswers: number;
  isPassed: boolean;
}

export interface ContactForm {
  id: number;
  name: string;
  email: string;
  number: string;
  text: string;
  createdAt: string;
}

export interface ContactFormCreate {
  name: string;
  email: string;
  number: string;
  text: string;
}