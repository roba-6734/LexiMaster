import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  X, 
  Search, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Volume2
} from 'lucide-react';
import apiService from '../services/api';

const AddWordModal = ({ isOpen, onClose, onWordAdded }) => {
  const [word,setWord] = useState('')
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setWord('')
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

 
  

 

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    setLoading(true);
    setError('');

    try {
      await apiService.addWord(word.trim());
      setSuccess(true);
      
      // Show success for 1.5 seconds, then close
      setTimeout(() => {
        handleClose();
        onWordAdded?.();
      }, 1500);
    } catch (error) {
      setError(error.message || 'Failed to add word');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-accent/10 text-accent hover:bg-accent/20';
      case 'intermediate': return 'bg-amber-100 text-amber-700 hover:bg-amber-200';
      case 'advanced': return 'bg-rose-100 text-rose-700 hover:bg-rose-200';
      default: return 'bg-muted text-muted-foreground hover:bg-muted/80';
    }
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md border-border/80">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <CheckCircle className="h-10 w-10 text-accent" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Word Added Successfully!</h3>
            <p className="caption text-center">
              "{word}" has been added to your vocabulary.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto border-border/80">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Word
          </DialogTitle>
          <DialogDescription className="caption">
            Add a new word to your vocabulary. You can look it up automatically or enter details manually.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Word Input with Lookup */}
          <div className="space-y-2">
            <Label htmlFor="word">Word *</Label>
            <div className="flex gap-2">
              <Input
                id="word"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Enter the word..."
                className="flex-1"
              />
              
            </div>
          </div>

          

          
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Word...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Word
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWordModal;
