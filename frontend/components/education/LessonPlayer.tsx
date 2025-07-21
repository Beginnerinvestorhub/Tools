import React, { useState } from 'react';
import ReactPlayer from 'react-player/lazy';
import Quiz from './Quiz';
import { Lesson } from '../../../content/education/modules';

interface LessonPlayerProps {
  lesson: Lesson;
  onComplete: () => void;
}

/**
 * Renders a lesson video (or animation) followed by a quiz.
 * Once the user passes the quiz, calls onComplete so parent can
 * trigger backend event / award points.
 */
export default function LessonPlayer({ lesson, onComplete }: LessonPlayerProps) {
  const [quizUnlocked, setQuizUnlocked] = useState(false);
  const [passed, setPassed] = useState(false);

  return (
    <div className="space-y-6">
      {lesson.videoUrl && (
        <div className="w-full aspect-video rounded-lg overflow-hidden shadow">
          <ReactPlayer
            url={lesson.videoUrl}
            width="100%"
            height="100%"
            controls
            onEnded={() => setQuizUnlocked(true)}
          />
        </div>
      )}

      {quizUnlocked && !passed && (
        <Quiz lessonSlug={lesson.slug} onPass={() => { setPassed(true); onComplete(); }} />
      )}

      {passed && (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 font-semibold">Great job! You passed the quiz and earned {lesson.points} XP.</p>
        </div>
      )}
    </div>
  );
}
