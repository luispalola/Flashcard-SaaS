'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Container, Typography, Box, Button, CircularProgress } from '@mui/material';
import Head from 'next/head';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { useUser } from '@clerk/nextjs';
import QuizIcon from '@mui/icons-material/Quiz';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import { Global } from '@emotion/react';

export default function TestGame() {
  const { id } = useParams();  
  const { user } = useUser();  
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [incorrectQuestions, setIncorrectQuestions] = useState([]);
  const [isGameFinished, setIsGameFinished] = useState(false);

  const getAnsweredCount = () => {
    return Object.keys(selectedAnswers).length;
  };
  
  const adjustFontSize = (text) => {
    const wordCount = text.split(' ').length;
    return '0.75rem'; 
  };

  const truncateText = (text, wordLimit) => {
    const words = text.split(' ');

    if (words.length > wordLimit) {
        return words.slice(0, wordLimit).join(' ') + '...';
    }
    return text;
  };

  const shuffleArray = (array) => {
    return array.sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    if (user && id) {
      const fetchFlashcards = async () => {
        const flashcardsRef = collection(db, 'users', user.id, id);
        const flashcardsSnapshot = await getDocs(flashcardsRef);
        const flashcardsData = flashcardsSnapshot.docs.map(doc => doc.data());

        const formattedQuestions = flashcardsData.map(card => ({
          question: card.front,  
          options: generateOptions(card.back, flashcardsData),  
          answer: card.back  
        }));

        setQuestions(shuffleArray(formattedQuestions));
        setLoading(false);
      };

      fetchFlashcards();
    }
  }, [user, id]);

  

  const generateOptions = (correctAnswer, flashcardsData) => {
    const options = [correctAnswer];
    
    const possibleOptions = flashcardsData
      .map(card => card.back)
      .filter(answer => answer !== correctAnswer);
    
    while (options.length < 4 && possibleOptions.length > 0) {
      const randomIndex = Math.floor(Math.random() * possibleOptions.length);
      const selectedOption = possibleOptions.splice(randomIndex, 1)[0]; 
      options.push(selectedOption);
    }

    return options.sort(() => Math.random() - 0.5);  
  };

  const handleAnswerChange = (index, event) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [index]: event.target.value,
    });
  };

  const handleSubmitAnswers = () => {
    const incorrect = [];

    const calculatedScore = questions.reduce((total, question, index) => {
      if (selectedAnswers[index] === question.answer) {
        return total + 1;
      } else {
        incorrect.push({ question: question.question, correctAnswer: question.answer, selectedAnswer: selectedAnswers[index] });
        return total;
      }
    }, 0);

    setScore(calculatedScore);
    setIncorrectQuestions(incorrect);
    setShowResult(true);
    setIsGameFinished(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (showResult) {
    return (
      <Container maxWidth="lg">
        <Head>
          <title>Flashcard SaaS - Test Result</title>
          <meta name="description" content={`Your test result for the ${id} flashcard set`} />
        </Head>

        <Box 
          sx={{
            textAlign: 'center', 
            my: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh'
          }}>
          <Typography variant="h2" gutterBottom>Test Completed</Typography>
          <Typography variant="h5">Your score: {score} / {questions.length}</Typography>

          {incorrectQuestions.length > 0 && (
            <Box sx={{ mt: 4, textAlign: 'left', width: '100%' }}>
              <Typography variant="h6" gutterBottom>Incorrect Questions:</Typography>
              {incorrectQuestions.map((item, idx) => (
                <Box key={idx} sx={{ mb: 2 }}>
                  <Typography variant="body1"><strong>Question:</strong> {item.question}</Typography>
                  <Typography variant="body1" color="error"><strong>Your Answer:</strong> {item.selectedAnswer}</Typography>
                  <Typography variant="body1" color="primary"><strong>Correct Answer:</strong> {item.correctAnswer}</Typography>
                </Box>
              ))}
            </Box>
          )}

          <Button variant="contained" color="primary" sx={{ mt: 4 }} onClick={() => window.location.reload()}>
            Retake Test
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Head>
        <title>Flashcard SaaS - Test Game</title>
        <meta name="description" content={`Test your knowledge with the ${id} flashcard set`} />
      </Head>

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
          zIndex: 1000, 
        }}
      >
        <Box 
          sx = {{ flex: 1, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold'}}>
            {id} - Test Game
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
          onClick={() => window.location.href = '/test'}
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
          sx={{
            display: 'flex',
            alignItems: 'center',
            position: 'absolute',
            right: '20px',
            top: '20px',
          }}
        >
          {getAnsweredCount() === questions.length && (
            <Button
              variant="contained"
              color="primary"
              sx={{
                mr: 2, 
                backgroundColor: '#B5A1E0',
                borderRadius: '25px',
                padding: '5px 15px',
                color: '#fff',
                border: '2px solid #fff',
                opacity: 0,
                animation: 'fadeIn 1s forwards',
                '@keyframes fadeIn': {
                  '0%': { opacity: 0, transform: 'translateX(-20px)' },
                  '100%': { opacity: 1, transform: 'translateX(0)' },
                },
                '&:hover': {
                  backgroundColor: '#fff',
                  color: '#B5A1E0',
                  borderColor: '#fff',
                },
              }}
              onClick={handleSubmitAnswers}
            >
              Submit
            </Button>
          )}

          <Box
            sx = {{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#B5A1E0',
              borderRadius: '25px',
              padding: '5px 15px',
              color: '#fff',
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
            <QuizIcon sx={{ mr: 1 }} />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 'bold',
              }}
            >
              {getAnsweredCount()}/{questions.length}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex' }}></Box>
      
      {/* Test Game Content */}
      <Box 
        sx={{
          mt: '100px'  
        }}
      >
        {questions.map((question, index) => (
          <Box 
            key={index} 
            sx={{ 
              mb: 4, 
              p: 3, 
              backgroundColor: '#FFFFFF',  
              borderRadius: '8px',
              border: '0px solid #000000',
              boxShadow: selectedAnswers[index] ? '0px 4px 12px rgba(181, 161, 224, 2)' : '0px 4px 12px rgba(0, 0, 0, 0.3)', 
              width: '80%',
              minHeight: '480px',
              marginLeft: '300px',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                {question.question}
            </Typography>

            <Box
              sx={{
                display: 'flex', 
                flexDirection: 'row', 
                flexWrap: 'wrap',
                justifyContent: 'space-between',  // Space between each option
                gap: '16px',  // Gap between buttons
                marginTop: '90px',
              }}
            >
              {question.options.map((option, i) => (
                <Box
                  key={i}
                  sx={{
                    flexBasis: 'calc(50% - 8px)', 
                    height: '130px',  
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    paddingLeft: '12px',
                    border: `1px solid ${selectedAnswers[index] === option ? '#B5A1E0' : '#000000'}`,
                    borderRadius: '8px',
                    backgroundColor: selectedAnswers[index] === option ? '#B5A1E0' : '#FFFFFF',                    
                    color: selectedAnswers[index] === option ? '#FFFFFF' : '#000000', 
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s, color 0.3s, border-color 0.3s',
                    fontSize: adjustFontSize(option),
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '0px',
                    '&:hover': {
                        backgroundColor: selectedAnswers[index] === option ? '#B5A1E0' : '#B5A1E0',
                        color: selectedAnswers[index] === option ? '#FFFFFF' : '#FFFFFF',
                        borderColor: selectedAnswers[index] === option ? '#FFFFFF' : '#FFFFFF',
                    },
                  }}
                  onClick={() => handleAnswerChange(index, { target: { value: option } })}
                >
                    <Typography
                        variant="body1"
                        sx={{
                            whiteSpace:'normal',
                            overflowWrap: 'break-word',
                            fontWeight: 'bold',
                        }}
                    >
                        {truncateText(option, 28)}
                    </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Container>
  );
}
