import mongoose, { Schema, model, models } from 'mongoose';

const CourseSchema = new Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  modules: [{
    title: { type: String },
    lessons: [{
      id: { type: String },
      title: { type: String },
      type: { type: String, enum: ['video', 'text', 'challenge', 'quiz'] },
      content: { type: String },
      videoUrl: { type: String },
      xp: { type: Number },
      // Challenge
      initialCode: { type: String },
      testCode: { type: String },
      // Quiz
      questions: [{
        question: { type: String },
        options: [{ type: String }],
        correctAnswer: { type: Number } // Index of correct option
      }]
    }]
  }],
  tags: [{ type: String }],
  difficulty: { type: String, default: 'Beginner' },
  duration: { type: String, default: '1h' },
  isPublished: { type: Boolean, default: true }
}, { timestamps: true });

const Course = models.Course || model('Course', CourseSchema);

export default Course;
