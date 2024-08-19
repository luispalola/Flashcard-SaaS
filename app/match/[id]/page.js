'use client'

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Container, Typography, Box, Grid, Paper } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { useUser } from '@clerk/nextjs';
import { Global } from '@emotion/react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';

export default function MatchGame() {
  const params = useParams();
  const { id } = params;
  const { user, isLoaded } = useUser();
  const [flashcards, setFlashcards] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [timer, setTimer] = useState(0);
  const [isGameFinished, setIsGameFinished] = useState(false);

  useEffect(() => {
    if (isLoaded && id) {
      const fetchFlashcards = async () => {
        const flashcardsRef = collection(db, 'users', user.id, id);
        const flashcardsSnapshot = await getDocs(flashcardsRef);
        let flashcardsData = flashcardsSnapshot.docs.map(doc => doc.data());

        // Shuffle the flashcards and then select only 5 pairs
        flashcardsData = shuffle(flashcardsData).slice(0, 6);

        // Shuffle and combine terms and definitions
        const shuffledTiles = shuffle([
          ...flashcardsData.map(fc => ({ text: fc.front, type: 'term', matched: false })),
          ...flashcardsData.map(fc => ({ text: fc.back, type: 'definition', matched: false }))
        ]);

        setFlashcards(flashcardsData);
        setTiles(shuffledTiles);
      };
      fetchFlashcards();
    }
  }, [isLoaded, id, user]);

  useEffect(() => {
    let timerInterval;
    if (!isGameFinished) {
      timerInterval = setInterval(() => {
        setTimer((prevTime) => prevTime + 0.1);
      }, 100);
    }
    return () => clearInterval(timerInterval);
  }, [isGameFinished]);

  // Shuffle function
  const shuffle = (array) => {
    return array.sort(() => Math.random() - 0.5);
  };

  const handleTileClick = (tileIndex) => {
    const selectedTile = tiles[tileIndex];
    
    const isAlreadySelected = selectedTiles.some(selected => selected.index === tileIndex);
    
    if (isAlreadySelected) {
      setSelectedTiles(prev => prev.filter(selected => selected.index !== tileIndex));
      return;
    }

    if (selectedTiles.length >= 2) return; // Prevent more than two selections at a time

    
    setSelectedTiles(prev => [...prev, { ...selectedTile, index: tileIndex }]);

    if (selectedTiles.length === 1) {
      const firstTile = selectedTiles[0];
      const secondTile = { ...selectedTile, index: tileIndex };

      if (
        (firstTile.type === 'term' && secondTile.type === 'definition' && isMatch(firstTile, secondTile)) ||
        (firstTile.type === 'definition' && secondTile.type === 'term' && isMatch(secondTile, firstTile))
      ) {
        // Correct match - turn cards green
        setTiles(prevTiles =>
          prevTiles.map((tile, index) =>
            index === firstTile.index || index === secondTile.index
              ? { ...tile, matched: true, green: true } // Mark as green for correct match
              : tile
          )
        );

        // Start fade-out after a brief delay
        setTimeout(() => {
          setTiles(prevTiles =>
            prevTiles.map((tile, index) =>
              index === firstTile.index || index === secondTile.index
                ? { ...tile, fadeOut: true } // Trigger fadeOut
                : tile
            )
          );
        }, 500); // Delay to allow the green color to be seen

        // Finally, hide the tiles completely after fade-out
        setTimeout(() => {
          setTiles(prevTiles =>
            prevTiles.map((tile, index) =>
              index === firstTile.index || index === secondTile.index
                ? { ...tile, hidden: true } // Hide after fade-out
                : tile
            )
          );
        }, 1000); // Match the fade-out duration

        setMatches([...matches, { term: firstTile.text, definition: secondTile.text }]);
        setSelectedTiles([]); // Clear selections to allow new ones

        if (matches.length + 1 === flashcards.length) {
          setIsGameFinished(true); // End game when all matches are made
        }
      } else {
        // Incorrect match - trigger shake and red background
        setTiles(prevTiles =>
          prevTiles.map((tile, index) =>
            index === firstTile.index || index === secondTile.index
              ? { ...tile, shake: true, incorrect: true } // Mark as shaking and incorrect
              : tile
          )
        );
        setTimeout(() => {
          setTiles(prevTiles =>
            prevTiles.map((tile, index) =>
              index === firstTile.index || index === secondTile.index
                ? { ...tile, shake: false, incorrect: false } // Remove shake effect after animation
                : tile
            )
          );
          setSelectedTiles([]); // Clear selections after a short delay
        }, 300); // Match the shake duration
      }
    }
  };

  const isMatch = (termTile, defTile) => {
    return flashcards.some(fc => fc.front === termTile.text && fc.back === defTile.text);
  };

  return (
    <Container maxWidth="lg">
      <Global
        styles={`
          @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
            100% { transform: translateX(0); }
          }
        `}
      />
      
      {/* Top Bar */}
      <Box
        sx={{
          
          width: '100vw', 
          height: '80px', 
          display: 'flex',
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#B5A1E0', 
          color: '#fff', 
          padding: '10px 20px',
          marginBottom: '20px',
          boxSizing: 'border-box',
          position: 'fixed',
          top: 0,
          left: 0,
        }}
      >
        <Box 
          sx = {{ flex: 1, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold'}}>
            {id} - Match Game
          </Typography>
        </Box>

        <Box
          sx = {{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#B5A1E0',
            borderRadius: '25px',
            padding: '5px 10px 5px 2px',
            color: '#fff',
            position: 'absolute',
            left: '20px',
            border: '2px solid #fff',
            transition: 'background-color 0.3s, color 0.3s',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: '#fff',
              color: '#B5A1E0',
              '& svg': {
                color: '#B5A1E0',
              },
            },
          }}
          onClick={() => window.location.href = '/match'}
        >
          <ArrowLeftIcon sx={{ mr: 0.5 }} />
          <Typography
            variant="body1"
            sx={{
              fontWeight: 'bold',
            }}
          >
            Back
          </Typography>
        </Box>

        <Box
          sx = {{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#B5A1E0',
            borderRadius: '25px',
            padding: '5px 15px',
            color: '#fff',
            position: 'absolute',
            right: '20px',
            border: '2px solid #fff',
            transition: 'background-color 0.3s, color 0.3s',
            '&:hover': {
              backgroundColor: '#fff',
              color: '#B5A1E0',
              '& svg': {
                color: '#B5A1E0'
              },
            },
          }}
        >
          <AccessTimeIcon sx={{ mr: 1 }} />
          <Typography
            variant="body1"
            sx={{
              fontWeight: 'bold',
            }}
          >
            {timer.toFixed(1)}s
          </Typography>
        </Box>
      </Box>

      {/* Match Game Grid */}
      <Box sx={{ textAlign: 'center', my: 4, mt: '100px' }}>
        <Grid 
          container 
          spacing={3} 
          justifyContent="center" 
          alignItems="center" 
          sx={{ 
            width: '100%',
            maxWidth: '100%',
            margin: '0 auto',
            px:0, 
          }}
        >
          {tiles.map((tile, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  cursor: tile.matched ? 'default' : 'pointer',
                  backgroundColor: tile.hidden
                    ? 'transparent'
                    : tile.green 
                    ? 'rgba(144, 238, 144, 0.5)' 
                    : selectedTiles.some(selected => selected.index === index && tile.incorrect)
                    ? 'rgba(255, 99, 71, 0.5)' 
                    : selectedTiles.some(selected => selected.index === index)
                    ? 'rgba(186, 104, 200, 0.5)'
                    : '#F8F3FC',
                  visibility: tile.hidden ? 'hidden' : 'visible',
                  border: tile.hidden
                    ? 'none'
                    : tile.matched
                    ? '2px solid rgba(144, 238, 144, 0.8)'
                    : selectedTiles.some(selected => selected.index === index && tile.incorrect)
                    ? '2px solid rgba(255, 99, 71, 0.8)'
                    : 'none', 
                  height: '180px',  // Fixed height
                  width: '100%', 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  opacity: tile.fadeOut ? 0 : 1, 
                  transition: 'background-color 0.5s ease, opacity 0.5s ease-out, border 0.5s ease',
                  transition: tile.fadeOut ? 'opacity 0.3s ease-out' : 'opacity 0.2s', 
                  transform: tile.shake ? 'translateX(0)' : 'scale(1)', 
                  animation: tile.shake ? 'shake 0.3s' : 'none', 
                  overflow: 'hidden', // Ensure content is contained
                  '&:hover' : tile.matched ? {} : {
                    backgroundColor: 'rgba(186, 104, 200, 0.5)',
                    color: '#fff',
                  },
                  '&:hover' : (tile.matched || tile.incorrect) ? {} : {
                    backgroundColor: 'rgba(186, 104, 200, 0.5)',
                  }
                }}
                onClick={() => !tile.matched && handleTileClick(index)}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: tile.text.length > 200? '0.750rem':'0.875rem',
                    lineHeight: 'normal',
                    userSelect: 'none',
                    color: 'inherit',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {tile.text}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
