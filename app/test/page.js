'use client'

import { useState, useEffect } from "react";
import { Container, Typography, Box, Grid, Card, CardActionArea, CardContent, CircularProgress, IconButton, AppBar, Toolbar } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Head from "next/head";
import { useUser } from "@clerk/nextjs";
import { collection, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useRouter } from "next/navigation";

export default function Test() {
  const { user, isLoaded } = useUser();
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      const fetchFlashcardSets = async () => {
        const userDocRef = doc(collection(db, 'users'), user.id);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setFlashcardSets(userDoc.data().flashcards || []);
        }
        setLoading(false);
      };
      fetchFlashcardSets();
    }
  }, [user, isLoaded]);

  const handleSelectSet = (setName) => {
    // Navigate to the test game with the selected flashcard set
    router.push(`/test/${setName}`);
  };

  const handleBack = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Head>
        <title>Flashcard SaaS - Test Game</title>
        <meta name="description" content="Test your knowledge with your flashcards"/>
      </Head>

      {/* AppBar with "Test" Title and Back Button */}
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton edge="start" color="inherit" onClick={handleBack}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
            Test
          </Typography>
          <Box sx={{ width: 48 }} /> {/* Empty box to balance the space on the right */}
        </Toolbar>
      </AppBar>

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

        <Typography variant="h2" gutterBottom>Test Game</Typography>
        <Typography variant="h5" sx={{mb: 4}}>
          Select a flashcard set to start the test:
        </Typography>

        <Grid container spacing={3} justifyContent="center">
          {flashcardSets.length === 0 ? (
            <Typography variant="h6">No flashcard sets found. Please create some first.</Typography>
          ) : (
            flashcardSets.map((set, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card>
                  <CardActionArea onClick={() => handleSelectSet(set.name)}>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {set.name}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Box>
    </Container>
  )
}
