import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AnimatedFlashcard from '../components/AnimatedFlashcard';
import { 
  Brain, 
  CheckCircle, 
  XCircle,
  Clock,
  Target,
  TrendingUp,
  Home,
  RefreshCw,
  Award,
  BookOpen
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const StudyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Session state
  const [studyWords, setStudyWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0
  });
  const [sessionComplete, setSessionComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudySession();
  }, []);

  const loadStudySession = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getWords();
      
      if (response.words && response.words.length > 0) {
        
        setStudyWords(response.words);
        setSessionStats(prev => ({ ...prev, total: response.words.length }));
      } else {
        setStudyWords([]);
        setSessionStats(prev => ({ ...prev, total: 0 }));
      }
    } catch (error) {
      console.error('Failed to load study session:', error);
      setError(error.message || 'Failed to load study session');
      setStudyWords([]);
      setSessionStats(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const currentWord = studyWords[currentWordIndex];
  const progressPercentage = studyWords.length > 0 ? ((currentWordIndex + 1) / studyWords.length) * 100 : 0;

  const handleFlipCard = () => {
    setShowDefinition(!showDefinition);
  };

  const playPronunciation = () => {
    if (currentWord?.word) {
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleDifficultyResponse = async (difficulty) => {
    if (!currentWord) return;

    setSubmitting(true);
    setError('');
    
    try {
      // Update word progress based on difficulty response
      await apiService.updateWordProgress(currentWord.id, difficulty);
      
      // Update session stats
      const isCorrect = difficulty === 'easy' || difficulty === 'medium';
      setSessionStats(prev => ({
        ...prev,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        incorrect: !isCorrect ? prev.incorrect + 1 : prev.incorrect
      }));

      // Move to next word or complete session
      if (currentWordIndex < studyWords.length - 1) {
        setCurrentWordIndex(currentWordIndex + 1);
        setShowDefinition(false);
      } else {
        setSessionComplete(true);
      }
    } catch (error) {
      console.error('Failed to update word progress:', error);
      setError(error.message || 'Failed to save your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const startNewSession = () => {
    setCurrentWordIndex(0);
    setShowDefinition(false);
    setSessionStats({ correct: 0, incorrect: 0, total: studyWords.length });
    setSessionComplete(false);
    loadStudySession();
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 shadow-lg shadow-slate-900/5">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-secondary/25 border-t-primary"></div>
            <p className="caption">Loading your study session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (studyWords.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <Card className="border-border/80">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-primary/70 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Words to Study</h2>
            <p className="caption mb-6">
              You don't have any words due for review right now. Add some words to your library or check back later!
            </p>
            {error && (
              <p className="text-sm text-destructive mb-4">{error}</p>
            )}
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link to="/words">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Words
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionComplete) {
    const accuracy = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;
    const performance = accuracy >= 80 ? 'excellent' : accuracy >= 60 ? 'good' : 'needs-improvement';
    
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <Card className="max-w-2xl mx-auto border-border/80">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {performance === 'excellent' ? (
                <Award className="h-16 w-16 text-yellow-500" />
              ) : performance === 'good' ? (
                <CheckCircle className="h-16 w-16 text-green-500" />
              ) : (
                <Target className="h-16 w-16 text-blue-500" />
              )}
            </div>
            <CardTitle className="text-2xl font-semibold">
              {performance === 'excellent' ? 'Excellent Work!' :
               performance === 'good' ? 'Good Job!' : 'Keep Practicing!'}
            </CardTitle>
            <CardDescription className="caption">
              You've completed your study session
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-primary/10">
                <div className="text-2xl font-semibold text-primary">{sessionStats.total}</div>
                <div className="caption">Words Studied</div>
              </div>
              <div className="p-4 rounded-lg bg-accent/10">
                <div className="text-2xl font-semibold text-accent">{sessionStats.correct}</div>
                <div className="caption">Correct</div>
              </div>
              <div className="p-4 rounded-lg bg-rose-100">
                <div className="text-2xl font-semibold text-rose-600">{sessionStats.incorrect}</div>
                <div className="caption">Needs Review</div>
              </div>
            </div>

            {/* Accuracy */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Session Accuracy</span>
                <span className="font-medium">{accuracy}%</span>
              </div>
              <Progress value={accuracy} className="h-3" />
            </div>

            {/* Performance Message */}
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                {performance === 'excellent' && 
                  "Outstanding! You're mastering these words quickly. Keep up the great work!"
                }
                {performance === 'good' && 
                  "Good progress! A few more reviews and you'll have these words mastered."
                }
                {performance === 'needs-improvement' && 
                  "Don't worry, learning takes time. Try reviewing these words again soon."
                }
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-center">
              <Button onClick={startNewSession}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Study More
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/progress">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Progress
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Study Session
          </h1>
          <p className="caption mt-1">
            Review your vocabulary with spaced repetition
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/dashboard">
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
        </Button>
      </div>

      {/* Progress Bar */}
      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card className="mb-6 border-border/80">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="caption">
              {currentWordIndex + 1} of {studyWords.length}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Animated Flashcard */}
      <AnimatedFlashcard 
        word={currentWord}
        onFlip={handleFlipCard}
        isFlipped={showDefinition}
        onPronounce={playPronunciation}
      />

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mb-6">
        {showDefinition && (
          <div className="flex flex-wrap justify-center gap-2">
            <Button 
              variant="outline" 
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
              onClick={() => handleDifficultyResponse('hard')}
              disabled={submitting}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Hard
            </Button>
            <Button 
              variant="outline"
              className="text-amber-600 border-amber-200 hover:bg-amber-50"
              onClick={() => handleDifficultyResponse('medium')}
              disabled={submitting}
            >
              <Clock className="h-4 w-4 mr-2" />
              Medium
            </Button>
            <Button 
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => handleDifficultyResponse('easy')}
              disabled={submitting}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Easy
            </Button>
          </div>
        )}
      </div>

      {/* Session Stats */}
      <Card className="border-border/80">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-accent">{sessionStats.correct}</div>
              <div className="caption">Correct</div>
            </div>
            <div>
              <div className="font-semibold text-rose-600">{sessionStats.incorrect}</div>
              <div className="caption">Incorrect</div>
            </div>
            <div>
              <div className="font-semibold text-primary">
                {sessionStats.total - sessionStats.correct - sessionStats.incorrect}
              </div>
              <div className="caption">Remaining</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyPage;
