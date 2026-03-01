import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, RotateCcw } from 'lucide-react';
import './AnimatedFlashcard.css'; // We'll create this CSS file

const AnimatedFlashcard = ({ word, onFlip, isFlipped, onPronounce }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFlip = () => {
    if (isAnimating) return; // Prevent multiple clicks during animation
    
    setIsAnimating(true);
    onFlip();
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 600); // Match CSS animation duration
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-accent/10 text-accent border-transparent';
      case 'intermediate': return 'bg-amber-100 text-amber-700 border-transparent';
      case 'advanced': return 'bg-rose-100 text-rose-700 border-transparent';
      default: return 'bg-muted text-muted-foreground border-transparent';
    }
  };

  return (
    <div className="flashcard-container" onClick={handleFlip}>
      <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
        {/* Front of card */}
        <div className="flashcard-face flashcard-front">
          <div className="flashcard-content">
            <Badge className={getDifficultyColor(word?.difficulty)}>
              {word?.difficulty}
            </Badge>
            
            <h2 className="flashcard-word">
              {word?.word}
            </h2>
            
            {word?.pronunciation && (
              <div className="flashcard-pronunciation">
                <p className="pronunciation-text">
                  {word.pronunciation}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onPronounce();
                  }}
                  className="pronunciation-btn"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flip-hint">
              <RotateCcw className="h-4 w-4 mr-2" />
              Click to reveal definition
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div className="flashcard-face flashcard-back">
          <div className="flashcard-content">
            <h3 className="flashcard-word-back">
              {word?.word}
            </h3>
            
            <div className="definitions-container">
              {word?.definitions?.slice(0,2).map((def, index) => (
                <div key={index} className="definition-item">
                  <p className="definition-text">{def.definition}</p>
                  {def.example && (
                    <p className="example-text">
                      "{def.example}"
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flip-hint">
              How well did you know this word?
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedFlashcard;
