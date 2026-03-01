import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Volume2, 
  Calendar, 
  Target, 
  TrendingUp,
  BookOpen,
  Brain,
  Edit,
  Trash2,
  MoreVertical,
  Star,
  Clock,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {Link} from 'react-router-dom'; 

const WordDetailsModal = ({ isOpen, onClose, word, onEdit, onDelete, onStudy }) => {
  const [loading, setLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);

  if (!word) return null;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-accent/10 text-accent border-transparent';
      case 'intermediate': return 'bg-amber-100 text-amber-700 border-transparent';
      case 'advanced': return 'bg-rose-100 text-rose-700 border-transparent';
      default: return 'bg-muted text-muted-foreground border-transparent';
    }
  };

  const getMasteryColor = (level) => {
    if (level >= 4) return 'text-accent';
    if (level >= 3) return 'text-secondary';
    if (level >= 2) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getMasteryLabel = (level) => {
    if (level >= 4) return 'Mastered';
    if (level >= 3) return 'Familiar';
    if (level >= 2) return 'Learning';
    return 'New';
  };

  const playPronunciation = async () => {
    setPlayingAudio(true);
    try {
      // In a real app, this would use text-to-speech or audio file
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.rate = 0.8;
      utterance.lang = 'en-GB'
      utterance.onend = () => setPlayingAudio(false);
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Failed to play pronunciation:', error);
      setPlayingAudio(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${word.word}"?`)) {
      setLoading(true);
      try {
        await onDelete?.(word.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete word:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const masteryPercentage = ((word.mastery_level || 0) / 5) * 100;
  const nextReviewDate = new Date(word.next_review || Date.now());
  const isOverdue = nextReviewDate < new Date();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto border-border/80">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-semibold text-primary flex items-center gap-3">
                {word.word}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={playPronunciation}
                  disabled={playingAudio}
                  className="h-8 w-8 min-w-0 p-0"
                >
                  <Volume2 className={`h-4 w-4 ${playingAudio ? 'animate-pulse' : ''}`} />
                </Button>
              </DialogTitle>
              
              {word.pronunciation && (
                <DialogDescription className="text-lg mt-1 text-secondary">
                  {word.pronunciation}
                </DialogDescription>
              )}
              
              <div className="flex items-center gap-2 mt-3">
                <Badge className={getDifficultyColor(word.difficulty)}>
                  {word.difficulty}
                </Badge>
                {word.part_of_speech && (
                  <Badge variant="outline">
                    {word.part_of_speech}
                  </Badge>
                )}
                <div className={`flex items-center gap-1 ${getMasteryColor(word.mastery_level)}`}>
                  <Star className="h-3 w-3" />
                  <span className="text-sm font-medium">
                    {getMasteryLabel(word.mastery_level)}
                  </span>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(word)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Word
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => (<Link to='/study' />)}>
                  <Brain className="h-4 w-4 mr-2" />
                  Study Now
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Word
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Learning Progress */}
          <div className="bg-muted/50 p-4 rounded-lg border border-border/60">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Learning Progress
            </h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Mastery Level</span>
                  <span className={getMasteryColor(word.mastery_level)}>
                    {word.mastery_level}/5 - {getMasteryLabel(word.mastery_level)}
                  </span>
                </div>
                <Progress value={masteryPercentage} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Added:</span>
                  <span>{new Date(word.added_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className={`h-3 w-3 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`} />
                  <span className="text-muted-foreground">Next Review:</span>
                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                    {nextReviewDate.toLocaleDateString()}
                  </span>
                </div>
              </div>

              {isOverdue && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This word is overdue for review. Study it now to maintain your progress!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Definitions */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Definitions
            </h3>
            
           <div className="space-y-4">
            {word.definitions?.slice(0, 3).map((def, index) => (
                <div key={index} className="rounded-lg border border-border/70 bg-card px-4 py-3">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs mt-0.5">
                      {index + 1}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-foreground mb-2">{def.definition}</p>
                      {def.example && (
                        <p className="caption italic">
                          "{def.example}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )) || (
                <p className="text-muted-foreground">No definitions available</p>
              )}
           </div>

          </div>

          {/* Study Statistics */}
          {word.study_stats && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Study Statistics
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-semibold text-primary">
                    {word.study_stats.total_reviews || 0}
                  </div>
                  <div className="caption text-xs">Total Reviews</div>
                </div>
                
                <div className="text-center p-3 bg-accent/10 rounded-lg">
                  <div className="text-2xl font-semibold text-accent">
                    {word.study_stats.correct_answers || 0}
                  </div>
                  <div className="caption text-xs">Correct</div>
                </div>
                
                <div className="text-center p-3 bg-rose-100 rounded-lg">
                  <div className="text-2xl font-semibold text-rose-600">
                    {word.study_stats.incorrect_answers || 0}
                  </div>
                  <div className="caption text-xs">Incorrect</div>
                </div>
                
                <div className="text-center p-3 bg-secondary/10 rounded-lg">
                  <div className="text-2xl font-semibold text-secondary">
                    {word.study_stats.accuracy ? `${Math.round(word.study_stats.accuracy)}%` : '0%'}
                  </div>
                  <div className="caption text-xs">Accuracy</div>
                </div>
              </div>
            </div>
          )}

          {/* Etymology (if available) */}
          {word.etymology && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Etymology
              </h3>
              <p className="caption">{word.etymology}</p>
            </div>
          )}

          {/* Synonyms and Antonyms */}
          {(word.synonyms?.length > 0 || word.antonyms?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {word.synonyms?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-accent">Synonyms</h4>
                  <div className="flex flex-wrap gap-1">
                    {word.synonyms.map((synonym, index) => (
                      <Badge key={index} variant="outline" className="text-accent border-accent/30">
                        {synonym}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {word.antonyms?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-rose-600">Antonyms</h4>
                  <div className="flex flex-wrap gap-1">
                    {word.antonyms.map((antonym, index) => (
                      <Badge key={index} variant="outline" className="text-rose-600 border-rose-300">
                        {antonym}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <Link to='/study'>
            <Button 
              variant="outline" 
              onClick={() => onStudy?.(word)}
              className="flex-1 sm:flex-none "
            >
              
              <Brain className="h-4 w-4 mr-2" />
              Study Now
            
            </Button>
              </Link>
            <Button 
              variant="outline" 
              onClick={() => onEdit?.(word)}
              className="flex-1 sm:flex-none"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
          <Button onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WordDetailsModal;
