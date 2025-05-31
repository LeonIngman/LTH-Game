-- Create QuizSubmission table
CREATE TABLE IF NOT EXISTS "QuizSubmission" (
  id SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "levelId" INTEGER NOT NULL,
  answers JSONB NOT NULL,
  "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  UNIQUE("userId", "levelId")
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_quiz_submission_user_level ON "QuizSubmission"("userId", "levelId");
CREATE INDEX IF NOT EXISTS idx_quiz_submission_level ON "QuizSubmission"("levelId");
