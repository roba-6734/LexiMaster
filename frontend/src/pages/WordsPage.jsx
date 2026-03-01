import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api.js';
import AddWordModal from '../components/AddWordModal';
import WordDetailsModal from '../components/WordDetailsModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  BookOpen, 
  Search, 
  Plus, 
  Filter,
  MoreVertical,
  Calendar,
  Target,
  Volume2,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';

const WordsPage = () => {
  const { user } = useAuth();
  const [words, setWords] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  

  useEffect(() => {
    loadWords();
  }, [currentPage, searchTerm, filterDifficulty, sortBy]);

  const loadWords = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getWords(currentPage, 20, searchTerm);
      console.log(response)
      setWords(response.words || []);
      const total = response.total || 0;
      const perPage = response.per_page || 20;
      setTotalPages(Math.max(1, Math.ceil(total / perPage)));
    } catch (error) {
      console.error('Failed to load words:', error);
      setWords([]);
      setTotalPages(1);
      setError(error.message || 'Failed to load words');
    } finally {
      setLoading(false);
    }
  };

  const filteredWords = words.filter(word => {
    const matchesSearch = word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (word.definitions?.[0]?.definition || '').toLowerCase().includes(searchTerm.toLowerCase());
    const difficulty = word.difficulty_level || word.difficulty;
    const matchesDifficulty = filterDifficulty === 'all' || difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-accent/10 text-accent border-transparent';
      case 'easy': return 'bg-accent/10 text-accent border-transparent';
      case 'intermediate': return 'bg-amber-100 text-amber-700 border-transparent';
      case 'advanced': return 'bg-rose-100 text-rose-700 border-transparent';
      case 'hard': return 'bg-rose-100 text-rose-700 border-transparent';
      default: return 'bg-muted text-muted-foreground border-transparent';
    }
  };

  const getMasteryColor = (level) => {
    if (level >= 4) return 'bg-accent';
    if (level >= 3) return 'bg-secondary';
    if (level >= 2) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const handleWordAdded = () => {
  loadWords(); // Refresh the word list
};
const handleEditWord = (word) => {
  // You can implement edit functionality later
  console.log('Edit word:', word);
};
const handleDeleteWord = async (wordId) => {
  // Implement delete functionality
  await apiService.deleteWord(wordId);
  loadWords();
};
const handleStudyWord = (word) => {
  // Navigate to study mode with this word
  <Link to='/study' />
};

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 shadow-lg shadow-slate-900/5">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-secondary/25 border-t-primary"></div>
            <p className="caption">Loading words...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Words Library
          </h1>
          <p className="caption mt-1">
            Manage your vocabulary collection ({filteredWords.length} words)
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Word
        </Button>
      </div>
      {error && (
        <Card className="border-destructive/20">
          <CardContent className="p-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="border-border/80">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Label htmlFor="search">Search Words</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by word or definition..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Difficulty Filter */}
            <div className="w-full md:w-48">
              <Label>Difficulty</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full mt-1 justify-between">
                    <Filter className="h-4 w-4 mr-2" />
                    {filterDifficulty === 'all' ? 'All Levels' : 
                     filterDifficulty.charAt(0).toUpperCase() + filterDifficulty.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterDifficulty('all')}>
                    All Levels
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterDifficulty('easy')}>
                    Easy
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterDifficulty('intermediate')}>
                    Intermediate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterDifficulty('hard')}>
                    Hard
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Sort */}
            <div className="w-full md:w-48">
              <Label>Sort By</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full mt-1 justify-between">
                    {sortBy === 'recent' ? 'Recently Added' :
                     sortBy === 'alphabetical' ? 'A-Z' :
                     sortBy === 'difficulty' ? 'Difficulty' : 'Due Soon'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy('recent')}>
                    Recently Added
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('alphabetical')}>
                    Alphabetical (A-Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('difficulty')}>
                    By Difficulty
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('due')}>
                    Due for Review
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Words Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWords.map((word) => (
          <Card key={word.id} className="border-border/80 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/10 cursor-pointer" onClick ={()=>(setSelectedWord(word))}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl font-semibold text-primary">
                    {word.word}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getDifficultyColor(word.difficulty_level || word.difficulty)}>
                      {word.difficulty_level || word.difficulty || 'unknown'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getMasteryColor(word.mastery_level)}`}></div>
                      <span className="caption text-xs">
                        Level {word.mastery_level}
                      </span>
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick = {(e) =>{e.stopPropagation();}} 
                  >
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedWord(word)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Volume2 className="h-4 w-4 mr-2" />
                      Pronounce
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="caption mb-3">
                {word.definitions?.[0]?.definition || 'No definition available'}
              </p>
              
              <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Added {new Date(word.added_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Review {word.next_review ? new Date(word.next_review).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredWords.length === 0 && (
        <Card className="border-border/80">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-primary/70 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No words found</h3>
            <p className="caption mb-4">
              {searchTerm ? 'Try adjusting your search or filters' : 'Start building your vocabulary by adding your first word'}
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Word
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button 
            variant="outline" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 caption">
            Page {currentPage} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
      <AddWordModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onWordAdded={handleWordAdded}
        />

        {/* Word Details Modal */}
        <WordDetailsModal 
        isOpen={!!selectedWord}
        onClose={() => setSelectedWord(null)}
        word={selectedWord}
        onEdit={handleEditWord}
        onDelete={handleDeleteWord}
        onStudy={handleStudyWord}
        />
    </div>
  );
};

export default WordsPage;
